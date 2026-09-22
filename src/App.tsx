import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import PlayerList from '@/pages/players/PlayerList'
import PlayerDetail from '@/pages/players/PlayerDetail'
import Coach from '@/pages/team/Coach'
import Youth from '@/pages/team/Youth'
import MatchList from '@/pages/matches/MatchList'
import MatchDetail from '@/pages/matches/MatchDetail'
import Interviews from '@/pages/news/Interviews'
import Schedule from '@/pages/Schedule'
import SeasonList from '@/pages/seasons/SeasonList'
import SeasonDetail from '@/pages/seasons/SeasonDetail'
import TransferList from '@/pages/transfers/TransferList'
import CompetitionList from '@/pages/competitions/CompetitionList'
import UniformCurrent from '@/pages/uniform/UniformCurrent'
import UniformArchive from '@/pages/uniform/UniformArchive'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />

        {/* Team */}
        <Route path="players" element={<PlayerList />} />
        <Route path="players/:playerId" element={<PlayerDetail />} />
        <Route path="team/coach" element={<Coach />} />
        <Route path="team/youth" element={<Youth />} />

        {/* News */}
        <Route path="matches" element={<MatchList />} />
        <Route path="matches/:matchId" element={<MatchDetail />} />
        <Route path="news/interviews" element={<Interviews />} />
        <Route path="transfers" element={<TransferList />} />
        <Route path="competitions" element={<CompetitionList />} />

        {/* Schedule */}
        <Route path="schedule" element={<Schedule />} />

        {/* Uniform */}
        <Route path="uniform/current" element={<UniformCurrent />} />
        <Route path="uniform/archive" element={<UniformArchive />} />

        {/* Seasons: ナビ非掲載だが、Dashboard等からのリンク先として維持 */}
        <Route path="seasons" element={<SeasonList />} />
        <Route path="seasons/:seasonId" element={<SeasonDetail />} />
      </Route>
    </Routes>
  )
}
