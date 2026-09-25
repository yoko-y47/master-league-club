import { Link } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { News } from '@/lib/news'

export default function HomeLatestNews({ articles }: { articles: News[] }) {
  const { t } = useLanguage()
  if (articles.length === 0) return null
  const [main, ...rest] = articles

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy md:text-xl">
          {t('home.latestNews')}
        </h2>
        <Link
          to="/news"
          className="text-xs font-semibold uppercase tracking-wider text-club-muted hover:text-club-navy"
        >
          {t('home.viewAll')}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to={`/news/${main.slug}`}
          className="overflow-hidden rounded-lg border border-club-line bg-white hover:shadow-md"
        >
          {main.cover_image_url ? (
            <img src={main.cover_image_url} alt="" className="h-52 w-full object-cover md:h-64" />
          ) : (
            <div className="h-52 w-full bg-club-navy md:h-64" />
          )}
          <div className="p-4">
            {main.category && (
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-club-gold">
                {main.category}
              </div>
            )}
            <div className="font-display text-base font-semibold text-club-navy">{main.title}</div>
            <div className="mt-1 text-xs text-club-muted">
              {new Date(main.published_at!).toLocaleDateString()}
            </div>
          </div>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2">
          {rest.slice(0, 4).map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.slug}`}
              className="overflow-hidden rounded-lg border border-club-line bg-white hover:shadow-md"
            >
              {article.cover_image_url ? (
                <img src={article.cover_image_url} alt="" className="h-24 w-full object-cover" />
              ) : (
                <div className="h-24 w-full bg-club-navy" />
              )}
              <div className="p-3">
                {article.category && (
                  <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-club-gold">
                    {article.category}
                  </div>
                )}
                <div className="line-clamp-2 text-xs font-semibold text-club-navy">{article.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
