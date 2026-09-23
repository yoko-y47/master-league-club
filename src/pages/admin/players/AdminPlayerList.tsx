import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { calculateAge, type Player } from '@/lib/players'

export default function AdminPlayerList() {
  const { club } = useClub()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [nationality, setNationality] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  async function loadPlayers() {
    if (!club) return
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', club.id)
      .order('full_name')
    setPlayers(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadPlayers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('players').insert({
      club_id: club.id,
      full_name: fullName,
      nationality: nationality || null,
      birth_date: birthDate || null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setFullName('')
    setNationality('')
    setBirthDate('')
    setShowForm(false)
    setSubmitting(false)
    await loadPlayers()
  }

  async function handleDelete(playerId: string) {
    await supabase.from('players').delete().eq('id', playerId)
    setConfirmingDeleteId(null)
    await loadPlayers()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title="Players" description="選手プロフィール・シーズン所属の管理" />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          {showForm ? 'キャンセル' : '+ New Player'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              氏名
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              国籍（任意）
            </label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              生年月日（任意）
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-2"
          >
            作成する（詳細・シーズン所属は作成後に編集できます）
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : players.length === 0 ? (
        <p className="text-sm text-club-muted">選手がまだ登録されていません。「+ New Player」から作成してください。</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {players.map((player) => {
            const age = calculateAge(player.birth_date)
            return (
              <div key={player.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link to={`/admin/players/${player.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-semibold text-club-navy">
                      {player.full_name}
                    </div>
                    <div className="text-xs text-club-muted">
                      {[player.nationality, age !== null ? `${age}歳` : null].filter(Boolean).join(' ・ ')}
                    </div>
                  </div>
                </Link>
                {confirmingDeleteId === player.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">削除しますか？</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(player.id)}
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
                    onClick={() => setConfirmingDeleteId(player.id)}
                    className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                  >
                    削除
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
