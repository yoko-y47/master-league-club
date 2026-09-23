import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { matchResult, resultColors, resultLabels, type HomeAway, type Match } from '@/lib/matches'
import type { Season } from '@/lib/seasons'
import type { Competition } from '@/lib/competitions'

type MatchRow = Match & { season_label: string; competition_name: string }

export default function AdminMatchList() {
  const { club } = useClub()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [seasonId, setSeasonId] = useState('')
  const [competitionId, setCompetitionId] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [homeAway, setHomeAway] = useState<HomeAway>('home')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [roundLabel, setRoundLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  async function loadMatches() {
    if (!club) return
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select('*, seasons(label), competitions(name)')
      .in('season_id', (await supabase.from('seasons').select('id').eq('club_id', club.id)).data?.map((s) => s.id) ?? [])
      .order('match_date', { ascending: false })
    setMatches(
      (data ?? []).map((row) => {
        const { seasons: seasonRel, competitions: competitionRel, ...rest } = row as Match & {
          seasons: { label: string } | null
          competitions: { name: string } | null
        }
        return { ...rest, season_label: seasonRel?.label ?? '?', competition_name: competitionRel?.name ?? '?' }
      }),
    )
    setLoading(false)
  }

  async function loadOptions() {
    if (!club) return
    const [{ data: seasonData }, { data: competitionData }] = await Promise.all([
      supabase.from('seasons').select('*').eq('club_id', club.id).order('start_date', { ascending: false }),
      supabase.from('competitions').select('*').order('name'),
    ])
    setSeasons(seasonData ?? [])
    setCompetitions(competitionData ?? [])
  }

  useEffect(() => {
    loadMatches()
    loadOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club || !seasonId || !competitionId) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('matches').insert({
      season_id: seasonId,
      competition_id: competitionId,
      match_date: matchDate,
      opponent_name: opponentName,
      home_away: homeAway,
      home_score: homeScore ? Number(homeScore) : null,
      away_score: awayScore ? Number(awayScore) : null,
      round_label: roundLabel || null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setMatchDate('')
    setOpponentName('')
    setHomeAway('home')
    setHomeScore('')
    setAwayScore('')
    setRoundLabel('')
    setShowForm(false)
    setSubmitting(false)
    await loadMatches()
  }

  async function handleDelete(matchId: string) {
    await supabase.from('matches').delete().eq('id', matchId)
    setConfirmingDeleteId(null)
    await loadMatches()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title="Matches" description="試合結果・出場記録の管理" />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={seasons.length === 0 || competitions.length === 0}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-40"
        >
          {showForm ? 'キャンセル' : '+ New Match'}
        </button>
      </div>

      {(seasons.length === 0 || competitions.length === 0) && (
        <p className="mb-4 text-sm text-club-muted">
          試合を登録する前に、{seasons.length === 0 && 'シーズン'}
          {seasons.length === 0 && competitions.length === 0 && '・'}
          {competitions.length === 0 && '大会（Competitions）'}を作成してください。
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              シーズン
            </label>
            <select
              required
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              <option value="">選択してください</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              大会
            </label>
            <select
              required
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              <option value="">選択してください</option>
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              試合日
            </label>
            <input
              type="date"
              required
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              対戦相手
            </label>
            <input
              type="text"
              required
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              ホーム/アウェイ
            </label>
            <select
              value={homeAway}
              onChange={(e) => setHomeAway(e.target.value as HomeAway)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              ラウンド（任意）
            </label>
            <input
              type="text"
              value={roundLabel}
              onChange={(e) => setRoundLabel(e.target.value)}
              placeholder="例: 第3節、準決勝"
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              ホームスコア（任意）
            </label>
            <input
              type="number"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              アウェイスコア（任意）
            </label>
            <input
              type="number"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-3"
          >
            作成する（出場選手はこの後で登録できます）
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : matches.length === 0 ? (
        <p className="text-sm text-club-muted">試合がまだ登録されていません。</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {matches.map((match) => {
            const result = matchResult(match)
            return (
              <div key={match.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link to={`/admin/matches/${match.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {result && (
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${resultColors[result]}`}
                      >
                        {resultLabels[result]}
                      </span>
                    )}
                    <span className="font-display text-sm font-semibold text-club-navy">
                      {match.home_away === 'home' ? 'vs' : '@'} {match.opponent_name}
                    </span>
                    <span className="text-xs text-club-muted">
                      {match.home_score !== null && match.away_score !== null
                        ? `${match.home_score}-${match.away_score}`
                        : '未実施'}
                    </span>
                  </div>
                  <div className="text-xs text-club-muted">
                    {match.match_date} ・ {match.season_label} ・ {match.competition_name}
                    {match.round_label ? ` ・ ${match.round_label}` : ''}
                  </div>
                </Link>
                {confirmingDeleteId === match.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">削除しますか？</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(match.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      はい
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      className="text-club-muted hover:underline"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(match.id)}
                    className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                  >
                    削除
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
