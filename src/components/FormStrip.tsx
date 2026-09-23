import { matchResult, resultColors, resultLabels, type Match } from '@/lib/matches'

export default function FormStrip({ matches }: { matches: Match[] }) {
  const ordered = [...matches].reverse()

  return (
    <div className="flex items-center gap-1.5">
      {ordered.map((match) => {
        const result = matchResult(match)
        if (!result) return null
        return (
          <span
            key={match.id}
            title={`${match.match_date} ${match.home_away === 'home' ? 'vs' : '@'} ${match.opponent_name} ${
              match.home_score
            }-${match.away_score}`}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${resultColors[result]}`}
          >
            {resultLabels[result]}
          </span>
        )
      })}
    </div>
  )
}
