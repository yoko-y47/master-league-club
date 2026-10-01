import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { useStatusLabels, type Player, type SquadStatus } from '@/lib/players'
import { clearFormDraft, useFormDraft } from '@/lib/useFormDraft'
import type { Season } from '@/lib/seasons'

type PreviousAffiliation = 'none' | 'external' | 'youth'

export default function AdminPlayerList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const statusLabels = useStatusLabels()
  const statusOptions = Object.entries(statusLabels) as [SquadStatus, string][]
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)

  const [fullName, setFullName] = useState('')
  const [givenNameEn, setGivenNameEn] = useState('')
  const [familyNameEn, setFamilyNameEn] = useState('')
  const [nationality, setNationality] = useState('')
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [squadNumber, setSquadNumber] = useState('')
  const [positionMain, setPositionMain] = useState('')
  const [positionSub, setPositionSub] = useState('')
  const [overall, setOverall] = useState('')
  const [potential, setPotential] = useState('')
  const [status, setStatus] = useState<SquadStatus>('active')
  const [contractEndDate, setContractEndDate] = useState('')
  const [previousAffiliation, setPreviousAffiliation] = useState<PreviousAffiliation>('none')
  const [previousClubName, setPreviousClubName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  useFormDraft('admin-draft:player-new', {
    fullName: [fullName, setFullName],
    givenNameEn: [givenNameEn, setGivenNameEn],
    familyNameEn: [familyNameEn, setFamilyNameEn],
    nationality: [nationality, setNationality],
    age: [age, setAge],
    heightCm: [heightCm, setHeightCm],
    weightKg: [weightKg, setWeightKg],
    squadNumber: [squadNumber, setSquadNumber],
    positionMain: [positionMain, setPositionMain],
    positionSub: [positionSub, setPositionSub],
    overall: [overall, setOverall],
    potential: [potential, setPotential],
    status: [status, setStatus as (value: never) => void],
    contractEndDate: [contractEndDate, setContractEndDate],
    previousAffiliation: [previousAffiliation, setPreviousAffiliation as (value: never) => void],
    previousClubName: [previousClubName, setPreviousClubName],
  })

  async function loadPlayers() {
    if (!club) return
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', club.id)
      .order('full_name')
    setPlayers(data ?? [])
    setLoading(false)
  }

  async function loadCurrentSeason() {
    if (!club) return
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .eq('club_id', club.id)
      .eq('is_current', true)
      .maybeSingle()
    setCurrentSeason(data)
  }

  useEffect(() => {
    loadPlayers()
    loadCurrentSeason()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  function resetForm() {
    setFullName('')
    setGivenNameEn('')
    setFamilyNameEn('')
    setNationality('')
    setAge('')
    setHeightCm('')
    setWeightKg('')
    setSquadNumber('')
    setPositionMain('')
    setPositionSub('')
    setOverall('')
    setPotential('')
    setStatus('active')
    setContractEndDate('')
    setPreviousAffiliation('none')
    setPreviousClubName('')
    setError(null)
    clearFormDraft('admin-draft:player-new')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club) return
    setSubmitting(true)
    setError(null)

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        club_id: club.id,
        full_name: fullName,
        given_name_en: givenNameEn || null,
        family_name_en: familyNameEn || null,
        nationality: nationality || null,
        age: age ? Number(age) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
      })
      .select()
      .single()

    if (playerError) {
      setError(playerError.message)
      setSubmitting(false)
      return
    }

    if (currentSeason) {
      const { error: membershipError } = await supabase.from('squad_memberships').insert({
        player_id: player.id,
        club_id: club.id,
        season_id: currentSeason.id,
        squad_number: squadNumber ? Number(squadNumber) : null,
        position_main: positionMain || null,
        position_sub: positionSub || null,
        overall_rating: overall ? Number(overall) : null,
        potential_rating: potential ? Number(potential) : null,
        status,
        contract_end_date: contractEndDate || null,
      })

      if (membershipError) {
        setError(membershipError.message)
        setSubmitting(false)
        return
      }

      if (previousAffiliation !== 'none') {
        await supabase.from('transfers').insert({
          player_id: player.id,
          season_id: currentSeason.id,
          transfer_date: currentSeason.start_date ?? new Date().toISOString().slice(0, 10),
          from_club: previousAffiliation === 'external' ? previousClubName || null : null,
          to_club: club.name,
          transfer_type: previousAffiliation === 'external' ? 'signing' : 'youth_promotion',
        })
      }
    }

    resetForm()
    setShowForm(false)
    setSubmitting(false)
    await loadPlayers()
  }

  async function handleDelete(playerId: string) {
    await supabase.from('players').delete().eq('id', playerId)
    setConfirmingDeleteId(null)
    await loadPlayers()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title={t('players.pageTitle')} description={t('players.pageDesc.admin')} />
        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm()
            setShowForm((v) => !v)
          }}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          {showForm ? t('common.cancel') : t('players.newPlayer')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
        >
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.fullName')}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.givenNameEn')}{t('common.optional')}
            </label>
            <input
              type="text"
              value={givenNameEn}
              onChange={(e) => setGivenNameEn(e.target.value)}
              placeholder="Lukas"
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.familyNameEn')}{t('common.optional')}
            </label>
            <input
              type="text"
              value={familyNameEn}
              onChange={(e) => setFamilyNameEn(e.target.value)}
              placeholder="Weber"
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.nationality')}{t('common.optional')}
            </label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.age')}{t('common.optional')}
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.heightCm')}{t('common.optional')}
            </label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.weightKg')}{t('common.optional')}
            </label>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>

          {currentSeason ? (
            <div className="md:col-span-3 border-t border-club-line pt-3">
              <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-club-navy">
                {t('players.membershipHeading')}（{currentSeason.label}）
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('players.form.squadNumber')}{t('common.optional')}
                  </label>
                  <input
                    type="number"
                    value={squadNumber}
                    onChange={(e) => setSquadNumber(e.target.value)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('players.form.status')}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SquadStatus)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  >
                    {statusOptions.map(([value, labelText]) => (
                      <option key={value} value={value}>
                        {labelText}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('players.form.positionMain')}{t('common.optional')}
                  </label>
                  <input
                    type="text"
                    value={positionMain}
                    onChange={(e) => setPositionMain(e.target.value)}
                    placeholder="e.g. FW, MF, DF, GK"
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('players.form.positionSub')}{t('common.optional')}
                  </label>
                  <input
                    type="text"
                    value={positionSub}
                    onChange={(e) => setPositionSub(e.target.value)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('players.form.overall')}{t('common.optional')}
                  </label>
                  <input
                    type="number"
                    value={overall}
                    onChange={(e) => setOverall(e.target.value)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('players.form.potential')}{t('common.optional')}
                  </label>
                  <input
                    type="number"
                    value={potential}
                    onChange={(e) => setPotential(e.target.value)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                    {t('players.form.contractEndDate')}{t('common.optional')}
                  </label>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                  {t('players.form.previousAffiliation')}
                </label>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={previousAffiliation === 'none'}
                      onChange={() => setPreviousAffiliation('none')}
                    />
                    {t('players.form.previousNone')}
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={previousAffiliation === 'external'}
                      onChange={() => setPreviousAffiliation('external')}
                    />
                    {t('players.form.previousExternal')}
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={previousAffiliation === 'youth'}
                      onChange={() => setPreviousAffiliation('youth')}
                    />
                    {t('players.form.previousYouth')}
                  </label>
                </div>
                {previousAffiliation === 'external' && (
                  <input
                    type="text"
                    value={previousClubName}
                    onChange={(e) => setPreviousClubName(e.target.value)}
                    placeholder={t('players.form.previousClubName')}
                    className="mt-2 w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
                  />
                )}
                <p className="mt-1 text-xs text-club-muted">{t('players.form.previousHint')}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-club-muted md:col-span-3">{t('common.noCurrentSeason')}</p>
          )}

          {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-3"
          >
            {t('players.form.createSubmit')}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : players.length === 0 ? (
        <p className="text-sm text-club-muted">{t('players.empty')}</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link to={`/admin/players/${player.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-semibold text-club-navy">
                    {player.full_name}
                  </div>
                  <div className="text-xs text-club-muted">
                    {[player.nationality, player.age !== null ? `${player.age}${t('players.age')}` : null]
                      .filter(Boolean)
                      .join(' ・ ')}
                  </div>
                </div>
              </Link>
              {confirmingDeleteId === player.id ? (
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-club-muted">{t('common.confirmDelete')}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(player.id)}
                    className="font-semibold text-red-600 hover:underline"
                  >
                    {t('common.yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-club-muted hover:underline"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteId(player.id)}
                  className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
