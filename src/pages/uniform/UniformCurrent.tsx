import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function UniformCurrent() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeading title={t('uniformCurrent.title')} description={t('uniformCurrent.desc')} />
      <p className="text-sm text-club-muted">{t('uniformCurrent.body')}</p>
    </>
  )
}
