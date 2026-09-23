import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PlayerAvatar from '@/components/PlayerAvatar'
import { supabase } from '@/lib/supabaseClient'
import { isContractExpiringSoon, statusLabels, type Player, type SquadMembership } from '@/lib/players'
import type { MatchPlayerStat } from '@/lib/matches'
import { transferTypeLabels, type Transfer } from '@/lib/transfers'

type MembershipRow = SquadMembership & {
  season_label: string
  season_start_date: string | null
  season_end_date: string | null
  season_is_current: boolean
}

type SeasonStatRow = {
  season_id: string
  season_label: string
  appearances: number
  starts: number
  goals: number
  assists: number
  minutes: number
}

const footLabels: Record<string, string> = { left: '左', right: '右', both: '両足' }

function yearsAtClub(memberships: MembershipRow[]): number | null {
  const years = memberships
    .map((m) => (m.season_start_date ? new Date(m.season_start_date).getFullYear() : null))
    .filter((y): y is number => y !== null)
  if (years.length === 0) return null
  return Math.max(...years) - Math.min(...years) + 1
}

export default function PlayerDetail() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [memberships, setMemberships] = useState<MembershipRow[]>([])
  const [seasonStats, setSeasonStats] = useState<SeasonStatRow[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return
    setLoading(true)

    async function load() {
      const [{ data: playerData }, { data: membershipData }, { data: statData }, { data: transferData }] =
        await Promise.all([
          supabase.from('players').select('*').eq('id', playerId).maybeSingle(),
          supabase
            .from('squad_memberships')
            .select('*, seasons(label, start_date, end_date, is_current)')
            .eq('player_id', playerId)
            .order('created_at', { ascending: false }),
          supabase
            .from('match_player_stats')
            .select('*, matches(season_id, seasons(label))')
            .eq('player_id', playerId),
          supabase
            .from('transfers')
            .select('*')
            .eq('player_id', playerId)
            .order('transfer_date', { ascending: false }),
        ])

      setTransfers(transferData ?? [])

      setPlayer(playerData)
      setMemberships(
        (membershipData ?? []).map((row) => {
          const { seasons: seasonRelation, ...rest } = row as SquadMembership & {
            seasons: { label: string; start_date: string | null; end_date: string | null; is_current: boolean } | null
          }
          return {
            ...rest,
            season_label: seasonRelation?.label ?? '?',
            season_start_date: seasonRelation?.start_date ?? null,
            season_end_date: seasonRelation?.end_date ?? null,
            season_is_current: seasonRelation?.is_current ?? false,
          }
        }),
      )

      const totals = new Map<string, SeasonStatRow>()
      for (const row of (statData ?? []) as (MatchPlayerStat & {
        matches: { season_id: string; seasons: { label: string } | null } | null
      })[]) {
        const seasonId = row.matches?.season_id
        if (!seasonId) continue
        const seasonLabel = row.matches?.seasons?.label ?? '?'
        const existing = totals.get(seasonId)
        if (existing) {
          existing.appearances += 1
          existing.starts += row.is_starting ? 1 : 0
          existing.goals += row.goals
          existing.assists += row.assists
          existing.minutes += row.minutes_played
        } else {
          totals.set(seasonId, {
            season_id: seasonId,
            season_label: seasonLabel,
            appearances: 1,
            starts: row.is_starting ? 1 : 0,
            goals: row.goals,
            assists: row.assists,
            minutes: row.minutes_played,
          })
        }
      }
      setSeasonStats([...totals.values()])
      setLoading(false)
    }

    load()
  }, [playerId])

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!player) return <p className="text-sm text-club-muted">選手が見つかりませんでした。</p>

  const years = yearsAtClub(memberships)

  return (
    <>
      <div className="mb-6 flex items-center gap-4 border-b border-club-line pb-6">
        <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-club-navy md:text-3xl">
            {player.full_name}
          </h1>
          {(player.name_kana || player.name_en) && (
            <p className="text-sm text-club-muted">{[player.name_kana, player.name_en].filter(Boolean).join(' / ')}</p>
          )}
          <p className="mt-1 text-sm text-club-muted">
            {[
              player.nationality,
              player.age !== null ? `${player.age}歳` : null,
              player.height_cm ? `${player.height_cm}cm` : null,
              player.weight_kg ? `${player.weight_kg}kg` : null,
              player.preferred_foot ? `${footLabels[player.preferred_foot]}利き` : null,
            ]
              .filter(Boolean)
              .join(' ・ ')}
          </p>
          {years !== null && <p className="mt-1 text-xs text-club-muted">在籍年数の目安: 約{years}年</p>}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          所属履歴
        </h2>
        {memberships.length === 0 ? (
          <p className="text-sm text-club-muted">所属履歴がまだありません。</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {memberships.map((membership) => {
              const expiringSoon =
                membership.season_is_current && isContractExpiringSoon(membership, membership.season_end_date)
              return (
                <div key={membership.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-semibold text-club-navy">
                        {membership.season_label}
                      </span>
                      {membership.squad_number !== null && (
                        <span className="text-xs text-club-muted">#{membership.squad_number}</span>
                      )}
                      {membership.position_main && (
                        <span className="text-xs text-club-muted">
                          {[membership.position_main, membership.position_sub].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </div>
                    {membership.contract_end_date && (
                      <div className="text-xs text-club-muted">契約満了: {membership.contract_end_date}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {expiringSoon && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        契約満了間近
                      </span>
                    )}
                    <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                      {statusLabels[membership.status]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Season Stats
          </h2>
          {seasonStats.length === 0 ? (
            <p className="text-sm text-club-muted">試合出場記録がまだありません。</p>
          ) : (
            <div className="space-y-2">
              {seasonStats.map((s) => (
                <div key={s.season_id} className="text-sm">
                  <span className="font-medium text-club-navy">{s.season_label}</span>
                  <div className="text-xs text-club-muted">
                    出場{s.appearances}（先発{s.starts}） ・ {s.goals}得点 ・ {s.assists}アシスト ・ {s.minutes}分
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Transfer History
          </h2>
          {transfers.length === 0 ? (
            <p className="text-sm text-club-muted">移籍履歴がまだありません。</p>
          ) : (
            <div className="space-y-2">
              {transfers.map((t) => (
                <div key={t.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-club-navy">{transferTypeLabels[t.transfer_type]}</span>
                    <span className="text-xs text-club-muted">{t.transfer_date}</span>
                  </div>
                  <div className="text-xs text-club-muted">
                    {t.from_club || '?'} → {t.to_club || '?'}
                    {t.fee ? ` ・ €${t.fee.toLocaleString()}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
