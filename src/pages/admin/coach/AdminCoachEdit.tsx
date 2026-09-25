import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Coach } from '@/lib/coaches'

export default function AdminCoachEdit() {
  const { coachId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [nationality, setNationality] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadCoach() {
    if (!coachId) return
    setLoading(true)
    const { data } = await supabase.from('coaches').select('*').eq('id', coachId).maybeSingle()
    setCoach(data)
    if (data) {
      setFullName(data.full_name)
      setRole(data.role)
      setNationality(data.nationality ?? '')
      setStartDate(data.start_date ?? '')
      setEndDate(data.end_date ?? '')
      setPhotoUrl(data.photo_url ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCoach()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!coach) return
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('coaches')
      .update({
        full_name: fullName,
        role,
        nationality: nationality || null,
        start_date: startDate || null,
        end_date: endDate || null,
        photo_url: photoUrl || null,
      })
      .eq('id', coach.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    await loadCoach()
  }

  async function handleDelete() {
    if (!coach) return
    await supabase.from('coaches').delete().eq('id', coach.id)
    navigate('/admin/coach')
  }

  if (loading) return <p className="text-sm text-club-muted">{t('common.loading')}</p>
  if (!coach) return <p className="text-sm text-club-muted">{t('common.notFound.coach')}</p>

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <PageHeading title={coach.full_name} description={coach.role} />
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="text-club-muted">{t('common.confirmDelete')}</span>
            <button type="button" onClick={handleDelete} className="font-semibold text-red-600 hover:underline">
              {t('common.yes')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-club-muted hover:underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="shrink-0 rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-muted hover:border-red-300 hover:text-red-600"
          >
            {t('common.delete')}
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="grid max-w-xl gap-3 md:grid-cols-2">
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
          disabled={saving}
          className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-2 md:w-fit"
        >
          {t('common.save')}
        </button>
      </form>
    </>
  )
}
