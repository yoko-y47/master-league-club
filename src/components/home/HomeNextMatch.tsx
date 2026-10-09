import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Match } from '@/lib/matches'

type Row = Match & { competition_name: string }

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [target])
  if (!target) return null
  const diff = Math.max(0, Math.floor((target.getTime() - now) / 1000))
  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    min: Math.floor((diff % 3600) / 60),
    sec: diff % 60,
  }
}

function Crest({ isClub, name }: { isClub: boolean; name: string }) {
  if (isClub) return <ClubCrest size="lg" alt={name} />
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white font-display text-xl font-bold text-club-navy">
      {name.slice(0, 3).toUpperCase()}
    </div>
  )
}

export default function HomeNextMatch({ clubName, match }: { clubName: string; match: Row | null }) {
  const { t } = useLanguage()
  const target = match ? new Date(`${match.match_date}T${match.kickoff_time?.slice(0, 5) ?? '00:00'}:00`) : null
  const countdown = useCountdown(target && !Number.isNaN(target.getTime()) ? target : null)
  if (!match) return null

  const isClubHome = match.home_away === 'home'
  const [home, away] = isClubHome ? [clubName, match.opponent_name] : [match.opponent_name, clubName]
  const pad = (n: number) => String(n).padStart(2, '0')
  const cells = countdown
    ? [
        { v: countdown.days, l: t('home.countdown.days') },
        { v: countdown.hours, l: t('home.countdown.hours') },
        { v: countdown.min, l: t('home.countdown.min') },
        { v: countdown.sec, l: t('home.countdown.sec') },
      ]
    : []

  return (
    <section className="bg-club-navy-2 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center md:px-8">
        <div className="font-display text-sm font-bold md:text-base">
          {match.competition_name}
          {match.round_label ? ` ・ ${match.round_label}` : ''}
          <span className="mx-2 text-white/40">|</span>
          {match.match_date}
          {match.kickoff_time ? ` ・ ${match.kickoff_time.slice(0, 5)}` : ''}
        </div>

        <div className="mt-6 flex items-center justify-center gap-5 md:gap-14">
          <div className="flex flex-1 flex-col items-center gap-2 md:flex-none">
            <Crest isClub={isClubHome} name={home} />
            <span className="font-display text-sm font-bold">{home}</span>
          </div>
          <Link
            to={`/matches/${match.id}`}
            className="shrink-0 rounded-md bg-club-gold px-5 py-3 font-display text-sm font-bold text-club-navy ring-4 ring-club-gold/30 hover:opacity-90"
          >
            {t('home.matchCenter')}
          </Link>
          <div className="flex flex-1 flex-col items-center gap-2 md:flex-none">
            <Crest isClub={!isClubHome} name={away} />
            <span className="font-display text-sm font-bold">{away}</span>
          </div>
        </div>

        {cells.length > 0 && (
          <>
            <div className="mx-auto mt-8 h-px max-w-3xl bg-white/60" />
            <div className="mt-5 text-xs font-bold">{t('home.nextGame')}</div>
            <div className="mt-2 flex items-start justify-center gap-3 font-display">
              {cells.map((c, i) => (
                <div key={c.l} className="flex items-start gap-3">
                  <div>
                    <div className="text-3xl font-bold leading-none md:text-4xl">{pad(c.v)}</div>
                    <div className="mt-1 text-[10px] font-semibold text-white/80">{c.l}</div>
                  </div>
                  {i < cells.length - 1 && <span className="text-3xl font-bold leading-none md:text-4xl">:</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
