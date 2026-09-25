import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function Coach() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeading title={t('coach.title')} description={t('coach.desc')} />
      <p className="text-sm text-club-muted">{t('coach.body')}</p>
    </>
  )
}
