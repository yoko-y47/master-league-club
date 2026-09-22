import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

function topLevelClasses({ isActive }: { isActive: boolean }) {
  return [
    'font-display text-sm font-semibold uppercase tracking-wider transition-colors',
    isActive ? 'text-white' : 'text-white/70 hover:text-white',
  ].join(' ')
}

function childLinkClasses({ isActive }: { isActive: boolean }) {
  return [
    'block whitespace-nowrap px-4 py-2 text-sm transition-colors',
    isActive ? 'bg-club-navy/10 font-medium text-club-navy' : 'text-club-ink hover:bg-club-bg',
  ].join(' ')
}

export default function DesktopNav() {
  const [openLabel, setOpenLabel] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!openLabel) return
    function handlePointerDown(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenLabel(null)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openLabel])

  return (
    <nav ref={navRef} className="hidden items-center gap-7 md:flex">
      {navItems.map((item, index) => {
        if (!item.children) {
          return (
            <NavLink key={item.label} to={item.to!} className={topLevelClasses}>
              {item.label}
            </NavLink>
          )
        }

        const isOpen = openLabel === item.label
        const alignRight = index >= navItems.length - 2

        return (
          <div key={item.label} className="relative">
            <button
              type="button"
              onClick={() => setOpenLabel(isOpen ? null : item.label)}
              aria-expanded={isOpen}
              className="flex items-center gap-1 font-display text-sm font-semibold uppercase tracking-wider text-white/70 transition-colors hover:text-white"
            >
              {item.label}
              <span aria-hidden className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
            {isOpen && (
              <div
                className={`absolute top-full z-30 mt-3 min-w-44 rounded-md border border-club-line bg-white py-1.5 shadow-lg ${alignRight ? 'right-0' : 'left-0'}`}
              >
                {item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={() => setOpenLabel(null)}
                    className={childLinkClasses}
                  >
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
