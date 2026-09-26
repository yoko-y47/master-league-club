import { Link } from 'react-router-dom'
import PlayerCard from '@/components/PlayerCard'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Player, SquadMembership } from '@/lib/players'

type Row = SquadMembership & { players: Player }

export default function HomeSquad({ rows }: { rows: Row[] }) {
  const { t } = useLanguage()
  if (rows.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy md:text-xl">
          {t('home.theSquad')}
        </h2>
        <Link
          to="/players"
          className="text-xs font-semibold uppercase tracking-wider text-club-muted hover:text-club-navy"
        >
          {t('home.viewSquad')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {rows.map((row) => (
          <PlayerCard
            key={row.id}
            player={row.players}
            squadNumber={row.squad_number}
            to={`/players/${row.players.id}`}
            subtitle={row.position_main}
          />
        ))}
      </div>
    </section>
  )
}
