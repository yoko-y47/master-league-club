export type HomeAway = 'home' | 'away'

export type Match = {
  id: string
  season_id: string
  competition_id: string
  match_date: string
  opponent_name: string
  home_away: HomeAway
  home_score: number | null
  away_score: number | null
  round_label: string | null
  created_at: string
}

export type MatchResult = 'win' | 'draw' | 'loss'

export function matchResult(match: Match): MatchResult | null {
  if (match.home_score === null || match.away_score === null) return null
  const clubScore = match.home_away === 'home' ? match.home_score : match.away_score
  const opponentScore = match.home_away === 'home' ? match.away_score : match.home_score
  if (clubScore > opponentScore) return 'win'
  if (clubScore < opponentScore) return 'loss'
  return 'draw'
}

export const resultLabels: Record<MatchResult, string> = { win: 'W', draw: 'D', loss: 'L' }
export const resultColors: Record<MatchResult, string> = {
  win: 'bg-green-100 text-green-700',
  draw: 'bg-club-bg text-club-muted',
  loss: 'bg-red-100 text-red-700',
}

export type MatchPlayerStat = {
  id: string
  match_id: string
  player_id: string
  is_starting: boolean
  minutes_played: number
  position_played: string | null
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  rating: number | null
  created_at: string
}
