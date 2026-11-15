// ウイイレ2021の試合後スクリーンショットを Gemini で読み取り、試合データ(JSON)を返す Edge Function。
// - APIキーは Supabase の Secrets(GEMINI_API_KEY)に置く。ブラウザには出さない。
// - 呼び出せるのは、ログイン済みでクラブを持っているユーザーだけ。
// - 使うモデルは Secrets の GEMINI_MODEL で変えられる(未設定なら gemini-flash-latest)。
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_IMAGES = 6
const MAX_BASE64_LENGTH = 4_000_000

const BASE_PROMPT = `You read screenshots of the post-match screens of the football video game "eFootball PES 2021" (Japanese UI) and extract structured data. You are told which kind of screen the screenshots show.

General rules:
- "left" / "right" are the sides as displayed (left = home team). Never guess values that are not visible: use null or omit the item. Do not invent anything.
- Names: copy the name exactly as displayed (Japanese). Positions use the on-screen abbreviations (GK, CB, LSB, RSB, DMF, CMF, LMF, RMF, OMF, LWG, RWG, SS, CF).
- You are given hints: the opponent's team name, the club's own name and the roster of the user's own players. The team whose name matches the opponent hint is the opponent, so the other one is the user's team ("own_side"). Use null only if you truly cannot tell.
- "name_map": for EVERY person name on the user's own side that you output, map the name as displayed to the exact matching string from the given roster list, or null if no roster entry clearly corresponds (consider kana/kanji, spacing, middle-dot and truncation differences, and the position). Only use roster strings exactly as given.
- "notes": short remarks about anything unclear (e.g. the screenshots look cut off). Use [] if nothing.
- Return ONLY JSON of the exact shape given below.`

const KIND_PROMPTS: Record<string, { task: string; needsRoster: boolean }> = {
  events: {
    needsRoster: true,
    task: `Screen kind: the match event timeline ("マッチイベント"). The left column of the timeline belongs to the left team, the right column to the right team. A soccer-ball icon next to a name = goal; a blue triangle next to a name under a goal = that player gave the assist; green up-triangle = player coming on, red down-triangle = player going off (the two names are one substitution at that minute); yellow/red card icons = cards. The timeline scrolls, so several screenshots may overlap: merge them and never output the same event twice. The header shows the final score.
Shape:
{"left_team": string|null, "right_team": string|null, "own_side": "left"|"right"|null,
 "score": {"left": number|null, "right": number|null},
 "goals": [{"side": "left"|"right", "minute": number|null, "scorer": string, "assist": string|null}],
 "substitutions": [{"side": "left"|"right", "minute": number, "player_on": string, "player_off": string}],
 "cards": [{"side": "left"|"right", "minute": number|null, "player": string, "card": "yellow"|"red"}],
 "name_map": {"<name as displayed>": "<roster string>"|null}, "notes": [string]}`,
  },
  teamStats: {
    needsRoster: false,
    task: `Screen kind: the team statistics screen ("チーム統計"). Keys: possession (%), shots, shots_on_target (the number in parentheses after シュート), fouls, offsides (the number in parentheses after ファウル), corner_kicks, free_kicks, passes, passes_completed (the number in parentheses after パス), crosses, pass_cuts (パスカット回数), tackles, saves. Integers only. The big numbers at the top are the score.
Shape:
{"left_team": string|null, "right_team": string|null, "own_side": "left"|"right"|null,
 "score": {"left": number|null, "right": number|null},
 "team_stats": {"left": {"possession": number, ...}, "right": {...}}, "notes": [string]}`,
  },
  lineup: {
    needsRoster: true,
    task: `Screen kind: the lineup screen ("選手入れ替え/ポジションエディット"). The pitch shows the starting eleven with positions; in the player list the first group of 7 players above the divider line are the bench, players below the divider are not in the match squad. Names on the pitch are often truncated; if the same person appears fully in the list, use the full name. Do the lineup for BOTH teams if both are shown.
Shape:
{"left_team": string|null, "right_team": string|null, "own_side": "left"|"right"|null,
 "lineup": {"left": {"formation": string|null, "starters": [{"name": string, "position": string|null}], "bench": [{"name": string, "position": string|null}]}, "right": {"formation": string|null, "starters": [], "bench": []}},
 "name_map": {"<name as displayed>": "<roster string>"|null}, "notes": [string]}`,
  },
  ratings: {
    needsRoster: true,
    task: `Screen kind: the player rating screen ("個人試合記録" → "選手評価"). It is a list of ONE team's players who played; each row = position badge, full name, rating such as 6.0 or 7.5. The first 11 rows are the starters; the following rows are substitutes who came on. A star icon marks the man of the match. The team name is shown at the top of the list. Ignore the detailed numbers on the right side.
Shape:
{"team_name": string|null, "is_own_team": boolean|null,
 "ratings": [{"name": string, "position": string|null, "rating": number, "starter": boolean}],
 "name_map": {"<name as displayed>": "<roster string>"|null}, "notes": [string]}
"is_own_team" is true when the team name matches the user's club (not the opponent hint).`,
  },
}

type ImageInput = { mime: string; data: string }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  try {
    return await handle(req)
  } catch (e) {
    console.error('Unhandled error', e)
    return json({ error: `サーバーでエラーが起きました: ${e instanceof Error ? e.message : String(e)}` }, 500)
  }
})

async function handle(req: Request): Promise<Response> {
  const startedAt = Date.now()
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // ログイン済み & クラブの持ち主だけが使える
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return json({ error: 'ログインが必要です' }, 401)
  const { data: clubs } = await supabase.from('clubs').select('id').limit(1)
  if (!clubs || clubs.length === 0) return json({ error: 'この機能はクラブの管理者だけが使えます' }, 403)

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ error: 'GEMINI_API_KEY が設定されていません' }, 500)
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-flash-latest'

  let payload: { kind?: string; images?: ImageInput[]; opponentName?: string; clubName?: string; roster?: string[] }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'リクエストの形式が正しくありません' }, 400)
  }
  const kindConfig = KIND_PROMPTS[payload.kind ?? '']
  if (!kindConfig) return json({ error: '画面の種類が正しくありません' }, 400)
  const images = payload.images ?? []
  if (images.length === 0) return json({ error: '画像がありません' }, 400)
  if (images.length > MAX_IMAGES) return json({ error: `画像は ${MAX_IMAGES} 枚までです` }, 400)
  if (images.some((i) => !i.data || i.data.length > MAX_BASE64_LENGTH)) {
    return json({ error: '画像のサイズが大きすぎます' }, 400)
  }

  const userText = [
    `Opponent team name hint: ${payload.opponentName ?? '(unknown)'}`,
    `Club name hint: ${payload.clubName ?? '(unknown)'}`,
    ...(kindConfig.needsRoster ? [`Roster (the user's own players): ${JSON.stringify(payload.roster ?? [])}`] : []),
  ].join('\n')

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: `${BASE_PROMPT}\n\n${kindConfig.task}` }] },
    contents: [
      {
        role: 'user',
        parts: [
          { text: userText },
          ...images.map((i) => ({ inlineData: { mimeType: i.mime || 'image/jpeg', data: i.data } })),
        ],
      },
    ],
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  })

  // 混み合い(503)・一時的なエラー(500)・上限(429)のときは、少し待って再試行し、だめなら予備のモデルに切り替える
  const fallbackModel = Deno.env.get('GEMINI_FALLBACK_MODEL') || 'gemini-flash-lite-latest'
  const models = fallbackModel && fallbackModel !== model ? [model, fallbackModel] : [model]
  const RETRY_STATUSES = [429, 500, 503, 504]
  const RETRY_DELAYS_MS = [0, 2000, 5000]
  // Edge Function は一定時間(無料プランは約150秒)で強制終了されるので、その手前で自分から切り上げる
  const DEADLINE = startedAt + 125_000
  const MIN_ATTEMPT_MS = 12_000
  let timedOut = false

  let geminiResponse: Response | null = null
  let primaryFailure: { status: number; detail: string } | null = null
  let usedModel = model
  outer: for (const candidate of models) {
    for (const delay of RETRY_DELAYS_MS) {
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      const remaining = DEADLINE - Date.now()
      if (remaining < MIN_ATTEMPT_MS) {
        timedOut = true
        break outer
      }
      try {
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: requestBody,
            signal: AbortSignal.timeout(Math.min(remaining, 75_000)),
          },
        )
      } catch (e) {
        console.error('Gemini request aborted', candidate, e instanceof Error ? e.message : String(e))
        geminiResponse = null
        timedOut = true
        break // 応答が遅いモデルは、次のモデルに切り替える
      }
      usedModel = candidate
      if (geminiResponse.ok) break outer
      const detail = await geminiResponse.clone().text()
      console.error('Gemini error', candidate, geminiResponse.status, detail.slice(0, 500))
      if (candidate === model) primaryFailure = { status: geminiResponse.status, detail }
      if (!RETRY_STATUSES.includes(geminiResponse.status)) break // 再試行しても直らないエラーは、次のモデルへ
    }
  }

  if (!geminiResponse || !geminiResponse.ok) {
    if (timedOut && !primaryFailure) {
      return json({ error: 'AIの応答に時間がかかりすぎました。少し時間を置いて、もう一度試してください。' }, 504)
    }
    // 予備のモデルが使えなかっただけのときは、本来のモデルのエラーを知らせる
    const status = primaryFailure?.status ?? geminiResponse?.status ?? 0
    const detail = primaryFailure?.detail ?? (geminiResponse ? await geminiResponse.text() : '')
    if (status === 429) {
      return json({ error: 'AIの利用上限に達しました。しばらく待つか、明日もう一度試してください。' }, 429)
    }
    if (status === 503) {
      return json({ error: 'AIが混み合っています。少し時間を置いて、もう一度試してください。' }, 503)
    }
    return json({ error: `AIの呼び出しに失敗しました(${status})`, detail: detail.slice(0, 500) }, 502)
  }

  const result = await geminiResponse.json()
  const text: string = (result.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    return json({ data: JSON.parse(cleaned), model: usedModel, kind: payload.kind })
  } catch {
    console.error('Unparseable Gemini output', text.slice(0, 500))
    return json({ error: '読み取り結果を解釈できませんでした。もう一度試してください。' }, 502)
  }
}
