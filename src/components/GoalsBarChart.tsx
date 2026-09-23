import { Link } from 'react-router-dom'

type Row = { player_id: string; player_name: string; goals: number; assists: number }

export default function GoalsBarChart({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.goals), 1)

  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <Link
          key={r.player_id}
          to={`/players/${r.player_id}`}
          className="block"
          title={`${r.player_name}: ${r.goals}得点 ・ ${r.assists}アシスト`}
        >
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-club-navy">{r.player_name}</span>
            <span className="text-club-muted">
              {r.goals}得点 ・ {r.assists}アシスト
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-club-bg">
            <div
              className="h-full rounded-full bg-club-navy"
              style={{ width: `${Math.max((r.goals / max) * 100, 4)}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  )
}
