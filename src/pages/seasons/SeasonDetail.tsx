import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'

export default function SeasonDetail() {
  const { seasonId } = useParams()
  const [season, setSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seasonId) return
    setLoading(true)
    supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .maybeSingle()
      .then(({ data }) => {
        setSeason(data)
        setLoading(false)
      })
  }, [seasonId])

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!season) return <p className="text-sm text-club-muted">シーズンが見つかりませんでした。</p>

  return (
    <>
      <PageHeading
        title={season.label}
        description={
          season.start_date || season.end_date
            ? `${season.start_date ?? '?'} 〜 ${season.end_date ?? '?'}`
            : undefined
        }
      />

      {season.is_current && (
        <span className="mb-4 inline-block rounded-full bg-club-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-navy">
          Current Season
        </span>
      )}

      <p className="text-sm text-club-muted">
        Phase 6以降で順位・勝敗・得失点・タイトル・チーム成績・選手成績を表示します。
      </p>
    </>
  )
}
