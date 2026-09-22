import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'

export default function AdminSeasonEdit() {
  const { seasonId } = useParams()
  const { club } = useClub()
  const navigate = useNavigate()
  const [season, setSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSeason() {
    if (!seasonId) return
    setLoading(true)
    const { data } = await supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle()
    setSeason(data)
    if (data) {
      setLabel(data.label)
      setStartDate(data.start_date ?? '')
      setEndDate(data.end_date ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSeason()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!season) return
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('seasons')
      .update({ label, start_date: startDate || null, end_date: endDate || null })
      .eq('id', season.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    await loadSeason()
  }

  async function handleSetCurrent() {
    if (!season || !club) return
    await supabase.from('seasons').update({ is_current: false }).eq('club_id', club.id)
    await supabase.from('seasons').update({ is_current: true }).eq('id', season.id)
    setSeason({ ...season, is_current: true })
  }

  async function handleDelete() {
    if (!season) return
    await supabase.from('seasons').delete().eq('id', season.id)
    navigate('/admin/seasons')
  }

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!season) return <p className="text-sm text-club-muted">シーズンが見つかりませんでした。</p>

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <PageHeading title={`Edit: ${season.label}`} />
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {!season.is_current && (
            <button
              type="button"
              onClick={handleSetCurrent}
              className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5"
            >
              現在のシーズンにする
            </button>
          )}
          {confirmingDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-club-muted">削除しますか？</span>
              <button type="button" onClick={handleDelete} className="font-semibold text-red-600 hover:underline">
                はい
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-club-muted hover:underline"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-muted hover:border-red-300 hover:text-red-600"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {season.is_current && (
        <span className="mb-4 inline-block rounded-full bg-club-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-navy">
          Current Season
        </span>
      )}

      <form onSubmit={handleSave} className="grid max-w-md gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
            シーズン名
          </label>
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
            開始日（任意）
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
            終了日（任意）
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
        >
          保存する
        </button>
      </form>
    </>
  )
}
