import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import type { Match } from '@/lib/matches'

type Row = Match & { competition_name: string }

export default function HomeNextMatch({ clubName, match }: { clubName: string; match: Row | null }) {
  if (!match) return null

  const [home, away] = match.home_away === 'home' ? [clubName, match.opponent_name] : [match.opponent_name, clubName]

  return (
    <section className="mb-10 rounded-lg border border-club-line bg-white p-6 md:p-10">
      <div className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-club-muted">
        Next Match
      </div>
      <div className="flex items-center justify-center gap-4 md:gap-10">
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <ClubCrest size="md" alt={home} />
          <span className="font-display text-sm font-semibold text-club-navy md:text-base">{home}</span>
        </div>
        <div className="shrink-0 text-center">
          <div className="font-display text-2xl font-bold text-club-muted md:text-3xl">VS</div>
        </div>
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-club-bg font-display text-sm font-semibold text-club-muted md:h-16 md:w-16">
            {away.slice(0, 3).toUpperCase()}
          </div>
          <span className="font-display text-sm font-semibold text-club-navy md:text-base">{away}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-club-muted">
        <span>{match.match_date}</span>
        {match.kickoff_time && <span>{match.kickoff_time.slice(0, 5)} KO</span>}
        <span>{match.competition_name}</span>
        {match.venue && <span>{match.venue}</span>}
      </div>

      <div className="mt-6 text-center">
        <Link
          to={`/matches/${match.id}`}
          className="inline-block rounded-md bg-club-navy px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:opacity-90"
        >
          Match Center
        </Link>
      </div>
    </section>
  )
}
