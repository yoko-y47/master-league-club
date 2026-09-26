import { useEffect, useState } from 'react'
import PageHeading from '@/components/PageHeading'
import PlayerCard from '@/components/PlayerCard'
import PositionGroupedPlayers from '@/components/PositionGroupedPlayers'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { isContractExpiringSoon, useStatusLabels, type Player, type SquadMembership } from '@/lib/players'

type SquadRow = SquadMembership & { players: Player }

export default function PlayerList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const statusLabels = useStatusLabels()
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

      setRows((data ?? []) as SquadRow[])
      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <PageHeading title={t('players.pageTitle')} description={t('players.pageDesc.public')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : !hasCurrentSeason ? (
        <p className="text-sm text-club-muted">{t('common.noCurrentSeason')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-club-muted">{t('players.emptySquad')}</p>
      ) : (
        <PositionGroupedPlayers
          rows={rows}
          renderCard={(row) => {
            const expiringSoon = isContractExpiringSoon(row, seasonEndDate)
            return (
              <PlayerCard
                player={row.players}
                squadNumber={row.squad_number}
                to={`/players/${row.players.id}`}
                subtitle={row.players.age !== null ? `${row.players.age}${t('players.age')}` : null}
                badge={
                  expiringSoon && (
                    <span
                      aria-label={t('players.contractExpiringSoon')}
                      title={t('players.contractExpiringSoon')}
                      className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700"
                    >
                      {t('players.contractShort')}
                    </span>
                  )
                }
                footer={
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-club-navy">
                      {row.overall_rating ?? '—'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-club-muted">
                      {statusLabels[row.status]}
                    </span>
                  </div>
                }
              />
            )
          }}
        />
      )}
    </>
  )
}
