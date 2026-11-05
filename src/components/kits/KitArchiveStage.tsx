import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { COLLAR_COUNT, COLLAR_STYLES, DEFAULT_COLLAR, createKitArchive, type ArchiveKit, type KitArchive, type KitStore } from 'kit-archive-core'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { createKitStore, kitCategoryKey, openKitSource, resolveModelUrls } from '@/lib/kits'

type Status = 'loading' | 'ready' | 'empty' | 'noClub' | 'error'
type View = 'front' | 'angle' | 'side' | 'back'
type Shape = 'hanging' | 'worn'

const views: View[] = ['front', 'angle', 'side', 'back']
const collarNumbers = Array.from({ length: COLLAR_COUNT }, (_, i) => i + 1)
const stageColor = () => getComputedStyle(document.documentElement).getPropertyValue('--kit-stage').trim()

// Kit Archive の 3D 展示（1本のハンガーバーに、奥が古いシーズン・手前が新しいシーズン）
// three.js を含むので、このコンポーネントはページを開いたときだけ読み込む（React.lazy）
export default function KitArchiveStage() {
  const { t } = useLanguage()
  const stageRef = useRef<HTMLDivElement>(null)
  const archiveRef = useRef<KitArchive | null>(null)
  const storeRef = useRef<KitStore | null>(null)
  const collarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [collarError, setCollarError] = useState(false)
  const [kits, setKits] = useState<ArchiveKit[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shape, setShape] = useState<Shape>('hanging')
  const [status, setStatus] = useState<Status>('loading')

  // 選ぶユニフォームが変わったら、保存前の表示を消す
  useEffect(() => setShownCollar(null), [selectedId])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    let cancelled = false
    const store = createKitStore()
    storeRef.current = store
    const archive = createKitArchive(el, { store, resolveModelUrls, background: stageColor })
    archiveRef.current = archive
    const unsubscribe = store.subscribe(({ kits }) => setKits(kits))
    archive.on('panel', () => setSelectedId(archive.selectedId))
    archive.on('shape', (s) => setShape(s as Shape))

    ;(async () => {
      try {
        const source = await openKitSource()
        if (cancelled) return
        archive.setUserSource(source)
        await store.load()
        await store.attachUserSource(source)
        if (cancelled) return
        archive.setView('angle')
        setStatus(store.size ? 'ready' : 'empty')
      } catch (err) {
        if (cancelled) return
        console.error(err)
        setStatus((err as { code?: string }).code === 'no_club' ? 'noClub' : 'error')
      }
    })()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') archive.deselect()
    }
    addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      removeEventListener('keydown', onKey)
      unsubscribe()
      if (collarTimer.current) clearTimeout(collarTimer.current)
      archive.destroy()
      archiveRef.current = null
      storeRef.current = null
    }
  }, [])

  const selected = kits.find((k) => k.id === selectedId) ?? null
  // 表示中の襟（保存前でも、押したものをすぐ反映する）
  const [shownCollar, setShownCollar] = useState<number | null>(null)
  const currentCollar = shownCollar ?? selected?.display.collar ?? DEFAULT_COLLAR

  // 襟を選ぶ：3D の表示をすぐ変え、選んでいるユニフォームの襟として保存する（続けて押したときは最後の1回だけ）
  function chooseCollar(n: number) {
    const id = selectedId
    if (!id) return
    archiveRef.current?.setCollar(n)
    setShownCollar(n)
    setCollarError(false)
    if (collarTimer.current) clearTimeout(collarTimer.current)
    collarTimer.current = setTimeout(async () => {
      const store = storeRef.current
      if (!store || store.get(id)?.display.collar === n) return
      const r = await store.update(id, { display: { ...store.get(id)!.display, collar: n } })
      if (!r.ok) setCollarError(true)
    }, 500)
  }
  const typeLabel = (k: ArchiveKit) => (k.type ? t(kitCategoryKey(k.type)) : t('kits.typeUnset'))

  // シーズンごとにまとめた一覧（手前＝新しいシーズンから。並びは 3D 展示と同じ）
  const groups: { season: string; kits: ArchiveKit[] }[] = []
  for (const k of kits) {
    const season = k.season ?? t('kits.seasonUnset')
    const last = groups[groups.length - 1]
    if (last && last.season === season) last.kits.push(k)
    else groups.push({ season, kits: [k] })
  }

  const btn = 'rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-ink hover:border-club-gold'
  const btnOn = 'rounded-md border border-club-gold bg-club-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-navy'

  return (
    <div className="space-y-4">
      <div className="relative h-[58vh] min-h-[340px] overflow-hidden rounded-lg border border-club-line bg-[var(--kit-stage)]">
        <div ref={stageRef} className="absolute inset-0" />
        {status !== 'ready' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-club-muted">
            {status === 'loading' && t('common.loading')}
            {status === 'empty' && (
              <p className="pointer-events-auto">
                {t('kits.empty')}{' '}
                <Link to="/admin/kits" className="font-semibold text-club-navy underline">
                  {t('kits.goAdmin')}
                </Link>
              </p>
            )}
            {status === 'noClub' && t('kits.noClub')}
            {status === 'error' && t('kits.loadError')}
          </div>
        )}
        <p className="pointer-events-none absolute bottom-2 left-3 right-3 text-[11px] text-club-muted">
          {selected ? t('kits.hintSelected') : t('kits.hint')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {views.map((v) => (
          <button
            key={v}
            type="button"
            className={btn}
            onClick={() => {
              archiveRef.current?.deselect()
              archiveRef.current?.setView(v)
            }}
          >
            {t(`kits.view.${v}`)}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-club-line" aria-hidden />
        {(['hanging', 'worn'] as Shape[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={shape === s}
            className={shape === s ? btnOn : btn}
            onClick={() => archiveRef.current?.setShape(s)}
          >
            {t(`kits.shape.${s}`)}
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-club-line bg-white p-4">
          {selected.thumbnailUrl && (
            <img src={selected.thumbnailUrl} alt="" className="h-16 w-16 rounded-md border border-club-line object-contain" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold uppercase tracking-wide text-club-navy">{selected.name}</div>
            <div className="text-xs text-club-muted">
              {selected.season ?? t('kits.seasonUnset')} ・ {typeLabel(selected)}
              {selected.variant ? ` ・ ${selected.variant}` : ''} ・ {t('kits.collar')} {currentCollar} {COLLAR_STYLES[currentCollar]}
            </div>
          </div>
          <button type="button" className={btn} onClick={() => archiveRef.current?.flip()}>
            {t('kits.flip')}
          </button>
          <button type="button" className={btn} onClick={() => archiveRef.current?.deselect()}>
            {t('kits.backToRack')}
          </button>
          <div className="w-full border-t border-club-line pt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-club-muted">{t('kits.form.collar')}</div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('kits.form.collar')}>
              {collarNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  title={COLLAR_STYLES[n]}
                  aria-label={`${n} ${COLLAR_STYLES[n]}`}
                  aria-pressed={currentCollar === n}
                  className={`${currentCollar === n ? btnOn : btn} min-w-9 px-2`}
                  onClick={() => chooseCollar(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-club-muted">{collarError ? t('kits.collarSaveError') : t('kits.collarHint')}</p>
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.season}>
              <h2 className="mb-2 border-l-4 border-club-gold pl-2 font-display text-sm font-bold uppercase tracking-wider text-club-navy">
                {g.season}
              </h2>
              <div className="flex flex-wrap gap-2">
                {g.kits.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    aria-pressed={k.id === selectedId}
                    className={k.id === selectedId ? btnOn : btn}
                    onClick={() => (k.id === selectedId ? archiveRef.current?.flip() : archiveRef.current?.select(k.id))}
                  >
                    {typeLabel(k)}
                    {k.variant ? ` ・ ${k.variant}` : ''}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
