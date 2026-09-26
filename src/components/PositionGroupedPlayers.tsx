import type { ReactNode } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { groupPlayersByPosition, type Player, type SquadMembership } from '@/lib/players'

type Row = SquadMembership & { players: Player }

export default function PositionGroupedPlayers({
  rows,
  renderCard,
}: {
  rows: Row[]
  renderCard: (row: Row) => ReactNode
}) {
  const { t } = useLanguage()
  const groups = groupPlayersByPosition(rows, t('players.positionOther'))

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-club-muted">
            {group.label}
          </h3>
          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {group.rows.map((row) => (
              <div key={row.id} className="w-32 shrink-0 sm:w-36">
                {renderCard(row)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
