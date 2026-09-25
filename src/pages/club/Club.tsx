import ClubCrest from '@/components/ClubCrest'
import { useClub } from '@/lib/ClubContext'

export default function Club() {
  const { club } = useClub()

  if (!club) return <p className="text-sm text-club-muted">読み込み中...</p>

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-4 rounded-lg bg-club-navy px-6 py-10 text-center text-white md:py-14">
        <ClubCrest size="lg" alt={`${club.name} crest`} />
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide md:text-4xl">{club.name}</h1>
          {club.short_name && <p className="mt-1 text-sm text-white/60">{club.short_name}</p>}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        {club.founded_year && (
          <div className="rounded-lg border border-club-line bg-white p-4 text-center">
            <div className="text-[11px] font-medium uppercase tracking-wider text-club-muted">Founded</div>
            <div className="mt-1 font-display text-xl font-semibold text-club-navy">{club.founded_year}</div>
          </div>
        )}
        {club.stadium_name && (
          <div className="rounded-lg border border-club-line bg-white p-4 text-center">
            <div className="text-[11px] font-medium uppercase tracking-wider text-club-muted">Stadium</div>
            <div className="mt-1 font-display text-xl font-semibold text-club-navy">{club.stadium_name}</div>
          </div>
        )}
      </div>

      {club.description && (
        <div className="rounded-lg border border-club-line bg-white p-6">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            About the Club
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-club-ink">{club.description}</p>
        </div>
      )}
    </>
  )
}
