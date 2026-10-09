import { Link } from 'react-router-dom'
import ClubCrest from './ClubCrest'
import { getNavItems } from './navItems'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function Footer() {
  const { club } = useClub()
  const { t } = useLanguage()
  const navItems = getNavItems(t)

  return (
    <footer className="border-t-[3px] border-club-gold bg-club-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <Link to="/" className="flex items-center gap-3">
          <ClubCrest size="md" alt={club ? `${club.name} crest` : 'Club crest'} />
          <span className="font-display text-2xl font-bold uppercase tracking-wide">{club?.name}</span>
        </Link>
        {(club?.stadium_name || club?.founded_year) && (
          <p className="mt-3 text-xs text-white/70">
            {[club?.stadium_name, club?.founded_year ? `${t('club.founded')} ${club.founded_year}` : null]
              .filter(Boolean)
              .join(' ・ ')}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {navItems.map((item) => (
            <div key={item.label}>
              {item.to ? (
                <Link to={item.to} className="font-display text-sm font-bold uppercase tracking-wider hover:underline">
                  {item.label}
                </Link>
              ) : (
                <div className="font-display text-sm font-bold uppercase tracking-wider">{item.label}</div>
              )}
              {item.children && (
                <ul className="mt-3 space-y-2 text-xs text-white/80">
                  {item.children.map((child) => (
                    <li key={child.to}>
                      <Link to={child.to} className="hover:text-white hover:underline">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-[11px] text-white/60 md:px-8">
        © {new Date().getFullYear()} {club?.name}. {t('footer.copyright')}
      </div>
    </footer>
  )
}
