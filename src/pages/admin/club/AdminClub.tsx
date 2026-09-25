import { useEffect, useState, type FormEvent } from 'react'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'

export default function AdminClub() {
  const { club, refresh } = useClub()
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [stadiumName, setStadiumName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!club) return
    setName(club.name)
    setShortName(club.short_name ?? '')
    setFoundedYear(club.founded_year?.toString() ?? '')
    setLogoUrl(club.logo_url ?? '')
    setStadiumName(club.stadium_name ?? '')
    setDescription(club.description ?? '')
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error } = await supabase
      .from('clubs')
      .update({
        name,
        short_name: shortName || null,
        founded_year: foundedYear ? Number(foundedYear) : null,
        logo_url: logoUrl || null,
        stadium_name: stadiumName || null,
        description: description || null,
      })
      .eq('id', club.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    await refresh()
  }

  if (!club) return <p className="text-sm text-club-muted">{t('common.loading')}</p>

  return (
    <>
      <PageHeading title={t('adminNav.club')} description={t('adminClub.pageDesc')} />

      <form onSubmit={handleSubmit} className="grid max-w-xl gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
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
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
            {t('adminClub.stadiumName')}{t('common.optional')}
          </label>
          <input
            type="text"
            value={stadiumName}
            onChange={(e) => setStadiumName(e.target.value)}
            className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
            {t('adminClub.logoUrl')}{t('common.optional')}
          </label>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
            {t('adminClub.description')}{t('common.optional')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
        {saved && <p className="text-sm text-club-navy md:col-span-2">{t('adminClub.saved')}</p>}

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
