import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, type Lang } from './translations'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'mlc-language'

function detectInitialLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'ja' || stored === 'en') return stored
  } catch {
    // localStorage unavailable; fall through to default
  }
  return 'ja'
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang)

  function setLang(next: Lang) {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable; language choice just won't persist
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function t(key: string, vars?: Record<string, string | number>): string {
    const template = translations[lang][key] ?? translations.ja[key] ?? key
    return interpolate(template, vars)
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
