import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import FullPageSpinner from './FullPageSpinner'

export default function RequireAuth() {
  const { session, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
