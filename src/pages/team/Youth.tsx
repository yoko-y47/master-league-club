import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function Youth() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeading title={t('youth.title')} description={t('youth.desc')} />
      <p className="text-sm text-club-muted">{t('youth.body')}</p>
    </>
  )
}
