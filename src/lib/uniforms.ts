export type KitType = 'home' | 'away' | 'third'

export type Uniform = {
  id: string
  club_id: string
  season_id: string
  kit_type: KitType
  image_url: string
  created_at: string
}

export const kitTypeOrder: KitType[] = ['home', 'away', 'third']
