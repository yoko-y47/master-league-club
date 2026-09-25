import { useEffect, useState } from 'react'
import PageHeading from '@/components/PageHeading'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Season } from '@/lib/seasons'
import { kitTypeOrder, type KitType, type Uniform } from '@/lib/uniforms'

type SeasonGroup = { season: Season; uniforms: Uniform[] }

export default function UniformArchive() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [groups, setGroups] = useState<SeasonGroup[]>([])
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
      const { data: seasons } = await supabase
        .from('seasons')
        .select('*')
        .eq('club_id', club!.id)
        .eq('is_current', false)
        .order('start_date', { ascending: false, nullsFirst: false })

      const seasonList = seasons ?? []
      if (seasonList.length === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      const { data: uniformData } = await supabase
        .from('uniforms')
        .select('*')
        .in(
          'season_id',
          seasonList.map((s) => s.id),
        )

      const grouped = seasonList
        .map((season) => ({
          season,
          uniforms: (uniformData ?? []).filter((u) => u.season_id === season.id),
        }))
        .filter((g) => g.uniforms.length > 0)

      setGroups(grouped)
      setLoading(false)
    }

    load()
  }, [club])

  return (
    <>
      <PageHeading title={t('uniformArchive.title')} description={t('uniformArchive.desc')} />

      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-club-muted">{t('uniformArchive.empty')}</p>
      ) : (
        <div className="space-y-8">
          {groups.map(({ season, uniforms }) => (
            <section key={season.id}>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
                {season.label}
              </h2>
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
            </section>
          ))}
        </div>
      )}
    </>
  )
}
