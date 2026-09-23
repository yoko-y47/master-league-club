import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/components/AdminLayout'
import ClubGate from '@/components/ClubGate'
import Layout from '@/components/Layout'
import RequireAuth from '@/components/RequireAuth'
import Login from '@/pages/auth/Login'
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
import AdminSeasonList from '@/pages/admin/seasons/AdminSeasonList'
import AdminSeasonEdit from '@/pages/admin/seasons/AdminSeasonEdit'
import AdminPlayerList from '@/pages/admin/players/AdminPlayerList'
import AdminPlayerEdit from '@/pages/admin/players/AdminPlayerEdit'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<ClubGate />}>
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

            {/* Seasons: 閲覧専用。編集はAdminで行う */}
            <Route path="seasons" element={<SeasonList />} />
            <Route path="seasons/:seasonId" element={<SeasonDetail />} />
          </Route>

          {/* Admin: データ管理はすべてこちらで行う */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="seasons" replace />} />
            <Route path="seasons" element={<AdminSeasonList />} />
            <Route path="seasons/:seasonId" element={<AdminSeasonEdit />} />
            <Route path="players" element={<AdminPlayerList />} />
            <Route path="players/:playerId" element={<AdminPlayerEdit />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
