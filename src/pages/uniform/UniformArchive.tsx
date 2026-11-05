import { lazy, Suspense } from 'react'
import PageHeading from '@/components/PublicPageHeading'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// 3D の展示は three.js を含んで大きいので、このページを開いたときだけ読み込む
const KitArchiveStage = lazy(() => import('@/components/kits/KitArchiveStage'))

export default function UniformArchive() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeading title={t('uniformArchive.title')} description={t('uniformArchive.desc')} />
      <Suspense fallback={<p className="text-sm text-club-muted">{t('common.loading')}</p>}>
        <KitArchiveStage />
      </Suspense>
    </>
  )
}
