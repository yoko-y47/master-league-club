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
  team_stats?: Partial<Record<RawSide, Record<string, number | null>>>
  name_map?: Record<string, string | null>
  notes?: string[]
}

// ---- 確認画面で編集する下書き ----
export type DraftGoal = { own: boolean; minute: string; scorerId: string; assistId: string; opponentName: string }
export type DraftSub = { minute: string; offId: string; onId: string }
export type DraftCard = { own: boolean; minute: string; playerId: string; opponentName: string; card: CardType }
export type DraftLineup = { playerId: string; rawName: string; position: string; isStarting: boolean }

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

export async function requestScreenshotReading(params: {
  images: { mime: string; data: string }[]
  opponentName: string
  clubName: string
  roster: string[]
}): Promise<RawImportResult> {
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
      } catch {
        // JSON でない本文はそのまま使う
      }
      message = `(${context.status}) ${detail || error.message}`
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data.data as RawImportResult
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
  }))

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
