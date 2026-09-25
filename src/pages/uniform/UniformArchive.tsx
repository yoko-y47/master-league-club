import PageHeading from '@/components/PageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function UniformArchive() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeading title={t('uniformArchive.title')} description={t('uniformArchive.desc')} />
      <p className="text-sm text-club-muted">{t('uniformArchive.body')}</p>
    </>
  )
}
