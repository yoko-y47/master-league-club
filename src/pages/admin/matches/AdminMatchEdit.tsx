import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { HomeAway, Match, MatchPlayerStat } from '@/lib/matches'
import type { Player, SquadMembership } from '@/lib/players'

type StatRow = MatchPlayerStat & { player_name: string }

export default function AdminMatchEdit() {
  const { matchId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [matchDate, setMatchDate] = useState('')
  const [kickoffTime, setKickoffTime] = useState('')
  const [venue, setVenue] = useState('')
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
      setKickoffTime(data.kickoff_time ?? '')
      setVenue(data.venue ?? '')
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
        kickoff_time: kickoffTime || null,
        venue: venue || null,
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

  if (loading) return <p className="text-sm text-club-muted">{t('common.loading')}</p>
  if (!match) return <p className="text-sm text-club-muted">{t('common.notFound.match')}</p>

  const registeredPlayerIds = new Set(stats.map((s) => s.player_id))
  const availablePlayers = squad.filter((s) => !registeredPlayerIds.has(s.player_id))

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <PageHeading title={`vs ${match.opponent_name}`} description={match.match_date} />
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="text-club-muted">{t('common.confirmDelete')}</span>
            <button type="button" onClick={handleDeleteMatch} className="font-semibold text-red-600 hover:underline">
              {t('common.yes')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-club-muted hover:underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="shrink-0 rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-muted hover:border-red-300 hover:text-red-600"
          >
            {t('common.delete')}
          </button>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          {t('matches.info.heading')}
        </h2>
        <form onSubmit={handleSave} className="grid max-w-xl gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('matches.form.matchDate')}
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
              {t('matches.form.kickoffTime')}{t('common.optional')}
            </label>
            <input
              type="time"
              value={kickoffTime}
              onChange={(e) => setKickoffTime(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('matches.form.venue')}{t('common.optional')}
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('matches.form.opponent')}
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
              {t('matches.form.homeAway')}
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
              {t('matches.form.round')}{t('common.optional')}
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
              {t('matches.form.homeScore')}
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
              {t('matches.form.awayScore')}
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
            {t('common.save')}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            {t('matches.playerStatsHeading')}
          </h2>
          <button
            type="button"
            onClick={() => setShowStatForm((v) => !v)}
            disabled={availablePlayers.length === 0}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5 disabled:opacity-40"
          >
            {showStatForm ? t('common.cancel') : t('matches.addPlayer')}
          </button>
        </div>

        {squad.length === 0 && (
          <p className="mb-4 text-sm text-club-muted">{t('matches.noSquadForSeason')}</p>
        )}

        {showStatForm && (
          <form
            onSubmit={handleAddStat}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-4"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.selectPlayer')}
              </label>
              <select
                required
                value={statPlayerId}
                onChange={(e) => setStatPlayerId(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">{t('common.selectPlaceholder')}</option>
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
                {t('matches.form.usage')}
              </label>
              <select
                value={statIsStarting ? 'starting' : 'bench'}
                onChange={(e) => setStatIsStarting(e.target.value === 'starting')}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="starting">{t('matches.form.starting')}</option>
                <option value="bench">{t('matches.form.bench')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.position')}
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
                {t('matches.form.minutesPlayed')}
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
                {t('matches.form.goals')}
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
                {t('matches.form.assists')}
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
                {t('matches.form.yellow')}
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
                {t('matches.form.red')}
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
                {t('matches.form.rating')}{t('common.optional')}
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
              {t('common.add')}
            </button>
          </form>
        )}

        {stats.length === 0 ? (
          <p className="text-sm text-club-muted">{t('matches.statsEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {stats.map((stat) => (
              <div key={stat.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-club-navy">{stat.player_name}</span>
                    <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                      {stat.is_starting ? t('matches.stat.starting') : t('matches.stat.bench')}
                    </span>
                    {stat.position_played && <span className="text-xs text-club-muted">{stat.position_played}</span>}
                  </div>
                  <div className="text-xs text-club-muted">
                    {t('matches.stat.line', { minutes: stat.minutes_played, goals: stat.goals, assists: stat.assists })}
                    {stat.yellow_cards > 0 ? ` ・ 🟨${stat.yellow_cards}` : ''}
                    {stat.red_cards > 0 ? ` ・ 🟥${stat.red_cards}` : ''}
                    {stat.rating !== null ? t('matches.stat.rating', { rating: stat.rating }) : ''}
                  </div>
                </div>
                {confirmingDeleteStatId === stat.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">{t('common.confirmDelete')}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteStat(stat.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteStatId(null)}
                      className="text-club-muted hover:underline"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteStatId(stat.id)}
                    className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                  >
                    {t('common.delete')}
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
