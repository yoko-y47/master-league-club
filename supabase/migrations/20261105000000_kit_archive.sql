-- Kit Archive（3D のユニフォーム展示）のデータ
-- 単体版（kit-archive）と、このアプリの統合版が同じデータを使う。1着 = 1行
-- 既存の uniforms（シーズン × home/away/third の画像1枚）はそのまま残し、ここからサムネイルとして参照する
--
-- 方針
-- - 権限は既存のテーブルと同じ「クラブの所有者だけが読み書きできる」。誰でも読める設定は作らない
-- - シーズンは文字（season_label）と開始年（season_start_year）で持つ。単体版は seasons にひも付けない（season_id は空でよい）
-- - 同じシーズン・種別の重複は許可する（画面で警告して確認する）ため、unique 制約は付けない
-- - 3D の形は共通の型紙（model_key）を使い、1着ずつの違いはキット画像（texture_path）で出す。GLB はアプリに同梱する

create table public.kits (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  season_label text,
  season_start_year int check (season_start_year between 1850 and 2100),
  kit_type text check (kit_type in ('home', 'away', 'third', 'cup', 'gk')),
  variant text,
  variant_order int not null default 0,
  sort_hint int not null default 0,
  name text not null,
  model_key text not null default 'standard',
  texture_path text,
  collar smallint check (collar between 1 and 13),
  display_color text,
  display_scale numeric(4, 2) not null default 1,
  hanger_visible boolean not null default true,
  legacy_uniform_id uuid references public.uniforms(id) on delete set null,
  is_placeholder boolean not null default false,
  source_id text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((season_label is null) = (season_start_year is null)),
  unique (club_id, source_id)
);

comment on column public.kits.season_label is 'シーズン表記（例 2026-27、1年なら 2026）。未設定は null';
comment on column public.kits.season_start_year is 'シーズン開始年。並び順に使う（新しいほど手前）';
comment on column public.kits.model_key is '3D の型紙。standard = 吊り下げ形 kit_hanging.glb / 着用形 kit_base.glb（アプリに同梱）';
comment on column public.kits.texture_path is 'キット画像（UV 展開の PNG）。kit-textures バケット内のパス <club_id>/<ファイル名>';
comment on column public.kits.legacy_uniform_id is 'サムネイルに使う既存の 2D 画像（uniforms）';
comment on column public.kits.source_id is '移行元の ID（kits.json の placeholder-01 など）。同じものを二重に取り込まないため';

create index on public.kits (club_id);
create index on public.kits (season_id);
create index on public.kits (legacy_uniform_id);

alter table public.kits enable row level security;

-- ひも付ける seasons / uniforms も同じクラブのものに限る
create policy "kits_owner" on public.kits
  for all
  using (club_id in (select id from public.clubs where owner_id = auth.uid()))
  with check (
    club_id in (select id from public.clubs where owner_id = auth.uid())
    and (season_id is null or season_id in (select id from public.seasons where club_id = kits.club_id))
    and (legacy_uniform_id is null or legacy_uniform_id in (select id from public.uniforms where club_id = kits.club_id))
  );

-- キット画像用のStorageバケット（非公開。表示は署名付き URL で行う）
-- パスの先頭のフォルダはクラブの id（<club_id>/<ファイル名>）。そのクラブの所有者だけが読み書きできる
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kit-textures', 'kit-textures', false, 16777216, array['image/png'])
on conflict (id) do nothing;

create policy "kit_textures_owner_select"
on storage.objects for select
using (
  bucket_id = 'kit-textures'
  and (storage.foldername(name))[1] in (select id::text from public.clubs where owner_id = auth.uid())
);

create policy "kit_textures_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'kit-textures'
  and (storage.foldername(name))[1] in (select id::text from public.clubs where owner_id = auth.uid())
);

create policy "kit_textures_owner_update"
on storage.objects for update
using (
  bucket_id = 'kit-textures'
  and (storage.foldername(name))[1] in (select id::text from public.clubs where owner_id = auth.uid())
);

create policy "kit_textures_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'kit-textures'
  and (storage.foldername(name))[1] in (select id::text from public.clubs where owner_id = auth.uid())
);
