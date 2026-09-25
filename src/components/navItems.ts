export type NavChild = {
  to: string
  label: string
}

export type NavItem = {
  label: string
  to?: string
  children?: NavChild[]
}

export function getNavItems(t: (key: string) => string): NavItem[] {
  return [
    {
      label: t('nav.team'),
      children: [
        { to: '/players', label: t('nav.team.players') },
        { to: '/team/rankings', label: t('nav.team.rankings') },
        { to: '/team/coach', label: t('nav.team.coach') },
        { to: '/team/youth', label: t('nav.team.youth') },
      ],
    },
    {
      label: t('nav.news'),
      children: [
        { to: '/news', label: t('nav.news.all') },
        { to: '/matches', label: t('nav.news.results') },
        { to: '/transfers', label: t('nav.news.transfers') },
        { to: '/competitions', label: t('nav.news.honours') },
      ],
    },
    {
      label: t('nav.schedule'),
      to: '/schedule',
    },
    {
      label: t('nav.uniform'),
      children: [
        { to: '/uniform/current', label: t('nav.uniform.current') },
        { to: '/uniform/archive', label: t('nav.uniform.archive') },
      ],
    },
  ]
}
