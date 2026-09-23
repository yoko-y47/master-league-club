import { useEffect, useState, type FormEvent } from 'react'
import PageHeading from '@/components/PageHeading'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { competitionTypeLabels, type Competition, type CompetitionType } from '@/lib/competitions'

const typeOptions = Object.entries(competitionTypeLabels) as [CompetitionType, string][]

export default function AdminCompetitionList() {
  const { session } = useAuth()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<CompetitionType>('league')
  const [tier, setTier] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  async function loadCompetitions() {
    if (!session) return
    setLoading(true)
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('name')
    setCompetitions(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadCompetitions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('competitions').insert({
      owner_id: session.user.id,
      name,
      type,
      tier: tier ? Number(tier) : null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setName('')
    setType('league')
    setTier('')
    setShowForm(false)
    setSubmitting(false)
    await loadCompetitions()
  }

  async function handleDelete(id: string) {
    await supabase.from('competitions').delete().eq('id', id)
    setConfirmingDeleteId(null)
    await loadCompetitions()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title="Competitions" description="大会（リーグ・カップ）の管理" />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          {showForm ? 'キャンセル' : '+ New Competition'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              大会名
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              種別
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CompetitionType)}
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
              階層（任意、リーグの場合）
            </label>
            <input
              type="number"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-3"
          >
            作成する
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : competitions.length === 0 ? (
        <p className="text-sm text-club-muted">
          大会がまだ登録されていません。試合を登録する前に「+ New Competition」から作成してください。
        </p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {competitions.map((competition) => (
            <div key={competition.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <span className="font-display text-sm font-semibold text-club-navy">{competition.name}</span>
                <div className="text-xs text-club-muted">
                  {competitionTypeLabels[competition.type]}
                  {competition.tier ? ` ・ Tier ${competition.tier}` : ''}
                </div>
              </div>
              {confirmingDeleteId === competition.id ? (
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-club-muted">削除しますか？</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(competition.id)}
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
                  onClick={() => setConfirmingDeleteId(competition.id)}
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
