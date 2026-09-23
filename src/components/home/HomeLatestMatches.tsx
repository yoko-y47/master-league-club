import { Link } from 'react-router-dom'
import { matchResult, resultColors, resultLabels, type Match } from '@/lib/matches'

export default function HomeLatestMatches({ clubName, matches }: { clubName: string; matches: Match[] }) {
  if (matches.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy md:text-xl">
          Latest Matches
        </h2>
        <Link
          to="/matches"
          className="text-xs font-semibold uppercase tracking-wider text-club-muted hover:text-club-navy"
        >
          View All →
        </Link>
      </div>

      <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
        {matches.map((match) => {
          const [home, away] =
            match.home_away === 'home' ? [clubName, match.opponent_name] : [match.opponent_name, clubName]
          const [homeScore, awayScore] =
            match.home_away === 'home' ? [match.home_score, match.away_score] : [match.away_score, match.home_score]
          const result = matchResult(match)
          return (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-club-bg"
            >
              <span className="w-16 shrink-0 text-xs text-club-muted">{match.match_date.slice(5)}</span>
              <span className="flex-1 truncate text-right font-medium text-club-navy">{home}</span>
              <span className="shrink-0 font-display text-sm font-bold text-club-navy">
                {homeScore} - {awayScore}
              </span>
              <span className="flex-1 truncate font-medium text-club-navy">{away}</span>
              {result && (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${resultColors[result]}`}
                >
                  {resultLabels[result]}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
