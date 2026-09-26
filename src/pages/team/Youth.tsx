import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { useStatusLabels, type Player, type SquadMembership } from '@/lib/players'
import type { Transfer } from '@/lib/transfers'

type SquadRow = SquadMembership & { players: Player }
type PromotionRow = Transfer & { player_name: string }

export default function Youth() {
  const { club } = useClub()
  const { t } = useLanguage()
  const statusLabels = useStatusLabels()
  const [rows, setRows] = useState<SquadRow[]>([])
  const [promotions, setPromotions] = useState<PromotionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [hasCurrentSeason, setHasCurrentSeason] = useState(true)

  useEffect(() => {
    if (!club) return

    async function load() {
      setLoading(true)
      const { data: season } = await supabase
        .from('seasons')
        .select('id')
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
      const { data } = await supabase
        .from('squad_memberships')
        .select('*, players(*)')
        .eq('season_id', season.id)
        .in('status', ['youth', 'b_registered'])
        .order('squad_number', { ascending: true, nullsFirst: false })

      setRows((data ?? []) as SquadRow[])

      const playerIds = (await supabase.from('players').select('id').eq('club_id', club!.id)).data?.map(
        (p) => p.id,
      )
      const { data: transferData } = await supabase
        .from('transfers')
        .select('*, players(full_name)')
        .in('player_id', playerIds && playerIds.length > 0 ? playerIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('transfer_type', 'youth_promotion')
        .order('transfer_date', { ascending: false })

      setPromotions(
        (transferData ?? []).map((row) => {
          const { players: playerRel, ...rest } = row as Transfer & { players: { full_name: string } | null }
          return { ...rest, player_name: playerRel?.full_name ?? '?' }
        }),
      )
      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <PageHeading title={t('youth.title')} description={t('youth.desc')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : !hasCurrentSeason ? (
        <p className="text-sm text-club-muted">{t('common.noCurrentSeason')}</p>
      ) : (
        <>
          {rows.length === 0 ? (
            <p className="mb-8 text-sm text-club-muted">{t('youth.empty')}</p>
          ) : (
            <div className="mb-8 divide-y divide-club-line rounded-lg border border-club-line bg-white">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  to={`/players/${row.players.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-club-bg"
                >
                  <PlayerAvatar name={row.players.full_name} photoUrl={row.players.photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-sm font-semibold text-club-navy">
                      {row.players.full_name}
                    </div>
                    <div className="text-xs text-club-muted">
                      {[row.position_main, row.players.age !== null ? `${row.players.age}${t('players.age')}` : null]
                        .filter(Boolean)
                        .join(' ・ ')}
                    </div>
                  </div>
                  {row.status === 'b_registered' && (
                    <span className="shrink-0 rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                      {statusLabels.b_registered}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          <section>
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
              {t('youth.promotionsHeading')}
            </h2>
            {promotions.length === 0 ? (
              <p className="text-sm text-club-muted">{t('youth.promotionsEmpty')}</p>
            ) : (
              <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
                {promotions.map((p) => (
                  <Link
                    key={p.id}
                    to={`/players/${p.player_id}`}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-club-bg"
                  >
                    <span className="text-sm font-medium text-club-navy">{p.player_name}</span>
                    <span className="text-xs text-club-muted">{p.transfer_date}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
