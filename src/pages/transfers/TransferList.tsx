import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { transferTypeLabels, type Transfer } from '@/lib/transfers'

type TransferRow = Transfer & { player_name: string }

export default function TransferList() {
  const { club } = useClub()
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club) return

    async function load() {
      setLoading(true)
      const { data: playerRows } = await supabase.from('players').select('id').eq('club_id', club!.id)
      const playerIds = playerRows?.map((p) => p.id) ?? []

      if (playerIds.length === 0) {
        setTransfers([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('transfers')
        .select('*, players(full_name)')
        .in('player_id', playerIds)
        .order('transfer_date', { ascending: false })

      setTransfers(
        (data ?? []).map((row) => {
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
      <PageHeading title="Transfers" description="移籍履歴" />

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : transfers.length === 0 ? (
        <p className="text-sm text-club-muted">移籍記録がまだありません。</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {transfers.map((t) => (
            <Link
              key={t.id}
              to={`/players/${t.player_id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-club-bg"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-club-navy">{t.player_name}</span>
                  <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                    {transferTypeLabels[t.transfer_type]}
                  </span>
                </div>
                <div className="text-xs text-club-muted">
                  {t.from_club || '?'} → {t.to_club || '?'}
                  {t.fee ? ` ・ €${t.fee.toLocaleString()}` : ''}
                </div>
              </div>
              <div className="shrink-0 text-xs text-club-muted">{t.transfer_date}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
