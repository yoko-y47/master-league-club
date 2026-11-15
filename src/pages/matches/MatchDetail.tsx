import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import {
  matchResult,
  resultColors,
  resultLabels,
  useHomeAwayLabels,
  TEAM_STAT_KEYS,
  type Match,
  type MatchPlayerStat,
  type MatchTeamStats,
} from '@/lib/matches'

type StatRow = MatchPlayerStat & { player_name: string; player_id: string }

export default function MatchDetail() {
  const { matchId } = useParams()
  const { t } = useLanguage()
  const { club } = useClub()
  const homeAwayLabels = useHomeAwayLabels()
  const [match, setMatch] = useState<(Match & { competition_name: string; season_label: string }) | null>(null)
  const [stats, setStats] = useState<StatRow[]>([])
  const [teamStats, setTeamStats] = useState<MatchTeamStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return
    setLoading(true)

    async function load() {
      const [{ data: matchData }, { data: statData }, { data: teamStatData }] = await Promise.all([
        supabase.from('matches').select('*, competitions(name), seasons(label)').eq('id', matchId).maybeSingle(),
        supabase
          .from('match_player_stats')
          .select('*, players(full_name)')
          .eq('match_id', matchId)
          .order('is_starting', { ascending: false }),
        supabase.from('match_team_stats').select('*').eq('match_id', matchId).maybeSingle(),
      ])
      setTeamStats((teamStatData as MatchTeamStats | null) ?? null)

      if (matchData) {
        const { competitions: competitionRel, seasons: seasonRel, ...rest } = matchData as Match & {
          competitions: { name: string } | null
          seasons: { label: string } | null
        }
        setMatch({ ...rest, competition_name: competitionRel?.name ?? '?', season_label: seasonRel?.label ?? '?' })
      } else {
        setMatch(null)
      }

      setStats(
        (statData ?? []).map((row) => {
          const { players: playerRel, ...rest } = row as MatchPlayerStat & { players: { full_name: string } | null }
          return { ...rest, player_name: playerRel?.full_name ?? '?' }
        }),
      )
      setLoading(false)
    }

    load()
  }, [matchId])

  if (loading) return <p className="text-sm text-club-muted">{t('common.loading')}</p>
  if (!match) return <p className="text-sm text-club-muted">{t('common.notFound.match')}</p>

  const result = matchResult(match)
  const starters = stats.filter((s) => s.is_starting)
  const bench = stats.filter((s) => !s.is_starting)
  const teamStatRows = TEAM_STAT_KEYS.filter(
    (key) => teamStats && (teamStats.own[key] !== undefined || teamStats.opponent[key] !== undefined),
  )

  return (
    <>
      <div className="mb-8 overflow-hidden rounded-lg bg-club-navy text-white">
        <div className="flex items-center gap-2 border-b border-white/10 bg-club-navy-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.3em] text-club-gold md:px-10">
          {match.competition_name}
          {match.round_label ? ` ・ ${match.round_label}` : ''}
        </div>
        <div className="flex flex-col items-center gap-3 px-6 py-7 text-center md:px-10">
          {result && (
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${resultColors[result]}`}
            >
              {resultLabels[result]}
            </span>
          )}
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide md:text-4xl">
            vs {match.opponent_name}
            <span className="ml-2 align-middle text-sm font-bold text-club-gold">
              ({homeAwayLabels[match.home_away]})
            </span>
          </h1>
          <div className="font-display text-3xl font-black tracking-wide md:text-5xl">
            {match.home_score !== null && match.away_score !== null
              ? `${match.home_score} - ${match.away_score}`
              : t('common.unplayed')}
          </div>
          <div className="text-sm font-medium text-white/60">
            {match.match_date} ・ {match.season_label}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 border-l-4 border-club-gold pl-2 font-display text-sm font-bold uppercase tracking-wider text-club-navy">
            {t('matches.startingXI')}
          </h2>
          {starters.length === 0 ? (
            <p className="text-sm text-club-muted">{t('matches.startingEmpty')}</p>
          ) : (
            <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
              {starters.map((stat) => (
                <Link
                  key={stat.id}
                  to={`/players/${stat.player_id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-club-bg"
                >
                  <div>
                    <span className="text-sm font-medium text-club-navy">{stat.player_name}</span>
                    {stat.position_played && (
                      <span className="ml-2 text-xs text-club-muted">{stat.position_played}</span>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-club-muted">
                    {stat.goals > 0 ? `⚽${stat.goals} ` : ''}
                    {stat.assists > 0 ? `🅰${stat.assists} ` : ''}
                    {stat.yellow_cards > 0 ? `🟨${stat.yellow_cards} ` : ''}
                    {stat.red_cards > 0 ? `🟥${stat.red_cards}` : ''}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 border-l-4 border-club-gold pl-2 font-display text-sm font-bold uppercase tracking-wider text-club-navy">
            {t('matches.bench')}
          </h2>
          {bench.length === 0 ? (
            <p className="text-sm text-club-muted">{t('matches.benchEmpty')}</p>
          ) : (
            <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
              {bench.map((stat) => (
                <Link
                  key={stat.id}
                  to={`/players/${stat.player_id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-club-bg"
                >
                  <span className="text-sm font-medium text-club-navy">{stat.player_name}</span>
                  <div className="shrink-0 text-xs text-club-muted">
                    {stat.minutes_played > 0 ? `${stat.minutes_played}${t('matches.minutesPlayedSuffix')} ` : ''}
                    {stat.goals > 0 ? `⚽${stat.goals} ` : ''}
                    {stat.assists > 0 ? `🅰${stat.assists}` : ''}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {teamStats && teamStatRows.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 border-l-4 border-club-gold pl-2 font-display text-sm font-bold uppercase tracking-wider text-club-navy">
            {t('matches.teamStats.heading')}
          </h2>
          <div className="rounded-lg border border-club-line bg-white px-4 py-3 md:px-6">
            <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold text-club-navy">
              <span className="truncate">{club?.name ?? ''}</span>
              <span className="truncate text-right">{match.opponent_name}</span>
            </div>
            <div className="space-y-3">
              {teamStatRows.map((key) => {
                const own = teamStats.own[key] ?? 0
                const opp = teamStats.opponent[key] ?? 0
                const total = own + opp
                const ownRatio = total > 0 ? (own / total) * 100 : 50
                return (
                  <div key={key}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="w-12 font-bold text-club-navy">{teamStats.own[key] ?? '-'}</span>
                      <span className="text-xs text-club-muted">{t(`matches.teamStat.${key}`)}</span>
                      <span className="w-12 text-right font-bold text-club-navy">{teamStats.opponent[key] ?? '-'}</span>
                    </div>
                    <div className="mt-1 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                      <div className="bg-club-gold" style={{ width: `${ownRatio}%` }} />
                      <div className="bg-club-line" style={{ width: `${100 - ownRatio}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
