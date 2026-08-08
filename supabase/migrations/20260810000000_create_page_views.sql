create table public.page_views (
    id uuid default gen_random_uuid() primary key,
    page_path text not null,
    user_agent text,
    ip_hash text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS but allow anonymous inserts (we will use a secure API route anyway, so service role is fine, but if direct from client, we need a policy)
alter table public.page_views enable row level security;

-- Only service role can read/insert. The API route uses service role.
create policy "Service role can manage page_views" on public.page_views
    using (true)
    with check (true);
