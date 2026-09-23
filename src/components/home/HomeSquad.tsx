import { Link } from 'react-router-dom'
import PlayerAvatar from '@/components/PlayerAvatar'
import type { Player, SquadMembership } from '@/lib/players'

type Row = SquadMembership & { players: Player }

export default function HomeSquad({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-club-navy md:text-xl">
          The Squad
        </h2>
        <Link
          to="/players"
          className="text-xs font-semibold uppercase tracking-wider text-club-muted hover:text-club-navy"
        >
          View Squad →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {rows.map((row) => (
          <Link
            key={row.id}
            to={`/players/${row.players.id}`}
            className="rounded-lg border border-club-line bg-white p-4 text-center hover:shadow-md"
          >
            <div className="mx-auto mb-3 w-fit">
              <PlayerAvatar name={row.players.full_name} photoUrl={row.players.photo_url} size="lg" />
            </div>
            {row.squad_number !== null && (
              <div className="font-display text-lg font-bold text-club-gold">#{row.squad_number}</div>
            )}
            <div className="font-display text-sm font-semibold text-club-navy">{row.players.full_name}</div>
            {row.position_main && <div className="text-xs text-club-muted">{row.position_main}</div>}
          </Link>
        ))}
      </div>
    </section>
  )
}
