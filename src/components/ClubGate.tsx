import { Outlet } from 'react-router-dom'
import { ClubProvider, useClub } from '@/lib/ClubContext'
import CreateClub from '@/pages/onboarding/CreateClub'
import FullPageSpinner from './FullPageSpinner'

function ClubGateInner() {
  const { club, loading } = useClub()

  if (loading) return <FullPageSpinner />
  if (!club) return <CreateClub />

  return <Outlet />
}

export default function ClubGate() {
  return (
    <ClubProvider>
      <ClubGateInner />
    </ClubProvider>
  )
}
