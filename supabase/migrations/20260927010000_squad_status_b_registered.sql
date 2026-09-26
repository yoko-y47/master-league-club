-- ユース・トップチーム兼任選手（B登録）をstatusで表現できるようにする
alter table public.squad_memberships
  drop constraint squad_memberships_status_check;

alter table public.squad_memberships
  add constraint squad_memberships_status_check
  check (status in ('active', 'injured', 'loaned_out', 'loaned_in', 'retired', 'youth', 'youth_promoted', 'b_registered'));
