import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'
import type { Competition } from '@/lib/competitions'
import { goalDifference, points, type SeasonCompetition } from '@/lib/seasonCompetitions'
import { titleResultLabels, type Title, type TitleResult } from '@/lib/titles'

type StandingRow = SeasonCompetition & { competition_name: string; title: Title | null }

const titleResultOptions = Object.entries(titleResultLabels) as [TitleResult, string][]

export default function AdminSeasonEdit() {
  const { seasonId } = useParams()
  const { club } = useClub()
  const navigate = useNavigate()
  const [season, setSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [showStandingForm, setShowStandingForm] = useState(false)
  const [newCompetitionId, setNewCompetitionId] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [newPlayed, setNewPlayed] = useState('0')
  const [newWon, setNewWon] = useState('0')
  const [newDrawn, setNewDrawn] = useState('0')
  const [newLost, setNewLost] = useState('0')
  const [newGoalsFor, setNewGoalsFor] = useState('0')
  const [newGoalsAgainst, setNewGoalsAgainst] = useState('0')
  const [standingError, setStandingError] = useState<string | null>(null)
  const [confirmingDeleteStandingId, setConfirmingDeleteStandingId] = useState<string | null>(null)

  const [addingTitleForId, setAddingTitleForId] = useState<string | null>(null)
  const [titleResultChoice, setTitleResultChoice] = useState<TitleResult>('champion')

  async function loadSeason() {
    if (!seasonId) return
    setLoading(true)
    const { data } = await supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle()
    setSeason(data)
    if (data) {
      setLabel(data.label)
      setStartDate(data.start_date ?? '')
      setEndDate(data.end_date ?? '')
    }
    setLoading(false)
  }

  async function loadStandings() {
    if (!seasonId) return
    const { data } = await supabase
      .from('season_competitions')
      .select('*, competitions(name), titles(id, season_competition_id, result, created_at)')
      .eq('season_id', seasonId)
    setStandings(
      (data ?? []).map((row) => {
        const { competitions: competitionRel, titles: titleRel, ...rest } = row as SeasonCompetition & {
          competitions: { name: string } | null
          titles: Title[]
        }
        return { ...rest, competition_name: competitionRel?.name ?? '?', title: titleRel[0] ?? null }
      }),
    )
  }

  async function loadCompetitions() {
    const { data } = await supabase.from('competitions').select('*').order('name')
    setCompetitions(data ?? [])
  }

  useEffect(() => {
    loadSeason()
    loadStandings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId])

  useEffect(() => {
    loadCompetitions()
  }, [])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!season) return
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('seasons')
      .update({ label, start_date: startDate || null, end_date: endDate || null })
      .eq('id', season.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    await loadSeason()
  }

  async function handleSetCurrent() {
    if (!season || !club) return
    await supabase.from('seasons').update({ is_current: false }).eq('club_id', club.id)
    await supabase.from('seasons').update({ is_current: true }).eq('id', season.id)
    setSeason({ ...season, is_current: true })
  }

  async function handleDelete() {
    if (!season) return
    await supabase.from('seasons').delete().eq('id', season.id)
    navigate('/admin/seasons')
  }

  async function handleAddStanding(event: FormEvent) {
    event.preventDefault()
    if (!season || !newCompetitionId) return
    setStandingError(null)

    const { error } = await supabase.from('season_competitions').insert({
      season_id: season.id,
      competition_id: newCompetitionId,
      final_position: newPosition ? Number(newPosition) : null,
      played: Number(newPlayed) || 0,
      won: Number(newWon) || 0,
      drawn: Number(newDrawn) || 0,
      lost: Number(newLost) || 0,
      goals_for: Number(newGoalsFor) || 0,
      goals_against: Number(newGoalsAgainst) || 0,
    })

    if (error) {
      setStandingError(error.message)
      return
    }

    setNewCompetitionId('')
    setNewPosition('')
    setNewPlayed('0')
    setNewWon('0')
    setNewDrawn('0')
    setNewLost('0')
    setNewGoalsFor('0')
    setNewGoalsAgainst('0')
    setShowStandingForm(false)
    await loadStandings()
  }

  async function handleDeleteStanding(id: string) {
    await supabase.from('season_competitions').delete().eq('id', id)
    setConfirmingDeleteStandingId(null)
    await loadStandings()
  }

  async function handleAddTitle(seasonCompetitionId: string) {
    await supabase.from('titles').insert({
      season_competition_id: seasonCompetitionId,
      result: titleResultChoice,
    })
    setAddingTitleForId(null)
    setTitleResultChoice('champion')
    await loadStandings()
  }

  async function handleDeleteTitle(titleId: string) {
    await supabase.from('titles').delete().eq('id', titleId)
    await loadStandings()
  }

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!season) return <p className="text-sm text-club-muted">シーズンが見つかりませんでした。</p>

  const usedCompetitionIds = new Set(standings.map((s) => s.competition_id))
  const availableCompetitions = competitions.filter((c) => !usedCompetitionIds.has(c.id))

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <PageHeading title={`Edit: ${season.label}`} />
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {!season.is_current && (
            <button
              type="button"
              onClick={handleSetCurrent}
              className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5"
            >
              現在のシーズンにする
            </button>
          )}
          {confirmingDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-club-muted">削除しますか？</span>
              <button type="button" onClick={handleDelete} className="font-semibold text-red-600 hover:underline">
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
              className="rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-muted hover:border-red-300 hover:text-red-600"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {season.is_current && (
        <span className="mb-4 inline-block rounded-full bg-club-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-navy">
          Current Season
        </span>
      )}

      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          基本情報
        </h2>
        <form onSubmit={handleSave} className="grid max-w-md gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              シーズン名
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              開始日（任意）
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              終了日（任意）
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:w-fit"
          >
            保存する
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            大会成績（順位表）
          </h2>
          <button
            type="button"
            onClick={() => setShowStandingForm((v) => !v)}
            disabled={availableCompetitions.length === 0}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5 disabled:opacity-40"
          >
            {showStandingForm ? 'キャンセル' : '+ Add Competition Result'}
          </button>
        </div>

        {competitions.length === 0 && (
          <p className="mb-4 text-sm text-club-muted">
            先にAdmin &gt; Competitionsで大会を作成してください。
          </p>
        )}

        {showStandingForm && (
          <form
            onSubmit={handleAddStanding}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-4"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                大会
              </label>
              <select
                required
                value={newCompetitionId}
                onChange={(e) => setNewCompetitionId(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">選択してください</option>
                {availableCompetitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                最終順位（任意）
              </label>
              <input
                type="number"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                試合数
              </label>
              <input
                type="number"
                value={newPlayed}
                onChange={(e) => setNewPlayed(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">勝</label>
              <input
                type="number"
                value={newWon}
                onChange={(e) => setNewWon(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">分</label>
              <input
                type="number"
                value={newDrawn}
                onChange={(e) => setNewDrawn(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">敗</label>
              <input
                type="number"
                value={newLost}
                onChange={(e) => setNewLost(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                得点
              </label>
              <input
                type="number"
                value={newGoalsFor}
                onChange={(e) => setNewGoalsFor(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                失点
              </label>
              <input
                type="number"
                value={newGoalsAgainst}
                onChange={(e) => setNewGoalsAgainst(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>

            {standingError && <p className="text-sm text-red-600 md:col-span-4">{standingError}</p>}

            <button
              type="submit"
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-4 md:w-fit"
            >
              追加する
            </button>
          </form>
        )}

        {standings.length === 0 ? (
          <p className="text-sm text-club-muted">大会成績がまだ登録されていません。</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {standings.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-club-navy">
                      {s.competition_name}
                    </span>
                    {s.final_position !== null && (
                      <span className="text-xs text-club-muted">{s.final_position}位</span>
                    )}
                    {s.title && (
                      <span className="rounded-full bg-club-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-gold">
                        🏆 {titleResultLabels[s.title.result]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-club-muted">
                    {s.played}試合 {s.won}勝{s.drawn}分{s.lost}敗 ・ 得失点 {goalDifference(s) >= 0 ? '+' : ''}
                    {goalDifference(s)} ({s.goals_for}-{s.goals_against}) ・ 勝点 {points(s)}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {s.title ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTitle(s.title!.id)}
                      className="text-xs font-medium text-club-muted hover:text-red-600"
                    >
                      タイトル解除
                    </button>
                  ) : addingTitleForId === s.id ? (
                    <div className="flex items-center gap-2 text-xs">
                      <select
                        value={titleResultChoice}
                        onChange={(e) => setTitleResultChoice(e.target.value as TitleResult)}
                        className="rounded-md border border-club-line px-2 py-1 text-xs focus:border-club-navy focus:outline-none"
                      >
                        {titleResultOptions.map(([value, labelText]) => (
                          <option key={value} value={value}>
                            {labelText}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddTitle(s.id)}
                        className="font-semibold text-club-navy hover:underline"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingTitleForId(null)}
                        className="text-club-muted hover:underline"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingTitleForId(s.id)}
                      className="text-xs font-medium text-club-muted hover:text-club-navy"
                    >
                      + Title
                    </button>
                  )}

                  {confirmingDeleteStandingId === s.id ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-club-muted">削除しますか？</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteStanding(s.id)}
                        className="font-semibold text-red-600 hover:underline"
                      >
                        はい
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteStandingId(null)}
                        className="text-club-muted hover:underline"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteStandingId(s.id)}
                      className="text-xs font-medium text-club-muted hover:text-red-600"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
