import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Coach } from '@/lib/coaches'

export default function AdminCoachList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [nationality, setNationality] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  async function loadCoaches() {
    if (!club) return
    setLoading(true)
    const { data } = await supabase
      .from('coaches')
      .select('*')
      .eq('club_id', club.id)
      .order('start_date', { ascending: false, nullsFirst: false })
    setCoaches(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadCoaches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('coaches').insert({
      club_id: club.id,
      full_name: fullName,
      role,
      nationality: nationality || null,
      start_date: startDate || null,
      end_date: endDate || null,
      photo_url: photoUrl || null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setFullName('')
    setRole('')
    setNationality('')
    setStartDate('')
    setEndDate('')
    setPhotoUrl('')
    setShowForm(false)
    setSubmitting(false)
    await loadCoaches()
  }

  async function handleDelete(id: string) {
    await supabase.from('coaches').delete().eq('id', id)
    setConfirmingDeleteId(null)
    await loadCoaches()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title={t('coach.title')} description={t('coaches.pageDesc.admin')} />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          {showForm ? t('common.cancel') : t('coaches.newCoach')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('coaches.form.fullName')}
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
              {t('coaches.form.role')}
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t('coaches.form.rolePlaceholder')}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('coaches.form.nationality')}{t('common.optional')}
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
              {t('coaches.form.startDate')}{t('common.optional')}
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
              {t('coaches.form.endDate')}{t('common.optional')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
            <p className="mt-1 text-xs text-club-muted">{t('coaches.form.endDateHint')}</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('coaches.form.photoUrl')}{t('common.optional')}
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

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
      ) : coaches.length === 0 ? (
        <p className="text-sm text-club-muted">{t('coaches.emptyAdmin')}</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {coaches.map((coach) => (
            <div key={coach.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link to={`/admin/coach/${coach.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-club-navy">{coach.full_name}</span>
                  {!coach.end_date && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                      {t('coaches.current')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-club-muted">
                  {coach.role}
                  {coach.start_date
                    ? ` ・ ${
                        coach.end_date
                          ? t('coach.tenureRange', { start: coach.start_date, end: coach.end_date })
                          : t('coach.tenureCurrent', { start: coach.start_date })
                      }`
                    : ''}
                </div>
              </Link>
              {confirmingDeleteId === coach.id ? (
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-club-muted">{t('common.confirmDelete')}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(coach.id)}
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
                  onClick={() => setConfirmingDeleteId(coach.id)}
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
