-- 移籍記録はシーズン所属とは無関係なので、season_idを必須にしない
alter table public.transfers alter column season_id drop not null;
