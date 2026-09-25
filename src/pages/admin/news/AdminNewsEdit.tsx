import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeading from '@/components/PageHeading'
import { supabase } from '@/lib/supabaseClient'
import { slugify, type News } from '@/lib/news'

export default function AdminNewsEdit() {
  const { newsId } = useParams()
  const navigate = useNavigate()

  const [article, setArticle] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [body, setBody] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadArticle() {
    if (!newsId) return
    setLoading(true)
    const { data } = await supabase.from('news').select('*').eq('id', newsId).maybeSingle()
    setArticle(data)
    if (data) {
      setTitle(data.title)
      setCategory(data.category ?? '')
      setCoverImageUrl(data.cover_image_url ?? '')
      setBody(data.body ?? '')
      setPublished(!!data.published_at)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadArticle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsId])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!article) return
    setSaving(true)
    setError(null)

    const titleChanged = title !== article.title
    const { error } = await supabase
      .from('news')
      .update({
        title,
        slug: titleChanged ? slugify(title) : article.slug,
        category: category || null,
        cover_image_url: coverImageUrl || null,
        body: body || null,
        published_at: published ? (article.published_at ?? new Date().toISOString()) : null,
      })
      .eq('id', article.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    await loadArticle()
  }

  async function handleDelete() {
    if (!article) return
    await supabase.from('news').delete().eq('id', article.id)
    navigate('/admin/news')
  }

  if (loading) return <p className="text-sm text-club-muted">読み込み中...</p>
  if (!article) return <p className="text-sm text-club-muted">記事が見つかりませんでした。</p>

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-club-line pb-4">
        <PageHeading title={article.title} description={`/news/${article.slug}`} />
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="text-club-muted">削除しますか？</span>
            <button type="button" onClick={handleDelete} className="font-semibold text-red-600 hover:underline">
              はい
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-club-muted hover:underline"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="shrink-0 rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-muted hover:border-red-300 hover:text-red-600"
          >
            削除
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="grid max-w-xl gap-3 md:grid-cols-2">
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
            rows={8}
            className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-club-ink md:col-span-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
          公開する（オフにすると下書きに戻ります）
        </label>

        {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 md:col-span-2 md:w-fit"
        >
          保存する
        </button>
      </form>
    </>
  )
}
