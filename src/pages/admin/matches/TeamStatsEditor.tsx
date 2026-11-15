import { useEffect, useState, type FormEvent } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import { TEAM_STAT_KEYS, type MatchTeamStats, type TeamStatKey, type TeamStatValues } from '@/lib/matches'

type Props = {
  matchId: string
  clubName: string
  opponentName: string
}

type Inputs = Record<TeamStatKey, { own: string; opponent: string }>

function emptyInputs(): Inputs {
  return Object.fromEntries(TEAM_STAT_KEYS.map((key) => [key, { own: '', opponent: '' }])) as Inputs
}

function toInputs(own: TeamStatValues, opponent: TeamStatValues): Inputs {
  const inputs = emptyInputs()
  for (const key of TEAM_STAT_KEYS) {
    inputs[key] = { own: own[key]?.toString() ?? '', opponent: opponent[key]?.toString() ?? '' }
  }
  return inputs
}

function toValues(inputs: Inputs, side: 'own' | 'opponent'): TeamStatValues {
  const values: TeamStatValues = {}
  for (const key of TEAM_STAT_KEYS) {
    const raw = inputs[key][side]
    if (raw !== '') values[key] = Number(raw)
  }
  return values
}

export default function TeamStatsEditor({ matchId, clubName, opponentName }: Props) {
  const { t } = useLanguage()
  const [inputs, setInputs] = useState<Inputs>(emptyInputs)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('match_team_stats')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as MatchTeamStats | null
        setInputs(row ? toInputs(row.own, row.opponent) : emptyInputs())
        setLoading(false)
      })
  }, [matchId])

  function setValue(key: TeamStatKey, side: 'own' | 'opponent', value: string) {
    setSaved(false)
    setInputs((prev) => ({ ...prev, [key]: { ...prev[key], [side]: value } }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    const { error } = await supabase.from('match_team_stats').upsert({
      match_id: matchId,
      own: toValues(inputs, 'own'),
      opponent: toValues(inputs, 'opponent'),
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSaved(true)
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
        {t('matches.teamStats.heading')}
      </h2>
      {loading ? (
        <p className="text-sm text-club-muted">{t('common.loading')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-club-line bg-white p-4">
          <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-3 gap-y-2 md:grid-cols-[1fr_8rem_8rem]">
            <div />
            <div className="truncate text-center text-xs font-medium text-club-muted">{clubName}</div>
            <div className="truncate text-center text-xs font-medium text-club-muted">{opponentName}</div>
            {TEAM_STAT_KEYS.map((key) => (
              <div key={key} className="contents">
                <label className="text-sm text-club-navy">{t(`matches.teamStat.${key}`)}</label>
                {(['own', 'opponent'] as const).map((side) => (
                  <input
                    key={side}
                    type="number"
                    min={0}
                    value={inputs[key][side]}
                    onChange={(e) => setValue(key, side, e.target.value)}
                    className="w-full rounded-md border border-club-line px-2 py-1.5 text-center text-sm focus:border-club-navy focus:outline-none"
                  />
                ))}
              </div>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-club-muted">{t('matches.teamStats.saved')}</span>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-club-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
