-- 選手一覧でのスタック表示（名/姓）用の英語氏名フィールド
-- name_en（単一フィールド）は置き換えられるが、既存データ保護のため列自体は残す
alter table public.players
  add column given_name_en text,
  add column family_name_en text;
