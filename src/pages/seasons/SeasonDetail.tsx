import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'
import { goalDifference, points, type SeasonCompetition } from '@/lib/seasonCompetitions'

type StandingRow = SeasonCompetition & { competition_name: string }
type ScorerRow = { player_id: string; player_name: string; goals: number; assists: number }

export default function SeasonDetail() {
  const { seasonId } = useParams()
  const { t } = useLanguage()
  const [season, setSeason] = useState<Season | null>(null)
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [scorers, setScorers] = useState<ScorerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seasonId) return
    setLoading(true)

    async function load() {
      const [{ data: seasonData }, { data: standingData }, { data: matchData }] = await Promise.all([
        supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle(),
        supabase.from('season_competitions').select('*, competitions(name)').eq('season_id', seasonId),
        supabase.from('matches').select('id').eq('season_id', seasonId),
      ])

      setSeason(seasonData)
      setStandings(
        (standingData ?? []).map((row) => {
          const { competitions: competitionRel, ...rest } = row as SeasonCompetition & {
            competitions: { name: string } | null
          }
          return { ...rest, competition_name: competitionRel?.name ?? '?' }
        }),
      )

      const matchIds = (matchData ?? []).map((m) => m.id)
      if (matchIds.length > 0) {
        const { data: statData } = await supabase
          .from('match_player_stats')
          .select('player_id, goals, assists, players(full_name)')
          .in('match_id', matchIds)

        type GoalAssistRow = { player_id: string; goals: number; assists: number; players: { full_name: string } | null }
        const totals = new Map<string, ScorerRow>()
        for (const row of (statData ?? []) as unknown as GoalAssistRow[]) {
          const existing = totals.get(row.player_id)
          if (existing) {
            existing.goals += row.goals
            existing.assists += row.assists
          } else {
            totals.set(row.player_id, {
              player_id: row.player_id,
              player_name: row.players?.full_name ?? '?',
              goals: row.goals,
              assists: row.assists,
            })
          }
        }
        setScorers(
          [...totals.values()]
            .filter((r) => r.goals > 0 || r.assists > 0)
            .sort((a, b) => b.goals - a.goals || b.assists - a.assists),
        )
      } else {
        setScorers([])
      }

      setLoading(false)
    }

    load()
  }, [seasonId])

  if (loading) return <p className="text-sm text-club-muted">{t('common.loading')}</p>
  if (!season) return <p className="text-sm text-club-muted">{t('common.notFound.season')}</p>

  return (
    <>
      <PageHeading
        title={season.label}
        description={
          season.start_date || season.end_date
            ? `${season.start_date ?? '?'} 〜 ${season.end_date ?? '?'}`
            : undefined
        }
      />

      {season.is_current && (
        <span className="mb-4 inline-block rounded-full bg-club-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-navy">
          {t('common.currentSeason')}
        </span>
      )}

      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          {t('seasons.standingsHeadingPublic')}
        </h2>
        {standings.length === 0 ? (
          <p className="text-sm text-club-muted">{t('seasons.standingsEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {standings.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-club-navy">{s.competition_name}</span>
                  {s.final_position !== null && (
                    <span className="rounded-full bg-club-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-navy">
                      {t('seasons.position', { n: s.final_position })}
                    </span>
                  )}
                </div>
                <div className="text-xs text-club-muted">
                  {t('seasons.standingLinePublic', {
                    played: s.played,
                    won: s.won,
                    drawn: s.drawn,
                    lost: s.lost,
                    gd: (goalDifference(s) >= 0 ? '+' : '') + goalDifference(s),
                    pts: points(s),
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          {t('seasons.scorersHeading')}
        </h2>
        {scorers.length === 0 ? (
          <p className="text-sm text-club-muted">{t('seasons.scorersEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {scorers.map((s) => (
              <div key={s.player_id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span className="text-sm font-medium text-club-navy">{s.player_name}</span>
                <span className="text-xs text-club-muted">
                  {t('seasons.scorerLine', { goals: s.goals, assists: s.assists })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
