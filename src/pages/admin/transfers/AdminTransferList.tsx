import { useEffect, useState, type FormEvent } from 'react'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { transferTypeLabels, type Transfer, type TransferType } from '@/lib/transfers'
import type { Player } from '@/lib/players'
import type { Season } from '@/lib/seasons'

type TransferRow = Transfer & { player_name: string }

const typeOptions = Object.entries(transferTypeLabels) as [TransferType, string][]

export default function AdminTransferList() {
  const { club } = useClub()
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [playerId, setPlayerId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [fromClub, setFromClub] = useState('')
  const [toClub, setToClub] = useState('')
  const [transferType, setTransferType] = useState<TransferType>('signing')
  const [fee, setFee] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  async function loadTransfers() {
    if (!club) return
    setLoading(true)
    const playerIds = (await supabase.from('players').select('id').eq('club_id', club.id)).data?.map((p) => p.id) ?? []
    const { data } = await supabase
      .from('transfers')
      .select('*, players(full_name)')
      .in('player_id', playerIds.length > 0 ? playerIds : ['00000000-0000-0000-0000-000000000000'])
      .order('transfer_date', { ascending: false })
    setTransfers(
      (data ?? []).map((row) => {
        const { players: playerRel, ...rest } = row as Transfer & { players: { full_name: string } | null }
        return { ...rest, player_name: playerRel?.full_name ?? '?' }
      }),
    )
    setLoading(false)
  }

  async function loadOptions() {
    if (!club) return
    const [{ data: playerData }, { data: seasonData }] = await Promise.all([
      supabase.from('players').select('*').eq('club_id', club.id).order('full_name'),
      supabase.from('seasons').select('*').eq('club_id', club.id).order('start_date', { ascending: false }),
    ])
    setPlayers(playerData ?? [])
    setSeasons(seasonData ?? [])
  }

  useEffect(() => {
    loadTransfers()
    loadOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!playerId || !seasonId) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('transfers').insert({
      player_id: playerId,
      season_id: seasonId,
      transfer_date: transferDate,
      from_club: fromClub || null,
      to_club: toClub || null,
      transfer_type: transferType,
      fee: fee ? Number(fee) : null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setPlayerId('')
    setSeasonId('')
    setTransferDate('')
    setFromClub('')
    setToClub('')
    setTransferType('signing')
    setFee('')
    setShowForm(false)
    setSubmitting(false)
    await loadTransfers()
  }

  async function handleDelete(id: string) {
    await supabase.from('transfers').delete().eq('id', id)
    setConfirmingDeleteId(null)
    await loadTransfers()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title="Transfers" description="移籍履歴の管理" />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={players.length === 0 || seasons.length === 0}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-40"
        >
          {showForm ? 'キャンセル' : '+ New Transfer'}
        </button>
      </div>

      {(players.length === 0 || seasons.length === 0) && (
        <p className="mb-4 text-sm text-club-muted">
          移籍を登録する前に、{players.length === 0 && '選手'}
          {players.length === 0 && seasons.length === 0 && '・'}
          {seasons.length === 0 && 'シーズン'}を作成してください。
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              選手
            </label>
            <select
              required
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              <option value="">選択してください</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              シーズン
            </label>
            <select
              required
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              <option value="">選択してください</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              移籍日
            </label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              移籍種別
            </label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value as TransferType)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              {typeOptions.map(([value, labelText]) => (
                <option key={value} value={value}>
                  {labelText}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              移籍元（任意）
            </label>
            <input
              type="text"
              value={fromClub}
              onChange={(e) => setFromClub(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              移籍先（任意）
            </label>
            <input
              type="text"
              value={toClub}
              onChange={(e) => setToClub(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              移籍金（任意）
            </label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-3"
          >
            追加する
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : transfers.length === 0 ? (
        <p className="text-sm text-club-muted">移籍がまだ登録されていません。</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {transfers.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-club-navy">{t.player_name}</span>
                  <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                    {transferTypeLabels[t.transfer_type]}
                  </span>
                </div>
                <div className="text-xs text-club-muted">
                  {t.transfer_date} ・ {t.from_club || '?'} → {t.to_club || '?'}
                  {t.fee ? ` ・ €${t.fee.toLocaleString()}` : ''}
                </div>
              </div>
              {confirmingDeleteId === t.id ? (
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-club-muted">削除しますか？</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="font-semibold text-red-600 hover:underline"
                  >
                    はい
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-club-muted hover:underline"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteId(t.id)}
                  className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
