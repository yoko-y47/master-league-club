import ClubCrest from '@/components/ClubCrest'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function Club() {
  const { club } = useClub()
  const { t } = useLanguage()

  if (!club) return <p className="text-sm text-club-muted">{t('common.loading')}</p>

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-4 rounded-lg bg-club-navy px-6 py-10 text-center text-white md:py-14">
        <ClubCrest size="lg" alt={`${club.name} crest`} />
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide md:text-5xl">{club.name}</h1>
          {club.short_name && <p className="mt-2 text-sm font-medium text-club-gold">{club.short_name}</p>}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        {club.founded_year && (
          <div className="rounded-lg border-t-4 border-club-gold bg-white p-4 text-center shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-club-muted">{t('club.founded')}</div>
            <div className="mt-1 font-display text-xl font-extrabold text-club-navy">{club.founded_year}</div>
          </div>
        )}
        {club.stadium_name && (
          <div className="rounded-lg border-t-4 border-club-gold bg-white p-4 text-center shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-club-muted">{t('club.stadium')}</div>
            <div className="mt-1 font-display text-xl font-extrabold text-club-navy">{club.stadium_name}</div>
          </div>
        )}
      </div>

      {club.description && (
        <div className="rounded-lg border border-club-line bg-white p-6">
          <h2 className="mb-3 border-l-4 border-club-gold pl-2 font-display text-sm font-bold uppercase tracking-wider text-club-navy">
            {t('club.about')}
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-club-ink">{club.description}</p>
        </div>
      )}
    </>
  )
}
