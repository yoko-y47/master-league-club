export type NavChild = {
  to: string
  label: string
}

export type NavItem = {
  label: string
  to?: string
  children?: NavChild[]
}

export const navItems: NavItem[] = [
  {
    label: 'Team',
    children: [
      { to: '/players', label: 'Players' },
      { to: '/team/rankings', label: 'Rankings' },
      { to: '/team/coach', label: 'Coach' },
      { to: '/team/youth', label: 'Youth' },
    ],
  },
  {
    label: 'News',
    children: [
      { to: '/matches', label: 'Match Results' },
      { to: '/news/interviews', label: 'Interviews' },
      { to: '/transfers', label: 'Transfers' },
      { to: '/competitions', label: 'Honours' },
    ],
  },
  {
    label: 'Schedule',
    to: '/schedule',
  },
  {
    label: 'Uniform',
    children: [
      { to: '/uniform/current', label: 'Current Season' },
      { to: '/uniform/archive', label: 'Archive' },
    ],
  },
]
