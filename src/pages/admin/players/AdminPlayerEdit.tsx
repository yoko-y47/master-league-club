import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useAuth } from '@/lib/AuthContext'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { extractStoragePath } from '@/lib/storage'
import { supabase } from '@/lib/supabaseClient'
import { useStatusLabels, yearsAtClub, type Player, type SquadMembership, type SquadStatus } from '@/lib/players'
import type { Season } from '@/lib/seasons'

type MembershipRow = SquadMembership & { season_label: string; season_start_date: string | null }

type PreviousAffiliation = 'none' | 'external' | 'youth'

export default function AdminPlayerEdit() {
  const { playerId } = useParams()
  const { club } = useClub()
  const { session } = useAuth()
  const { t } = useLanguage()
  const statusLabels = useStatusLabels()
  const statusOptions = Object.entries(statusLabels) as [SquadStatus, string][]
  const navigate = useNavigate()

  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [fullName, setFullName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nationality, setNationality] = useState('')
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [preferredFoot, setPreferredFoot] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [joinedYear, setJoinedYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [seasons, setSeasons] = useState<Season[]>([])
  const [memberships, setMemberships] = useState<MembershipRow[]>([])
  const [showMembershipForm, setShowMembershipForm] = useState(false)
  const [newSeasonId, setNewSeasonId] = useState('')
  const [newSquadNumber, setNewSquadNumber] = useState('')
  const [newPositionMain, setNewPositionMain] = useState('')
  const [newPositionSub, setNewPositionSub] = useState('')
  const [newOverall, setNewOverall] = useState('')
  const [newPotential, setNewPotential] = useState('')
  const [newStatus, setNewStatus] = useState<SquadStatus>('active')
  const [newContractEndDate, setNewContractEndDate] = useState('')
  const [previousAffiliation, setPreviousAffiliation] = useState<PreviousAffiliation>('none')
  const [previousClubName, setPreviousClubName] = useState('')
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [confirmingDeleteMembershipId, setConfirmingDeleteMembershipId] = useState<string | null>(null)
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [editingContractValue, setEditingContractValue] = useState('')

  async function loadPlayer() {
    if (!playerId) return
    setLoading(true)
    const { data } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle()
    setPlayer(data)
    if (data) {
      setFullName(data.full_name)
      setNameKana(data.name_kana ?? '')
      setNameEn(data.name_en ?? '')
      setNationality(data.nationality ?? '')
      setAge(data.age?.toString() ?? '')
      setHeightCm(data.height_cm?.toString() ?? '')
      setWeightKg(data.weight_kg?.toString() ?? '')
      setPreferredFoot(data.preferred_foot ?? '')
      setPhotoUrl(data.photo_url ?? '')
      setJoinedYear(data.joined_year?.toString() ?? '')
    }
    setLoading(false)
  }

  async function loadSeasons() {
    if (!club) return
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .eq('club_id', club.id)
      .order('start_date', { ascending: false, nullsFirst: false })
    setSeasons(data ?? [])
  }

  async function loadMemberships() {
    if (!playerId) return
    const { data } = await supabase
      .from('squad_memberships')
      .select('*, seasons(label, start_date)')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
    setMemberships(
      (data ?? []).map((row) => {
        const { seasons: seasonRelation, ...rest } = row as SquadMembership & {
          seasons: { label: string; start_date: string | null } | null
        }
        return {
          ...rest,
          season_label: seasonRelation?.label ?? '?',
          season_start_date: seasonRelation?.start_date ?? null,
        }
      }),
    )
  }

  useEffect(() => {
    loadPlayer()
    loadMemberships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  useEffect(() => {
    loadSeasons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault()
    if (!player) return
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('players')
      .update({
        full_name: fullName,
        name_kana: nameKana || null,
        name_en: nameEn || null,
        nationality: nationality || null,
        age: age ? Number(age) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        preferred_foot: preferredFoot || null,
        photo_url: photoUrl || null,
        joined_year: joinedYear ? Number(joinedYear) : null,
      })
      .eq('id', player.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    await loadPlayer()
  }

  async function handlePhotoUpload(file: File) {
    if (!player || !session) return
    setUploadingPhoto(true)
    setError(null)

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${session.user.id}/${player.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, file, {
      upsert: false,
    })
    if (uploadError) {
      setError(uploadError.message)
      setUploadingPhoto(false)
      return
    }

    const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(path)
    const previousUrl = player.photo_url

    const { error: dbError } = await supabase
      .from('players')
      .update({ photo_url: urlData.publicUrl })
      .eq('id', player.id)

    if (dbError) {
      setError(dbError.message)
      setUploadingPhoto(false)
      return
    }

    if (previousUrl) {
      const oldPath = extractStoragePath(previousUrl, 'player-photos')
      if (oldPath) await supabase.storage.from('player-photos').remove([oldPath])
    }

    setPhotoUrl(urlData.publicUrl)
    setUploadingPhoto(false)
    await loadPlayer()
  }

  async function handleDeletePlayer() {
    if (!player) return
    await supabase.from('players').delete().eq('id', player.id)
    navigate('/admin/players')
  }

  async function handleAddMembership(event: FormEvent) {
    event.preventDefault()
    if (!player || !club || !newSeasonId) return
    setMembershipError(null)

    const { error } = await supabase.from('squad_memberships').insert({
      player_id: player.id,
      club_id: club.id,
      season_id: newSeasonId,
      squad_number: newSquadNumber ? Number(newSquadNumber) : null,
      position_main: newPositionMain || null,
      position_sub: newPositionSub || null,
      overall_rating: newOverall ? Number(newOverall) : null,
      potential_rating: newPotential ? Number(newPotential) : null,
      status: newStatus,
      contract_end_date: newContractEndDate || null,
    })

    if (error) {
      setMembershipError(error.message)
      return
    }

    if (previousAffiliation !== 'none') {
      const season = seasons.find((s) => s.id === newSeasonId)
      await supabase.from('transfers').insert({
        player_id: player.id,
        season_id: newSeasonId,
        transfer_date: season?.start_date ?? new Date().toISOString().slice(0, 10),
        from_club: previousAffiliation === 'external' ? previousClubName || null : null,
        to_club: club.name,
        transfer_type: previousAffiliation === 'external' ? 'signing' : 'youth_promotion',
      })
    }

    setNewSeasonId('')
    setNewSquadNumber('')
    setNewPositionMain('')
    setNewPositionSub('')
    setNewOverall('')
    setNewPotential('')
    setNewStatus('active')
    setNewContractEndDate('')
    setPreviousAffiliation('none')
    setPreviousClubName('')
    setShowMembershipForm(false)
    await loadMemberships()
  }

  async function handleDeleteMembership(membershipId: string) {
    await supabase.from('squad_memberships').delete().eq('id', membershipId)
    setConfirmingDeleteMembershipId(null)
    await loadMemberships()
  }

  async function handleSaveContract(membershipId: string) {
    await supabase
      .from('squad_memberships')
      .update({ contract_end_date: editingContractValue || null })
      .eq('id', membershipId)
    setEditingContractId(null)
    await loadMemberships()
  }

  if (loading) return <p className="text-sm text-club-muted">{t('common.loading')}</p>
  if (!player) return <p className="text-sm text-club-muted">{t('common.notFound.player')}</p>

  const years = yearsAtClub(memberships, player.joined_year)

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <div className="flex items-center gap-3">
          <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} />
          <div>
            <PageHeading title={player.full_name} />
            {(player.name_kana || player.name_en) && (
              <p className="-mt-4 text-sm text-club-muted">{[player.name_kana, player.name_en].filter(Boolean).join(' / ')}</p>
            )}
          </div>
        </div>
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="text-club-muted">{t('common.confirmDelete')}</span>
            <button
              type="button"
              onClick={handleDeletePlayer}
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

      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          {t('players.profileHeading')}
        </h2>
        <form onSubmit={handleSaveProfile} className="grid max-w-xl gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.fullNameShort')}
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
              {t('players.form.nameKana')}
            </label>
            <input
              type="text"
              value={nameKana}
              onChange={(e) => setNameKana(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.nameEn')}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.nationality')}
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
              {t('players.form.age')}
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
              {t('players.form.heightCmParen')}
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
              {t('players.form.weightKgParen')}
            </label>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.preferredFoot')}
            </label>
            <select
              value={preferredFoot}
              onChange={(e) => setPreferredFoot(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              <option value="">{t('players.form.footUnset')}</option>
              <option value="right">{t('players.form.footRight')}</option>
              <option value="left">{t('players.form.footLeft')}</option>
              <option value="both">{t('players.form.footBoth')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.joinedYear')}{t('common.optional')}
            </label>
            <input
              type="number"
              value={joinedYear}
              onChange={(e) => setJoinedYear(e.target.value)}
              placeholder={t('players.form.joinedYearPlaceholder')}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
            <p className="mt-1 text-xs text-club-muted">{t('players.form.joinedYearHint')}</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('players.form.photoUrl')}{t('common.optional')}
            </label>
            <div className="flex items-center gap-3">
              {photoUrl && (
                <PlayerAvatar name={fullName || player?.full_name || ''} photoUrl={photoUrl} size="sm" />
              )}
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
              <label className="shrink-0 cursor-pointer rounded-md border border-club-navy px-3 py-2 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5">
                {uploadingPhoto ? t('uniforms.uploading') : t('players.form.uploadPhoto')}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingPhoto}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
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
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
              {t('players.membershipHeading')}
            </h2>
            {years !== null && <p className="text-xs text-club-muted">{t('players.yearsAtClub', { years })}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowMembershipForm((v) => !v)}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5"
          >
            {showMembershipForm ? t('common.cancel') : t('players.addToSeason')}
          </button>
        </div>

        {showMembershipForm && (
          <form
            onSubmit={handleAddMembership}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('players.form.season')}
              </label>
              <select
                required
                value={newSeasonId}
                onChange={(e) => setNewSeasonId(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              >
                <option value="">{t('common.selectPlaceholder')}</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('players.form.squadNumber')}
              </label>
              <input
                type="number"
                value={newSquadNumber}
                onChange={(e) => setNewSquadNumber(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('players.form.status')}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as SquadStatus)}
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
                {t('players.form.positionMain')}
              </label>
              <input
                type="text"
                value={newPositionMain}
                onChange={(e) => setNewPositionMain(e.target.value)}
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
                value={newPositionSub}
                onChange={(e) => setNewPositionSub(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('players.form.overall')}
              </label>
              <input
                type="number"
                value={newOverall}
                onChange={(e) => setNewOverall(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('players.form.potential')}
              </label>
              <input
                type="number"
                value={newPotential}
                onChange={(e) => setNewPotential(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                {t('players.form.contractEndDate')}{t('common.optional')}
              </label>
              <input
                type="date"
                value={newContractEndDate}
                onChange={(e) => setNewContractEndDate(e.target.value)}
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 border-t border-club-line pt-3">
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

            {membershipError && <p className="text-sm text-red-600 md:col-span-3">{membershipError}</p>}

            <button
              type="submit"
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-3 md:w-fit"
            >
              {t('common.add')}
            </button>
          </form>
        )}

        {memberships.length === 0 ? (
          <p className="text-sm text-club-muted">{t('players.membershipEmpty')}</p>
        ) : (
          <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
            {memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-club-navy">
                      {membership.season_label}
                    </span>
                    {membership.squad_number !== null && (
                      <span className="text-xs text-club-muted">#{membership.squad_number}</span>
                    )}
                    {membership.position_main && (
                      <span className="text-xs text-club-muted">
                        {[membership.position_main, membership.position_sub].filter(Boolean).join(' / ')}
                      </span>
                    )}
                    <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                      {statusLabels[membership.status]}
                    </span>
                  </div>
                  {(membership.overall_rating !== null || membership.potential_rating !== null) && (
                    <div className="text-xs text-club-muted">
                      OVR {membership.overall_rating ?? '—'} / POT {membership.potential_rating ?? '—'}
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-club-muted">
                    {editingContractId === membership.id ? (
                      <>
                        <input
                          type="date"
                          value={editingContractValue}
                          onChange={(e) => setEditingContractValue(e.target.value)}
                          className="rounded-md border border-club-line px-2 py-1 text-xs focus:border-club-navy focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveContract(membership.id)}
                          className="font-semibold text-club-navy hover:underline"
                        >
                          {t('players.contract.save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingContractId(null)}
                          className="hover:underline"
                        >
                          {t('common.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <span>
                          {t('players.contract.label', {
                            date: membership.contract_end_date ?? t('players.contract.unset'),
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingContractId(membership.id)
                            setEditingContractValue(membership.contract_end_date ?? '')
                          }}
                          className="font-medium text-club-navy hover:underline"
                        >
                          {t('players.contract.renew')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {confirmingDeleteMembershipId === membership.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">{t('common.confirmDelete')}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMembership(membership.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteMembershipId(null)}
                      className="text-club-muted hover:underline"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteMembershipId(membership.id)}
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
