import { useLanguage } from './i18n/LanguageContext'

export type Player = {
  id: string
  club_id: string
  full_name: string
  name_kana: string | null
  given_name_en: string | null
  family_name_en: string | null
  nationality: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  preferred_foot: 'left' | 'right' | 'both' | null
  photo_url: string | null
  joined_year: number | null
  created_at: string
}

export type SquadStatus =
  | 'active'
  | 'injured'
  | 'loaned_out'
  | 'loaned_in'
  | 'retired'
  | 'youth'
  | 'youth_promoted'
  | 'b_registered'

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

const POSITION_GROUPS = [
  ['GK'],
  ['DF', 'CB', 'LSB', 'RSB'],
  ['MF', 'DMF', 'CMF', 'LMF', 'RMF', 'OMF'],
  ['FW', 'LWG', 'RWG', 'ST', 'CF'],
]

const POSITION_GROUP_RANK = new Map(
  POSITION_GROUPS.flatMap((positions, groupIndex) => positions.map((position) => [position, groupIndex])),
)

export function positionGroupRank(positionMain: string | null): number {
  if (!positionMain) return POSITION_GROUPS.length + 1
  const rank = POSITION_GROUP_RANK.get(positionMain.trim().toUpperCase())
  return rank ?? POSITION_GROUPS.length
}

export function comparePlayersByPositionAndNumber(
  a: { position_main: string | null; squad_number: number | null },
  b: { position_main: string | null; squad_number: number | null },
): number {
  const groupDiff = positionGroupRank(a.position_main) - positionGroupRank(b.position_main)
  if (groupDiff !== 0) return groupDiff
  if (a.squad_number === null && b.squad_number === null) return 0
  if (a.squad_number === null) return 1
  if (b.squad_number === null) return -1
  return a.squad_number - b.squad_number
}

const POSITION_GROUP_LABELS = ['GK', 'DF', 'MF', 'FW']

export function groupPlayersByPosition<T extends { position_main: string | null; squad_number: number | null }>(
  rows: T[],
  otherLabel: string,
): { label: string; rows: T[] }[] {
  const buckets = new Map<number, T[]>()
  for (const row of rows) {
    const rank = positionGroupRank(row.position_main)
    const bucket = buckets.get(rank)
    if (bucket) bucket.push(row)
    else buckets.set(rank, [row])
  }

  const groups: { label: string; rows: T[] }[] = []
  POSITION_GROUP_LABELS.forEach((label, index) => {
    const bucket = buckets.get(index)
    if (bucket && bucket.length > 0) {
      groups.push({ label, rows: [...bucket].sort(comparePlayersByPositionAndNumber) })
    }
  })
  const other = buckets.get(POSITION_GROUP_LABELS.length)
  if (other && other.length > 0) {
    groups.push({ label: otherLabel, rows: [...other].sort(comparePlayersByPositionAndNumber) })
  }
  return groups
}

export function yearsAtClub(
  memberships: { season_start_date: string | null }[],
  joinedYear?: number | null,
): number | null {
  const years = memberships
    .map((m) => (m.season_start_date ? new Date(m.season_start_date).getFullYear() : null))
    .filter((y): y is number => y !== null)
  if (joinedYear) years.push(joinedYear)
  if (years.length === 0) return null
  return Math.max(...years) - Math.min(...years) + 1
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
    youth: t('status.youth'),
    youth_promoted: t('status.youth_promoted'),
    b_registered: t('status.b_registered'),
  }
}
