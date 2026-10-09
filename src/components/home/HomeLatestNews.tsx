import { Link } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { News } from '@/lib/news'

export default function HomeLatestNews({ articles }: { articles: News[] }) {
  const { t } = useLanguage()
  if (articles.length === 0) return null

  return (
    <section className="bg-club-navy py-10 text-white md:py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-3xl font-bold md:text-4xl">{t('home.latestNews')}</h2>
          <Link
            to="/news"
            className="shrink-0 rounded-md bg-club-gold px-5 py-2.5 font-display text-sm font-bold text-club-navy hover:opacity-90"
          >
            {t('home.viewAll')}
          </Link>
        </div>

        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-5">
          {articles.slice(0, 5).map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.slug}`}
              className="flex w-60 shrink-0 snap-start flex-col overflow-hidden rounded-lg bg-white text-club-navy transition-transform hover:-translate-y-0.5 md:w-auto"
            >
              {article.cover_image_url ? (
                <img src={article.cover_image_url} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 w-full bg-club-navy-2" />
              )}
              <div className="flex flex-1 flex-col justify-between gap-4 p-4">
                <div className="font-display text-base font-bold leading-snug">{article.title}</div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em]">
                  {article.category && (
                    <>
                      <span className="text-club-gold">{article.category}</span>
                      <span className="h-3 w-px bg-club-line" />
                    </>
                  )}
                  <span className="text-club-muted">{new Date(article.published_at!).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
