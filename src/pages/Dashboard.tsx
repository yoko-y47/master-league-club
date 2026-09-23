import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import StatTile from '@/components/StatTile'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { matchResult, resultColors, resultLabels, type Match } from '@/lib/matches'
import { goalDifference, points, type SeasonCompetition } from '@/lib/seasonCompetitions'
import { transferTypeLabels, type Transfer } from '@/lib/transfers'
import { titleResultLabels, type Title } from '@/lib/titles'

type CurrentSeason = {
  id: string
  label: string
}

type ScorerRow = { player_id: string; player_name: string; goals: number; assists: number }
type TransferRow = Transfer & { player_name: string }
type HonourRow = Title & { competition_name: string; season_label: string }

export default function Dashboard() {
  const { club } = useClub()
  const [currentSeason, setCurrentSeason] = useState<CurrentSeason | null>(null)
  const [loading, setLoading] = useState(true)
  const [leagueStanding, setLeagueStanding] = useState<SeasonCompetition | null>(null)
  const [recentMatches, setRecentMatches] = useState<(Match & { competition_name: string })[]>([])
  const [scorers, setScorers] = useState<ScorerRow[]>([])
  const [latestTransfers, setLatestTransfers] = useState<TransferRow[]>([])
  const [honours, setHonours] = useState<HonourRow[]>([])

  useEffect(() => {
    if (!club) return

    async function loadTransfersAndHonours() {
      const { data: playerRows } = await supabase.from('players').select('id').eq('club_id', club!.id)
      const playerIds = playerRows?.map((p) => p.id) ?? []

      if (playerIds.length > 0) {
        const { data: transferData } = await supabase
          .from('transfers')
          .select('*, players(full_name)')
          .in('player_id', playerIds)
          .order('transfer_date', { ascending: false })
          .limit(3)
        setLatestTransfers(
          (transferData ?? []).map((row) => {
            const { players: playerRel, ...rest } = row as Transfer & { players: { full_name: string } | null }
            return { ...rest, player_name: playerRel?.full_name ?? '?' }
          }),
        )
      } else {
        setLatestTransfers([])
      }

      const { data: seasonRows } = await supabase.from('seasons').select('id').eq('club_id', club!.id)
      const seasonIds = seasonRows?.map((s) => s.id) ?? []

      if (seasonIds.length === 0) {
        setHonours([])
        return
      }

      const { data: standingRows } = await supabase
        .from('season_competitions')
        .select('id, seasons(label, start_date), competitions(name)')
        .in('season_id', seasonIds)
      type StandingInfo = {
        id: string
        seasons: { label: string; start_date: string | null } | null
        competitions: { name: string } | null
      }
      const standingMap = new Map(
        (standingRows ?? []).map((row) => {
          const r = row as unknown as StandingInfo
          return [
            r.id,
            { season_label: r.seasons?.label ?? '?', start_date: r.seasons?.start_date, competition_name: r.competitions?.name ?? '?' },
          ]
        }),
      )
      const standingIds = [...standingMap.keys()]
      if (standingIds.length === 0) {
        setHonours([])
        return
      }

      const { data: titleRows } = await supabase.from('titles').select('*').in('season_competition_id', standingIds)
      const rows = (titleRows ?? [])
        .map((t) => {
          const info = standingMap.get(t.season_competition_id)
          return {
            ...(t as Title),
            season_label: info?.season_label ?? '?',
            competition_name: info?.competition_name ?? '?',
            start_date: info?.start_date,
          }
        })
        .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
        .slice(0, 3)
      setHonours(rows)
    }

    loadTransfersAndHonours()

    async function load() {
      setLoading(true)
      const { data: season } = await supabase
        .from('seasons')
        .select('id, label')
        .eq('club_id', club!.id)
        .eq('is_current', true)
        .maybeSingle()

      setCurrentSeason(season)

      if (!season) {
        setLeagueStanding(null)
        setRecentMatches([])
        setScorers([])
        setLoading(false)
        return
      }

      const [{ data: standingData }, { data: matchData }] = await Promise.all([
        supabase
          .from('season_competitions')
          .select('*, competitions!inner(type)')
          .eq('season_id', season.id)
          .eq('competitions.type', 'league')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('matches')
          .select('*, competitions(name)')
          .eq('season_id', season.id)
          .order('match_date', { ascending: false })
          .limit(5),
      ])

      setLeagueStanding(standingData)

      const matches = (matchData ?? []).map((row) => {
        const { competitions: competitionRel, ...rest } = row as Match & { competitions: { name: string } | null }
        return { ...rest, competition_name: competitionRel?.name ?? '?' }
      })
      setRecentMatches(matches)

      const matchIds = matches.map((m) => m.id)
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
            .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
            .slice(0, 5),
        )
      } else {
        setScorers([])
      }

      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <section className="mb-8 flex items-center gap-4 rounded-lg bg-club-navy px-5 py-6 text-white md:gap-6 md:px-8 md:py-8">
        <ClubCrest size="lg" alt={club ? `${club.name} crest` : 'Club crest'} />
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">Current Season</div>
          <h1 className="font-display text-2xl font-semibold tracking-wide md:text-3xl">{club?.name}</h1>
          {loading ? (
            <p className="mt-1 text-sm text-white/60">読み込み中...</p>
          ) : currentSeason ? (
            <p className="mt-1 text-sm text-white/60">{currentSeason.label}</p>
          ) : (
            <p className="mt-1 text-sm text-white/60">
              現在のシーズンが設定されていません。
              <Link to="/admin/seasons" className="ml-1 underline hover:text-white">
                管理画面でシーズンを作成する
              </Link>
            </p>
          )}
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatTile label="League Position" value={leagueStanding?.final_position ? `${leagueStanding.final_position}位` : '—'} />
        <StatTile
          label="Record (W-D-L)"
          value={leagueStanding ? `${leagueStanding.won}-${leagueStanding.drawn}-${leagueStanding.lost}` : '—'}
        />
        <StatTile
          label="Goal Difference"
          value={leagueStanding ? `${goalDifference(leagueStanding) >= 0 ? '+' : ''}${goalDifference(leagueStanding)}` : '—'}
        />
        <StatTile label="Points" value={leagueStanding ? `${points(leagueStanding)}` : '—'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Recent Results
          </h2>
          {recentMatches.length === 0 ? (
            <p className="text-sm text-club-muted">試合結果がまだありません。</p>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((match) => {
                const result = matchResult(match)
                return (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    {result && (
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${resultColors[result]}`}
                      >
                        {resultLabels[result]}
                      </span>
                    )}
                    <span className="text-club-navy">
                      {match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}
                    </span>
                    <span className="text-xs text-club-muted">
                      {match.home_score !== null && match.away_score !== null
                        ? `${match.home_score}-${match.away_score}`
                        : '未実施'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Top Scorers &amp; Assists
          </h2>
          {scorers.length === 0 ? (
            <p className="text-sm text-club-muted">記録がまだありません。</p>
          ) : (
            <div className="space-y-2">
              {scorers.map((s) => (
                <Link
                  key={s.player_id}
                  to={`/players/${s.player_id}`}
                  className="flex items-center justify-between text-sm hover:underline"
                >
                  <span className="text-club-navy">{s.player_name}</span>
                  <span className="text-xs text-club-muted">
                    {s.goals}得点 ・ {s.assists}アシスト
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Latest Transfers
          </h2>
          {latestTransfers.length === 0 ? (
            <p className="text-sm text-club-muted">移籍記録がまだありません。</p>
          ) : (
            <div className="space-y-2">
              {latestTransfers.map((t) => (
                <Link
                  key={t.id}
                  to={`/players/${t.player_id}`}
                  className="flex items-center justify-between text-sm hover:underline"
                >
                  <span className="text-club-navy">{t.player_name}</span>
                  <span className="text-xs text-club-muted">{transferTypeLabels[t.transfer_type]}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Honours
          </h2>
          {honours.length === 0 ? (
            <p className="text-sm text-club-muted">タイトル記録がまだありません。</p>
          ) : (
            <div className="space-y-2">
              {honours.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="text-club-navy">
                    🏆 {h.competition_name} <span className="text-xs text-club-muted">{h.season_label}</span>
                  </span>
                  <span className="text-xs text-club-muted">{titleResultLabels[h.result]}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
