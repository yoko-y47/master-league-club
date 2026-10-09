import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import BackButton from './BackButton'
import ClubCrest from './ClubCrest'
import DesktopNav from './DesktopNav'
import Footer from './Footer'
import LanguageToggle from './LanguageToggle'
import NavMenu from './NavMenu'

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function QuickIcon({ name }: { name: 'matches' | 'schedule' | 'squad' }) {
  const common = { viewBox: '0 0 24 24', className: 'h-7 w-7', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
  if (name === 'matches') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="M12 5v14" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M3 9.5h2.5v5H3M21 9.5h-2.5v5H21" />
      </svg>
    )
  }
  if (name === 'schedule') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="1.5" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3.1-6.5 7-6.5s7 2.5 7 6.5" />
    </svg>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { club } = useClub()
  const { t } = useLanguage()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const quickLinks = [
    { to: '/matches', icon: 'matches' as const, label: t('home.quick.matches') },
    { to: '/schedule', icon: 'schedule' as const, label: t('home.quick.schedule') },
    { to: '/players', icon: 'squad' as const, label: t('home.quick.squad') },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-[3px] border-club-gold bg-white shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-stretch justify-between">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex shrink-0 items-center gap-3 bg-club-navy px-5 md:px-7"
          >
            <ClubCrest size="md" alt={club ? `${club.name} crest` : 'Club crest'} />
            <div className="hidden leading-tight md:block">
              <div className="font-display text-lg font-bold uppercase tracking-wide text-white">{club?.name}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">{t('layout.tagline')}</div>
            </div>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-5 px-4 md:px-8">
            <DesktopNav />

            <div className="hidden h-6 w-px bg-club-line md:block" />

            <LanguageToggle className="hidden !border-club-line md:flex [&_button]:text-club-muted [&_button[aria-pressed=true]]:bg-club-navy [&_button[aria-pressed=true]]:text-white" />

            <Link
              to="/admin"
              className="hidden text-xs font-semibold uppercase tracking-wider text-club-muted transition-colors hover:text-club-navy md:inline"
            >
              {t('layout.admin')}
            </Link>

            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="hidden text-xs font-semibold uppercase tracking-wider text-club-muted transition-colors hover:text-club-navy md:inline"
            >
              {t('layout.signOut')}
            </button>

            <div className="flex items-center md:hidden">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-14 flex-col items-center gap-0.5 border-l border-club-line py-2 text-club-navy first:border-l-0"
                >
                  <QuickIcon name={item.icon} />
                  <span className="text-[10px] font-medium leading-tight text-club-ink">{item.label}</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-label={t('layout.menuAria')}
                className="ml-1 flex w-14 flex-col items-center gap-0.5 py-2 text-club-navy"
              >
                <MenuIcon open={menuOpen} />
                <span className="font-display text-[10px] font-bold uppercase tracking-wider">
                  {menuOpen ? t('layout.menuClose') : t('layout.menu')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-club-line bg-white md:hidden">
            <div className="mx-auto max-w-7xl">
              <NavMenu onNavigate={() => setMenuOpen(false)} />
              <div className="px-4 py-3">
                <LanguageToggle className="!border-club-line w-fit [&_button]:text-club-muted [&_button[aria-pressed=true]]:bg-club-navy [&_button[aria-pressed=true]]:text-white" />
              </div>
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block w-full px-4 py-3 text-left font-display text-sm font-semibold uppercase tracking-wider text-club-muted"
              >
                {t('layout.admin')}
              </Link>
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="block w-full px-4 py-3 text-left font-display text-sm font-semibold uppercase tracking-wider text-club-muted"
              >
                {t('layout.signOut')}
              </button>
            </div>
          </div>
        )}
      </header>

      {isHome ? (
        <main className="flex-1">
          <Outlet />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-8">
          <BackButton />
          <Outlet />
        </main>
      )}

      <Footer />
    </div>
  )
}
