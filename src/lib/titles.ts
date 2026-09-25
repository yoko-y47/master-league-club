import { useLanguage } from './i18n/LanguageContext'

export type TitleResult = 'champion' | 'runner_up' | 'winner' | 'finalist' | 'semifinalist'

export type Title = {
  id: string
  season_competition_id: string
  result: TitleResult
  created_at: string
}

export function useTitleResultLabels(): Record<TitleResult, string> {
  const { t } = useLanguage()
  return {
    champion: t('titleResult.champion'),
    runner_up: t('titleResult.runner_up'),
    winner: t('titleResult.winner'),
    finalist: t('titleResult.finalist'),
    semifinalist: t('titleResult.semifinalist'),
  }
}
