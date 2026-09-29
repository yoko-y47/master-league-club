-- ニュースのカバー画像アップロード用のStorageバケット
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

create policy "news_images_bucket_public_read"
on storage.objects for select
using (bucket_id = 'news-images');

create policy "news_images_bucket_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'news-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "news_images_bucket_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'news-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
