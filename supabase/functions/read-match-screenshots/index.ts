// ウイイレ2021の試合後スクリーンショットを Gemini で読み取り、試合データ(JSON)を返す Edge Function。
// - APIキーは Supabase の Secrets(GEMINI_API_KEY)に置く。ブラウザには出さない。
// - 呼び出せるのは、ログイン済みでクラブを持っているユーザーだけ。
// - 使うモデルは Secrets の GEMINI_MODEL で変えられる(未設定なら gemini-flash-latest)。
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_IMAGES = 10
const MAX_BASE64_LENGTH = 4_000_000

const SYSTEM_PROMPT = `You read screenshots of the post-match screens of the football video game "eFootball PES 2021" (Japanese UI) and extract structured match data.

The screenshots may include: the match event timeline ("マッチイベント": goals, substitutions, cards; the left column belongs to the left team, the right column to the right team; a blue triangle next to a name under a goal means that player gave the assist; green up-triangle = player coming on, red down-triangle = player going off), the team statistics screen ("チーム統計"), and the pre-match lineup screen ("選手入れ替え/ポジションエディット": the pitch shows the starting eleven with positions; in the player list the first group of 7 players above the divider line are the bench, players below the divider are not in the match squad).
Several screenshots may overlap (the timeline is scrollable); merge them into ONE match and never output the same event twice.

Rules:
- "left" / "right" are the sides as displayed (left = home team). Do not guess values that are not visible: use null (or omit the item).
- Only include events that are actually visible. Do not invent anything.
- Names: copy the name exactly as displayed (Japanese). Names on the pitch of the lineup screen are often truncated; if the same person appears fully on another screenshot, use the full name.
- Positions use the on-screen abbreviations (GK, CB, LSB, RSB, DMF, CMF, LMF, RMF, OMF, LWG, RWG, SS, CF).
- Goals: include goals from both teams. "assist" is null if there is none.
- Substitutions: include both teams.
- Cards: include yellow and red cards if visible (yellow card icon / red card icon in the timeline).
- team_stats keys: possession (%), shots, shots_on_target (the number in parentheses after シュート), fouls, offsides (the number in parentheses after ファウル), corner_kicks, free_kicks, passes, passes_completed (the number in parentheses after パス), crosses, pass_cuts, tackles, saves. Integers only.
- "own_side": the team the user plays. You are given hints: the opponent's name and the club's name. The side whose team name matches the opponent hint is the opponent, so the other side is the user's team. Use null only if you truly cannot tell.
- "name_map": for EVERY person name on the user's own side that you output (goals, assists, substitutions, cards, lineup), map the name as displayed to the exact matching string from the given roster list, or null if no roster entry clearly corresponds (consider kana/kanji, spacing, middle-dot and truncation differences, and the position). Only use roster strings exactly as given.

Return ONLY JSON of this shape:
{
  "left_team": string|null, "right_team": string|null, "own_side": "left"|"right"|null,
  "score": {"left": number|null, "right": number|null},
  "goals": [{"side": "left"|"right", "minute": number|null, "scorer": string, "assist": string|null}],
  "substitutions": [{"side": "left"|"right", "minute": number, "player_on": string, "player_off": string}],
  "cards": [{"side": "left"|"right", "minute": number|null, "player": string, "card": "yellow"|"red"}],
  "lineup": {"left": {"starters": [{"name": string, "position": string|null}], "bench": [{"name": string, "position": string|null}]}, "right": {"starters": [], "bench": []}},
  "team_stats": {"left": {"possession": number, ...}, "right": {...}},
  "name_map": {"<name as displayed>": "<roster string>"|null},
  "notes": [string]
}
"notes" is for short remarks about anything unclear (e.g. a screenshot that seems cut off).`

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

  let payload: { images?: ImageInput[]; opponentName?: string; clubName?: string; roster?: string[] }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'リクエストの形式が正しくありません' }, 400)
  }
  const images = payload.images ?? []
  if (images.length === 0) return json({ error: '画像がありません' }, 400)
  if (images.length > MAX_IMAGES) return json({ error: `画像は ${MAX_IMAGES} 枚までです` }, 400)
  if (images.some((i) => !i.data || i.data.length > MAX_BASE64_LENGTH)) {
    return json({ error: '画像のサイズが大きすぎます' }, 400)
  }

  const userText = [
    `Opponent team name hint: ${payload.opponentName ?? '(unknown)'}`,
    `Club name hint: ${payload.clubName ?? '(unknown)'}`,
    `Roster (the user's own players): ${JSON.stringify(payload.roster ?? [])}`,
  ].join('\n')

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
      }),
    },
  )

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text()
    console.error('Gemini error', geminiResponse.status, detail)
    if (geminiResponse.status === 429) {
      return json({ error: 'AIの利用上限に達しました。しばらく待つか、明日もう一度試してください。' }, 429)
    }
    return json({ error: `AIの呼び出しに失敗しました(${geminiResponse.status})`, detail: detail.slice(0, 500) }, 502)
  }

  const result = await geminiResponse.json()
  const text: string = (result.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    return json({ data: JSON.parse(cleaned), model })
  } catch {
    console.error('Unparseable Gemini output', text.slice(0, 500))
    return json({ error: '読み取り結果を解釈できませんでした。もう一度試してください。' }, 502)
  }
}
