import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { News } from '@/lib/news'

export default function HomeHero({ clubName, featured }: { clubName: string; featured: News | null }) {
  const { t } = useLanguage()
  if (!featured) {
    return (
      <section className="relative mb-10 flex min-h-[320px] flex-col items-center justify-center gap-4 overflow-hidden rounded-lg bg-club-navy px-6 py-16 text-center text-white md:min-h-[420px]">
        <ClubCrest size="lg" alt={`${clubName} crest`} />
        <h1 className="font-display text-3xl font-semibold tracking-wide md:text-5xl">{clubName}</h1>
      </section>
    )
  }

  return (
    <Link
      to={`/news/${featured.slug}`}
      className="relative mb-10 flex min-h-[360px] flex-col justify-end overflow-hidden rounded-lg text-white md:min-h-[480px]"
    >
      {featured.cover_image_url ? (
        <img
          src={featured.cover_image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-club-navy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative p-6 md:p-10">
        <div className="mb-3 inline-block rounded-full bg-club-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-club-navy">
          {t('home.featured')}
        </div>
        <h1 className="max-w-2xl font-display text-2xl font-semibold leading-tight tracking-wide md:text-4xl">
          {featured.title}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-white/70">
          <span>{new Date(featured.published_at!).toLocaleDateString()}</span>
          <span className="font-semibold uppercase tracking-wider text-white">{t('home.readMore')}</span>
        </div>
      </div>
    </Link>
  )
}
