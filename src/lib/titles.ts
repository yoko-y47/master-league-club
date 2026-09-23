export type TitleResult = 'champion' | 'runner_up' | 'winner' | 'finalist' | 'semifinalist'

export type Title = {
  id: string
  season_competition_id: string
  result: TitleResult
  created_at: string
}

export const titleResultLabels: Record<TitleResult, string> = {
  champion: 'Champion',
  runner_up: 'Runner-up',
  winner: 'Winner',
  finalist: 'Finalist',
  semifinalist: 'Semifinalist',
}
