-- 移籍種別に「ローン終了」を追加する
alter table public.transfers
  drop constraint transfers_transfer_type_check;

alter table public.transfers
  add constraint transfers_transfer_type_check
  check (transfer_type in ('signing', 'sale', 'loan_out', 'loan_in', 'free', 'youth_promotion', 'loan_end'));
