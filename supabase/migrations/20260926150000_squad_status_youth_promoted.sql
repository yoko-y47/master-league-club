-- ユース昇格済み・トップチーム未登録の選手をstatusで表現できるようにする
alter table public.squad_memberships
  drop constraint squad_memberships_status_check;

alter table public.squad_memberships
  add constraint squad_memberships_status_check
  check (status in ('active', 'injured', 'loaned_out', 'loaned_in', 'retired', 'youth', 'youth_promoted'));
