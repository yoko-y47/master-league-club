const sizeClasses = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-24 w-24 text-xl',
} as const

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PlayerAvatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string
  photoUrl?: string | null
  size?: keyof typeof sizeClasses
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${sizeClasses[size]}`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-club-navy/10 font-display font-semibold text-club-navy ${sizeClasses[size]}`}
    >
      {initials(name)}
    </div>
  )
}
