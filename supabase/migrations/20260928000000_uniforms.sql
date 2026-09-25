-- ユニフォーム画像（シーズン × 種別）
create table public.uniforms (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  kit_type text not null check (kit_type in ('home', 'away', 'third')),
  image_url text not null,
  created_at timestamptz not null default now(),
  unique (season_id, kit_type)
);

create index on public.uniforms (club_id);
create index on public.uniforms (season_id);

alter table public.uniforms enable row level security;

create policy "uniforms_owner" on public.uniforms
  for all
  using (club_id in (select id from public.clubs where owner_id = auth.uid()))
  with check (club_id in (select id from public.clubs where owner_id = auth.uid()));

-- ユニフォーム画像用のStorageバケット
insert into storage.buckets (id, name, public)
values ('uniforms', 'uniforms', true)
on conflict (id) do nothing;

create policy "uniforms_bucket_public_read"
on storage.objects for select
using (bucket_id = 'uniforms');

create policy "uniforms_bucket_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'uniforms'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "uniforms_bucket_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'uniforms'
  and (storage.foldername(name))[1] = auth.uid()::text
);
