const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-20 w-20',
} as const

export default function ClubCrest({
  size = 'md',
  alt = 'Club crest',
}: {
  size?: keyof typeof sizeClasses
  alt?: string
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}images/club-crest.png`}
      alt={alt}
      className={`shrink-0 object-contain ${sizeClasses[size]}`}
    />
  )
}
