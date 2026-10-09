import { Link } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Match } from '@/lib/matches'

type Row = Match & { competition_name: string }

export default function HomeNextMatch({ clubName, match }: { clubName: string; match: Row | null }) {
  const { t } = useLanguage()
  if (!match) return null

  const [home, away] = match.home_away === 'home' ? [clubName, match.opponent_name] : [match.opponent_name, clubName]

  return (
    <section className="bg-club-navy-2 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center md:px-8 md:py-10">
        <div className="font-display text-sm font-bold md:text-base">
          {t('home.nextMatch')}
          <span className="mx-2 text-white/40">|</span>
          {match.competition_name}
          {match.round_label ? ` ・ ${match.round_label}` : ''}
          <span className="mx-2 text-white/40">|</span>
          {match.match_date}
          {match.kickoff_time ? ` ・ ${match.kickoff_time.slice(0, 5)}` : ''}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 md:gap-10">
          <span className="flex-1 text-right font-display text-lg font-bold leading-tight md:text-3xl">{home}</span>
          <Link
            to={`/matches/${match.id}`}
            className="shrink-0 rounded-md bg-club-gold px-5 py-3 font-display text-sm font-bold text-club-navy ring-4 ring-club-gold/30 hover:opacity-90"
          >
            {t('home.matchCenter')}
          </Link>
          <span className="flex-1 text-left font-display text-lg font-bold leading-tight md:text-3xl">{away}</span>
        </div>
      </div>
    </section>
  )
}
