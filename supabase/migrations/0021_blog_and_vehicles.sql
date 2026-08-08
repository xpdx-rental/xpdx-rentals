-- 0021  Blog Tables & Vehicle Listing Enhancements

-- 1. Recreate Blog Tables
create type public.blog_status as enum ('draft', 'scheduled', 'published');

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.blog_categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text,
  cover_image_url text,
  content text not null, -- Manual mode HTML
  ai_prompt text, -- For automated blog mode
  status public.blog_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blog_posts_published on public.blog_posts(status, published_at desc);

-- RLS
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

create policy "blog_categories public read" on public.blog_categories
  for select using (true);

create policy "blog_categories staff manage" on public.blog_categories
  for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());

create policy "blog_posts public read published" on public.blog_posts
  for select using (status = 'published' or app_private.is_staff());

create policy "blog_posts staff manage" on public.blog_posts
  for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());


-- 2. Vehicle Listing Enhancements
alter table public.vans
add column make text,
add column model text,
add column year integer,
add column registration text,
add column deposit_amount integer;
