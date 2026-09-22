-- Master League Club: core schema (Phase 2)
-- clubs / competitions / seasons / season_competitions / players /
-- squad_memberships / player_season_stats / matches / match_player_stats /
-- transfers / titles
--
-- 全テーブルは owner_id (auth.users.id) まで辿れるRLSで保護し、
-- 各ユーザーが自分のクラブのデータのみ読み書きできるようにする。

-- =========================================
-- Tables
-- =========================================

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  short_name text,
  founded_year int,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('league', 'domestic_cup', 'international_cup')),
  tier int,
  created_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  label text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.season_competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  final_position int,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  created_at timestamptz not null default now(),
  unique (season_id, competition_id)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  full_name text not null,
  nationality text,
  birth_date date,
  height_cm int,
  preferred_foot text check (preferred_foot in ('left', 'right', 'both')),
  photo_url text,
  created_at timestamptz not null default now()
);

create table public.squad_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  squad_number int,
  position text,
  overall_rating int,
  potential_rating int,
  status text not null default 'active'
    check (status in ('active', 'injured', 'loaned_out', 'loaned_in', 'retired')),
  created_at timestamptz not null default now(),
  unique (player_id, season_id)
);

create table public.player_season_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  appearances int not null default 0,
  starts int not null default 0,
  goals int not null default 0,
  assists int not null default 0,
  yellow_cards int not null default 0,
  red_cards int not null default 0,
  minutes_played int not null default 0,
  created_at timestamptz not null default now(),
  unique (player_id, season_id, competition_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  match_date date not null,
  opponent_name text not null,
  home_away text not null check (home_away in ('home', 'away')),
  home_score int,
  away_score int,
  round_label text,
  created_at timestamptz not null default now()
);

create table public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  is_starting boolean not null default true,
  minutes_played int not null default 0,
  position_played text,
  goals int not null default 0,
  assists int not null default 0,
  yellow_cards int not null default 0,
  red_cards int not null default 0,
  rating numeric(3, 1),
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  transfer_date date not null,
  from_club text,
  to_club text,
  transfer_type text not null
    check (transfer_type in ('signing', 'sale', 'loan_out', 'loan_in', 'free', 'youth_promotion')),
  fee numeric(12, 2),
  created_at timestamptz not null default now()
);

create table public.titles (
  id uuid primary key default gen_random_uuid(),
  season_competition_id uuid not null references public.season_competitions(id) on delete cascade,
  result text not null
    check (result in ('champion', 'runner_up', 'winner', 'finalist', 'semifinalist')),
  created_at timestamptz not null default now()
);

-- =========================================
-- Indexes (foreign keys)
-- =========================================

create index on public.seasons (club_id);
create index on public.season_competitions (season_id);
create index on public.season_competitions (competition_id);
create index on public.players (club_id);
create index on public.squad_memberships (player_id);
create index on public.squad_memberships (club_id);
create index on public.squad_memberships (season_id);
create index on public.player_season_stats (player_id);
create index on public.player_season_stats (season_id);
create index on public.player_season_stats (competition_id);
create index on public.matches (season_id);
create index on public.matches (competition_id);
create index on public.match_player_stats (match_id);
create index on public.match_player_stats (player_id);
create index on public.transfers (player_id);
create index on public.transfers (season_id);
create index on public.titles (season_competition_id);

-- =========================================
-- Row Level Security
-- =========================================

alter table public.clubs enable row level security;
alter table public.competitions enable row level security;
alter table public.seasons enable row level security;
alter table public.season_competitions enable row level security;
alter table public.players enable row level security;
alter table public.squad_memberships enable row level security;
alter table public.player_season_stats enable row level security;
alter table public.matches enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.transfers enable row level security;
alter table public.titles enable row level security;

create policy "clubs_owner" on public.clubs
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "competitions_owner" on public.competitions
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "seasons_owner" on public.seasons
  for all
  using (club_id in (select id from public.clubs where owner_id = auth.uid()))
  with check (club_id in (select id from public.clubs where owner_id = auth.uid()));

create policy "season_competitions_owner" on public.season_competitions
  for all
  using (
    season_id in (
      select s.id from public.seasons s
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  )
  with check (
    season_id in (
      select s.id from public.seasons s
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  );

create policy "players_owner" on public.players
  for all
  using (club_id in (select id from public.clubs where owner_id = auth.uid()))
  with check (club_id in (select id from public.clubs where owner_id = auth.uid()));

create policy "squad_memberships_owner" on public.squad_memberships
  for all
  using (club_id in (select id from public.clubs where owner_id = auth.uid()))
  with check (club_id in (select id from public.clubs where owner_id = auth.uid()));

create policy "player_season_stats_owner" on public.player_season_stats
  for all
  using (
    player_id in (
      select id from public.players
      where club_id in (select id from public.clubs where owner_id = auth.uid())
    )
  )
  with check (
    player_id in (
      select id from public.players
      where club_id in (select id from public.clubs where owner_id = auth.uid())
    )
  );

create policy "matches_owner" on public.matches
  for all
  using (
    season_id in (
      select id from public.seasons
      where club_id in (select id from public.clubs where owner_id = auth.uid())
    )
  )
  with check (
    season_id in (
      select id from public.seasons
      where club_id in (select id from public.clubs where owner_id = auth.uid())
    )
  );

create policy "match_player_stats_owner" on public.match_player_stats
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

create policy "transfers_owner" on public.transfers
  for all
  using (
    player_id in (
      select id from public.players
      where club_id in (select id from public.clubs where owner_id = auth.uid())
    )
  )
  with check (
    player_id in (
      select id from public.players
      where club_id in (select id from public.clubs where owner_id = auth.uid())
    )
  );

create policy "titles_owner" on public.titles
  for all
  using (
    season_competition_id in (
      select sc.id from public.season_competitions sc
      join public.seasons s on s.id = sc.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  )
  with check (
    season_competition_id in (
      select sc.id from public.season_competitions sc
      join public.seasons s on s.id = sc.season_id
      join public.clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  );
