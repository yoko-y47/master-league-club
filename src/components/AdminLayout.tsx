import { Link, NavLink, Outlet } from 'react-router-dom'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import LanguageToggle from './LanguageToggle'

function linkClasses({ isActive }: { isActive: boolean }) {
  return [
    'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-club-navy text-white' : 'text-white/60 hover:bg-white/10 hover:text-white',
  ].join(' ')
}

export default function AdminLayout() {
  const { club } = useClub()
  const { t } = useLanguage()

  const adminNavItems = [
    { to: '/admin/club', label: t('adminNav.club') },
    { to: '/admin/seasons', label: t('adminNav.seasons') },
    { to: '/admin/players', label: t('adminNav.players') },
    { to: '/admin/coach', label: t('adminNav.coach') },
    { to: '/admin/competitions', label: t('adminNav.competitions') },
    { to: '/admin/matches', label: t('adminNav.matches') },
    { to: '/admin/transfers', label: t('adminNav.transfers') },
    { to: '/admin/news', label: t('adminNav.news') },
    { to: '/admin/uniform', label: t('adminNav.uniform') },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-club-ink shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <div className="leading-tight">
            <div className="font-display text-base font-semibold uppercase tracking-wide text-white">
              {t('layout.admin')}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{club?.name}</div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-wider">
            <LanguageToggle />
            <Link to="/" className="text-white/60 hover:text-white">
              {t('layout.backToSite')}
            </Link>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-white/60 hover:text-white"
            >
              {t('layout.signOut')}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:px-8">
          {adminNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
