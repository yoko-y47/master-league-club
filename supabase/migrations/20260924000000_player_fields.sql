-- 選手の追加項目（カナ・英語表記、体重、直接保持する年齢）
alter table public.players
  add column name_kana text,
  add column name_en text,
  add column weight_kg numeric(5, 2),
  add column age int;

-- ポジションをメイン/サブに分割
alter table public.squad_memberships
  rename column position to position_main;
alter table public.squad_memberships
  add column position_sub text;
