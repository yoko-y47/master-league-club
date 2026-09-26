import { Link } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Match } from '@/lib/matches'

type Row = Match & { competition_name: string }

export default function HomeUpcomingMatches({ matches }: { matches: Row[] }) {
  const { t } = useLanguage()
  if (matches.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy md:text-xl">
          {t('home.upcomingMatches')}
        </h2>
        <Link
          to="/schedule"
          className="text-xs font-semibold uppercase tracking-wider text-club-muted hover:text-club-navy"
        >
          {t('home.viewAll')}
        </Link>
      </div>

      <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
        {matches.map((match) => (
          <Link key={match.id} to={`/matches/${match.id}`} className="block px-4 py-3 text-sm hover:bg-club-bg">
            <div className="flex items-center gap-3">
              <div className="w-16 shrink-0 text-xs text-club-muted">
                <div className="font-display text-sm font-semibold text-club-navy">{match.match_date.slice(5)}</div>
                {match.kickoff_time && <div>{match.kickoff_time.slice(0, 5)} KO</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm font-semibold text-club-navy">
                  {match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}
                </div>
                <div className="truncate text-xs text-club-muted">
                  {match.competition_name}
                  {match.round_label ? ` ・ ${match.round_label}` : ''}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
