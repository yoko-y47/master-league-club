import { useEffect, useState } from 'react'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { kitTypeOrder, type KitType, type Uniform } from '@/lib/uniforms'

export default function UniformCurrent() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [uniforms, setUniforms] = useState<Uniform[]>([])
  const [loading, setLoading] = useState(true)

  const kitTypeLabels: Record<KitType, string> = {
    home: t('kitType.home'),
    away: t('kitType.away'),
    third: t('kitType.third'),
  }

  useEffect(() => {
    if (!club) return

    async function load() {
      setLoading(true)
      const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .eq('club_id', club!.id)
        .eq('is_current', true)
        .maybeSingle()

      if (!season) {
        setUniforms([])
        setLoading(false)
        return
      }

      const { data } = await supabase.from('uniforms').select('*').eq('season_id', season.id)
      setUniforms(data ?? [])
      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <PageHeading title={t('uniformCurrent.title')} description={t('uniformCurrent.desc')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : uniforms.length === 0 ? (
        <p className="text-sm text-club-muted">{t('uniformCurrent.empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {kitTypeOrder.map((kitType) => {
            const uniform = uniforms.find((u) => u.kit_type === kitType)
            if (!uniform) return null
            return (
              <div key={kitType} className="rounded-lg border border-club-line bg-white p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-club-muted">
                  {kitTypeLabels[kitType]}
                </div>
                <img
                  src={uniform.image_url}
                  alt={kitTypeLabels[kitType]}
                  className="h-56 w-full rounded-md object-contain"
                />
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
