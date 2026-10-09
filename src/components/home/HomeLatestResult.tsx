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
    <section className="bg-club-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center md:px-8">
        <div className="flex items-center justify-center gap-2 font-display text-sm font-bold md:text-base">
          {t('home.latestResult')}
          <span className="text-white/40">|</span>
          {match.competition_name}
          {match.round_label ? ` ・ ${match.round_label}` : ''}
          <span className="text-white/40">|</span>
          {match.match_date}
          {result && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${resultColors[result]}`}>
              {resultLabels[result]}
            </span>
          )}
        </div>
        <div className="mt-5 flex items-center justify-center gap-4 md:gap-10">
          <span className="flex-1 text-right font-display text-base font-bold md:text-2xl">{home}</span>
          <span className="shrink-0 rounded-md bg-white px-4 py-2 font-display text-3xl font-bold text-club-navy md:text-4xl">
            {homeScore} - {awayScore}
          </span>
          <span className="flex-1 text-left font-display text-base font-bold md:text-2xl">{away}</span>
        </div>
        <Link
          to={`/matches/${match.id}`}
          className="mt-6 inline-block rounded-md bg-club-gold px-5 py-2.5 font-display text-sm font-bold text-club-navy hover:opacity-90"
        >
          {t('home.matchReport')}
        </Link>
      </div>
    </section>
  )
}
