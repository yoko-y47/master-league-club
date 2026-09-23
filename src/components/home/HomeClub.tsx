import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import type { Club } from '@/lib/ClubContext'

export default function HomeClub({ club }: { club: Club }) {
  return (
    <section className="mb-10 rounded-lg bg-club-navy p-6 text-white md:p-10">
      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <ClubCrest size="lg" alt={`${club.name} crest`} />
        <div className="flex-1">
          <h2 className="font-display text-2xl font-semibold tracking-wide md:text-3xl">{club.name}</h2>
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-white/60 md:justify-start">
            {club.founded_year && <span>Founded {club.founded_year}</span>}
            {club.stadium_name && <span>{club.stadium_name}</span>}
          </div>
          {club.description && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/80">{club.description}</p>
          )}
        </div>
        <Link
          to="/club"
          className="shrink-0 rounded-md bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wider text-club-navy hover:opacity-90"
        >
          About the Club
        </Link>
      </div>
    </section>
  )
}
