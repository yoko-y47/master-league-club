import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

export type Club = {
  id: string
  owner_id: string
  name: string
  short_name: string | null
  founded_year: number | null
  logo_url: string | null
  stadium_name: string | null
  description: string | null
  created_at: string
}

type ClubContextValue = {
  club: Club | null
  loading: boolean
  refresh: () => Promise<void>
}

const ClubContext = createContext<ClubContextValue>({
  club: null,
  loading: true,
  refresh: async () => {},
})

export function ClubProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session) {
      setClub(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .eq('owner_id', session.user.id)
      .maybeSingle()
    setClub(data)
    setLoading(false)
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  return <ClubContext.Provider value={{ club, loading, refresh }}>{children}</ClubContext.Provider>
}

export function useClub() {
  return useContext(ClubContext)
}
