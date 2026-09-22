import { Link, NavLink, Outlet } from 'react-router-dom'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'

const adminNavItems = [{ to: '/admin/seasons', label: 'Seasons' }]

function linkClasses({ isActive }: { isActive: boolean }) {
  return [
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-club-navy text-white' : 'text-club-ink hover:bg-club-bg',
  ].join(' ')
}

export default function AdminLayout() {
  const { club } = useClub()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-club-ink shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <div className="leading-tight">
            <div className="font-display text-base font-semibold uppercase tracking-wide text-white">
              Admin
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{club?.name}</div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-wider">
            <Link to="/" className="text-white/60 hover:text-white">
              ← サイトに戻る
            </Link>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-white/60 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 px-4 pb-3 md:px-8">
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
