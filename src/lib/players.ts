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
  created_at: string
}

export const statusLabels: Record<SquadStatus, string> = {
  active: 'Active',
  injured: 'Injured',
  loaned_out: 'Loaned Out',
  loaned_in: 'Loaned In',
  retired: 'Retired',
}
