import { useEffect, useState } from 'react'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { titleResultLabels, type Title } from '@/lib/titles'

type HonourRow = Title & { competition_name: string; season_label: string }

export default function CompetitionList() {
  const { club } = useClub()
  const [honours, setHonours] = useState<HonourRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club) return

    async function load() {
      setLoading(true)
      const { data: seasonRows } = await supabase.from('seasons').select('id').eq('club_id', club!.id)
      const seasonIds = seasonRows?.map((s) => s.id) ?? []

      if (seasonIds.length === 0) {
        setHonours([])
        setLoading(false)
        return
      }

      const { data: standingRows } = await supabase
        .from('season_competitions')
        .select('id, seasons(label, start_date), competitions(name)')
        .in('season_id', seasonIds)

      type StandingInfo = {
        id: string
        seasons: { label: string; start_date: string | null } | null
        competitions: { name: string } | null
      }
      const standingMap = new Map(
        (standingRows ?? []).map((row) => {
          const r = row as unknown as StandingInfo
          return [r.id, { season_label: r.seasons?.label ?? '?', start_date: r.seasons?.start_date, competition_name: r.competitions?.name ?? '?' }]
        }),
      )

      const standingIds = [...standingMap.keys()]
      if (standingIds.length === 0) {
        setHonours([])
        setLoading(false)
        return
      }

      const { data: titleRows } = await supabase
        .from('titles')
        .select('*')
        .in('season_competition_id', standingIds)

      const rows = (titleRows ?? [])
        .map((t) => {
          const info = standingMap.get(t.season_competition_id)
          return { ...(t as Title), season_label: info?.season_label ?? '?', competition_name: info?.competition_name ?? '?', start_date: info?.start_date }
        })
        .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))

      setHonours(rows)
      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <PageHeading title="Honours" description="獲得タイトル" />

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : honours.length === 0 ? (
        <p className="text-sm text-club-muted">タイトル記録がまだありません。</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {honours.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2">
                <span aria-hidden>🏆</span>
                <span className="font-display text-sm font-semibold text-club-navy">{h.competition_name}</span>
                <span className="text-xs text-club-muted">{h.season_label}</span>
              </div>
              <span className="rounded-full bg-club-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-gold">
                {titleResultLabels[h.result]}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
