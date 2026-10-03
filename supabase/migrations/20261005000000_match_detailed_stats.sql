alter table public.match_player_stats
  add column shots int not null default 0,
  add column passes int not null default 0;

create table public.match_goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  scorer_id uuid not null references public.players(id) on delete cascade,
  assist_id uuid references public.players(id) on delete set null,
  minute int,
  created_at timestamptz not null default now()
);

create table public.match_cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  card_type text not null check (card_type in ('yellow', 'red')),
  minute int,
  created_at timestamptz not null default now()
);

create table public.match_substitutions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_off_id uuid not null references public.players(id) on delete cascade,
  player_on_id uuid not null references public.players(id) on delete cascade,
  minute int not null,
  created_at timestamptz not null default now()
);

alter table public.match_goals enable row level security;
alter table public.match_cards enable row level security;
alter table public.match_substitutions enable row level security;

create policy "match_goals_owner" on public.match_goals
  for all
  using (
    match_id in (
      select m.id from public.matches m
      join public.seasons s on s.id = m.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  )
  with check (
    match_id in (
      select m.id from public.matches m
      join public.seasons s on s.id = m.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  );

create policy "match_cards_owner" on public.match_cards
  for all
  using (
    match_id in (
      select m.id from public.matches m
      join public.seasons s on s.id = m.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  )
  with check (
    match_id in (
      select m.id from public.matches m
      join public.seasons s on s.id = m.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  );

create policy "match_substitutions_owner" on public.match_substitutions
  for all
  using (
    match_id in (
      select m.id from public.matches m
      join public.seasons s on s.id = m.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  )
  with check (
    match_id in (
      select m.id from public.matches m
      join public.seasons s on s.id = m.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  );
