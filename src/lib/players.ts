export type Player = {
  id: string
  club_id: string
  full_name: string
  nationality: string | null
  birth_date: string | null
  height_cm: number | null
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
  position: string | null
  overall_rating: number | null
  potential_rating: number | null
  status: SquadStatus
  created_at: string
}

export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export const statusLabels: Record<SquadStatus, string> = {
  active: 'Active',
  injured: 'Injured',
  loaned_out: 'Loaned Out',
  loaned_in: 'Loaned In',
  retired: 'Retired',
}
