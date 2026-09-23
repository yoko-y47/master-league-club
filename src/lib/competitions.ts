export type CompetitionType = 'league' | 'domestic_cup' | 'international_cup'

export type Competition = {
  id: string
  owner_id: string
  name: string
  type: CompetitionType
  tier: number | null
  created_at: string
}

export const competitionTypeLabels: Record<CompetitionType, string> = {
  league: 'League',
  domestic_cup: 'Domestic Cup',
  international_cup: 'International Cup',
}
