import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import type { Club } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function HomeClub({ club }: { club: Club }) {
  const { t } = useLanguage()
  return (
    <section className="mb-10 rounded-lg bg-club-navy p-4 text-white">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left">
        <ClubCrest size="sm" alt={`${club.name} crest`} />
        <div className="flex-1">
          <h2 className="font-display text-base font-bold uppercase tracking-wide">{club.name}</h2>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-xs text-white/60 sm:justify-start">
            {club.founded_year && <span>{t('club.founded')} {club.founded_year}</span>}
            {club.stadium_name && <span>{club.stadium_name}</span>}
          </div>
        </div>
        <Link
          to="/club"
          className="shrink-0 rounded-md bg-club-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-club-navy hover:opacity-90"
        >
          {t('club.about')}
        </Link>
      </div>
    </section>
  )
}
