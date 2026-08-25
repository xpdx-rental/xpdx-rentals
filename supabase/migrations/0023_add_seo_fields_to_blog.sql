-- 0023 Add SEO and Organization Fields to Blog Posts

alter table public.blog_posts
add column categories_raw text,
add column tags_raw text,
add column meta_title text,
add column meta_description text;
