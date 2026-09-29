export type Coach = {
  id: string
  club_id: string
  full_name: string
  given_name_en: string | null
  family_name_en: string | null
  role: string
  nationality: string | null
  photo_url: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}
