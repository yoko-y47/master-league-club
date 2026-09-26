import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PlayerName from '@/components/PlayerName'
import type { Player } from '@/lib/players'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PlayerCard({
  player,
  squadNumber,
  to,
  subtitle,
  badge,
  footer,
  bare = false,
}: {
  player: Pick<Player, 'full_name' | 'given_name_en' | 'family_name_en' | 'photo_url'>
  squadNumber?: number | null
  to?: string
  subtitle?: ReactNode
  badge?: ReactNode
  footer?: ReactNode
  bare?: boolean
}) {
  const content = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-club-navy/10">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.full_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-club-navy">
            {initials(player.full_name)}
          </div>
        )}
        {squadNumber !== null && squadNumber !== undefined && (
          <div className="absolute left-2 top-2 font-display text-3xl font-bold leading-none text-club-navy drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] md:top-3 md:text-5xl">
            {String(squadNumber).padStart(2, '0')}
          </div>
        )}
        {badge && <div className="absolute right-2 top-2">{badge}</div>}
      </div>
      <div className="mt-2">
        <PlayerName player={player} size="md" />
        {subtitle && <div className="mt-0.5 text-xs text-club-muted">{subtitle}</div>}
        {footer && <div className="mt-1">{footer}</div>}
      </div>
    </>
  )

  if (bare) {
    return <div>{content}</div>
  }

  if (to) {
    return (
      <Link to={to} className="block rounded-lg border border-club-line bg-white p-3 hover:shadow-md">
        {content}
      </Link>
    )
  }

  return <div className="rounded-lg border border-club-line bg-white p-3">{content}</div>
}
