import { Link } from 'react-router-dom'
import PlayerCard from '@/components/PlayerCard'
import PositionGroupedPlayers from '@/components/PositionGroupedPlayers'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Player, SquadMembership } from '@/lib/players'

type Row = SquadMembership & { players: Player }

export default function HomeSquad({ rows }: { rows: Row[] }) {
  const { t } = useLanguage()
  if (rows.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between border-l-4 border-club-gold pl-3">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-club-navy md:text-xl">
          {t('home.theSquad')}
        </h2>
        <Link
          to="/players"
          className="text-xs font-bold uppercase tracking-wider text-club-muted hover:text-club-navy"
        >
          {t('home.viewSquad')}
        </Link>
      </div>

      <PositionGroupedPlayers
        rows={rows}
        renderCard={(row) => (
          <PlayerCard player={row.players} squadNumber={row.squad_number} to={`/players/${row.players.id}`} />
        )}
      />
    </section>
  )
}
