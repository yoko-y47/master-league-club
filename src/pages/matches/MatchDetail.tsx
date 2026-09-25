import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { matchResult, resultColors, resultLabels, type Match, type MatchPlayerStat } from '@/lib/matches'

type StatRow = MatchPlayerStat & { player_name: string; player_id: string }

export default function MatchDetail() {
  const { matchId } = useParams()
  const { t } = useLanguage()
  const [match, setMatch] = useState<(Match & { competition_name: string; season_label: string }) | null>(null)
  const [stats, setStats] = useState<StatRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return
    setLoading(true)

    async function load() {
      const [{ data: matchData }, { data: statData }] = await Promise.all([
        supabase.from('matches').select('*, competitions(name), seasons(label)').eq('id', matchId).maybeSingle(),
        supabase
          .from('match_player_stats')
          .select('*, players(full_name)')
          .eq('match_id', matchId)
          .order('is_starting', { ascending: false }),
      ])

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

  return (
    <>
      <div className="mb-6 flex items-center gap-3 border-b border-club-line pb-6">
        {result && (
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${resultColors[result]}`}
          >
            {resultLabels[result]}
          </span>
        )}
        <div>
          <PageHeading
            title={`${match.home_away === 'home' ? 'vs' : '@'} ${match.opponent_name}`}
            description={`${match.match_date} ・ ${match.season_label} ・ ${match.competition_name}${match.round_label ? ` ・ ${match.round_label}` : ''}`}
          />
        </div>
        <div className="ml-auto shrink-0 font-display text-2xl font-semibold text-club-navy">
          {match.home_score !== null && match.away_score !== null
            ? `${match.home_score} - ${match.away_score}`
            : t('common.unplayed')}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
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
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
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
    </>
  )
}
