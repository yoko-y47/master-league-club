import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { MATCH_POSITIONS, TEAM_STAT_KEYS, type CardType } from '@/lib/matches'
import {
  SCREENSHOT_KINDS,
  buildDraft,
  fileToBase64Jpeg,
  mergeResults,
  readScreenshotKind,
  resolveOwnSide,
  teamNames,
  type ImportDraft,
  type KindResults,
  type RosterEntry,
  type ScreenshotKind,
} from '@/lib/matchImport'

type PlayerOption = { playerId: string; name: string; squadNumber: number | null }

type Props = {
  opponentName: string
  clubName: string
  players: PlayerOption[]
  onApply: (draft: ImportDraft) => Promise<void>
}

type SlotState = { files: File[]; status: 'idle' | 'reading' | 'done' | 'error'; error: string | null }
type Slots = Record<ScreenshotKind, SlotState>

const emptySlot = (): SlotState => ({ files: [], status: 'idle', error: null })
const emptySlots = (): Slots => ({ events: emptySlot(), lineup: emptySlot(), ratings: emptySlot(), teamStats: emptySlot() })

const inputClass =
  'w-full rounded-md border border-club-line px-2 py-1.5 text-sm focus:border-club-navy focus:outline-none'

export default function ScreenshotImport({ opponentName, clubName, players, onApply }: Props) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState<Slots>(emptySlots)
  const [results, setResults] = useState<KindResults>({})
  const [reading, setReading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [needSide, setNeedSide] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<ImportDraft | null>(null)

  const roster: RosterEntry[] = players.map((p) => ({ playerId: p.playerId, name: p.name }))
  const filledCount = SCREENSHOT_KINDS.filter((k) => slots[k].files.length > 0).length

  function reset() {
    setSlots(emptySlots())
    setResults({})
    setReading(false)
    setApplying(false)
    setNeedSide(false)
    setError(null)
    setDraft(null)
  }

  function setSlotFiles(kind: ScreenshotKind, files: File[]) {
    setSlots((prev) => ({ ...prev, [kind]: { files, status: 'idle', error: null } }))
    setResults((prev) => {
      const next = { ...prev }
      delete next[kind]
      return next
    })
  }

  function buildFrom(nextResults: KindResults, ownLeft: boolean | null) {
    const onlyRatings = Object.keys(nextResults).every((k) => k === 'ratings')
    const side = ownLeft === null ? resolveOwnSide(nextResults) ?? (onlyRatings ? 'left' : null) : ownLeft ? 'left' : 'right'
    if (!side) {
      setDraft(null)
      setNeedSide(true)
      return
    }
    setNeedSide(false)
    setDraft(buildDraft(mergeResults(nextResults, side), side === 'left', roster))
  }

  async function handleRead() {
    const targets = SCREENSHOT_KINDS.filter((k) => slots[k].files.length > 0 && slots[k].status !== 'done')
    if (targets.length === 0) return
    setReading(true)
    setError(null)
    setSlots((prev) => {
      const next = { ...prev }
      for (const k of targets) next[k] = { ...next[k], status: 'reading', error: null }
      return next
    })

    const nextResults: KindResults = { ...results }
    await Promise.all(
      targets.map(async (kind) => {
        try {
          const images = await Promise.all(slots[kind].files.map(fileToBase64Jpeg))
          const result = await readScreenshotKind({
            kind,
            images,
            opponentName,
            clubName,
            roster: roster.map((r) => r.name),
          })
          nextResults[kind] = result
          setSlots((prev) => ({ ...prev, [kind]: { ...prev[kind], status: 'done', error: null } }))
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          setSlots((prev) => ({ ...prev, [kind]: { ...prev[kind], status: 'error', error: message } }))
        }
      }),
    )

    setResults(nextResults)
    setReading(false)
    if (Object.keys(nextResults).length > 0) buildFrom(nextResults, null)
  }

  async function handleApply() {
    if (!draft) return
    setApplying(true)
    setError(null)
    try {
      await onApply(draft)
      reset()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setApplying(false)
    }
  }

  function update(patch: Partial<ImportDraft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d))
  }

  function playerSelect(value: string, onChange: (v: string) => void, optional = false) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} ${!optional && !value ? 'border-red-400' : ''}`}
      >
        <option value="">{optional ? t('matches.form.noAssist') : t('matches.import.unselected')}</option>
        {players.map((p) => (
          <option key={p.playerId} value={p.playerId}>
            {p.name}
            {p.squadNumber !== null ? ` #${p.squadNumber}` : ''}
          </option>
        ))}
      </select>
    )
  }

  const sectionTitle = 'mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-club-navy'
  const rowClass = 'mb-2 grid items-center gap-2'

  return (
    <section className="mb-6 rounded-lg border border-club-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-club-navy"
      >
        <span>📷 {t('matches.import.title')}</span>
        <span className="text-xs text-club-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-club-line px-4 pb-4 pt-3">
          <p className="mb-3 text-xs text-club-muted">{t('matches.import.hint')}</p>
          <div className="space-y-3">
            {SCREENSHOT_KINDS.map((kind) => {
              const slot = slots[kind]
              return (
                <div key={kind} className="rounded-md border border-club-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-club-navy">{t(`matches.import.slot.${kind}`)}</span>
                    <span
                      className={`text-xs ${
                        slot.status === 'done'
                          ? 'text-green-600'
                          : slot.status === 'error'
                            ? 'text-red-600'
                            : 'text-club-muted'
                      }`}
                    >
                      {slot.status === 'reading'
                        ? t('matches.import.reading')
                        : slot.status === 'done'
                          ? t('matches.import.done')
                          : slot.status === 'error'
                            ? t('matches.import.failed')
                            : slot.files.length > 0
                              ? t('matches.import.selected', { n: slot.files.length })
                              : ''}
                    </span>
                  </div>
                  <p className="mb-2 mt-0.5 text-[11px] text-club-muted">{t(`matches.import.slotHint.${kind}`)}</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={reading}
                    onChange={(e) => setSlotFiles(kind, Array.from(e.target.files ?? []))}
                    className="block w-full text-xs"
                  />
                  {slot.error && <p className="mt-2 break-words text-xs text-red-600">{slot.error}</p>}
                </div>
              )
            })}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex items-center justify-end gap-3">
            {(draft || Object.keys(results).length > 0) && (
              <button type="button" onClick={reset} disabled={reading || applying} className="text-sm text-club-muted hover:underline">
                {t('matches.import.redo')}
              </button>
            )}
            <button
              type="button"
              onClick={handleRead}
              disabled={reading || applying || filledCount === 0}
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {reading ? t('matches.import.reading') : t('matches.import.read')}
            </button>
          </div>

          {needSide && (
            <div className="mt-5 border-t border-club-line pt-4">
              <p className="mb-3 text-sm text-club-navy">{t('matches.import.ownSideQuestion')}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => buildFrom(results, true)}
                  className="rounded-md border border-club-navy px-3 py-1.5 text-sm font-semibold text-club-navy hover:bg-club-navy/5"
                >
                  {t('matches.import.left')}（{teamNames(results).left ?? '?'}）
                </button>
                <button
                  type="button"
                  onClick={() => buildFrom(results, false)}
                  className="rounded-md border border-club-navy px-3 py-1.5 text-sm font-semibold text-club-navy hover:bg-club-navy/5"
                >
                  {t('matches.import.right')}（{teamNames(results).right ?? '?'}）
                </button>
              </div>
            </div>
          )}

          {draft && (
            <div className="mt-5 border-t border-club-line pt-4">
              <p className="text-xs text-club-muted">{t('matches.import.reviewHint')}</p>
              {draft.notes.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-700">
                  {draft.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              )}

              <h3 className={sectionTitle}>{t('matches.import.score')}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-club-muted">{clubName}</span>
                <input
                  type="number"
                  min={0}
                  value={draft.ownScore}
                  onChange={(e) => update({ ownScore: e.target.value })}
                  className={`${inputClass} w-16 text-center`}
                />
                <span>-</span>
                <input
                  type="number"
                  min={0}
                  value={draft.opponentScore}
                  onChange={(e) => update({ opponentScore: e.target.value })}
                  className={`${inputClass} w-16 text-center`}
                />
                <span className="text-xs text-club-muted">{opponentName}</span>
              </div>

              <h3 className={sectionTitle}>
                {t('matches.import.lineup')}（{draft.lineup.length}）
              </h3>
              {draft.lineup.length === 0 && <p className="text-xs text-club-muted">{t('matches.import.none')}</p>}
              {draft.lineup.map((row, i) => (
                <div key={i} className={`${rowClass} grid-cols-[1fr_4.5rem_4.5rem_3.5rem] md:grid-cols-[1fr_6rem_6rem_5rem]`}>
                  <div>
                    {playerSelect(row.playerId, (v) =>
                      update({ lineup: draft.lineup.map((r, j) => (j === i ? { ...r, playerId: v } : r)) }),
                    )}
                    {!row.playerId && <div className="mt-0.5 text-[10px] text-red-600">{row.rawName}</div>}
                  </div>
                  <select
                    value={row.position}
                    onChange={(e) =>
                      update({ lineup: draft.lineup.map((r, j) => (j === i ? { ...r, position: e.target.value } : r)) })
                    }
                    className={inputClass}
                  >
                    <option value="">-</option>
                    {MATCH_POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.isStarting ? 'starting' : 'bench'}
                    onChange={(e) =>
                      update({
                        lineup: draft.lineup.map((r, j) => (j === i ? { ...r, isStarting: e.target.value === 'starting' } : r)),
                      })
                    }
                    className={inputClass}
                  >
                    <option value="starting">{t('matches.form.starting')}</option>
                    <option value="bench">{t('matches.form.bench')}</option>
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={10}
                    value={row.rating}
                    placeholder={t('matches.import.rating')}
                    onChange={(e) =>
                      update({ lineup: draft.lineup.map((r, j) => (j === i ? { ...r, rating: e.target.value } : r)) })
                    }
                    className={inputClass}
                  />
                </div>
              ))}

              <h3 className={sectionTitle}>
                {t('matches.import.goals')}（{draft.goals.length}）
              </h3>
              {draft.goals.length === 0 && <p className="text-xs text-club-muted">{t('matches.import.none')}</p>}
              {draft.goals.map((g, i) => (
                <div key={i} className={`${rowClass} grid-cols-[3.5rem_1fr] md:grid-cols-[4rem_1fr_1fr]`}>
                  <input
                    type="number"
                    min={0}
                    value={g.minute}
                    placeholder="分"
                    onChange={(e) =>
                      update({ goals: draft.goals.map((r, j) => (j === i ? { ...r, minute: e.target.value } : r)) })
                    }
                    className={inputClass}
                  />
                  {g.own ? (
                    <>
                      {playerSelect(g.scorerId, (v) =>
                        update({ goals: draft.goals.map((r, j) => (j === i ? { ...r, scorerId: v } : r)) }),
                      )}
                      {playerSelect(
                        g.assistId,
                        (v) => update({ goals: draft.goals.map((r, j) => (j === i ? { ...r, assistId: v } : r)) }),
                        true,
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <span className="shrink-0 rounded-full bg-club-bg px-1.5 py-0.5 text-[9px] font-semibold text-club-muted">
                        {t('matches.goal.opponentBadge')}
                      </span>
                      <input
                        type="text"
                        value={g.opponentName}
                        onChange={(e) =>
                          update({
                            goals: draft.goals.map((r, j) => (j === i ? { ...r, opponentName: e.target.value } : r)),
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              ))}

              <h3 className={sectionTitle}>
                {t('matches.import.subs')}（{draft.subs.length}）
              </h3>
              {draft.subs.length === 0 && <p className="text-xs text-club-muted">{t('matches.import.none')}</p>}
              {draft.subs.map((s, i) => (
                <div key={i} className={`${rowClass} grid-cols-[3.5rem_1fr] md:grid-cols-[4rem_1fr_1fr]`}>
                  <input
                    type="number"
                    min={0}
                    value={s.minute}
                    placeholder="分"
                    onChange={(e) =>
                      update({ subs: draft.subs.map((r, j) => (j === i ? { ...r, minute: e.target.value } : r)) })
                    }
                    className={inputClass}
                  />
                  {playerSelect(s.offId, (v) =>
                    update({ subs: draft.subs.map((r, j) => (j === i ? { ...r, offId: v } : r)) }),
                  )}
                  {playerSelect(s.onId, (v) =>
                    update({ subs: draft.subs.map((r, j) => (j === i ? { ...r, onId: v } : r)) }),
                  )}
                </div>
              ))}
              {draft.subs.length > 0 && <p className="text-[10px] text-club-muted">{t('matches.import.subsHint')}</p>}

              {draft.cards.length > 0 && (
                <>
                  <h3 className={sectionTitle}>
                    {t('matches.import.cards')}（{draft.cards.length}）
                  </h3>
                  {draft.cards.map((c, i) => (
                    <div key={i} className={`${rowClass} grid-cols-[3.5rem_5rem_1fr]`}>
                      <input
                        type="number"
                        min={0}
                        value={c.minute}
                        placeholder="分"
                        onChange={(e) =>
                          update({ cards: draft.cards.map((r, j) => (j === i ? { ...r, minute: e.target.value } : r)) })
                        }
                        className={inputClass}
                      />
                      <select
                        value={c.card}
                        onChange={(e) =>
                          update({
                            cards: draft.cards.map((r, j) => (j === i ? { ...r, card: e.target.value as CardType } : r)),
                          })
                        }
                        className={inputClass}
                      >
                        <option value="yellow">🟨</option>
                        <option value="red">🟥</option>
                      </select>
                      {c.own ? (
                        playerSelect(c.playerId, (v) =>
                          update({ cards: draft.cards.map((r, j) => (j === i ? { ...r, playerId: v } : r)) }),
                        )
                      ) : (
                        <input
                          type="text"
                          value={c.opponentName}
                          onChange={(e) =>
                            update({
                              cards: draft.cards.map((r, j) => (j === i ? { ...r, opponentName: e.target.value } : r)),
                            })
                          }
                          className={inputClass}
                        />
                      )}
                    </div>
                  ))}
                </>
              )}

              <h3 className={sectionTitle}>{t('matches.teamStats.heading')}</h3>
              {TEAM_STAT_KEYS.every((k) => draft.teamStats.own[k] === undefined && draft.teamStats.opponent[k] === undefined) ? (
                <p className="text-xs text-club-muted">{t('matches.import.none')}</p>
              ) : (
                <div className="grid grid-cols-[1fr_4rem_4rem] gap-x-3 gap-y-1 text-sm">
                  {TEAM_STAT_KEYS.filter(
                    (k) => draft.teamStats.own[k] !== undefined || draft.teamStats.opponent[k] !== undefined,
                  ).map((k) => (
                    <div key={k} className="contents">
                      <span className="text-club-muted">{t(`matches.teamStat.${k}`)}</span>
                      <span className="text-center font-medium text-club-navy">{draft.teamStats.own[k] ?? '-'}</span>
                      <span className="text-center font-medium text-club-navy">{draft.teamStats.opponent[k] ?? '-'}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-5 text-xs text-club-muted">{t('matches.import.replaceNote')}</p>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying || reading}
                  className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {applying ? t('matches.import.applying') : t('matches.import.apply')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
