import { useEffect, useRef, type MutableRefObject } from 'react'

type FieldEntry = [value: string | boolean, setValue: (value: never) => void]

/**
 * Persists a form's field values to localStorage as the user types, and restores them on mount.
 * Protects against mobile browsers/PWAs discarding the page (and its in-memory state) when
 * backgrounded mid-input. Call `clearFormDraft(key)` after a successful submit.
 *
 * Returns a ref that is true once a real pre-existing draft was found on mount. Pages that also
 * hydrate these same fields from an async server fetch should skip that hydration when this ref
 * is true (read `.current` inside the async callback, not destructured early) — otherwise, since
 * the autosave effect below can write a snapshot of the still-empty initial state before the
 * fetch resolves, a plain `localStorage.getItem(key)` re-check from the caller would wrongly see
 * a "draft" and skip loading the real server data.
 */
export function useFormDraft(key: string, fields: Record<string, FieldEntry>): MutableRefObject<boolean> {
  const restored = useRef(false)
  const hadDraft = useRef(false)

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const raw = localStorage.getItem(key)
    if (!raw) return
    hadDraft.current = true
    try {
      const saved = JSON.parse(raw) as Record<string, string | boolean>
      for (const [name, [, setValue]] of Object.entries(fields)) {
        if (name in saved) setValue(saved[name] as never)
      }
    } catch {
      // ignore malformed drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    const snapshot: Record<string, string | boolean> = {}
    for (const [name, [value]] of Object.entries(fields)) snapshot[name] = value
    const hasContent = Object.values(snapshot).some((v) => (typeof v === 'string' ? v.trim() !== '' : false))
    if (hasContent) {
      localStorage.setItem(key, JSON.stringify(snapshot))
    } else {
      localStorage.removeItem(key)
    }
  })

  return hadDraft
}

export function clearFormDraft(key: string) {
  localStorage.removeItem(key)
}
