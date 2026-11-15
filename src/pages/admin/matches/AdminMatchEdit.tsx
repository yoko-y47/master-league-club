import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import {
  MATCH_POSITIONS,
  SUBSTITUTION_MATCH_MINUTES,
  useHomeAwayLabels,
  type CardType,
  type HomeAway,
  type Match,
  type MatchCard,
  type MatchGoal,
  type MatchPlayerStat,
  type MatchSubstitution,
} from '@/lib/matches'
import { slugify } from '@/lib/news'
import { comparePlayersByPositionAndNumber, type Player, type SquadMembership } from '@/lib/players'
import { clearFormDraft, useFormDraft } from '@/lib/useFormDraft'
import type { ImportDraft } from '@/lib/matchImport'
import ScreenshotImport from './ScreenshotImport'
import TeamStatsEditor from './TeamStatsEditor'

type StatRow = MatchPlayerStat & { player_name: string }

export default function AdminMatchEdit() {
  const { matchId } = useParams()
  const { club } = useClub()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const homeAwayLabels = useHomeAwayLabels()

  const [match, setMatch] = useState<Match | null>(null)
  const [teamStatsRefreshKey, setTeamStatsRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

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
  const [editingStatId, setEditingStatId] = useState<string | null>(null)
  const statFormRef = useRef<HTMLFormElement>(null)
  const [editingStatPlayerName, setEditingStatPlayerName] = useState('')
  const [statPlayerId, setStatPlayerId] = useState('')
  const [statIsStarting, setStatIsStarting] = useState(true)
  const [statMinutes, setStatMinutes] = useState(String(SUBSTITUTION_MATCH_MINUTES))
  const [statPosition, setStatPosition] = useState('')
  const [statRating, setStatRating] = useState('')
  const [statError, setStatError] = useState<string | null>(null)
  const [confirmingDeleteStatId, setConfirmingDeleteStatId] = useState<string | null>(null)

  const [goals, setGoals] = useState<MatchGoal[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalIsOpponent, setGoalIsOpponent] = useState(false)
  const [goalMinute, setGoalMinute] = useState('')
  const [goalScorerId, setGoalScorerId] = useState('')
  const [goalAssistId, setGoalAssistId] = useState('')
  const [goalOpponentScorerName, setGoalOpponentScorerName] = useState('')
  const [goalError, setGoalError] = useState<string | null>(null)
  const [confirmingDeleteGoalId, setConfirmingDeleteGoalId] = useState<string | null>(null)

  const [cards, setCards] = useState<MatchCard[]>([])
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardMinute, setCardMinute] = useState('')
  const [cardPlayerId, setCardPlayerId] = useState('')
  const [cardIsOpponent, setCardIsOpponent] = useState(false)
  const [cardOpponentPlayerName, setCardOpponentPlayerName] = useState('')
  const [cardType, setCardType] = useState<CardType>('yellow')
  const [cardError, setCardError] = useState<string | null>(null)
  const [confirmingDeleteCardId, setConfirmingDeleteCardId] = useState<string | null>(null)

  const [substitutions, setSubstitutions] = useState<MatchSubstitution[]>([])
  const [showSubForm, setShowSubForm] = useState(false)
  const [subMinute, setSubMinute] = useState('')
  const [subOffId, setSubOffId] = useState('')
  const [subOnId, setSubOnId] = useState('')
  const [subError, setSubError] = useState<string | null>(null)
  const [confirmingDeleteSubId, setConfirmingDeleteSubId] = useState<string | null>(null)

  const matchDraftRef = useFormDraft(`admin-draft:match-edit:${matchId ?? ''}`, {
    matchDate: [matchDate, setMatchDate],
    kickoffTime: [kickoffTime, setKickoffTime],
    venue: [venue, setVenue],
    opponentName: [opponentName, setOpponentName],
    homeAway: [homeAway, setHomeAway as (value: never) => void],
    homeScore: [homeScore, setHomeScore],
    awayScore: [awayScore, setAwayScore],
    roundLabel: [roundLabel, setRoundLabel],
  })

  useFormDraft(`admin-draft:match-edit-stat:${matchId ?? ''}`, {
    statPlayerId: [statPlayerId, setStatPlayerId],
    statIsStarting: [statIsStarting, setStatIsStarting as (value: never) => void],
    statMinutes: [statMinutes, setStatMinutes],
    statPosition: [statPosition, setStatPosition],
    statRating: [statRating, setStatRating],
  })

  async function loadMatch() {
    if (!matchId) return
    setLoading(true)
    const { data } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle()
    setMatch(data)
    if (data) {
      if (!matchDraftRef.current) {
        setMatchDate(data.match_date)
        setKickoffTime(data.kickoff_time ?? '')
        setVenue(data.venue ?? '')
        setOpponentName(data.opponent_name)
        setHomeAway(data.home_away)
        setHomeScore(data.home_score?.toString() ?? '')
        setAwayScore(data.away_score?.toString() ?? '')
        setRoundLabel(data.round_label ?? '')
      }

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

  async function loadGoals() {
    if (!matchId) return
    const { data } = await supabase
      .from('match_goals')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true, nullsFirst: false })
    setGoals(data ?? [])
  }

  async function loadCards() {
    if (!matchId) return
    const { data } = await supabase
      .from('match_cards')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true, nullsFirst: false })
    setCards(data ?? [])
  }

  async function loadSubstitutions() {
    if (!matchId) return
    const { data } = await supabase
      .from('match_substitutions')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true })
    setSubstitutions(data ?? [])
  }

  useEffect(() => {
    loadMatch()
    loadStats()
    loadGoals()
    loadCards()
    loadSubstitutions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  useEffect(() => {
    if (editingStatId) statFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [editingStatId])

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
    clearFormDraft(`admin-draft:match-edit:${match.id}`)
    await loadMatch()
  }

  async function handleDeleteMatch() {
    if (!match) return
    await supabase.from('matches').delete().eq('id', match.id)
    navigate('/admin/matches')
  }

  function baseMinutes(isStarting: boolean) {
    return isStarting ? SUBSTITUTION_MATCH_MINUTES : 0
  }

  function handleChangeUsage(isStarting: boolean) {
    // 出場時間が先発/ベンチの基本値のままなら、区分の切り替えに合わせて基本値も切り替える
    if (statMinutes === '' || Number(statMinutes) === baseMinutes(statIsStarting)) {
      setStatMinutes(String(baseMinutes(isStarting)))
    }
    setStatIsStarting(isStarting)
  }

  function resetStatForm() {
    setStatPlayerId('')
    setStatIsStarting(true)
    setStatMinutes(String(SUBSTITUTION_MATCH_MINUTES))
    setStatPosition('')
    setStatRating('')
    setStatError(null)
    setEditingStatId(null)
    setEditingStatPlayerName('')
    clearFormDraft(`admin-draft:match-edit-stat:${matchId ?? ''}`)
  }

  function startEditStat(stat: StatRow) {
    setEditingStatId(stat.id)
    setEditingStatPlayerName(stat.player_name)
    setStatPlayerId(stat.player_id)
    setStatIsStarting(stat.is_starting)
    setStatMinutes(stat.minutes_played.toString())
    setStatPosition(stat.position_played ?? '')
    setStatRating(stat.rating !== null ? stat.rating.toString() : '')
    setStatError(null)
    setShowStatForm(true)
  }

  async function handleSubmitStat(event: FormEvent) {
    event.preventDefault()
    if (!match || !statPlayerId) return
    setStatError(null)

    const payload = {
      is_starting: statIsStarting,
      minutes_played: statMinutes ? Number(statMinutes) : baseMinutes(statIsStarting),
      position_played: statPosition || null,
      rating: statRating ? Number(statRating) : null,
    }

    const { error } = editingStatId
      ? await supabase.from('match_player_stats').update(payload).eq('id', editingStatId)
      : await supabase.from('match_player_stats').insert({
          match_id: match.id,
          player_id: statPlayerId,
          ...payload,
        })

    if (error) {
      setStatError(error.message)
      return
    }

    resetStatForm()
    setShowStatForm(false)
    await loadStats()
  }

  async function handleDeleteStat(id: string) {
    await supabase.from('match_player_stats').delete().eq('id', id)
    setConfirmingDeleteStatId(null)
    await loadStats()
  }

  async function recomputeGoalsAndAssists() {
    if (!match) return
    const { data: goalRows } = await supabase.from('match_goals').select('scorer_id, assist_id').eq('match_id', match.id)
    const { data: statRows } = await supabase
      .from('match_player_stats')
      .select('id, player_id, goals, assists')
      .eq('match_id', match.id)
    const goalCounts: Record<string, number> = {}
    const assistCounts: Record<string, number> = {}
    for (const g of goalRows ?? []) {
      if (g.scorer_id) goalCounts[g.scorer_id] = (goalCounts[g.scorer_id] ?? 0) + 1
      if (g.assist_id) assistCounts[g.assist_id] = (assistCounts[g.assist_id] ?? 0) + 1
    }
    for (const stat of statRows ?? []) {
      const nextGoals = goalCounts[stat.player_id] ?? 0
      const nextAssists = assistCounts[stat.player_id] ?? 0
      if (nextGoals !== stat.goals || nextAssists !== stat.assists) {
        await supabase.from('match_player_stats').update({ goals: nextGoals, assists: nextAssists }).eq('id', stat.id)
      }
    }
  }

  async function syncScoreFromGoals() {
    if (!match) return
    const { data: goalRows } = await supabase.from('match_goals').select('is_opponent').eq('match_id', match.id)
    const opponentGoals = (goalRows ?? []).filter((g) => g.is_opponent).length
    const ownGoals = (goalRows ?? []).length - opponentGoals
    const nextHome = match.home_away === 'home' ? ownGoals : opponentGoals
    const nextAway = match.home_away === 'home' ? opponentGoals : ownGoals

    const { error } = await supabase
      .from('matches')
      .update({ home_score: nextHome, away_score: nextAway })
      .eq('id', match.id)
    if (error) return
    setMatch({ ...match, home_score: nextHome, away_score: nextAway })
    setHomeScore(nextHome.toString())
    setAwayScore(nextAway.toString())
  }

  async function recomputeCards() {
    if (!match) return
    const { data: cardRows } = await supabase.from('match_cards').select('player_id, card_type').eq('match_id', match.id)
    const { data: statRows } = await supabase
      .from('match_player_stats')
      .select('id, player_id, yellow_cards, red_cards')
      .eq('match_id', match.id)
    const yellowCounts: Record<string, number> = {}
    const redCounts: Record<string, number> = {}
    for (const c of cardRows ?? []) {
      if (!c.player_id) continue
      if (c.card_type === 'yellow') yellowCounts[c.player_id] = (yellowCounts[c.player_id] ?? 0) + 1
      else redCounts[c.player_id] = (redCounts[c.player_id] ?? 0) + 1
    }
    for (const stat of statRows ?? []) {
      const nextYellow = yellowCounts[stat.player_id] ?? 0
      const nextRed = redCounts[stat.player_id] ?? 0
      if (nextYellow !== stat.yellow_cards || nextRed !== stat.red_cards) {
        await supabase
          .from('match_player_stats')
          .update({ yellow_cards: nextYellow, red_cards: nextRed })
          .eq('id', stat.id)
      }
    }
  }

  async function recomputeMinutesFromSubs(resetPlayerIds: string[] = []) {
    if (!match) return
    const { data: subRows } = await supabase
      .from('match_substitutions')
      .select('player_off_id, player_on_id, minute')
      .eq('match_id', match.id)
    const { data: statRows } = await supabase
      .from('match_player_stats')
      .select('id, player_id, minutes_played, is_starting')
      .eq('match_id', match.id)
    const minutesMap: Record<string, number> = {}
    for (const s of subRows ?? []) {
      minutesMap[s.player_off_id] = s.minute
      minutesMap[s.player_on_id] = SUBSTITUTION_MATCH_MINUTES - s.minute
    }
    for (const stat of statRows ?? []) {
      let next: number
      if (stat.player_id in minutesMap) next = minutesMap[stat.player_id]
      else if (resetPlayerIds.includes(stat.player_id)) next = baseMinutes(stat.is_starting)
      else continue
      if (next !== stat.minutes_played) {
        await supabase.from('match_player_stats').update({ minutes_played: next }).eq('id', stat.id)
      }
    }
  }

  function playerName(playerId: string | null): string {
    if (!playerId) return '?'
    return stats.find((s) => s.player_id === playerId)?.player_name ?? '?'
  }

  function cardPlayerLabel(card: MatchCard): string {
    if (card.is_opponent) return card.opponent_player_name || t('matches.card.opponentUnknownPlayer')
    return playerName(card.player_id)
  }

  function goalScorerLabel(goal: MatchGoal): string {
    if (goal.is_opponent) return goal.opponent_scorer_name || t('matches.goal.opponentUnknownScorer')
    return playerName(goal.scorer_id)
  }

  async function ensurePlayerStat(playerId: string) {
    if (!match) return
    if (stats.some((s) => s.player_id === playerId)) return
    await supabase.from('match_player_stats').insert({
      match_id: match.id,
      player_id: playerId,
      is_starting: false,
      minutes_played: 0,
    })
  }

  async function handleAddGoal(event: FormEvent) {
    event.preventDefault()
    if (!match) return
    if (!goalIsOpponent && !goalScorerId) return
    setGoalError(null)

    const { error } = await supabase.from('match_goals').insert({
      match_id: match.id,
      is_opponent: goalIsOpponent,
      scorer_id: goalIsOpponent ? null : goalScorerId,
      assist_id: goalIsOpponent ? null : goalAssistId || null,
      opponent_scorer_name: goalIsOpponent ? goalOpponentScorerName || null : null,
      minute: goalMinute ? Number(goalMinute) : null,
    })

    if (error) {
      setGoalError(error.message)
      return
    }

    setGoalIsOpponent(false)
    setGoalMinute('')
    setGoalScorerId('')
    setGoalAssistId('')
    setGoalOpponentScorerName('')
    setShowGoalForm(false)
    await recomputeGoalsAndAssists()
    await syncScoreFromGoals()
    await loadGoals()
    await loadStats()
  }

  async function handleDeleteGoal(id: string) {
    await supabase.from('match_goals').delete().eq('id', id)
    setConfirmingDeleteGoalId(null)
    await recomputeGoalsAndAssists()
    await syncScoreFromGoals()
    await loadGoals()
    await loadStats()
  }

  async function handleAddCard(event: FormEvent) {
    event.preventDefault()
    if (!match || (!cardIsOpponent && !cardPlayerId)) return
    setCardError(null)

    if (!cardIsOpponent) await ensurePlayerStat(cardPlayerId)

    const { error } = await supabase.from('match_cards').insert({
      match_id: match.id,
      is_opponent: cardIsOpponent,
      player_id: cardIsOpponent ? null : cardPlayerId,
      opponent_player_name: cardIsOpponent ? cardOpponentPlayerName || null : null,
      card_type: cardType,
      minute: cardMinute ? Number(cardMinute) : null,
    })

    if (error) {
      setCardError(error.message)
      return
    }

    setCardMinute('')
    setCardPlayerId('')
    setCardIsOpponent(false)
    setCardOpponentPlayerName('')
    setCardType('yellow')
    setShowCardForm(false)
    await recomputeCards()
    await loadCards()
    await loadStats()
  }

  async function handleDeleteCard(id: string) {
    await supabase.from('match_cards').delete().eq('id', id)
    setConfirmingDeleteCardId(null)
    await recomputeCards()
    await loadCards()
    await loadStats()
  }

  async function handleAddSubstitution(event: FormEvent) {
    event.preventDefault()
    if (!match || !subOffId || !subOnId || !subMinute) return
    if (subOffId === subOnId) {
      setSubError(t('matches.form.subSamePlayerError'))
      return
    }
    setSubError(null)

    const { error } = await supabase.from('match_substitutions').insert({
      match_id: match.id,
      player_off_id: subOffId,
      player_on_id: subOnId,
      minute: Number(subMinute),
    })

    if (error) {
      setSubError(error.message)
      return
    }

    setSubMinute('')
    setSubOffId('')
    setSubOnId('')
    setShowSubForm(false)
    await recomputeMinutesFromSubs()
    await loadSubstitutions()
    await loadStats()
  }

  async function handleDeleteSubstitution(id: string) {
    const target = substitutions.find((sub) => sub.id === id)
    await supabase.from('match_substitutions').delete().eq('id', id)
    setConfirmingDeleteSubId(null)
    await recomputeMinutesFromSubs(target ? [target.player_off_id, target.player_on_id] : [])
    await loadSubstitutions()
    await loadStats()
  }

  // スクショから読み取った内容を、この試合の記録として反映する
  async function applyScreenshotImport(draft: ImportDraft) {
    if (!match) return
    const fail = (error: { message: string } | null) => {
      if (error) throw new Error(error.message)
    }

    // 1. メンバー（先発・ベンチ）
    const lineup = new Map<string, ImportDraft['lineup'][number]>()
    for (const row of draft.lineup) if (row.playerId && !lineup.has(row.playerId)) lineup.set(row.playerId, row)

    const { data: existingRows } = await supabase.from('match_player_stats').select('player_id').eq('match_id', match.id)
    const registered = new Set((existingRows ?? []).map((r) => r.player_id))

    async function ensureRegistered(playerId: string) {
      if (registered.has(playerId)) return
      fail((await supabase.from('match_player_stats').insert({ match_id: match!.id, player_id: playerId, is_starting: false, minutes_played: 0 })).error)
      registered.add(playerId)
    }

    for (const [playerId, row] of lineup) {
      const payload = {
        is_starting: row.isStarting,
        position_played: row.position || null,
        minutes_played: baseMinutes(row.isStarting),
      }
      if (registered.has(playerId)) {
        fail((await supabase.from('match_player_stats').update(payload).eq('match_id', match.id).eq('player_id', playerId)).error)
      } else {
        fail((await supabase.from('match_player_stats').insert({ match_id: match.id, player_id: playerId, ...payload })).error)
        registered.add(playerId)
      }
    }

    // 2. 得点（読み取れたときだけ、既存の記録を置き換える）
    const goals = draft.goals.filter((g) => !g.own || g.scorerId)
    if (goals.length > 0) {
      for (const g of goals) {
        if (g.own) {
          await ensureRegistered(g.scorerId)
          if (g.assistId) await ensureRegistered(g.assistId)
        }
      }
      fail((await supabase.from('match_goals').delete().eq('match_id', match.id)).error)
      fail(
        (
          await supabase.from('match_goals').insert(
            goals.map((g) => ({
              match_id: match.id,
              is_opponent: !g.own,
              scorer_id: g.own ? g.scorerId : null,
              assist_id: g.own ? g.assistId || null : null,
              opponent_scorer_name: g.own ? null : g.opponentName || null,
              minute: g.minute ? Number(g.minute) : null,
            })),
          )
        ).error,
      )
    }

    // 3. カード
    const cardRows = draft.cards.filter((c) => !c.own || c.playerId)
    if (cardRows.length > 0) {
      for (const c of cardRows) if (c.own) await ensureRegistered(c.playerId)
      fail((await supabase.from('match_cards').delete().eq('match_id', match.id)).error)
      fail(
        (
          await supabase.from('match_cards').insert(
            cardRows.map((c) => ({
              match_id: match.id,
              is_opponent: !c.own,
              player_id: c.own ? c.playerId : null,
              opponent_player_name: c.own ? null : c.opponentName || null,
              card_type: c.card,
              minute: c.minute ? Number(c.minute) : null,
            })),
          )
        ).error,
      )
    }

    // 4. 交代
    const subs = draft.subs.filter((sub) => sub.offId && sub.onId && sub.offId !== sub.onId && sub.minute)
    if (subs.length > 0) {
      for (const sub of subs) {
        await ensureRegistered(sub.offId)
        await ensureRegistered(sub.onId)
      }
      fail((await supabase.from('match_substitutions').delete().eq('match_id', match.id)).error)
      fail(
        (
          await supabase.from('match_substitutions').insert(
            subs.map((sub) => ({
              match_id: match.id,
              player_off_id: sub.offId,
              player_on_id: sub.onId,
              minute: Number(sub.minute),
            })),
          )
        ).error,
      )
    }

    await recomputeGoalsAndAssists()
    await recomputeCards()
    await recomputeMinutesFromSubs()

    // 5. スコア
    if (draft.ownScore !== '' && draft.opponentScore !== '') {
      const own = Number(draft.ownScore)
      const opp = Number(draft.opponentScore)
      const nextHome = match.home_away === 'home' ? own : opp
      const nextAway = match.home_away === 'home' ? opp : own
      fail((await supabase.from('matches').update({ home_score: nextHome, away_score: nextAway }).eq('id', match.id)).error)
      setMatch({ ...match, home_score: nextHome, away_score: nextAway })
      setHomeScore(nextHome.toString())
      setAwayScore(nextAway.toString())
    } else if (goals.length > 0) {
      await syncScoreFromGoals()
    }

    // 6. チームスタッツ
    const hasTeamStats = Object.keys(draft.teamStats.own).length > 0 || Object.keys(draft.teamStats.opponent).length > 0
    if (hasTeamStats) {
      fail(
        (
          await supabase.from('match_team_stats').upsert({
            match_id: match.id,
            own: draft.teamStats.own,
            opponent: draft.teamStats.opponent,
            updated_at: new Date().toISOString(),
          })
        ).error,
      )
      setTeamStatsRefreshKey((k) => k + 1)
    }

    await Promise.all([loadGoals(), loadCards(), loadSubstitutions(), loadStats()])
  }

  async function handleGenerateReport() {
    if (!match || !club) return
    setGeneratingReport(true)
    setReportError(null)

    const { data: competition } = await supabase
      .from('competitions')
      .select('name')
      .eq('id', match.competition_id)
      .maybeSingle()

    const ownScore = match.home_away === 'home' ? match.home_score : match.away_score
    const oppScore = match.home_away === 'home' ? match.away_score : match.home_score

    let title: string
    let scoreText: string | null = null
    if (ownScore === null || oppScore === null) {
      title = `vs ${match.opponent_name}`
    } else {
      scoreText = `${ownScore}-${oppScore}`
      if (ownScore > oppScore) {
        title = t('matches.report.titleWin', { club: club.name, opponent: match.opponent_name, score: scoreText })
      } else if (ownScore < oppScore) {
        title = t('matches.report.titleLoss', { club: club.name, opponent: match.opponent_name, score: scoreText })
      } else {
        title = t('matches.report.titleDraw', { club: club.name, opponent: match.opponent_name, score: scoreText })
      }
    }

    const lines: string[] = []
    const metaParts = [match.match_date, competition?.name, match.round_label].filter(Boolean)
    lines.push(metaParts.join(' ・ '))
    const [homeLabel, awayLabel] = match.home_away === 'home' ? [club.name, match.opponent_name] : [match.opponent_name, club.name]
    lines.push(`${homeLabel} ${scoreText ?? '?'} ${awayLabel}${match.venue ? `（${match.venue}）` : ''}`)

    const sortedGoals = [...goals].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    if (sortedGoals.length > 0) {
      lines.push('')
      lines.push(t('matches.report.goalsHeading'))
      for (const g of sortedGoals) {
        const minuteText = g.minute !== null ? `${g.minute}` : '?'
        if (g.is_opponent) {
          lines.push(
            t('matches.report.concedeLine', {
              minute: minuteText,
              scorer: g.opponent_scorer_name || t('matches.goal.opponentUnknownScorer'),
            }),
          )
        } else {
          const scorer = playerName(g.scorer_id)
          const line = t('matches.report.goalLine', { minute: minuteText, scorer })
          const assist = g.assist_id ? t('matches.goal.assistSuffix', { assist: playerName(g.assist_id) }) : ''
          lines.push(`${line}${assist}`)
        }
      }
    }

    if (cards.length > 0) {
      lines.push('')
      lines.push(t('matches.report.cardsHeading'))
      for (const c of cards) {
        const minuteText = c.minute !== null ? `${c.minute}` : '?'
        const cardLabel = c.card_type === 'yellow' ? t('matches.report.yellowCard') : t('matches.report.redCard')
        lines.push(t('matches.report.cardLine', { minute: minuteText, type: cardLabel, player: cardPlayerLabel(c) }))
      }
    }

    const body = lines.join('\n').trim()

    const { data: article, error } = await supabase
      .from('news')
      .insert({
        club_id: club.id,
        title,
        slug: slugify(title),
        category: t('matches.report.category'),
        body,
        published_at: null,
      })
      .select()
      .single()

    if (error) {
      setReportError(error.message)
      setGeneratingReport(false)
      return
    }

    navigate(`/admin/news/${article.id}`, { state: { defaultPublishedDate: match.match_date } })
  }

  if (loading) return <p className="text-sm text-club-muted">{t('common.loading')}</p>
  if (!match) return <p className="text-sm text-club-muted">{t('common.notFound.match')}</p>

  const registeredPlayerIds = new Set(stats.map((s) => s.player_id))
  const availablePlayers = squad
    .filter((s) => !registeredPlayerIds.has(s.player_id))
    .sort((a, b) => comparePlayersByPositionAndNumber(a, b))
  const squadSorted = [...squad].sort((a, b) => comparePlayersByPositionAndNumber(a, b))

  const squadByPlayerId = new Map(squad.map((s) => [s.player_id, s]))
  const sortedStats = [...stats].sort((a, b) => {
    if (a.is_starting !== b.is_starting) return a.is_starting ? -1 : 1
    const squadA = squadByPlayerId.get(a.player_id)
    const squadB = squadByPlayerId.get(b.player_id)
    return comparePlayersByPositionAndNumber(
      { position_main: squadA?.position_main ?? null, squad_number: squadA?.squad_number ?? null },
      { position_main: squadB?.position_main ?? null, squad_number: squadB?.squad_number ?? null },
    )
  })

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <PageHeading
          title={`vs ${match.opponent_name}（${homeAwayLabels[match.home_away]}）`}
          description={match.match_date}
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="shrink-0 rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5 disabled:opacity-40"
          >
            {generatingReport ? t('common.loading') : t('matches.generateReport')}
          </button>
          {confirmingDelete ? (
            <div className="flex shrink-0 items-center gap-2 text-xs">
              <span className="text-club-muted">{t('common.confirmDelete')}</span>
              <button
                type="button"
                onClick={handleDeleteMatch}
                className="font-semibold text-red-600 hover:underline"
              >
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
      </div>

      {reportError && <p className="mb-4 text-sm text-red-600">{reportError}</p>}

      <ScreenshotImport
        opponentName={match.opponent_name}
        clubName={club?.name ?? ''}
        players={squadSorted.map((s) => ({
          playerId: s.player_id,
          name: s.players.full_name,
          squadNumber: s.squad_number,
        }))}
        onApply={applyScreenshotImport}
      />

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

          <p className="text-xs text-club-muted md:col-span-2">{t('matches.form.scoreAutoHint')}</p>

          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-2 md:w-fit md:justify-self-end"
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
            onClick={() => {
              if (showStatForm) resetStatForm()
              setShowStatForm((v) => !v)
            }}
            disabled={!showStatForm && availablePlayers.length === 0}
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
            ref={statFormRef}
            onSubmit={handleSubmitStat}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-4"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.selectPlayer')}
              </label>
              {editingStatId ? (
                <div className="flex h-[38px] items-center rounded-md border border-club-line bg-club-bg px-3 text-sm text-club-navy">
                  {editingStatPlayerName}
                </div>
              ) : (
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
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.usage')}
              </label>
              <select
                value={statIsStarting ? 'starting' : 'bench'}
                onChange={(e) => handleChangeUsage(e.target.value === 'starting')}
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
              <select
                value={statPosition}
                onChange={(e) => setStatPosition(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">{t('common.selectPlaceholder')}</option>
                {MATCH_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
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
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-4 md:w-fit md:justify-self-end"
            >
              {editingStatId ? t('common.save') : t('common.add')}
            </button>
          </form>
        )}

        {stats.length === 0 ? (
          <p className="text-sm text-club-muted">{t('matches.statsEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {sortedStats.map((stat) => (
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
                    {t('matches.stat.line', {
                      minutes: stat.minutes_played,
                      goals: stat.goals,
                      assists: stat.assists,
                    })}
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
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => startEditStat(stat)}
                      className="font-medium text-club-muted hover:text-club-navy"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteStatId(stat.id)}
                      className="font-medium text-club-muted hover:text-red-600"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            {t('matches.goalsHeading')}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (showGoalForm) {
                setGoalIsOpponent(false)
                setGoalMinute('')
                setGoalScorerId('')
                setGoalAssistId('')
                setGoalOpponentScorerName('')
                setGoalError(null)
              }
              setShowGoalForm((v) => !v)
            }}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5 disabled:opacity-40"
          >
            {showGoalForm ? t('common.cancel') : t('matches.addGoal')}
          </button>
        </div>

        {showGoalForm && (
          <form
            onSubmit={handleAddGoal}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
          >
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.goalSide')}
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={!goalIsOpponent} onChange={() => setGoalIsOpponent(false)} />
                  {t('matches.form.ownTeam')}
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={goalIsOpponent} onChange={() => setGoalIsOpponent(true)} />
                  {t('matches.form.opponentTeam')}（{match.opponent_name}）
                </label>
              </div>
            </div>

            {!goalIsOpponent ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('matches.form.scorer')}
                  </label>
                  <select
                    required
                    value={goalScorerId}
                    onChange={(e) => setGoalScorerId(e.target.value)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  >
                    <option value="">{t('common.selectPlaceholder')}</option>
                    {sortedStats.map((s) => (
                      <option key={s.player_id} value={s.player_id}>
                        {s.player_name}
                        {squadByPlayerId.get(s.player_id)?.squad_number != null
                          ? ` #${squadByPlayerId.get(s.player_id)?.squad_number}`
                          : ''}
                      </option>
                    ))}
                  </select>
                  {stats.length === 0 && (
                    <p className="mt-1 text-xs text-club-muted">{t('matches.form.noRegisteredPlayers')}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('matches.form.assistPlayer')}{t('common.optional')}
                  </label>
                  <select
                    value={goalAssistId}
                    onChange={(e) => setGoalAssistId(e.target.value)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  >
                    <option value="">{t('matches.form.noAssist')}</option>
                    {sortedStats
                      .filter((s) => s.player_id !== goalScorerId)
                      .map((s) => (
                        <option key={s.player_id} value={s.player_id}>
                          {s.player_name}
                          {squadByPlayerId.get(s.player_id)?.squad_number != null
                            ? ` #${squadByPlayerId.get(s.player_id)?.squad_number}`
                            : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                  {t('matches.form.opponentScorerName')}{t('common.optional')}
                </label>
                <input
                  type="text"
                  value={goalOpponentScorerName}
                  onChange={(e) => setGoalOpponentScorerName(e.target.value)}
                  placeholder={t('matches.goal.opponentUnknownScorer')}
                  className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.goalMinute')}{t('common.optional')}
              </label>
              <input
                type="number"
                value={goalMinute}
                onChange={(e) => setGoalMinute(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>

            {goalError && <p className="text-sm text-red-600 md:col-span-3">{goalError}</p>}

            <button
              type="submit"
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-3 md:w-fit md:justify-self-end"
            >
              {t('common.add')}
            </button>
          </form>
        )}

        {goals.length === 0 ? (
          <p className="text-sm text-club-muted">{t('matches.goalsEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="text-sm text-club-navy">
                  <span className="font-medium">
                    {goal.minute !== null
                      ? t('matches.goal.line', { minute: goal.minute, scorer: goalScorerLabel(goal) })
                      : goalScorerLabel(goal)}
                  </span>
                  {goal.is_opponent && (
                    <span className="ml-1.5 rounded-full bg-club-bg px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-club-muted">
                      {t('matches.goal.opponentBadge')}
                    </span>
                  )}
                  {goal.assist_id && (
                    <span className="text-xs text-club-muted">
                      {t('matches.goal.assistSuffix', { assist: playerName(goal.assist_id) })}
                    </span>
                  )}
                </div>
                {confirmingDeleteGoalId === goal.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">{t('common.confirmDelete')}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteGoalId(null)}
                      className="text-club-muted hover:underline"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteGoalId(goal.id)}
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

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            {t('matches.cardsHeading')}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (showCardForm) {
                setCardMinute('')
                setCardPlayerId('')
                setCardIsOpponent(false)
                setCardOpponentPlayerName('')
                setCardType('yellow')
                setCardError(null)
              }
              setShowCardForm((v) => !v)
            }}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5 disabled:opacity-40"
          >
            {showCardForm ? t('common.cancel') : t('matches.addCard')}
          </button>
        </div>

        {showCardForm && (
          <form
            onSubmit={handleAddCard}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
          >
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.cardSide')}
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={!cardIsOpponent} onChange={() => setCardIsOpponent(false)} />
                  {t('matches.form.ownTeam')}
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={cardIsOpponent} onChange={() => setCardIsOpponent(true)} />
                  {t('matches.form.opponentTeam')}（{match.opponent_name}）
                </label>
              </div>
            </div>
            {cardIsOpponent ? (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                  {t('matches.form.opponentPlayerName')}{t('common.optional')}
                </label>
                <input
                  type="text"
                  value={cardOpponentPlayerName}
                  onChange={(e) => setCardOpponentPlayerName(e.target.value)}
                  placeholder={t('matches.card.opponentUnknownPlayer')}
                  className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                />
              </div>
            ) : (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.selectPlayer')}
              </label>
              <select
                required
                value={cardPlayerId}
                onChange={(e) => setCardPlayerId(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">{t('common.selectPlaceholder')}</option>
                {squadSorted.map((s) => (
                  <option key={s.player_id} value={s.player_id}>
                    {s.players.full_name}
                    {s.squad_number !== null ? ` #${s.squad_number}` : ''}
                  </option>
                ))}
              </select>
            </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.cardType')}
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as CardType)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="yellow">{t('matches.form.yellow')}</option>
                <option value="red">{t('matches.form.red')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.cardMinute')}{t('common.optional')}
              </label>
              <input
                type="number"
                value={cardMinute}
                onChange={(e) => setCardMinute(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>

            {cardError && <p className="text-sm text-red-600 md:col-span-3">{cardError}</p>}

            <button
              type="submit"
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-3 md:w-fit md:justify-self-end"
            >
              {t('common.add')}
            </button>
          </form>
        )}

        {cards.length === 0 ? (
          <p className="text-sm text-club-muted">{t('matches.cardsEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-club-navy">
                  <span>{card.card_type === 'yellow' ? '🟨' : '🟥'}</span>
                  <span className="font-medium">{cardPlayerLabel(card)}</span>
                  {card.is_opponent && (
                    <span className="rounded-full bg-club-bg px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-club-muted">
                      {t('matches.goal.opponentBadge')}
                    </span>
                  )}
                  {card.minute !== null && <span className="text-xs text-club-muted">{card.minute}分</span>}
                </div>
                {confirmingDeleteCardId === card.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">{t('common.confirmDelete')}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteCardId(null)}
                      className="text-club-muted hover:underline"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteCardId(card.id)}
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

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            {t('matches.substitutionsHeading')}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (showSubForm) {
                setSubMinute('')
                setSubOffId('')
                setSubOnId('')
                setSubError(null)
              }
              setShowSubForm((v) => !v)
            }}
            disabled={!showSubForm && stats.length < 2}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5 disabled:opacity-40"
          >
            {showSubForm ? t('common.cancel') : t('matches.addSubstitution')}
          </button>
        </div>

        {showSubForm && (
          <form
            onSubmit={handleAddSubstitution}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.playerOff')}
              </label>
              <select
                required
                value={subOffId}
                onChange={(e) => setSubOffId(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">{t('common.selectPlaceholder')}</option>
                {stats.map((s) => (
                  <option key={s.player_id} value={s.player_id}>
                    {s.player_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.playerOn')}
              </label>
              <select
                required
                value={subOnId}
                onChange={(e) => setSubOnId(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">{t('common.selectPlaceholder')}</option>
                {stats.map((s) => (
                  <option key={s.player_id} value={s.player_id}>
                    {s.player_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('matches.form.subMinute')}
              </label>
              <input
                type="number"
                required
                value={subMinute}
                onChange={(e) => setSubMinute(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>

            {subError && <p className="text-sm text-red-600 md:col-span-3">{subError}</p>}

            <button
              type="submit"
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-3 md:w-fit md:justify-self-end"
            >
              {t('common.add')}
            </button>
          </form>
        )}

        {substitutions.length === 0 ? (
          <p className="text-sm text-club-muted">{t('matches.substitutionsEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {substitutions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="text-sm text-club-navy">
                  {t('matches.substitution.line', {
                    minute: sub.minute,
                    off: playerName(sub.player_off_id),
                    on: playerName(sub.player_on_id),
                  })}
                </div>
                {confirmingDeleteSubId === sub.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">{t('common.confirmDelete')}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubstitution(sub.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteSubId(null)}
                      className="text-club-muted hover:underline"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteSubId(sub.id)}
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

      <TeamStatsEditor
        matchId={match.id}
        clubName={club?.name ?? ''}
        opponentName={match.opponent_name}
        refreshKey={teamStatsRefreshKey}
      />
    </>
  )
}
