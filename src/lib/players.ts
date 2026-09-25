import { useLanguage } from './i18n/LanguageContext'

export type Player = {
  id: string
  club_id: string
  full_name: string
  name_kana: string | null
  name_en: string | null
  nationality: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  preferred_foot: 'left' | 'right' | 'both' | null
  photo_url: string | null
  created_at: string
}

export type SquadStatus = 'active' | 'injured' | 'loaned_out' | 'loaned_in' | 'retired'

export type SquadMembership = {
  id: string
  player_id: string
  club_id: string
  season_id: string
  squad_number: number | null
  position_main: string | null
  position_sub: string | null
  overall_rating: number | null
  potential_rating: number | null
  status: SquadStatus
  contract_end_date: string | null
  created_at: string
}

export function isContractExpiringSoon(
  membership: Pick<SquadMembership, 'contract_end_date'>,
  currentSeasonEndDate: string | null,
): boolean {
  if (!membership.contract_end_date || !currentSeasonEndDate) return false
  return membership.contract_end_date <= currentSeasonEndDate
}

export function useStatusLabels(): Record<SquadStatus, string> {
  const { t } = useLanguage()
  return {
    active: t('status.active'),
    injured: t('status.injured'),
    loaned_out: t('status.loaned_out'),
    loaned_in: t('status.loaned_in'),
    retired: t('status.retired'),
  }
}
