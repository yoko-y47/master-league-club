import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { useTransferTypeLabels, type Transfer } from '@/lib/transfers'

type TransferRow = Transfer & { player_name: string }

export default function TransferList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const transferTypeLabels = useTransferTypeLabels()
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
      <PageHeading title={t('transfers.pageTitle')} description={t('transfers.pageDesc.public')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : transfers.length === 0 ? (
        <p className="text-sm text-club-muted">{t('transfers.empty')}</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {transfers.map((transfer) => (
            <Link
              key={transfer.id}
              to={`/players/${transfer.player_id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-club-bg"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-club-navy">{transfer.player_name}</span>
                  <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                    {transferTypeLabels[transfer.transfer_type]}
                  </span>
                </div>
                <div className="text-xs text-club-muted">
                  {transfer.from_club || '?'} → {transfer.to_club || '?'}
                  {transfer.fee ? ` ・ €${transfer.fee.toLocaleString()}` : ''}
                </div>
              </div>
              <div className="shrink-0 text-xs text-club-muted">{transfer.transfer_date}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
