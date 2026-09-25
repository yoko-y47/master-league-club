import { useEffect, useState } from 'react'
import HomeHero from '@/components/home/HomeHero'
import HomeNextMatch from '@/components/home/HomeNextMatch'
import HomeLatestResult from '@/components/home/HomeLatestResult'
import HomeLatestNews from '@/components/home/HomeLatestNews'
import HomeSquad from '@/components/home/HomeSquad'
import HomeLatestMatches from '@/components/home/HomeLatestMatches'
import HomeClub from '@/components/home/HomeClub'
import { useClub } from '@/lib/ClubContext'
import { supabase } from '@/lib/supabaseClient'
import type { Match } from '@/lib/matches'
import type { News } from '@/lib/news'
import type { Player, SquadMembership } from '@/lib/players'

type MatchRow = Match & { competition_name: string }
type SquadRow = SquadMembership & { players: Player }

export default function Dashboard() {
  const { club } = useClub()
  const [newsArticles, setNewsArticles] = useState<News[]>([])
  const [nextMatch, setNextMatch] = useState<MatchRow | null>(null)
  const [latestResult, setLatestResult] = useState<MatchRow | null>(null)
  const [latestMatches, setLatestMatches] = useState<Match[]>([])
  const [squad, setSquad] = useState<SquadRow[]>([])

  useEffect(() => {
    if (!club) return

    async function load() {
      const { data: articleData } = await supabase
        .from('news')
        .select('*')
        .eq('club_id', club!.id)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(5)
      setNewsArticles(articleData ?? [])

      const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .eq('club_id', club!.id)
        .eq('is_current', true)
        .maybeSingle()

      if (!season) {
        setNextMatch(null)
        setLatestResult(null)
        setLatestMatches([])
        setSquad([])
        return
      }

      const [{ data: nextData }, { data: resultData }, { data: recentData }, { data: squadData }] =
        await Promise.all([
          supabase
            .from('matches')
            .select('*, competitions(name)')
            .eq('season_id', season.id)
            .is('home_score', null)
            .is('away_score', null)
            .order('match_date', { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('matches')
            .select('*, competitions(name)')
            .eq('season_id', season.id)
            .not('home_score', 'is', null)
            .not('away_score', 'is', null)
            .order('match_date', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('matches')
            .select('*')
            .eq('season_id', season.id)
            .not('home_score', 'is', null)
            .not('away_score', 'is', null)
            .order('match_date', { ascending: false })
            .limit(5),
          supabase
            .from('squad_memberships')
            .select('*, players(*)')
            .eq('season_id', season.id)
            .eq('status', 'active')
            .order('overall_rating', { ascending: false, nullsFirst: false })
            .limit(4),
        ])

      function withCompetitionName(row: unknown): MatchRow | null {
        if (!row) return null
        const { competitions: competitionRel, ...rest } = row as Match & { competitions: { name: string } | null }
        return { ...rest, competition_name: competitionRel?.name ?? '?' }
      }

      setNextMatch(withCompetitionName(nextData))
      setLatestResult(withCompetitionName(resultData))
      setLatestMatches(recentData ?? [])
      setSquad((squadData ?? []) as SquadRow[])
    }

    load()
  }, [club])

  if (!club) return null

  const featured = newsArticles[0] ?? null

  return (
    <div className="-mx-4 md:-mx-8">
      <div className="px-4 md:px-8">
        <HomeHero clubName={club.name} featured={featured} />
      </div>

      <div className="px-4 md:px-8">
        <HomeNextMatch clubName={club.name} match={nextMatch} />
        <HomeLatestResult clubName={club.name} match={latestResult} />
        <HomeLatestNews articles={newsArticles} />
        <HomeSquad rows={squad} />
        <HomeLatestMatches clubName={club.name} matches={latestMatches} />
        <HomeClub club={club} />
      </div>
    </div>
  )
}
