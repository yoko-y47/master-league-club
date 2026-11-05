-- Kit Archive を ML_MyTeam を使っていない人にも使えるようにする：データの持ち主を「アーカイブ」にする
-- - kit_archives：キットのまとまり（1人が持つ）。ML_MyTeam のクラブのアーカイブは club_id でクラブとひも付ける
-- - kits は archive_id でアーカイブに属する。クラブのアーカイブのキットだけ club_id も持つ（統合版の season_id / uniforms のひも付け用）
-- - 権限：アーカイブの持ち主だけが、そのアーカイブとキット・キット画像を読み書きできる（誰でも読める設定は作らない）
-- - 使いすぎを防ぐ上限：クラブにひも付かないアーカイブは 1 人 1 つ、キットは 1 アーカイブ 200 着まで
-- 既存のクラブのキットは、クラブごとのアーカイブを作って移す（データは消えない）

create table public.kit_archives (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  club_id uuid unique references public.clubs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.kit_archives (owner_id);

alter table public.kit_archives enable row level security;
grant select, insert, update, delete on public.kit_archives to authenticated;

create policy "kit_archives_owner" on public.kit_archives
  for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (club_id is null or club_id in (select id from public.clubs where owner_id = auth.uid()))
  );

-- 既存のクラブのキットを、クラブごとのアーカイブに移す
insert into public.kit_archives (owner_id, name, club_id)
select c.owner_id, c.name, c.id
from public.clubs c
where exists (select 1 from public.kits k where k.club_id = c.id)
on conflict (club_id) do nothing;

alter table public.kits add column archive_id uuid references public.kit_archives(id) on delete cascade;

update public.kits k
set archive_id = a.id
from public.kit_archives a
where a.club_id = k.club_id and k.archive_id is null;

alter table public.kits alter column archive_id set not null;
alter table public.kits alter column club_id drop not null;
create index on public.kits (archive_id);

-- 移行元の ID の重なりはアーカイブの中で見る
alter table public.kits drop constraint kits_club_id_source_id_key;
alter table public.kits add constraint kits_archive_id_source_id_key unique (archive_id, source_id);

-- 権限：クラブの所有者 → アーカイブの持ち主
drop policy "kits_owner" on public.kits;

create policy "kits_archive_owner" on public.kits
  for all
  using (archive_id in (select id from public.kit_archives where owner_id = auth.uid()))
  with check (
    archive_id in (select id from public.kit_archives where owner_id = auth.uid())
    -- club_id はアーカイブのクラブと同じ（クラブにひも付かないアーカイブでは空）
    and club_id is not distinct from (select a.club_id from public.kit_archives a where a.id = kits.archive_id)
    and (season_id is null or season_id in (select id from public.seasons where club_id = kits.club_id))
    and (legacy_uniform_id is null or legacy_uniform_id in (select id from public.uniforms where club_id = kits.club_id))
  );

-- 上限
create function public.kit_archives_limit() returns trigger
language plpgsql as $$
begin
  if new.club_id is null and (select count(*) from public.kit_archives where owner_id = new.owner_id and club_id is null) >= 1 then
    raise exception 'kit_archives: personal archive limit reached (1 per user)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger kit_archives_limit before insert on public.kit_archives
  for each row execute function public.kit_archives_limit();

create function public.kits_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.kits where archive_id = new.archive_id) >= 200 then
    raise exception 'kits: limit reached (200 per archive)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger kits_limit before insert on public.kits
  for each row execute function public.kits_limit();

-- キット画像：パスの先頭のフォルダは、アーカイブの id（新しい形）か、クラブの id（これまでの形）
drop policy "kit_textures_owner_select" on storage.objects;
drop policy "kit_textures_owner_insert" on storage.objects;
drop policy "kit_textures_owner_update" on storage.objects;
drop policy "kit_textures_owner_delete" on storage.objects;

create policy "kit_textures_archive_select"
on storage.objects for select
using (
  bucket_id = 'kit-textures'
  and (
    (storage.foldername(name))[1] in (select id::text from public.kit_archives where owner_id = auth.uid())
    or (storage.foldername(name))[1] in (select id::text from public.clubs where owner_id = auth.uid())
  )
);

create policy "kit_textures_archive_insert"
on storage.objects for insert
with check (
  bucket_id = 'kit-textures'
  and (storage.foldername(name))[1] in (select id::text from public.kit_archives where owner_id = auth.uid())
);

create policy "kit_textures_archive_update"
on storage.objects for update
using (
  bucket_id = 'kit-textures'
  and (storage.foldername(name))[1] in (select id::text from public.kit_archives where owner_id = auth.uid())
);

create policy "kit_textures_archive_delete"
on storage.objects for delete
using (
  bucket_id = 'kit-textures'
  and (
    (storage.foldername(name))[1] in (select id::text from public.kit_archives where owner_id = auth.uid())
    or (storage.foldername(name))[1] in (select id::text from public.clubs where owner_id = auth.uid())
  )
);

-- 新しいテーブルを API から見えるようにする（Supabase の窓口が一覧を読み直す）
notify pgrst, 'reload schema';
