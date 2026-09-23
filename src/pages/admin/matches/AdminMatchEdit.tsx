import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { supabase } from '@/lib/supabaseClient'
import type { HomeAway, Match, MatchPlayerStat } from '@/lib/matches'
import type { Player, SquadMembership } from '@/lib/players'

type StatRow = MatchPlayerStat & { player_name: string }

export default function AdminMatchEdit() {
  const { matchId } = useParams()
  const navigate = useNavigate()

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [matchDate, setMatchDate] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [homeAway, setHomeAway] = useState<HomeAway>('home')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [roundLabel, setRoundLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [squad, setSquad] = useState<(SquadMembership & { players: Player })[]>([])
  const [stats, setStats] = useState<StatRow[]>([])
  const [showStatForm, setShowStatForm] = useState(false)
  const [statPlayerId, setStatPlayerId] = useState('')
  const [statIsStarting, setStatIsStarting] = useState(true)
  const [statMinutes, setStatMinutes] = useState('')
  const [statPosition, setStatPosition] = useState('')
  const [statGoals, setStatGoals] = useState('0')
  const [statAssists, setStatAssists] = useState('0')
  const [statYellow, setStatYellow] = useState('0')
  const [statRed, setStatRed] = useState('0')
  const [statRating, setStatRating] = useState('')
  const [statError, setStatError] = useState<string | null>(null)
  const [confirmingDeleteStatId, setConfirmingDeleteStatId] = useState<string | null>(null)

  async function loadMatch() {
    if (!matchId) return
    setLoading(true)
    const { data } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle()
    setMatch(data)
    if (data) {
      setMatchDate(data.match_date)
      setOpponentName(data.opponent_name)
      setHomeAway(data.home_away)
      setHomeScore(data.home_score?.toString() ?? '')
      setAwayScore(data.away_score?.toString() ?? '')
      setRoundLabel(data.round_label ?? '')

      const { data: squadData } = await supabase
        .from('squad_memberships')
        .select('*, players(*)')
        .eq('season_id', data.season_id)
      setSquad((squadData ?? []) as (SquadMembership & { players: Player })[])
    }
    setLoading(false)
  }

  async function loadStats() {
    if (!matchId) return
    const { data } = await supabase
      .from('match_player_stats')
      .select('*, players(full_name)')
      .eq('match_id', matchId)
      .order('is_starting', { ascending: false })
    setStats(
      (data ?? []).map((row) => {
        const { players: playerRel, ...rest } = row as MatchPlayerStat & { players: { full_name: string } | null }
        return { ...rest, player_name: playerRel?.full_name ?? '?' }
      }),
    )
  }

  useEffect(() => {
    loadMatch()
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!match) return
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('matches')
      .update({
        match_date: matchDate,
        opponent_name: opponentName,
        home_away: homeAway,
        home_score: homeScore ? Number(homeScore) : null,
        away_score: awayScore ? Number(awayScore) : null,
        round_label: roundLabel || null,
      })
      .eq('id', match.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    await loadMatch()
  }

  async function handleDeleteMatch() {
    if (!match) return
    await supabase.from('matches').delete().eq('id', match.id)
    navigate('/admin/matches')
  }

  async function handleAddStat(event: FormEvent) {
    event.preventDefault()
    if (!match || !statPlayerId) return
    setStatError(null)

    const { error } = await supabase.from('match_player_stats').insert({
      match_id: match.id,
      player_id: statPlayerId,
      is_starting: statIsStarting,
      minutes_played: statMinutes ? Number(statMinutes) : 0,
      position_played: statPosition || null,
      goals: Number(statGoals) || 0,
      assists: Number(statAssists) || 0,
      yellow_cards: Number(statYellow) || 0,
      red_cards: Number(statRed) || 0,
      rating: statRating ? Number(statRating) : null,
    })

    if (error) {
      setStatError(error.message)
      return
    }

    setStatPlayerId('')
    setStatIsStarting(true)
    setStatMinutes('')
    setStatPosition('')
    setStatGoals('0')
    setStatAssists('0')
    setStatYellow('0')
    setStatRed('0')
    setStatRating('')
    setShowStatForm(false)
    await loadStats()
  }

  async function handleDeleteStat(id: string) {
    await supabase.from('match_player_stats').delete().eq('id', id)
    setConfirmingDeleteStatId(null)
    await loadStats()
  }

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!match) return <p className="text-sm text-club-muted">試合が見つかりませんでした。</p>

  const registeredPlayerIds = new Set(stats.map((s) => s.player_id))
  const availablePlayers = squad.filter((s) => !registeredPlayerIds.has(s.player_id))

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <PageHeading title={`vs ${match.opponent_name}`} description={match.match_date} />
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="text-club-muted">削除しますか？</span>
            <button type="button" onClick={handleDeleteMatch} className="font-semibold text-red-600 hover:underline">
              はい
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-club-muted hover:underline"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="shrink-0 rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-muted hover:border-red-300 hover:text-red-600"
          >
            削除
          </button>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          試合情報
        </h2>
        <form onSubmit={handleSave} className="grid max-w-xl gap-3 md:grid-cols-2">
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
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              ホームスコア
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
              アウェイスコア
            </label>
            <input
              type="number"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-2 md:w-fit"
          >
            保存する
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            出場選手・個人スタッツ
          </h2>
          <button
            type="button"
            onClick={() => setShowStatForm((v) => !v)}
            disabled={availablePlayers.length === 0}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5 disabled:opacity-40"
          >
            {showStatForm ? 'キャンセル' : '+ Add Player'}
          </button>
        </div>

        {squad.length === 0 && (
          <p className="mb-4 text-sm text-club-muted">
            このシーズンにシーズン所属登録された選手がいません。先に選手のシーズン所属を登録してください。
          </p>
        )}

        {showStatForm && (
          <form
            onSubmit={handleAddStat}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-4"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                選手
              </label>
              <select
                required
                value={statPlayerId}
                onChange={(e) => setStatPlayerId(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">選択してください</option>
                {availablePlayers.map((s) => (
                  <option key={s.player_id} value={s.player_id}>
                    {s.players.full_name}
                    {s.squad_number !== null ? ` #${s.squad_number}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                起用
              </label>
              <select
                value={statIsStarting ? 'starting' : 'bench'}
                onChange={(e) => setStatIsStarting(e.target.value === 'starting')}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="starting">先発</option>
                <option value="bench">ベンチ（途中出場含む）</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                ポジション
              </label>
              <input
                type="text"
                value={statPosition}
                onChange={(e) => setStatPosition(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                出場時間（分）
              </label>
              <input
                type="number"
                value={statMinutes}
                onChange={(e) => setStatMinutes(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                得点
              </label>
              <input
                type="number"
                value={statGoals}
                onChange={(e) => setStatGoals(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                アシスト
              </label>
              <input
                type="number"
                value={statAssists}
                onChange={(e) => setStatAssists(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                イエロー
              </label>
              <input
                type="number"
                value={statYellow}
                onChange={(e) => setStatYellow(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                レッド
              </label>
              <input
                type="number"
                value={statRed}
                onChange={(e) => setStatRed(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                採点（任意）
              </label>
              <input
                type="number"
                step="0.1"
                value={statRating}
                onChange={(e) => setStatRating(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>

            {statError && <p className="text-sm text-red-600 md:col-span-4">{statError}</p>}

            <button
              type="submit"
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-4 md:w-fit"
            >
              追加する
            </button>
          </form>
        )}

        {stats.length === 0 ? (
          <p className="text-sm text-club-muted">出場選手がまだ登録されていません。</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {stats.map((stat) => (
              <div key={stat.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-club-navy">{stat.player_name}</span>
                    <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                      {stat.is_starting ? '先発' : 'ベンチ'}
                    </span>
                    {stat.position_played && <span className="text-xs text-club-muted">{stat.position_played}</span>}
                  </div>
                  <div className="text-xs text-club-muted">
                    {stat.minutes_played}分 ・ 得点{stat.goals} ・ アシスト{stat.assists}
                    {stat.yellow_cards > 0 ? ` ・ 🟨${stat.yellow_cards}` : ''}
                    {stat.red_cards > 0 ? ` ・ 🟥${stat.red_cards}` : ''}
                    {stat.rating !== null ? ` ・ 採点${stat.rating}` : ''}
                  </div>
                </div>
                {confirmingDeleteStatId === stat.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">削除しますか？</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteStat(stat.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      はい
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteStatId(null)}
                      className="text-club-muted hover:underline"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteStatId(stat.id)}
                    className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
