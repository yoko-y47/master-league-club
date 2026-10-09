import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'

export default function HomeTile({ to, label, className = '' }: { to: string; label: string; className?: string }) {
  return (
    <Link
      to={to}
      className={`relative flex min-h-[120px] items-end overflow-hidden bg-gradient-to-br from-club-navy to-club-navy-2 p-4 text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <div className="absolute -right-4 -top-4 opacity-20">
        <ClubCrest size="lg" alt="" />
      </div>
      <span className="relative font-display text-xl font-bold md:text-2xl">{label}</span>
    </Link>
  )
}
