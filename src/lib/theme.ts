import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

function currentIsDark() {
  return document.documentElement.classList.contains('dark')
}

export function useTheme() {
  const [isDark, setIsDark] = useState(currentIsDark)

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(currentIsDark()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const toggle = useCallback(() => {
    const next = !currentIsDark()
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // storage unavailable (private mode); the choice just won't persist
    }
  }, [])

  return { isDark, toggle }
}
