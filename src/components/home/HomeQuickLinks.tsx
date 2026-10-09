import { Link } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function HomeQuickLinks() {
  const { t } = useLanguage()
  const items = [
    { to: '/matches', label: t('home.quick.matches') },
    { to: '/players', label: t('home.quick.squad') },
    { to: '/schedule', label: t('home.quick.schedule') },
  ]

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-3 gap-3 px-4 py-8 md:px-8">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex h-24 items-end rounded-md bg-gradient-to-br from-club-navy to-club-navy-2 p-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90 md:h-32 md:p-4 md:text-xl"
        >
          {item.label}
        </Link>
      ))}
    </section>
  )
}
