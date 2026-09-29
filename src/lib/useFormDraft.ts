import { useEffect, useRef } from 'react'

type FieldEntry = [value: string | boolean, setValue: (value: never) => void]

/**
 * Persists a form's field values to localStorage as the user types, and restores them on mount.
 * Protects against mobile browsers/PWAs discarding the page (and its in-memory state) when
 * backgrounded mid-input. Call `clearFormDraft(key)` after a successful submit.
 */
export function useFormDraft(key: string, fields: Record<string, FieldEntry>) {
  const restored = useRef(false)

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const raw = localStorage.getItem(key)
    if (!raw) return
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
}

export function clearFormDraft(key: string) {
  localStorage.removeItem(key)
}
