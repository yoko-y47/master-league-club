import { Link } from 'react-router-dom'
import ClubCrest from './ClubCrest'
import { useClub } from '@/lib/ClubContext'

const footerNav = [
  { to: '/matches', label: 'Matchday' },
  { to: '/players', label: 'Squad' },
  { to: '/news', label: 'News' },
  { to: '/club', label: 'Club' },
]

export default function Footer() {
  const { club } = useClub()

  return (
    <footer className="border-t border-club-navy-2 bg-club-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <ClubCrest size="sm" alt={club ? `${club.name} crest` : 'Club crest'} />
          <span className="font-display text-sm font-semibold uppercase tracking-wide">{club?.name}</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-white/60">
          {footerNav.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-white/40 md:px-8">
        © {new Date().getFullYear()} {club?.name}. Master League Club.
      </div>
    </footer>
  )
}
