import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { matchResult, resultColors, resultLabels, type Match } from '@/lib/matches'

type MatchRow = Match & { competition_name: string }

export default function MatchList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [hasCurrentSeason, setHasCurrentSeason] = useState(true)

  useEffect(() => {
    if (!club) return

    async function load() {
      setLoading(true)
      const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .eq('club_id', club!.id)
        .eq('is_current', true)
        .maybeSingle()

      if (!season) {
        setHasCurrentSeason(false)
        setMatches([])
        setLoading(false)
        return
      }

      setHasCurrentSeason(true)
      const { data } = await supabase
        .from('matches')
        .select('*, competitions(name)')
        .eq('season_id', season.id)
        .order('match_date', { ascending: false })

      setMatches(
        (data ?? []).map((row) => {
          const { competitions: competitionRel, ...rest } = row as Match & { competitions: { name: string } | null }
          return { ...rest, competition_name: competitionRel?.name ?? '?' }
        }),
      )
      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <PageHeading title={t('matches.pageTitle')} description={t('matches.pageDesc.public')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : !hasCurrentSeason ? (
        <p className="text-sm text-club-muted">{t('common.noCurrentSeason')}</p>
      ) : matches.length === 0 ? (
        <p className="text-sm text-club-muted">{t('matches.emptyForSeason')}</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {matches.map((match) => {
            const result = matchResult(match)
            return (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-club-bg"
              >
                {result ? (
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${resultColors[result]}`}
                  >
                    {resultLabels[result]}
                  </span>
                ) : (
                  <span className="w-6 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-semibold text-club-navy">
                    {match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}
                  </div>
                  <div className="text-xs text-club-muted">
                    {match.match_date} ・ {match.competition_name}
                    {match.round_label ? ` ・ ${match.round_label}` : ''}
                  </div>
                </div>
                <div className="shrink-0 font-display text-sm font-semibold text-club-navy">
                  {match.home_score !== null && match.away_score !== null
                    ? `${match.home_score}-${match.away_score}`
                    : t('common.unplayed')}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
