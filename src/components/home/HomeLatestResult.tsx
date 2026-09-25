import { Link } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { matchResult, resultColors, resultLabels, type Match } from '@/lib/matches'

type Row = Match & { competition_name: string }

export default function HomeLatestResult({ clubName, match }: { clubName: string; match: Row | null }) {
  const { t } = useLanguage()
  if (!match) return null

  const [home, away] = match.home_away === 'home' ? [clubName, match.opponent_name] : [match.opponent_name, clubName]
  const { home_score: homeScore, away_score: awayScore } = match
  const result = matchResult(match)

  return (
    <section className="mb-10 rounded-lg bg-club-navy p-6 text-white md:p-10">
      <div className="mb-4 flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
        {t('home.latestResult')}
        {result && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${resultColors[result]}`}>
            {resultLabels[result]}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 md:gap-10">
        <span className="flex-1 text-right font-display text-base font-semibold md:text-xl">{home}</span>
        <span className="shrink-0 font-display text-3xl font-bold tracking-wide md:text-4xl">
          {homeScore} - {awayScore}
        </span>
        <span className="flex-1 text-left font-display text-base font-semibold md:text-xl">{away}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/60">
        <span>{match.match_date}</span>
        <span>{match.competition_name}</span>
        {match.round_label && <span>{match.round_label}</span>}
      </div>

      <div className="mt-6 text-center">
        <Link
          to={`/matches/${match.id}`}
          className="inline-block rounded-md bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wider text-club-navy hover:opacity-90"
        >
          {t('home.matchReport')}
        </Link>
      </div>
    </section>
  )
}
