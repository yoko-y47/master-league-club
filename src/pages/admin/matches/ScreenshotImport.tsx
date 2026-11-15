import { useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { MATCH_POSITIONS, TEAM_STAT_KEYS, type CardType } from '@/lib/matches'
import {
  buildDraft,
  fileToBase64Jpeg,
  requestScreenshotReading,
  type ImportDraft,
  type RawImportResult,
  type RosterEntry,
} from '@/lib/matchImport'

type PlayerOption = { playerId: string; name: string; squadNumber: number | null }

type Props = {
  opponentName: string
  clubName: string
  players: PlayerOption[]
  onApply: (draft: ImportDraft) => Promise<void>
}

type Phase = 'idle' | 'reading' | 'chooseSide' | 'review' | 'applying'

const inputClass =
  'w-full rounded-md border border-club-line px-2 py-1.5 text-sm focus:border-club-navy focus:outline-none'

export default function ScreenshotImport({ opponentName, clubName, players, onApply }: Props) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [raw, setRaw] = useState<RawImportResult | null>(null)
  const [draft, setDraft] = useState<ImportDraft | null>(null)

  const roster: RosterEntry[] = players.map((p) => ({ playerId: p.playerId, name: p.name }))

  function reset() {
    setFiles([])
    setPhase('idle')
    setError(null)
    setRaw(null)
    setDraft(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRead() {
    if (files.length === 0) return
    setPhase('reading')
    setError(null)
    try {
      const images = await Promise.all(files.map(fileToBase64Jpeg))
      const result = await requestScreenshotReading({
        images,
        opponentName,
        clubName,
        roster: roster.map((r) => r.name),
      })
      setRaw(result)
      if (result.own_side === 'left' || result.own_side === 'right') {
        setDraft(buildDraft(result, result.own_side === 'left', roster))
        setPhase('review')
      } else {
        setPhase('chooseSide')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('idle')
    }
  }

  function chooseSide(ownLeft: boolean) {
    if (!raw) return
    setDraft(buildDraft(raw, ownLeft, roster))
    setPhase('review')
  }

  async function handleApply() {
    if (!draft) return
    setPhase('applying')
    setError(null)
    try {
      await onApply(draft)
      reset()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('review')
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
          {(phase === 'idle' || phase === 'reading') && (
            <>
              <p className="mb-3 text-xs text-club-muted">{t('matches.import.hint')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={phase === 'reading'}
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm"
              />
              {files.length > 0 && (
                <p className="mt-2 text-xs text-club-muted">{t('matches.import.selected', { n: files.length })}</p>
              )}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleRead}
                  disabled={files.length === 0 || phase === 'reading'}
                  className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {phase === 'reading' ? t('matches.import.reading') : t('matches.import.read')}
                </button>
              </div>
            </>
          )}

          {phase === 'chooseSide' && (
            <div>
              <p className="mb-3 text-sm text-club-navy">{t('matches.import.ownSideQuestion')}</p>
              <p className="mb-3 text-xs text-club-muted">
                {raw?.left_team ?? '?'} ／ {raw?.right_team ?? '?'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => chooseSide(true)}
                  className="rounded-md border border-club-navy px-3 py-1.5 text-sm font-semibold text-club-navy hover:bg-club-navy/5"
                >
                  {t('matches.import.left')}（{raw?.left_team ?? '?'}）
                </button>
                <button
                  type="button"
                  onClick={() => chooseSide(false)}
                  className="rounded-md border border-club-navy px-3 py-1.5 text-sm font-semibold text-club-navy hover:bg-club-navy/5"
                >
                  {t('matches.import.right')}（{raw?.right_team ?? '?'}）
                </button>
              </div>
            </div>
          )}

          {(phase === 'review' || phase === 'applying') && draft && (
            <div>
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
                  onClick={reset}
                  disabled={phase === 'applying'}
                  className="text-sm text-club-muted hover:underline"
                >
                  {t('matches.import.redo')}
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={phase === 'applying'}
                  className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {phase === 'applying' ? t('matches.import.applying') : t('matches.import.apply')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
