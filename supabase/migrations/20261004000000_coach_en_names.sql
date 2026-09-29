-- コーチ(スタッフ)にも選手と同じ英語姓・名を追加する
alter table public.coaches add column given_name_en text, add column family_name_en text;
