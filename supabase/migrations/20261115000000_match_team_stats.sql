-- 試合ごとのチームスタッツ（支配率・シュート数など）。自チームと相手チームの値を JSON で持つ
create table public.match_team_stats (
  match_id uuid primary key references public.matches(id) on delete cascade,
  own jsonb not null default '{}'::jsonb,
  opponent jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.match_team_stats enable row level security;

create policy "match_team_stats_owner" on public.match_team_stats
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
