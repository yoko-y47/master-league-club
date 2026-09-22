const CLUB_NAME = 'FC Lüneburg'

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-20 w-20',
} as const

export { CLUB_NAME }

export default function ClubCrest({ size = 'md' }: { size?: keyof typeof sizeClasses }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}images/club-crest.png`}
      alt={`${CLUB_NAME} crest`}
      className={`shrink-0 object-contain ${sizeClasses[size]}`}
    />
  )
}
