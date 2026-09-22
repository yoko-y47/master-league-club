import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import ClubCrest, { CLUB_NAME } from './ClubCrest'
import DesktopNav from './DesktopNav'
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-club-navy shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
            <ClubCrest size="sm" />
            <div className="leading-tight">
              <div className="font-display text-base font-semibold tracking-wide text-white md:text-lg">
                {CLUB_NAME}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Master League Club
              </div>
            </div>
          </Link>

          <DesktopNav />

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="メニュー"
            className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-club-navy-2 bg-white md:hidden">
            <div className="mx-auto max-w-6xl">
              <NavMenu onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
