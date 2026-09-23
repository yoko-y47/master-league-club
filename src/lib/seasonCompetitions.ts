export type SeasonCompetition = {
  id: string
  season_id: string
  competition_id: string
  final_position: number | null
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  created_at: string
}

export function points(sc: Pick<SeasonCompetition, 'won' | 'drawn'>): number {
  return sc.won * 3 + sc.drawn
}

export function goalDifference(sc: Pick<SeasonCompetition, 'goals_for' | 'goals_against'>): number {
  return sc.goals_for - sc.goals_against
}
