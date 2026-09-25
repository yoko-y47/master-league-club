import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { MatchPlayerStat } from '@/lib/matches'

type PlayerTotals = {
  player_id: string
  player_name: string
  squad_number: number | null
  appearances: number
  starts: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  minutes: number
  ratingSum: number
  ratingCount: number
}

type SortKey = 'goals' | 'assists' | 'appearances' | 'minutes' | 'yellow_cards' | 'red_cards' | 'rating'

export default function Rankings() {
  const { club } = useClub()
  const { t } = useLanguage()

  const columns: { key: SortKey; label: string }[] = [
    { key: 'appearances', label: t('rankings.col.appearances') },
    { key: 'goals', label: t('rankings.col.goals') },
    { key: 'assists', label: t('rankings.col.assists') },
    { key: 'minutes', label: t('rankings.col.minutes') },
    { key: 'yellow_cards', label: t('rankings.col.yellow') },
    { key: 'red_cards', label: t('rankings.col.red') },
    { key: 'rating', label: t('rankings.col.rating') },
  ]
  const [seasonLabel, setSeasonLabel] = useState<string | null>(null)
  const [players, setPlayers] = useState<PlayerTotals[]>([])
  const [loading, setLoading] = useState(true)
  const [hasCurrentSeason, setHasCurrentSeason] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('goals')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    if (!club) return

    async function load() {
      setLoading(true)
      const { data: season } = await supabase
        .from('seasons')
        .select('id, label')
        .eq('club_id', club!.id)
        .eq('is_current', true)
        .maybeSingle()

      if (!season) {
        setHasCurrentSeason(false)
        setPlayers([])
        setLoading(false)
        return
      }

      setHasCurrentSeason(true)
      setSeasonLabel(season.label)

      const { data: squadData } = await supabase
        .from('squad_memberships')
        .select('player_id, squad_number, players(full_name)')
        .eq('season_id', season.id)

      type SquadInfo = { player_id: string; squad_number: number | null; players: { full_name: string } | null }
      const squadMap = new Map(
        ((squadData ?? []) as unknown as SquadInfo[]).map((s) => [
          s.player_id,
          { name: s.players?.full_name ?? '?', squad_number: s.squad_number },
        ]),
      )

      const { data: matchData } = await supabase.from('matches').select('id').eq('season_id', season.id)
      const matchIds = (matchData ?? []).map((m) => m.id)

      const totals = new Map<string, PlayerTotals>()
      for (const [playerId, info] of squadMap) {
        totals.set(playerId, {
          player_id: playerId,
          player_name: info.name,
          squad_number: info.squad_number,
          appearances: 0,
          starts: 0,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          minutes: 0,
          ratingSum: 0,
          ratingCount: 0,
        })
      }

      if (matchIds.length > 0) {
        const { data: statData } = await supabase
          .from('match_player_stats')
          .select('*')
          .in('match_id', matchIds)

        for (const row of (statData ?? []) as MatchPlayerStat[]) {
          const existing = totals.get(row.player_id)
          if (!existing) continue
          existing.appearances += 1
          existing.starts += row.is_starting ? 1 : 0
          existing.goals += row.goals
          existing.assists += row.assists
          existing.yellow_cards += row.yellow_cards
          existing.red_cards += row.red_cards
          existing.minutes += row.minutes_played
          if (row.rating !== null) {
            existing.ratingSum += row.rating
            existing.ratingCount += 1
          }
        }
      }

      setPlayers([...totals.values()])
      setLoading(false)
    }

    load()
  }, [club])

  const sorted = useMemo(() => {
    const rows = [...players]
    rows.sort((a, b) => {
      const av = sortKey === 'rating' ? (a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0) : a[sortKey]
      const bv = sortKey === 'rating' ? (b.ratingCount > 0 ? b.ratingSum / b.ratingCount : 0) : b[sortKey]
      return sortDesc ? bv - av : av - bv
    })
    return rows
  }, [players, sortKey, sortDesc])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDesc((v) => !v)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  return (
    <>
      <PageHeading
        title={t('rankings.pageTitle')}
        description={seasonLabel ? t('rankings.pageDescWithSeason', { season: seasonLabel }) : t('rankings.pageDesc')}
      />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : !hasCurrentSeason ? (
        <p className="text-sm text-club-muted">{t('common.noCurrentSeason')}</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-club-muted">{t('rankings.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-club-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-club-line text-left text-xs uppercase tracking-wide text-club-muted">
                <th className="px-4 py-2 font-medium">{t('rankings.col.player')}</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`hover:text-club-navy ${sortKey === col.key ? 'text-club-navy' : ''}`}
                    >
                      {col.label}
                      {sortKey === col.key ? (sortDesc ? ' ▾' : ' ▴') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-club-line">
              {sorted.map((p) => (
                <tr key={p.player_id}>
                  <td className="px-4 py-2">
                    <Link to={`/players/${p.player_id}`} className="font-medium text-club-navy hover:underline">
                      {p.squad_number !== null ? `#${p.squad_number} ` : ''}
                      {p.player_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right text-club-ink">{p.appearances}</td>
                  <td className="px-3 py-2 text-right text-club-ink">{p.goals}</td>
                  <td className="px-3 py-2 text-right text-club-ink">{p.assists}</td>
                  <td className="px-3 py-2 text-right text-club-ink">{p.minutes}</td>
                  <td className="px-3 py-2 text-right text-club-ink">{p.yellow_cards}</td>
                  <td className="px-3 py-2 text-right text-club-ink">{p.red_cards}</td>
                  <td className="px-3 py-2 text-right text-club-ink">
                    {p.ratingCount > 0 ? (p.ratingSum / p.ratingCount).toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
