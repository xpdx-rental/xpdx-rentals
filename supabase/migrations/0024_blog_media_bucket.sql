-- 0024 Blog Media Bucket

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media', 'blog-media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do nothing;

create policy "blog media public read" on storage.objects
for select using (bucket_id = 'blog-media');

create policy "blog media staff write" on storage.objects
for insert with check (bucket_id = 'blog-media' and app_private.is_staff());

create policy "blog media staff update" on storage.objects
for update using (bucket_id = 'blog-media' and app_private.is_staff())
with check (bucket_id = 'blog-media' and app_private.is_staff());

create policy "blog media staff delete" on storage.objects
for delete using (bucket_id = 'blog-media' and app_private.is_staff());
