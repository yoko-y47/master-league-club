import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { findSameSlot, type ArchiveKit, type KitCategory, type KitStore, type SupabaseKitSource } from 'kit-archive-core/data'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { checkSeason, createKitStore, kitCategories, kitCategoryKey, openKitSource } from '@/lib/kits'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'
import type { Uniform } from '@/lib/uniforms'

const MAX_PNG = 16 * 1024 * 1024

type Form = {
  id: string | null // null = 新規
  season: string
  type: KitCategory | ''
  variant: string
  file: File | null
  seasonId: string
  uniformId: string
}
const emptyForm: Form = { id: null, season: '', type: '', variant: '', file: null, seasonId: '', uniformId: '' }

// 3D キット（Kit Archive）の管理：追加・編集・削除。データは Kit Archive の単体版と同じ Supabase の kits
// キット画像は UV 展開の PNG（Kit Archive の型紙に貼る）。サムネイルは既存の 2D 画像（uniforms）から選べる
export default function AdminKitList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const storeRef = useRef<KitStore | null>(null)
  const sourceRef = useRef<SupabaseKitSource | null>(null)
  const [kits, setKits] = useState<ArchiveKit[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [uniforms, setUniforms] = useState<Uniform[]>([])
  const [textureUrls, setTextureUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const clubId = club?.id
  useEffect(() => {
    if (!clubId) return
    let cancelled = false
    const store = createKitStore()
    storeRef.current = store
    const unsubscribe = store.subscribe(({ kits }) => setKits(kits))
    ;(async () => {
      try {
        const [source, s, u] = await Promise.all([
          openKitSource(),
          supabase.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false, nullsFirst: false }),
          supabase.from('uniforms').select('*').eq('club_id', clubId),
        ])
        if (cancelled) return
        sourceRef.current = source
        setSeasons(s.data ?? [])
        setUniforms(u.data ?? [])
        await store.load()
        await store.attachUserSource(source)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError(t('kits.loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [clubId, t])

  // キット画像の表示用 URL（署名付き。1時間有効）
  useEffect(() => {
    const source = sourceRef.current
    if (!source) return
    for (const k of kits) {
      const ref = k.display.texture
      if (!ref || textureUrls[ref]) continue
      source.imageUrl(ref).then((url) => setTextureUrls((m) => ({ ...m, [ref]: url }))).catch((e) => console.warn(e))
    }
  }, [kits, textureUrls])

  const uniformById = useMemo(() => new Map(uniforms.map((u) => [u.id, u])), [uniforms])
  const seasonById = useMemo(() => new Map(seasons.map((s) => [s.id, s])), [seasons])
  const typeLabel = (type: KitCategory | null) => (type ? t(kitCategoryKey(type)) : t('kits.typeUnset'))

  function openForm(kit?: ArchiveKit) {
    setFormError(null)
    setForm(
      kit
        ? { id: kit.id, season: kit.season ?? '', type: kit.type ?? '', variant: kit.variant ?? '', file: null, seasonId: kit.seasonId ?? '', uniformId: kit.legacyUniformId ?? '' }
        : emptyForm,
    )
  }

  // シーズンの文字が ML のシーズン名と同じなら、そのシーズンと 2D 画像を候補として選んでおく
  function suggestLinks(next: Form): Form {
    const season = seasons.find((s) => s.label.trim() === next.season.trim())
    const seasonId = next.seasonId || season?.id || ''
    const uniform = uniforms.find((u) => u.season_id === seasonId && next.type && u.kit_type === next.type.toLowerCase())
    return { ...next, seasonId, uniformId: next.uniformId || uniform?.id || '' }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const store = storeRef.current, source = sourceRef.current
    if (!form || !store || !source || saving) return
    const s = checkSeason(form.season)
    if ('error' in s) return setFormError(t(`kits.seasonError.${s.error}`))
    if (!form.type) return setFormError(t('kits.typeRequired'))
    if (!form.id && !form.file) return setFormError(t('kits.fileRequired'))
    if (form.file && (form.file.type !== 'image/png' || form.file.size > MAX_PNG)) return setFormError(t('kits.fileInvalid'))

    const others = store.list().filter((k) => k.id !== form.id)
    const same = findSameSlot(others, s.year, form.type)
    const name = `${s.season} ${form.type}` + (same.length && !form.variant ? ` (${same.length + 1})` : '') + (form.variant ? ` ${form.variant}` : '')
    setSaving(true)
    setFormError(null)
    let newTexture: string | null = null
    try {
      if (form.file) newTexture = await source.putFile(form.file, 'image')
      const fields = {
        season: s.season,
        seasonStartYear: s.year,
        type: form.type,
        variant: form.variant.trim() || null,
        name,
        seasonId: form.seasonId || null,
        legacyUniformId: form.uniformId || null,
      }
      const old = form.id ? store.get(form.id) : null
      const r = old
        ? await store.update(old.id, { ...fields, ...(newTexture ? { display: { ...old.display, texture: newTexture } } : {}) })
        : await store.add({
            id: source.newId(),
            ...fields,
            modelUrl: 'models/kit_hanging.glb',
            modelUrlWorn: 'models/kit_base.glb',
            hanger: { visible: true },
            display: { texture: newTexture, collar: null, color: null, scale: 1 },
          })
      if (!r.ok) throw new Error((r.errors ?? []).join(' / '))
      // 画像を差し替えたら、前の画像を消す
      if (old && newTexture && old.display.texture) await source.deleteFile(old.display.texture).catch((err) => console.warn(err))
      setForm(null)
    } catch (err) {
      console.error(err)
      if (newTexture) await source.deleteFile(newTexture).catch(() => {})
      setFormError(t('kits.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(kit: ArchiveKit) {
    const store = storeRef.current, source = sourceRef.current
    if (!store || !source) return
    setConfirmingDeleteId(null)
    const r = await store.remove(kit.id)
    if (!r.ok) return setError(t('kits.deleteError'))
    if (kit.display.texture) await source.deleteFile(kit.display.texture).catch((err) => console.warn(err))
  }

  const input = 'w-full rounded-md border border-club-line bg-white px-3 py-2 text-sm'
  const label = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-club-muted'
  const uniformChoices = uniforms.filter((u) => !form?.seasonId || u.season_id === form.seasonId)

  return (
    <>
      <PageHeading title={t('adminNav.kits')} description={t('kits.adminDesc')} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!form && (
        <button
          type="button"
          onClick={() => openForm()}
          disabled={loading || !!error}
          className="mb-6 rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
        >
          {t('kits.add')}
        </button>
      )}

      {form && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-lg border border-club-line bg-white p-5" noValidate>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            {form.id ? t('kits.editTitle') : t('kits.addTitle')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>{t('kits.form.season')}</span>
              <input
                className={input}
                value={form.season}
                placeholder="2026-27"
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                onBlur={() => setForm(suggestLinks(form))}
              />
            </label>
            <label className="block">
              <span className={label}>{t('kits.form.type')}</span>
              <select className={input} value={form.type} onChange={(e) => setForm(suggestLinks({ ...form, type: e.target.value as KitCategory | '' }))}>
                <option value="">{t('common.selectPlaceholder')}</option>
                {kitCategories.map((c) => (
                  <option key={c} value={c}>
                    {t(kitCategoryKey(c))}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>
                {t('kits.form.variant')}
                {t('common.optional')}
              </span>
              <input className={input} value={form.variant} maxLength={40} onChange={(e) => setForm({ ...form, variant: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>{form.id ? t('kits.form.fileReplace') : t('kits.form.file')}</span>
              <input type="file" accept="image/png" className="text-sm" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} />
            </label>
            <label className="block">
              <span className={label}>
                {t('kits.form.linkSeason')}
                {t('common.optional')}
              </span>
              <select className={input} value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value, uniformId: '' })}>
                <option value="">—</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>
                {t('kits.form.thumbnail')}
                {t('common.optional')}
              </span>
              <select className={input} value={form.uniformId} onChange={(e) => setForm({ ...form, uniformId: e.target.value })}>
                <option value="">—</option>
                {uniformChoices.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(seasonById.get(u.season_id)?.label ?? '') + ' ' + t(`kitType.${u.kit_type}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-club-muted">{t('kits.form.hint')}</p>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50">
              {saving ? t('kits.saving') : t('common.save')}
            </button>
            <button type="button" disabled={saving} onClick={() => setForm(null)} className="rounded-md border border-club-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-club-muted">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : kits.length === 0 ? (
        !error && <p className="text-sm text-club-muted">{t('kits.adminEmpty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-club-line bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-club-line text-left text-xs uppercase tracking-wide text-club-muted">
                <th className="p-3">{t('kits.col.texture')}</th>
                <th className="p-3">{t('kits.col.name')}</th>
                <th className="p-3">{t('kits.col.type')}</th>
                <th className="p-3">{t('kits.col.thumbnail')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {kits.map((k) => {
                const uniform = k.legacyUniformId ? uniformById.get(k.legacyUniformId) : undefined
                const tex = k.display.texture ? textureUrls[k.display.texture] : undefined
                return (
                  <tr key={k.id} className="border-b border-club-line last:border-0">
                    <td className="p-3">
                      {tex ? (
                        <img src={tex} alt="" className="h-12 w-12 rounded border border-club-line object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded border border-dashed border-club-line" style={k.display.color ? { background: k.display.color } : undefined} />
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-club-ink">{k.name}</div>
                      <div className="text-xs text-club-muted">{k.season ?? t('kits.seasonUnset')}</div>
                    </td>
                    <td className="p-3">{typeLabel(k.type)}</td>
                    <td className="p-3">
                      {uniform ? <img src={uniform.image_url} alt="" className="h-12 w-12 rounded border border-club-line object-contain" /> : <span className="text-club-muted">—</span>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => openForm(k)} className="mr-3 text-xs font-medium text-club-navy hover:underline">
                        {t('common.edit')}
                      </button>
                      {confirmingDeleteId === k.id ? (
                        <span className="text-xs">
                          <button type="button" onClick={() => handleDelete(k)} className="mr-2 font-semibold text-red-600 hover:underline">
                            {t('common.yes')}
                          </button>
                          <button type="button" onClick={() => setConfirmingDeleteId(null)} className="text-club-muted hover:underline">
                            {t('common.cancel')}
                          </button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => setConfirmingDeleteId(k.id)} className="text-xs font-medium text-club-muted hover:text-red-600">
                          {t('common.delete')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
