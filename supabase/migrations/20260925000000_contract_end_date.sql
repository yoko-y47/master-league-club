-- シーズン所属ごとの契約満了日（契約更新・満了管理用）
alter table public.squad_memberships
  add column contract_end_date date;
