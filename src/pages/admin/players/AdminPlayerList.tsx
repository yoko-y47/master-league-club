import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import PlayerAvatar from '@/components/PlayerAvatar'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Player } from '@/lib/players'

export default function AdminPlayerList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [givenNameEn, setGivenNameEn] = useState('')
  const [familyNameEn, setFamilyNameEn] = useState('')
  const [nationality, setNationality] = useState('')
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

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

  useEffect(() => {
    loadPlayers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('players').insert({
      club_id: club.id,
      full_name: fullName,
      name_kana: nameKana || null,
      given_name_en: givenNameEn || null,
      family_name_en: familyNameEn || null,
      nationality: nationality || null,
      age: age ? Number(age) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setFullName('')
    setNameKana('')
    setGivenNameEn('')
    setFamilyNameEn('')
    setNationality('')
    setAge('')
    setHeightCm('')
    setWeightKg('')
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
          onClick={() => setShowForm((v) => !v)}
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
              {t('players.form.nameKana')}{t('common.optional')}
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
