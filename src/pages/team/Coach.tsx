import { useEffect, useState } from 'react'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Coach as CoachType } from '@/lib/coaches'

export default function Coach() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [coaches, setCoaches] = useState<CoachType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club) return
    setLoading(true)
    supabase
      .from('coaches')
      .select('*')
      .eq('club_id', club.id)
      .order('start_date', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setCoaches(data ?? [])
        setLoading(false)
      })
  }, [club])

  const current = coaches.filter((c) => !c.end_date)
  const past = coaches.filter((c) => c.end_date)

  function tenureLabel(c: CoachType) {
    if (c.end_date) return t('coach.tenureRange', { start: c.start_date ?? '?', end: c.end_date })
    if (c.start_date) return t('coach.tenureCurrent', { start: c.start_date })
    return ''
  }

  return (
    <>
      <PageHeading title={t('coach.title')} description={t('coach.desc')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : coaches.length === 0 ? (
        <p className="text-sm text-club-muted">{t('coach.empty')}</p>
      ) : (
        <>
          {current.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
                {t('coach.currentHeading')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {current.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-club-line bg-white p-4">
                    <PlayerAvatar name={c.full_name} photoUrl={c.photo_url} />
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-semibold text-club-navy">{c.full_name}</div>
                      <div className="text-xs text-club-muted">{c.role}</div>
                      {c.start_date && <div className="text-xs text-club-muted">{tenureLabel(c)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
                {t('coach.pastHeading')}
              </h2>
              <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
                {past.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <span className="font-display text-sm font-semibold text-club-navy">{c.full_name}</span>
                      <div className="text-xs text-club-muted">{c.role}</div>
                    </div>
                    <div className="shrink-0 text-xs text-club-muted">{tenureLabel(c)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}
