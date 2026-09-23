export type News = {
  id: string
  club_id: string
  title: string
  slug: string
  category: string | null
  cover_image_url: string | null
  body: string | null
  published_at: string | null
  created_at: string
}

export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
  return base || `article-${Date.now()}`
}
