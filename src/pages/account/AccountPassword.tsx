import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import ClubCrest from '@/components/ClubCrest'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { clearPasswordRecovery, isPasswordRecovery } from '@/lib/authLink'
import { supabase } from '@/lib/supabaseClient'

const MIN_LENGTH = 6

// パスワードの変更（ログイン中）と、再設定メールのリンクから来たときの新しいパスワードの設定
export default function AccountPassword() {
  const { t } = useLanguage()
  const [recovery] = useState(isPasswordRecovery)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_LENGTH) return setError(t('account.password.tooShort', { n: MIN_LENGTH }))
    if (password !== confirm) return setError(t('account.password.mismatch'))
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) return setError(t('account.password.failed', { message: error.message }))
    clearPasswordRecovery()
    setPassword('')
    setConfirm('')
    setDone(true)
  }

  const input = 'w-full rounded-md border border-club-line px-3 py-2 text-sm focus:border-club-navy focus:outline-none'
  const label = 'mb-1 block text-xs font-medium uppercase tracking-wide text-club-muted'

  return (
    <div className="flex min-h-screen items-center justify-center bg-club-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-club-line bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <ClubCrest size="lg" />
          <h1 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy">
            {recovery ? t('account.password.resetTitle') : t('account.password.title')}
          </h1>
          {recovery && <p className="text-xs text-club-muted">{t('account.password.resetLead')}</p>}
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-club-navy">{t('account.password.done')}</p>
            <Link to="/" className="inline-block rounded-md bg-club-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              {t('account.password.toTop')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label className={label} htmlFor="newPassword">
                {t('account.password.new')}
              </label>
              <input id="newPassword" type="password" autoComplete="new-password" required minLength={MIN_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="confirmPassword">
                {t('account.password.confirm')}
              </label>
              <input id="confirmPassword" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-club-navy py-2 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {submitting ? t('account.password.saving') : t('account.password.save')}
            </button>
            {!recovery && (
              <Link to="/admin" className="block text-center text-xs text-club-muted hover:underline">
                {t('common.cancel')}
              </Link>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
