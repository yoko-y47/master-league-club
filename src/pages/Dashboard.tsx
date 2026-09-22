import ClubCrest, { CLUB_NAME } from '@/components/ClubCrest'
import StatTile from '@/components/StatTile'

export default function Dashboard() {
  return (
    <>
      <section className="mb-8 flex items-center gap-4 rounded-lg bg-club-navy px-5 py-6 text-white md:gap-6 md:px-8 md:py-8">
        <ClubCrest size="lg" />
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">Current Season</div>
          <h1 className="font-display text-2xl font-semibold tracking-wide md:text-3xl">{CLUB_NAME}</h1>
          <p className="mt-1 text-sm text-white/60">シーズンを開始するとここに最新状況が表示されます</p>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatTile label="League Position" value="—" />
        <StatTile label="Record (W-D-L)" value="—" />
        <StatTile label="Goal Difference" value="—" />
        <StatTile label="Points" value="—" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Recent Results
          </h2>
          <p className="mt-2 text-sm text-club-muted">
            Phase 2以降でSupabaseの試合データに接続し、直近の試合結果を表示します。
          </p>
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Top Scorers &amp; Assists
          </h2>
          <p className="mt-2 text-sm text-club-muted">
            Phase 6以降で得点・アシストランキングを表示します。
          </p>
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Latest Transfers
          </h2>
          <p className="mt-2 text-sm text-club-muted">Phase 7以降で最近の移籍情報を表示します。</p>
        </section>
        <section className="rounded-lg border border-club-line bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
            Honours
          </h2>
          <p className="mt-2 text-sm text-club-muted">Phase 7以降で獲得タイトルを表示します。</p>
        </section>
      </div>
    </>
  )
}
