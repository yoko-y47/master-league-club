-- 実際の初回加入年（登録済みシーズンより前から在籍している選手の在籍年数を正しく表示するため）
alter table public.players
  add column joined_year int;
