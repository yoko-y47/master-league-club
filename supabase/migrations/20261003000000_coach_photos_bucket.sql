-- コーチ・スタッフ写真アップロード用のStorageバケット
insert into storage.buckets (id, name, public)
values ('coach-photos', 'coach-photos', true)
on conflict (id) do nothing;

create policy "coach_photos_bucket_public_read"
on storage.objects for select
using (bucket_id = 'coach-photos');

create policy "coach_photos_bucket_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'coach-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "coach_photos_bucket_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'coach-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
