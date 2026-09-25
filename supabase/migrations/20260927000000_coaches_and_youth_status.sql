-- 監督・コーチングスタッフ
create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  full_name text not null,
  role text not null,
  nationality text,
  photo_url text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index on public.coaches (club_id);

alter table public.coaches enable row level security;

create policy "coaches_owner" on public.coaches
  for all
  using (club_id in (select id from public.clubs where owner_id = auth.uid()))
  with check (club_id in (select id from public.clubs where owner_id = auth.uid()));

-- ユース所属選手をsquad_memberships.statusで表現できるようにする
alter table public.squad_memberships
  drop constraint squad_memberships_status_check;

alter table public.squad_memberships
  add constraint squad_memberships_status_check
  check (status in ('active', 'injured', 'loaned_out', 'loaned_in', 'retired', 'youth'));
