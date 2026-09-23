import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { statusLabels, type Player, type SquadMembership, type SquadStatus } from '@/lib/players'
import type { Season } from '@/lib/seasons'

type MembershipRow = SquadMembership & { season_label: string }

const statusOptions = Object.entries(statusLabels) as [SquadStatus, string][]

export default function AdminPlayerEdit() {
  const { playerId } = useParams()
  const { club } = useClub()
  const navigate = useNavigate()

  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [fullName, setFullName] = useState('')
  const [nationality, setNationality] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [preferredFoot, setPreferredFoot] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [seasons, setSeasons] = useState<Season[]>([])
  const [memberships, setMemberships] = useState<MembershipRow[]>([])
  const [showMembershipForm, setShowMembershipForm] = useState(false)
  const [newSeasonId, setNewSeasonId] = useState('')
  const [newSquadNumber, setNewSquadNumber] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [newOverall, setNewOverall] = useState('')
  const [newPotential, setNewPotential] = useState('')
  const [newStatus, setNewStatus] = useState<SquadStatus>('active')
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [confirmingDeleteMembershipId, setConfirmingDeleteMembershipId] = useState<string | null>(null)

  async function loadPlayer() {
    if (!playerId) return
    setLoading(true)
    const { data } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle()
    setPlayer(data)
    if (data) {
      setFullName(data.full_name)
      setNationality(data.nationality ?? '')
      setBirthDate(data.birth_date ?? '')
      setHeightCm(data.height_cm?.toString() ?? '')
      setPreferredFoot(data.preferred_foot ?? '')
      setPhotoUrl(data.photo_url ?? '')
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
      .select('*, seasons(label)')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
    setMemberships(
      (data ?? []).map((row) => {
        const { seasons: seasonRelation, ...rest } = row as SquadMembership & {
          seasons: { label: string } | null
        }
        return { ...rest, season_label: seasonRelation?.label ?? '?' }
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
        nationality: nationality || null,
        birth_date: birthDate || null,
        height_cm: heightCm ? Number(heightCm) : null,
        preferred_foot: preferredFoot || null,
        photo_url: photoUrl || null,
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
      position: newPosition || null,
      overall_rating: newOverall ? Number(newOverall) : null,
      potential_rating: newPotential ? Number(newPotential) : null,
      status: newStatus,
    })

    if (error) {
      setMembershipError(error.message)
      return
    }

    setNewSeasonId('')
    setNewSquadNumber('')
    setNewPosition('')
    setNewOverall('')
    setNewPotential('')
    setNewStatus('active')
    setShowMembershipForm(false)
    await loadMemberships()
  }

  async function handleDeleteMembership(membershipId: string) {
    await supabase.from('squad_memberships').delete().eq('id', membershipId)
    setConfirmingDeleteMembershipId(null)
    await loadMemberships()
  }

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!player) return <p className="text-sm text-club-muted">選手が見つかりませんでした。</p>

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <div className="flex items-center gap-3">
          <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} />
          <PageHeading title={player.full_name} />
        </div>
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="text-club-muted">削除しますか？</span>
            <button
              type="button"
              onClick={handleDeletePlayer}
              className="font-semibold text-red-600 hover:underline"
            >
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
          プロフィール
        </h2>
        <form onSubmit={handleSaveProfile} className="grid max-w-xl gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">氏名</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">国籍</label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              生年月日
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              身長（cm）
            </label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">利き足</label>
            <select
              value={preferredFoot}
              onChange={(e) => setPreferredFoot(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            >
              <option value="">未設定</option>
              <option value="right">右</option>
              <option value="left">左</option>
              <option value="both">両足</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              写真URL（任意）
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
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
            シーズン所属
          </h2>
          <button
            type="button"
            onClick={() => setShowMembershipForm((v) => !v)}
            className="rounded-md border border-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy hover:bg-club-navy/5"
          >
            {showMembershipForm ? 'キャンセル' : '+ Add to Season'}
          </button>
        </div>

        {showMembershipForm && (
          <form
            onSubmit={handleAddMembership}
            className="mb-4 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                シーズン
              </label>
              <select
                required
                value={newSeasonId}
                onChange={(e) => setNewSeasonId(e.target.value)}
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
                背番号
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
                ポジション
              </label>
              <input
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="例: FW, MF, DF, GK"
                className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
                総合値
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
                潜在能力
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
                在籍状況
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

            {membershipError && <p className="text-sm text-red-600 md:col-span-3">{membershipError}</p>}

            <button
              type="submit"
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 md:col-span-3 md:w-fit"
            >
              追加する
            </button>
          </form>
        )}

        {memberships.length === 0 ? (
          <p className="text-sm text-club-muted">シーズン所属がまだ登録されていません。</p>
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
                    {membership.position && <span className="text-xs text-club-muted">{membership.position}</span>}
                    <span className="rounded-full bg-club-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-club-muted">
                      {statusLabels[membership.status]}
                    </span>
                  </div>
                  {(membership.overall_rating !== null || membership.potential_rating !== null) && (
                    <div className="text-xs text-club-muted">
                      OVR {membership.overall_rating ?? '—'} / POT {membership.potential_rating ?? '—'}
                    </div>
                  )}
                </div>
                {confirmingDeleteMembershipId === membership.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-club-muted">削除しますか？</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMembership(membership.id)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      はい
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteMembershipId(null)}
                      className="text-club-muted hover:underline"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteMembershipId(membership.id)}
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
