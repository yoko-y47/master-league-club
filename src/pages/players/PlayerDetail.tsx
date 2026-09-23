import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PlayerAvatar from '@/components/PlayerAvatar'
import { supabase } from '@/lib/supabaseClient'
import { calculateAge, statusLabels, type Player, type SquadMembership } from '@/lib/players'

type MembershipRow = SquadMembership & { season_label: string }

const footLabels: Record<string, string> = { left: '左', right: '右', both: '両足' }

export default function PlayerDetail() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [memberships, setMemberships] = useState<MembershipRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return
    setLoading(true)

    async function load() {
      const [{ data: playerData }, { data: membershipData }] = await Promise.all([
        supabase.from('players').select('*').eq('id', playerId).maybeSingle(),
        supabase
          .from('squad_memberships')
          .select('*, seasons(label)')
          .eq('player_id', playerId)
          .order('created_at', { ascending: false }),
      ])

      setPlayer(playerData)
      setMemberships(
        (membershipData ?? []).map((row) => {
          const { seasons: seasonRelation, ...rest } = row as SquadMembership & {
            seasons: { label: string } | null
          }
          return { ...rest, season_label: seasonRelation?.label ?? '?' }
        }),
      )
      setLoading(false)
    }

    load()
  }, [playerId])

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!player) return <p className="text-sm text-club-muted">選手が見つかりませんでした。</p>

  const age = calculateAge(player.birth_date)

  return (
    <>
      <div className="mb-6 flex items-center gap-4 border-b border-club-line pb-6">
        <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-club-navy md:text-3xl">
            {player.full_name}
          </h1>
          <p className="mt-1 text-sm text-club-muted">
            {[player.nationality, age !== null ? `${age}歳` : null, player.height_cm ? `${player.height_cm}cm` : null, player.preferred_foot ? `${footLabels[player.preferred_foot]}利き` : null]
              .filter(Boolean)
              .join(' ・ ')}
          </p>
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
            {memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-club-navy">
                      {membership.season_label}
                    </span>
                    {membership.squad_number !== null && (
                      <span className="text-xs text-club-muted">#{membership.squad_number}</span>
                    )}
                    {membership.position && <span className="text-xs text-club-muted">{membership.position}</span>}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                  {statusLabels[membership.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Season Stats
          </h2>
          <p className="mt-2 text-sm text-club-muted">
            Phase 6以降でゴール・アシスト・出場数などのシーズン成績を表示します。
          </p>
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Transfer History
          </h2>
          <p className="mt-2 text-sm text-club-muted">Phase 7以降で移籍履歴を表示します。</p>
        </section>
      </div>
    </>
  )
}
