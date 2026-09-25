import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function Schedule() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeading title={t('schedule.title')} description={t('schedule.desc')} />
      <p className="text-sm text-club-muted">{t('schedule.body')}</p>
    </>
  )
}
