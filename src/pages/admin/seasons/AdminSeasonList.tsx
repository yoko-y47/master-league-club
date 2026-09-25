import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'

export default function AdminSeasonList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  async function loadSeasons() {
    if (!club) return
    setLoading(true)
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .eq('club_id', club.id)
      .order('start_date', { ascending: false, nullsFirst: false })
    setSeasons(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadSeasons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club) return
    setSubmitting(true)
    setError(null)

    if (isCurrent) {
      await supabase.from('seasons').update({ is_current: false }).eq('club_id', club.id)
    }

    const { error } = await supabase.from('seasons').insert({
      club_id: club.id,
      label,
      start_date: startDate || null,
      end_date: endDate || null,
      is_current: isCurrent,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setLabel('')
    setStartDate('')
    setEndDate('')
    setIsCurrent(true)
    setShowForm(false)
    setSubmitting(false)
    await loadSeasons()
  }

  async function handleDelete(seasonId: string) {
    await supabase.from('seasons').delete().eq('id', seasonId)
    setConfirmingDeleteId(null)
    await loadSeasons()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title={t('seasons.pageTitle')} description={t('seasons.pageDesc.admin')} />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          {showForm ? t('common.cancel') : t('seasons.newSeason')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('seasons.form.label')}
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
              {t('seasons.form.startDate')}{t('common.optional')}
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
              {t('seasons.form.endDate')}{t('common.optional')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-club-ink md:col-span-2">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="h-4 w-4"
            />
            {t('seasons.form.setCurrent')}
          </label>

          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-2"
          >
            {t('common.create')}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : seasons.length === 0 ? (
        <p className="text-sm text-club-muted">{t('seasons.emptyAdmin')}</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {seasons.map((season) => (
            <div key={season.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link to={`/admin/seasons/${season.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-club-navy">{season.label}</span>
                  {season.is_current && (
                    <span className="rounded-full bg-club-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-navy">
                      {t('common.current')}
                    </span>
                  )}
                </div>
                {(season.start_date || season.end_date) && (
                  <div className="text-xs text-club-muted">
                    {season.start_date ?? '?'} 〜 {season.end_date ?? '?'}
                  </div>
                )}
              </Link>
              {confirmingDeleteId === season.id ? (
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-club-muted">{t('common.confirmDelete')}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(season.id)}
                    className="font-semibold text-red-600 hover:underline"
                  >
                    {t('common.yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-club-muted hover:underline"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteId(season.id)}
                  className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
