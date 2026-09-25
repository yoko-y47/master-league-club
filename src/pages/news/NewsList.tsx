import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { News } from '@/lib/news'

export default function NewsList() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [articles, setArticles] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club) return
    setLoading(true)
    supabase
      .from('news')
      .select('*')
      .eq('club_id', club.id)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setArticles(data ?? [])
        setLoading(false)
      })
  }, [club])

  return (
    <>
      <PageHeading title={t('news.pageTitle')} description={t('news.pageDesc.public')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-club-muted">{t('news.empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.slug}`}
              className="overflow-hidden rounded-lg border border-club-line bg-white hover:shadow-md"
            >
              {article.cover_image_url ? (
                <img src={article.cover_image_url} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-club-navy" />
              )}
              <div className="p-4">
                {article.category && (
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-club-gold">
                    {article.category}
                  </div>
                )}
                <div className="font-display text-sm font-semibold text-club-navy">{article.title}</div>
                <div className="mt-1 text-xs text-club-muted">
                  {new Date(article.published_at!).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
