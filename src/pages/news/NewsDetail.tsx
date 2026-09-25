import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { News } from '@/lib/news'

export default function NewsDetail() {
  const { slug } = useParams()
  const { club } = useClub()
  const { t } = useLanguage()
  const [article, setArticle] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club || !slug) return
    setLoading(true)
    supabase
      .from('news')
      .select('*')
      .eq('club_id', club.id)
      .eq('slug', slug)
      .not('published_at', 'is', null)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data)
        setLoading(false)
      })
  }, [club, slug])

  if (loading) return <p className="text-sm text-club-muted">{t('common.loading')}</p>
  if (!article) return <p className="text-sm text-club-muted">{t('common.notFound.article')}</p>

  return (
    <article>
      {article.cover_image_url && (
        <img
          src={article.cover_image_url}
          alt=""
          className="mb-6 h-56 w-full rounded-lg object-cover md:h-80"
        />
      )}
      {article.category && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-club-gold">
          {article.category}
        </div>
      )}
      <h1 className="font-display text-2xl font-semibold text-club-navy md:text-3xl">{article.title}</h1>
      <p className="mt-1 text-sm text-club-muted">{new Date(article.published_at!).toLocaleDateString()}</p>
      {article.body && (
        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-club-ink">{article.body}</div>
      )}
    </article>
  )
}
