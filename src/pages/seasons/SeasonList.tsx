import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'

export default function SeasonList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club) return
    setLoading(true)
    supabase
      .from('seasons')
      .select('*')
      .eq('club_id', club.id)
      .order('start_date', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setSeasons(data ?? [])
        setLoading(false)
      })
  }, [club])

  return (
    <>
      <PageHeading title={t('seasons.pageTitle')} description={t('seasons.pageDesc.public')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : seasons.length === 0 ? (
        <p className="text-sm text-club-muted">{t('seasons.empty')}</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {seasons.map((season) => (
            <Link
              key={season.id}
              to={`/seasons/${season.id}`}
              className="block px-4 py-3 hover:bg-club-bg"
            >
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
          ))}
        </div>
      )}
    </>
  )
}
