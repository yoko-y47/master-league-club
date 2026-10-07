import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Match } from '@/lib/matches'

type Row = Match & { competition_name: string }

export default function HomeNextMatch({ clubName, match }: { clubName: string; match: Row | null }) {
  const { t } = useLanguage()
  if (!match) return null

  const isClubHome = match.home_away === 'home'
  const [home, away] = isClubHome ? [clubName, match.opponent_name] : [match.opponent_name, clubName]

  return (
    <section className="mb-10 overflow-hidden rounded-lg bg-club-navy text-white">
      <div className="border-b border-white/10 bg-club-navy-2 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.3em] text-club-gold md:px-10">
        {t('home.nextMatch')}
      </div>
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex items-center justify-center gap-4 md:gap-12">
          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            {isClubHome ? (
              <ClubCrest size="lg" alt={home} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 font-display text-lg font-bold text-white md:h-20 md:w-20">
                {home.slice(0, 3).toUpperCase()}
              </div>
            )}
            <span className="font-display text-sm font-bold uppercase tracking-wide md:text-lg">{home}</span>
          </div>
          <div className="shrink-0 text-center">
            <div className="font-display text-3xl font-black text-club-gold md:text-4xl">VS</div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            {isClubHome ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 font-display text-lg font-bold text-white md:h-20 md:w-20">
                {away.slice(0, 3).toUpperCase()}
              </div>
            ) : (
              <ClubCrest size="lg" alt={away} />
            )}
            <span className="font-display text-sm font-bold uppercase tracking-wide md:text-lg">{away}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-medium text-white/60">
          <span>{match.match_date}</span>
          {match.kickoff_time && <span>{match.kickoff_time.slice(0, 5)} KO</span>}
          <span>{match.competition_name}</span>
          {match.venue && <span>{match.venue}</span>}
        </div>

        <div className="mt-7 text-center">
          <Link
            to={`/matches/${match.id}`}
            className="inline-block rounded-md bg-club-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-club-navy hover:opacity-90"
          >
            {t('home.matchCenter')}
          </Link>
        </div>
      </div>
    </section>
  )
}
