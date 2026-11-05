import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import { useAuth } from '@/lib/AuthContext'
import { takeLinkError } from '@/lib/authLink'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const { session } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'reset'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // メールのリンクが無効・期限切れで戻ってきたとき
  const [error, setError] = useState<string | null>(() => {
    const code = takeLinkError()
    return code ? (code === 'otp_expired' ? t('auth.linkExpired') : t('auth.linkFailed', { code })) : null
  })
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [session, navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setNotice(null)

    if (mode === 'reset') {
      // 再設定のメールを送る。リンクの行き先はこのサイト（Supabase の Redirect URLs に登録が必要。ない場合は Site URL に戻る）
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      })
      if (error) setError(error.message)
      else setNotice(t('auth.resetSent'))
    } else if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        navigate('/', { replace: true })
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        navigate('/', { replace: true })
      } else {
        setNotice(t('auth.confirmEmailNotice'))
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-club-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-club-line bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <ClubCrest size="lg" />
          <h1 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy">
            {t('auth.appName')}
          </h1>
        </div>

        <div className="mb-5 flex rounded-md border border-club-line p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('sign-in')}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              mode === 'sign-in' ? 'bg-club-navy text-white' : 'text-club-muted'
            }`}
          >
            {t('auth.signIn')}
          </button>
          <button
            type="button"
            onClick={() => setMode('sign-up')}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              mode === 'sign-up' ? 'bg-club-navy text-white' : 'text-club-muted'
            }`}
          >
            {t('auth.signUp')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('auth.email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          {mode !== 'reset' && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none"
            />
          </div>
          )}
          {mode === 'reset' && <p className="text-xs text-club-muted">{t('auth.resetLead')}</p>}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-club-navy">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-club-navy py-2 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {mode === 'sign-in' ? t('auth.signIn') : mode === 'reset' ? t('auth.resetSend') : t('common.create')}
          </button>
          {mode === 'sign-in' && (
            <button type="button" onClick={() => { setMode('reset'); setError(null); setNotice(null) }} className="block w-full text-center text-xs text-club-muted hover:underline">
              {t('auth.forgotPassword')}
            </button>
          )}
          {mode === 'reset' && (
            <button type="button" onClick={() => { setMode('sign-in'); setError(null); setNotice(null) }} className="block w-full text-center text-xs text-club-muted hover:underline">
              {t('auth.backToSignIn')}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
