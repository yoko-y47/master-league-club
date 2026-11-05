// Kit Archive（3D のユニフォーム展示）とこのアプリをつなぐ小さな関数
// データは Supabase の kits テーブル（Kit Archive の単体版と同じデータ）。3D 展示は vendor/kit-archive-core
import { KitStore, SupabaseKitSource, type KitCategory } from 'kit-archive-core/data'
import { supabase } from './supabaseClient'

export const kitCategories: KitCategory[] = ['Home', 'Away', 'Third', 'Cup', 'GK']
export const kitCategoryKey = (c: KitCategory) => `kitType.${c.toLowerCase()}`

// 3D の型紙（GLB）は public/models に置く（npm run sync:kit-archive で取り込む）
export function resolveModelUrls(path: string): string[] {
  const name = path.split('/').pop() ?? path
  return ['kit_hanging.glb', 'kit_base.glb'].includes(name) ? [`${import.meta.env.BASE_URL}models/${name}`] : [path]
}

// ログイン中のクラブの Kit Archive データ。kits.json などの最初からある展示はなく、全部 Supabase の分
export function createKitStore() {
  return new KitStore({ name: 'supabase', label: 'Supabase', writable: false, empty: true, load: async () => [] })
}
export const openKitSource = () => SupabaseKitSource.open(supabase)

// シーズン：「2026-27」「2026/27」「2026-2027」「2026」。表記は「2026-27」にそろえる（Kit Archive の単体版と同じ規則）
export function checkSeason(text: string): { season: string; year: number } | { error: 'empty' | 'format' | 'range' | 'end' } {
  const t = text.trim()
  if (!t) return { error: 'empty' }
  const m = t.match(/^(\d{4})(?:\s*[-/]\s*(\d{2}|\d{4}))?$/)
  if (!m) return { error: 'format' }
  const y = Number(m[1])
  if (y < 1850 || y > 2100) return { error: 'range' }
  if (m[2]) {
    const e = Number(m[2])
    const end = m[2].length === 2 ? Math.floor(y / 100) * 100 + e + (e < y % 100 ? 100 : 0) : e
    if (end !== y + 1) return { error: 'end' }
  }
  return { season: m[2] ? `${y}-${String((y + 1) % 100).padStart(2, '0')}` : String(y), year: y }
}
