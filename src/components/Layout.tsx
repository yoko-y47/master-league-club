import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
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

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { club } = useClub()
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-club-navy shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
            <ClubCrest size="sm" alt={club ? `${club.name} crest` : 'Club crest'} />
            <div className="leading-tight">
              <div className="font-display text-base font-semibold tracking-wide text-white md:text-lg">
                {club?.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                {t('layout.tagline')}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <DesktopNav />

            <LanguageToggle className="hidden md:flex" />

            <Link
              to="/admin"
              className="hidden text-xs font-medium uppercase tracking-wider text-white/50 transition-colors hover:text-white md:inline"
            >
              {t('layout.admin')}
            </Link>

            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="hidden text-xs font-medium uppercase tracking-wider text-white/50 transition-colors hover:text-white md:inline"
            >
              {t('layout.signOut')}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={t('layout.menuAria')}
              className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-club-navy-2 bg-white md:hidden">
            <div className="mx-auto max-w-6xl">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
