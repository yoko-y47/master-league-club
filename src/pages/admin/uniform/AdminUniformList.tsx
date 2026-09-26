import { useEffect, useState } from 'react'
import PageHeading from '@/components/PageHeading'
import { useAuth } from '@/lib/AuthContext'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { extractStoragePath } from '@/lib/storage'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'
import { kitTypeOrder, type KitType, type Uniform } from '@/lib/uniforms'

export default function AdminUniformList() {
  const { club } = useClub()
  const { session } = useAuth()
  const { t } = useLanguage()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [uniforms, setUniforms] = useState<Uniform[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const kitTypeLabels: Record<KitType, string> = {
    home: t('kitType.home'),
    away: t('kitType.away'),
    third: t('kitType.third'),
  }

  async function loadAll() {
    if (!club) return
    setLoading(true)
    const [{ data: seasonData }, { data: uniformData }] = await Promise.all([
      supabase.from('seasons').select('*').eq('club_id', club.id).order('start_date', { ascending: false, nullsFirst: false }),
      supabase.from('uniforms').select('*').eq('club_id', club.id),
    ])
    setSeasons(seasonData ?? [])
    setUniforms(uniformData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleUpload(seasonId: string, kitType: KitType, file: File) {
    if (!club || !session) return
    const key = `${seasonId}-${kitType}`
    setUploadingKey(key)
    setError(null)

    const ext = file.name.split('.').pop() || 'png'
    const path = `${session.user.id}/${seasonId}-${kitType}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('uniforms').upload(path, file, { upsert: false })
    if (uploadError) {
      setError(uploadError.message)
      setUploadingKey(null)
      return
    }

    const { data: urlData } = supabase.storage.from('uniforms').getPublicUrl(path)
    const existing = uniforms.find((u) => u.season_id === seasonId && u.kit_type === kitType)

    const { error: dbError } = await supabase
      .from('uniforms')
      .upsert(
        { club_id: club.id, season_id: seasonId, kit_type: kitType, image_url: urlData.publicUrl },
        { onConflict: 'season_id,kit_type' },
      )

    if (dbError) {
      setError(dbError.message)
      setUploadingKey(null)
      return
    }

    if (existing) {
      const oldPath = extractStoragePath(existing.image_url, 'uniforms')
      if (oldPath) await supabase.storage.from('uniforms').remove([oldPath])
    }

    setUploadingKey(null)
    await loadAll()
  }

  async function handleDelete(uniform: Uniform) {
    await supabase.from('uniforms').delete().eq('id', uniform.id)
    const path = extractStoragePath(uniform.image_url, 'uniforms')
    if (path) await supabase.storage.from('uniforms').remove([path])
    setConfirmingDeleteId(null)
    await loadAll()
  }

  return (
    <>
      <PageHeading title={t('nav.uniform')} description={t('uniforms.pageDesc.admin')} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : seasons.length === 0 ? (
        <p className="text-sm text-club-muted">{t('uniforms.needSeasonHint')}</p>
      ) : (
        <div className="space-y-8">
          {seasons.map((season) => (
            <section key={season.id}>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
                {season.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {kitTypeOrder.map((kitType) => {
                  const uniform = uniforms.find((u) => u.season_id === season.id && u.kit_type === kitType)
                  const key = `${season.id}-${kitType}`
                  const isUploading = uploadingKey === key
                  return (
                    <div key={kitType} className="rounded-lg border border-club-line bg-white p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-club-muted">
                        {kitTypeLabels[kitType]}
                      </div>
                      {uniform ? (
                        <img
                          src={uniform.image_url}
                          alt={kitTypeLabels[kitType]}
                          className="mb-3 h-32 w-full rounded-md border border-club-line object-contain"
                        />
                      ) : (
                        <div className="mb-3 flex h-32 w-full items-center justify-center rounded-md border border-dashed border-club-line text-xs text-club-muted">
                          —
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer rounded-md bg-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90">
                          {isUploading ? t('uniforms.uploading') : uniform ? t('uniforms.replace') : t('uniforms.upload')}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(season.id, kitType, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                        {uniform &&
                          (confirmingDeleteId === uniform.id ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <button
                                type="button"
                                onClick={() => handleDelete(uniform)}
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
                              onClick={() => setConfirmingDeleteId(uniform.id)}
                              className="text-xs font-medium text-club-muted hover:text-red-600"
                            >
                              {t('common.delete')}
                            </button>
                          ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
