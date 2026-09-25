import { useState, type FormEvent } from 'react'
import ClubCrest from '@/components/ClubCrest'
import { useAuth } from '@/lib/AuthContext'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'

export default function CreateClub() {
  const { session } = useAuth()
  const { refresh } = useClub()
  const { t } = useLanguage()
  const [name, setName] = useState('FC Lüneburg')
  const [shortName, setShortName] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('clubs').insert({
      owner_id: session.user.id,
      name,
      short_name: shortName || null,
      founded_year: foundedYear ? Number(foundedYear) : null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    await refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-club-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-club-line bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <ClubCrest size="lg" />
          <h1 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy">
            {t('onboarding.title')}
          </h1>
          <p className="text-sm text-club-muted">{t('onboarding.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('onboarding.clubName')}
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
              {t('onboarding.shortName')}{t('common.optional')}
            </label>
            <input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('onboarding.foundedYear')}{t('common.optional')}
            </label>
            <input
              type="number"
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-club-navy py-2 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </form>
      </div>
    </div>
  )
}
