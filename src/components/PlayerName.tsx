import type { Player } from '@/lib/players'

const sizeClasses = {
  sm: { given: 'text-[10px]', family: 'text-sm', fallback: 'text-sm font-semibold' },
  md: { given: 'text-xs', family: 'text-lg', fallback: 'text-sm font-semibold' },
  lg: { given: 'text-sm', family: 'text-2xl md:text-3xl', fallback: 'text-2xl font-semibold md:text-3xl' },
} as const

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export default function PlayerName({
  player,
  size = 'md',
  className = '',
}: {
  player: Pick<Player, 'full_name' | 'given_name_en' | 'family_name_en'>
  size?: keyof typeof sizeClasses
  className?: string
}) {
  const classes = sizeClasses[size]

  if (player.given_name_en && player.family_name_en) {
    return (
      <div className={className}>
        <div className={`font-display text-club-muted ${classes.given}`}>{toTitleCase(player.given_name_en)}</div>
        <div className={`font-display font-bold uppercase leading-tight text-club-navy ${classes.family}`}>
          {player.family_name_en}
        </div>
      </div>
    )
  }

  return <div className={`font-display text-club-navy ${classes.fallback} ${className}`}>{player.full_name}</div>
}
