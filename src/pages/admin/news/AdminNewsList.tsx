import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import { slugify, type News } from '@/lib/news'

export default function AdminNewsList() {
  const { club } = useClub()
  const [articles, setArticles] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [body, setBody] = useState('')
  const [publishNow, setPublishNow] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  async function loadArticles() {
    if (!club) return
    setLoading(true)
    const { data } = await supabase
      .from('news')
      .select('*')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false })
    setArticles(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!club) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('news').insert({
      club_id: club.id,
      title,
      slug: slugify(title),
      category: category || null,
      cover_image_url: coverImageUrl || null,
      body: body || null,
      published_at: publishNow ? new Date().toISOString() : null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setTitle('')
    setCategory('')
    setCoverImageUrl('')
    setBody('')
    setPublishNow(true)
    setShowForm(false)
    setSubmitting(false)
    await loadArticles()
  }

  async function handleDelete(id: string) {
    await supabase.from('news').delete().eq('id', id)
    setConfirmingDeleteId(null)
    await loadArticles()
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-club-line pb-4">
        <PageHeading title="News" description="記事の作成・公開管理" />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-fit rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
        >
          {showForm ? 'キャンセル' : '+ New Article'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-lg border border-club-line bg-white p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              タイトル
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              カテゴリ（任意）
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: Match Report, Interview, Club News"
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              カバー画像URL（任意）
            </label>
            <input
              type="text"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              本文（任意）
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-club-ink md:col-span-2">
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} className="h-4 w-4" />
            すぐに公開する（オフの場合は下書きとして保存）
          </label>

          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-2"
          >
            作成する
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-club-muted">読み込み中...</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-club-muted">記事がまだありません。「+ New Article」から作成してください。</p>
      ) : (
        <div className="divide-y divide-club-line rounded-lg border border-club-line bg-white">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link to={`/admin/news/${article.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-club-navy">{article.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      article.published_at ? 'bg-green-100 text-green-700' : 'bg-club-bg text-club-muted'
                    }`}
                  >
                    {article.published_at ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="text-xs text-club-muted">
                  {article.category ? `${article.category} ・ ` : ''}
                  {article.published_at ? new Date(article.published_at).toLocaleDateString() : '未公開'}
                </div>
              </Link>
              {confirmingDeleteId === article.id ? (
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-club-muted">削除しますか？</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(article.id)}
                    className="font-semibold text-red-600 hover:underline"
                  >
                    はい
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-club-muted hover:underline"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteId(article.id)}
                  className="shrink-0 text-xs font-medium text-club-muted hover:text-red-600"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
