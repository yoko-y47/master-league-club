-- ニュース記事（HERO / LATEST NEWSセクション用）
create table public.news (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  slug text not null,
  category text,
  cover_image_url text,
  body text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (club_id, slug)
);

create index on public.news (club_id);

alter table public.news enable row level security;

create policy "news_owner" on public.news
  for all
  using (club_id in (select id from public.clubs where owner_id = auth.uid()))
  with check (club_id in (select id from public.clubs where owner_id = auth.uid()));

-- クラブ紹介・スタジアム情報（THE CLUBセクション用）
alter table public.clubs
  add column stadium_name text,
  add column description text;

-- 試合のキックオフ時刻・会場（NEXT MATCHセクション用）
alter table public.matches
  add column kickoff_time time,
  add column venue text;
