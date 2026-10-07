import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function BackButton() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="mb-4 text-xs font-semibold uppercase tracking-wider text-club-muted hover:text-club-navy"
    >
      {t('common.back')}
    </button>
  )
}
