import { useLanguage } from './i18n/LanguageContext'

export type CompetitionType = 'league' | 'domestic_cup' | 'international_cup'

export type Competition = {
  id: string
  owner_id: string
  name: string
  type: CompetitionType
  tier: number | null
  created_at: string
}

export function useCompetitionTypeLabels(): Record<CompetitionType, string> {
  const { t } = useLanguage()
  return {
    league: t('competitionType.league'),
    domestic_cup: t('competitionType.domestic_cup'),
    international_cup: t('competitionType.international_cup'),
  }
}
