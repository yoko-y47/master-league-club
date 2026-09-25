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
import Rankings from '@/pages/team/Rankings'
import MatchList from '@/pages/matches/MatchList'
import MatchDetail from '@/pages/matches/MatchDetail'
import NewsList from '@/pages/news/NewsList'
import NewsDetail from '@/pages/news/NewsDetail'
import Club from '@/pages/club/Club'
import Schedule from '@/pages/Schedule'
import SeasonList from '@/pages/seasons/SeasonList'
import SeasonDetail from '@/pages/seasons/SeasonDetail'
import TransferList from '@/pages/transfers/TransferList'
import CompetitionList from '@/pages/competitions/CompetitionList'
import UniformCurrent from '@/pages/uniform/UniformCurrent'
import UniformArchive from '@/pages/uniform/UniformArchive'
import AdminClub from '@/pages/admin/club/AdminClub'
import AdminSeasonList from '@/pages/admin/seasons/AdminSeasonList'
import AdminSeasonEdit from '@/pages/admin/seasons/AdminSeasonEdit'
import AdminPlayerList from '@/pages/admin/players/AdminPlayerList'
import AdminPlayerEdit from '@/pages/admin/players/AdminPlayerEdit'
import AdminCompetitionList from '@/pages/admin/competitions/AdminCompetitionList'
import AdminMatchList from '@/pages/admin/matches/AdminMatchList'
import AdminMatchEdit from '@/pages/admin/matches/AdminMatchEdit'
import AdminTransferList from '@/pages/admin/transfers/AdminTransferList'
import AdminNewsList from '@/pages/admin/news/AdminNewsList'
import AdminNewsEdit from '@/pages/admin/news/AdminNewsEdit'

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
            <Route path="team/rankings" element={<Rankings />} />
            <Route path="team/coach" element={<Coach />} />
            <Route path="team/youth" element={<Youth />} />

            {/* News */}
            <Route path="news" element={<NewsList />} />
            <Route path="news/:slug" element={<NewsDetail />} />
            <Route path="matches" element={<MatchList />} />
            <Route path="matches/:matchId" element={<MatchDetail />} />
            <Route path="transfers" element={<TransferList />} />
            <Route path="competitions" element={<CompetitionList />} />

            {/* Schedule */}
            <Route path="schedule" element={<Schedule />} />

            {/* Uniform */}
            <Route path="uniform/current" element={<UniformCurrent />} />
            <Route path="uniform/archive" element={<UniformArchive />} />

            {/* Club */}
            <Route path="club" element={<Club />} />

            {/* Seasons: 閲覧専用。編集はAdminで行う */}
            <Route path="seasons" element={<SeasonList />} />
            <Route path="seasons/:seasonId" element={<SeasonDetail />} />
          </Route>

          {/* Admin: データ管理はすべてこちらで行う */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="seasons" replace />} />
            <Route path="club" element={<AdminClub />} />
            <Route path="seasons" element={<AdminSeasonList />} />
            <Route path="seasons/:seasonId" element={<AdminSeasonEdit />} />
            <Route path="players" element={<AdminPlayerList />} />
            <Route path="players/:playerId" element={<AdminPlayerEdit />} />
            <Route path="competitions" element={<AdminCompetitionList />} />
            <Route path="matches" element={<AdminMatchList />} />
            <Route path="matches/:matchId" element={<AdminMatchEdit />} />
            <Route path="transfers" element={<AdminTransferList />} />
            <Route path="news" element={<AdminNewsList />} />
            <Route path="news/:newsId" element={<AdminNewsEdit />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
