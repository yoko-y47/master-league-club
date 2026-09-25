import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage()

  return (
    <div className={`flex items-center rounded-full border border-white/20 p-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}>
      <button
        type="button"
        onClick={() => setLang('ja')}
        aria-pressed={lang === 'ja'}
        className={`rounded-full px-2 py-0.5 transition-colors ${lang === 'ja' ? 'bg-white text-club-navy' : 'text-white/60 hover:text-white'}`}
      >
        JA
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`rounded-full px-2 py-0.5 transition-colors ${lang === 'en' ? 'bg-white text-club-navy' : 'text-white/60 hover:text-white'}`}
      >
        EN
      </button>
    </div>
  )
}
