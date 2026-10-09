import { useEffect, useState } from 'react'
import HomeHero from '@/components/home/HomeHero'
import HomeNextMatch from '@/components/home/HomeNextMatch'
import HomeLatestResult from '@/components/home/HomeLatestResult'
import HomeLatestNews from '@/components/home/HomeLatestNews'
import HomeQuickLinks from '@/components/home/HomeQuickLinks'
import HomeTile from '@/components/home/HomeTile'
import HomeSquad from '@/components/home/HomeSquad'
import HomeLatestMatches from '@/components/home/HomeLatestMatches'
import HomeUpcomingMatches from '@/components/home/HomeUpcomingMatches'
import HomeClub from '@/components/home/HomeClub'
import { useClub } from '@/lib/ClubContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import type { Match } from '@/lib/matches'
import type { News } from '@/lib/news'
import type { Player, SquadMembership } from '@/lib/players'

type MatchRow = Match & { competition_name: string }
type SquadRow = SquadMembership & { players: Player }

export default function Dashboard() {
  const { club } = useClub()
  const { t } = useLanguage()
  const [newsArticles, setNewsArticles] = useState<News[]>([])
  const [nextMatch, setNextMatch] = useState<MatchRow | null>(null)
  const [latestResult, setLatestResult] = useState<MatchRow | null>(null)
  const [latestMatches, setLatestMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<MatchRow[]>([])
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
        setUpcomingMatches([])
        setSquad([])
        return
      }

      const [{ data: nextData }, { data: upcomingData }, { data: resultData }, { data: recentData }, { data: squadData }] =
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
            .is('home_score', null)
            .is('away_score', null)
            .order('match_date', { ascending: true })
            .limit(5),
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
      setUpcomingMatches(((upcomingData ?? []) as (Match & { competitions: { name: string } | null })[]).map(
        (row) => withCompetitionName(row) as MatchRow,
      ))
      setLatestResult(withCompetitionName(resultData))
      setLatestMatches(recentData ?? [])
      setSquad((squadData ?? []) as SquadRow[])
    }

    load()
  }, [club])

  if (!club) return null

  const slides = newsArticles.slice(0, 3)

  return (
    <div>
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pt-4 md:grid-cols-3 md:grid-rows-2 md:px-8">
        <div className="col-span-2 overflow-hidden rounded-md md:row-span-2">
          <HomeHero clubName={club.name} slides={slides} />
        </div>
        <HomeTile to="/players" label={t('home.theSquad')} className="rounded-md" />
        <HomeTile to="/club" label={t('footer.club')} className="rounded-md" />
      </section>

      <div className="mt-4">
        <HomeNextMatch clubName={club.name} match={nextMatch} />
        <HomeLatestResult clubName={club.name} match={latestResult} />
      </div>
      <HomeLatestNews articles={newsArticles} />
      <HomeQuickLinks />

      <div className="mx-auto max-w-7xl px-4 pt-2 md:px-8">
        <HomeSquad rows={squad} />
        <HomeUpcomingMatches matches={upcomingMatches} />
        <HomeLatestMatches clubName={club.name} matches={latestMatches} />
        <HomeClub club={club} />
      </div>
    </div>
  )
}
