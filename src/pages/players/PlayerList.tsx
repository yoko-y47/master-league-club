import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { isContractExpiringSoon, statusLabels, type Player, type SquadMembership } from '@/lib/players'

type SquadRow = SquadMembership & { players: Player }

export default function PlayerList() {
  const { club } = useClub()
  const [rows, setRows] = useState<SquadRow[]>([])
  const [seasonEndDate, setSeasonEndDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCurrentSeason, setHasCurrentSeason] = useState(true)

  useEffect(() => {
    if (!club) return

    async function load() {
      setLoading(true)
      const { data: season } = await supabase
        .from('seasons')
        .select('id, end_date')
        .eq('club_id', club!.id)
        .eq('is_current', true)
        .maybeSingle()

      if (!season) {
        setHasCurrentSeason(false)
        setRows([])
        setLoading(false)
        return
      }

      setHasCurrentSeason(true)
      setSeasonEndDate(season.end_date)
      const { data } = await supabase
        .from('squad_memberships')
        .select('*, players(*)')
        .eq('season_id', season.id)
        .order('squad_number', { ascending: true, nullsFirst: false })

      setRows((data ?? []) as SquadRow[])
      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <PageHeading title="Players" description="所属選手一覧" />

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : !hasCurrentSeason ? (
        <p className="text-sm text-club-muted">現在のシーズンが設定されていません。</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-club-muted">このシーズンに登録されている選手がいません。</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {rows.map((row) => {
            const expiringSoon = isContractExpiringSoon(row, seasonEndDate)
            return (
              <Link
                key={row.id}
                to={`/players/${row.players.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-club-bg"
              >
                <div className="w-8 shrink-0 text-center font-display text-sm font-semibold text-club-muted">
                  {row.squad_number ?? '-'}
                </div>
                <PlayerAvatar name={row.players.full_name} photoUrl={row.players.photo_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate font-display text-sm font-semibold text-club-navy">
                      {row.players.full_name}
                    </span>
                    {expiringSoon && (
                      <span
                        aria-label="契約満了間近"
                        title="契約満了間近"
                        className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700"
                      >
                        契約
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-club-muted">
                    {[row.position_main, row.players.age !== null ? `${row.players.age}歳` : null]
                      .filter(Boolean)
                      .join(' ・ ')}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-sm font-semibold text-club-navy">
                    {row.overall_rating ?? '—'}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-club-muted">{statusLabels[row.status]}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
