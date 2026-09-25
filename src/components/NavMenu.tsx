import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { getNavItems } from './navItems'

function childLinkClasses({ isActive }: { isActive: boolean }) {
  return [
    'block rounded-md px-4 py-2 text-sm transition-colors',
    isActive ? 'bg-club-navy/10 font-medium text-club-navy' : 'text-club-ink hover:bg-club-bg',
  ].join(' ')
}

export default function NavMenu({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLanguage()
  const navItems = getNavItems(t)
  const [openLabel, setOpenLabel] = useState<string | null>(navItems[0]?.label ?? null)

  return (
    <nav className="divide-y divide-club-line">
      {navItems.map((item) => {
        if (!item.children) {
          return (
            <NavLink
              key={item.label}
              to={item.to!}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  'block px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider',
                  isActive ? 'text-club-navy' : 'text-club-ink',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          )
        }

        const isOpen = openLabel === item.label

        return (
          <div key={item.label}>
            <button
              type="button"
              onClick={() => setOpenLabel(isOpen ? null : item.label)}
              className="flex w-full items-center justify-between px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider text-club-ink"
              aria-expanded={isOpen}
            >
              {item.label}
              <span aria-hidden className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
            {isOpen && (
              <div className="space-y-0.5 pb-2">
                {item.children.map((child) => (
                  <NavLink key={child.to} to={child.to} onClick={onNavigate} className={childLinkClasses}>
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
