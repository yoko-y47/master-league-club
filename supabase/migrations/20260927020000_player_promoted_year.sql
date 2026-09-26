-- ユースからトップチームへ昇格した年を自由に設定できるようにする
alter table public.players add column promoted_year int;
