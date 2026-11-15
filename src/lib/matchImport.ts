import { supabase } from '@/lib/supabaseClient'
import { MATCH_POSITIONS, TEAM_STAT_KEYS, type CardType, type TeamStatValues } from '@/lib/matches'

// ---- Edge Function(read-match-screenshots)が返す生データ ----
type RawSide = 'left' | 'right'
type RawPerson = { name: string; position?: string | null }

export type RawImportResult = {
  left_team?: string | null
  right_team?: string | null
  own_side?: RawSide | null
  score?: { left?: number | null; right?: number | null }
  goals?: { side: RawSide; minute?: number | null; scorer: string; assist?: string | null }[]
  substitutions?: { side: RawSide; minute: number; player_on: string; player_off: string }[]
  cards?: { side: RawSide; minute?: number | null; player: string; card: CardType }[]
  lineup?: Partial<Record<RawSide, { starters?: RawPerson[]; bench?: RawPerson[] }>>
  ratings?: Partial<Record<RawSide, { name: string; position?: string | null; rating?: number | null; starter?: boolean }[]>>
  team_stats?: Partial<Record<RawSide, Record<string, number | null>>>
  name_map?: Record<string, string | null>
  notes?: string[]
}

// ---- 確認画面で編集する下書き ----
export type DraftGoal = { own: boolean; minute: string; scorerId: string; assistId: string; opponentName: string }
export type DraftSub = { minute: string; offId: string; onId: string }
export type DraftCard = { own: boolean; minute: string; playerId: string; opponentName: string; card: CardType }
export type DraftLineup = {
  playerId: string
  rawName: string
  position: string
  isStarting: boolean
  rating: string
}

export type ImportDraft = {
  ownScore: string
  opponentScore: string
  ownLeft: boolean
  goals: DraftGoal[]
  subs: DraftSub[]
  cards: DraftCard[]
  lineup: DraftLineup[]
  teamStats: { own: TeamStatValues; opponent: TeamStatValues }
  notes: string[]
}

export type RosterEntry = { playerId: string; name: string }

const MAX_EDGE = 1280

export async function fileToBase64Jpeg(file: File): Promise<{ mime: string; data: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return { mime: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1) }
}

export type ScreenshotKind = 'events' | 'teamStats' | 'lineup' | 'ratings'
export const SCREENSHOT_KINDS: ScreenshotKind[] = ['events', 'lineup', 'ratings', 'teamStats']

// 画面の種類ごとの読み取り結果（Edge Function の返り値）
type KindResult = Omit<RawImportResult, 'ratings'> & {
  team_name?: string | null
  is_own_team?: boolean | null
  ratings?: unknown
}
export type KindResults = Partial<Record<ScreenshotKind, KindResult>>

export async function readScreenshotKind(params: {
  kind: ScreenshotKind
  images: { mime: string; data: string }[]
  opponentName: string
  clubName: string
  roster: string[]
}): Promise<KindResult> {
  const { data, error } = await supabase.functions.invoke('read-match-screenshots', { body: params })
  if (error) {
    let message = error.message
    const context = (error as { context?: Response }).context
    if (context && typeof context.text === 'function') {
      const text = await context.text().catch(() => '')
      let detail = text
      try {
        const body = JSON.parse(text)
        detail = body.error ?? body.message ?? text
        if (body.error && body.detail) detail = `${body.error} ${String(body.detail).slice(0, 200)}`
      } catch {
        // JSON でない本文はそのまま使う
      }
      message = `(${context.status}) ${detail || error.message}`
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data.data as KindResult
}

// 読み取り結果から、自チームが左右どちらかを決める（分からなければ null）
export function resolveOwnSide(results: KindResults): RawSide | null {
  for (const kind of ['events', 'lineup', 'teamStats'] as ScreenshotKind[]) {
    const side = results[kind]?.own_side
    if (side === 'left' || side === 'right') return side
  }
  return null
}

export function teamNames(results: KindResults): { left: string | null; right: string | null } {
  for (const kind of ['events', 'lineup', 'teamStats'] as ScreenshotKind[]) {
    const r = results[kind]
    if (r && (r.left_team || r.right_team)) return { left: r.left_team ?? null, right: r.right_team ?? null }
  }
  return { left: null, right: null }
}

// 画面ごとの結果を、1試合分の生データにまとめる
export function mergeResults(results: KindResults, ownSide: RawSide): RawImportResult {
  const { events, teamStats, lineup, ratings } = results
  const merged: RawImportResult = {
    own_side: ownSide,
    left_team: teamNames(results).left,
    right_team: teamNames(results).right,
    score: events?.score ?? teamStats?.score,
    goals: events?.goals,
    substitutions: events?.substitutions,
    cards: events?.cards,
    lineup: lineup?.lineup,
    team_stats: teamStats?.team_stats,
    name_map: { ...(lineup?.name_map ?? {}), ...(events?.name_map ?? {}), ...(ratings?.name_map ?? {}) },
    notes: [] as string[],
  }
  const notes: string[] = []
  for (const kind of SCREENSHOT_KINDS) for (const note of results[kind]?.notes ?? []) notes.push(note)
  if (ratings) {
    if (ratings.is_own_team === false) {
      notes.push('選手評価の画面は相手チームのものだったので、読み取りから外しました。')
    } else {
      merged.ratings = { [ownSide]: ratings.ratings } as unknown as RawImportResult['ratings']
    }
  }
  merged.notes = notes
  return merged
}

function toIntString(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : ''
}

function numericStats(raw: Record<string, number | null> | undefined): TeamStatValues {
  const values: TeamStatValues = {}
  if (!raw) return values
  for (const key of TEAM_STAT_KEYS) {
    const v = raw[key]
    if (typeof v === 'number' && Number.isFinite(v)) values[key] = Math.round(v)
  }
  return values
}

// 生データ → 確認画面用の下書き。ownLeft は自チームが左側かどうか。
export function buildDraft(raw: RawImportResult, ownLeft: boolean, roster: RosterEntry[]): ImportDraft {
  const ownKey: RawSide = ownLeft ? 'left' : 'right'
  const oppKey: RawSide = ownLeft ? 'right' : 'left'
  const idByName = new Map(roster.map((r) => [r.name, r.playerId]))
  const nameMap = raw.name_map ?? {}
  const resolve = (displayed: string | null | undefined): string => {
    if (!displayed) return ''
    const mapped = nameMap[displayed]
    return (mapped && idByName.get(mapped)) || idByName.get(displayed) || ''
  }
  const position = (p: string | null | undefined) =>
    p && (MATCH_POSITIONS as readonly string[]).includes(p) ? p : ''

  const goals: DraftGoal[] = (raw.goals ?? []).map((g) => {
    const own = g.side === ownKey
    return {
      own,
      minute: toIntString(g.minute),
      scorerId: own ? resolve(g.scorer) : '',
      assistId: own ? resolve(g.assist) : '',
      opponentName: own ? '' : g.scorer ?? '',
    }
  })

  const subs: DraftSub[] = (raw.substitutions ?? [])
    .filter((s) => s.side === ownKey)
    .map((s) => ({ minute: toIntString(s.minute), offId: resolve(s.player_off), onId: resolve(s.player_on) }))

  const cards: DraftCard[] = (raw.cards ?? []).map((c) => {
    const own = c.side === ownKey
    return {
      own,
      minute: toIntString(c.minute),
      playerId: own ? resolve(c.player) : '',
      opponentName: own ? '' : c.player ?? '',
      card: c.card === 'red' ? 'red' : 'yellow',
    }
  })

  const lineupRaw = raw.lineup?.[ownKey]
  const lineup: DraftLineup[] = [
    ...(lineupRaw?.starters ?? []).map((p) => ({ p, isStarting: true })),
    ...(lineupRaw?.bench ?? []).map((p) => ({ p, isStarting: false })),
  ].map(({ p, isStarting }) => ({
    playerId: resolve(p.name),
    rawName: p.name,
    position: position(p.position),
    isStarting,
    rating: '',
  }))

  // 選手評価の画面: 評価点を入れる。メンバーの一覧にいない選手は、出場した選手として足す
  for (const r of raw.ratings?.[ownKey] ?? []) {
    const playerId = resolve(r.name)
    const rating = typeof r.rating === 'number' ? String(r.rating) : ''
    const existing = playerId ? lineup.find((row) => row.playerId === playerId) : undefined
    if (existing) {
      existing.rating = rating
      if (!existing.position) existing.position = position(r.position)
    } else {
      lineup.push({
        playerId,
        rawName: r.name,
        position: position(r.position),
        isStarting: r.starter !== false,
        rating,
      })
    }
  }

  return {
    ownScore: toIntString(raw.score?.[ownKey]),
    opponentScore: toIntString(raw.score?.[oppKey]),
    ownLeft,
    goals,
    subs,
    cards,
    lineup,
    teamStats: { own: numericStats(raw.team_stats?.[ownKey]), opponent: numericStats(raw.team_stats?.[oppKey]) },
    notes: raw.notes ?? [],
  }
}
