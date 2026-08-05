-- ─────────────────────────────────────────────────────────────────────────────
-- 0019  XPDX core schema
--
-- Phase 2 of the Cars365 → XPDX Rentals conversion. Replaces the used-car
-- sales schema (migrations 0001–0018) with the van-hire model from
-- CLAUDE.md §6.
--
-- ⚠ THIS MIGRATION IS DESTRUCTIVE. It drops every table from the car-sales
--   schema. CLAUDE.md §6 permits this on the stated assumption that this is a
--   pre-launch product with no production data to preserve. THAT ASSUMPTION IS
--   UNCONFIRMED — see docs/conversion/01-plan.md Q2. Do not apply this against
--   a project holding real leads until it has been confirmed.
--
-- Shape of the change:
--   • A car listing is one unit that sells once and disappears. A van is a
--     fleet model that stays, is priced per week, and is either available or
--     not. So: no VIN, no odometer, no build year, no colour, no price
--     history, no sale state.
--   • Single tenant, one yard at Condell Park. No makes/models taxonomy, no
--     locations table, no dealer scoping.
--   • Leads are the product and are the only thing the public can write.
--
-- Kept from the old schema (not recreated here): profiles, admin_roles,
-- activity_logs, settings, faqs, testimonials, redirects, and the
-- app_private.is_staff() / has_staff_role() helpers every policy depends on.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Drop the car-sales schema ────────────────────────────────────────────
-- Order matters: syndication FKs reference vehicles, so those go first.
-- `cascade` on the enums cleans up any column defaults that reference them.

drop table if exists public.syndication_event         cascade;
drop table if exists public.sync_run                  cascade;
drop table if exists public.channel_enum_map          cascade;
drop table if exists public.channel_override          cascade;
drop table if exists public.channel_listing           cascade;
drop table if exists public.channel_connection        cascade;
drop table if exists public.channel                   cascade;
drop table if exists public.syndication_vehicle_extra cascade;
drop table if exists public.syndication_dealer        cascade;
drop table if exists public.webhook_events            cascade;

drop table if exists public.chat_messages             cascade;
drop table if exists public.chat_threads              cascade;
drop table if exists public.bids                      cascade;

drop table if exists public.blog_articles             cascade;
drop table if exists public.blog_posts                cascade;
drop table if exists public.blog_categories           cascade;
drop table if exists public.pages                     cascade;
drop table if exists public.newsletter_subscribers    cascade;

drop table if exists public.search_index_jobs         cascade;

drop table if exists public.vehicle_daily_stats       cascade;
drop table if exists public.vehicle_price_history     cascade;
drop table if exists public.vehicle_features          cascade;
drop table if exists public.vehicle_images            cascade;

-- lead_events / lead_reminders FK into leads; drop before it.
drop table if exists public.lead_reminders            cascade;
drop table if exists public.lead_events               cascade;
drop table if exists public.leads                     cascade;

drop table if exists public.vehicles                  cascade;
drop table if exists public.features                  cascade;
drop table if exists public.models                    cascade;
drop table if exists public.makes                     cascade;
drop table if exists public.locations                 cascade;
drop table if exists public.media_assets              cascade;

-- Functions belonging to deleted features.
drop function if exists public.handle_vehicle_price_change()      cascade;
drop function if exists public.enqueue_search_index_job()         cascade;
drop function if exists public.get_admin_dashboard_metrics(integer) cascade;
drop function if exists public.increment_vehicle_view(uuid)       cascade;
drop function if exists public.record_cta_click(uuid, text)       cascade;
drop function if exists public.record_cta_click(uuid, text, text) cascade;
drop function if exists public.expire_stale_vdps()                cascade;
drop function if exists public.touch_syndication_vehicle_extra()  cascade;
drop function if exists public.create_lead_with_event(jsonb)      cascade;
drop function if exists public.anonymize_stale_leads(integer)     cascade;

-- Enums. `cascade` because dropped tables may not have taken every dependency.
drop type if exists public.fuel_type                  cascade;
drop type if exists public.transmission_type          cascade;
drop type if exists public.body_type                  cascade;
drop type if exists public.drive_type                 cascade;
drop type if exists public.vehicle_status             cascade;
drop type if exists public.feature_category           cascade;
drop type if exists public.lead_type                  cascade;
drop type if exists public.lead_status                cascade;
drop type if exists public.lead_loss_reason           cascade;
drop type if exists public.blog_status                cascade;
drop type if exists public.bid_status                 cascade;
drop type if exists public.syndication_condition      cascade;
drop type if exists public.syndication_price_type     cascade;
drop type if exists public.au_state                   cascade;
drop type if exists public.channel_transport_kind     cascade;
drop type if exists public.channel_auth_kind          cascade;
drop type if exists public.channel_connection_status  cascade;
drop type if exists public.channel_listing_state      cascade;
drop type if exists public.sync_run_trigger           cascade;
drop type if exists public.sync_run_status            cascade;
drop type if exists public.media_processing_status    cascade;

-- `device_type` and `testimonial_source` survive; `staff_role` is load-bearing
-- for app_private.has_staff_role() and must not be dropped.

-- `testimonials` survives, but it carried FKs into `media_assets` and
-- `vehicles`. The `cascade` above drops those CONSTRAINTS and leaves the
-- columns behind as orphaned uuids pointing at nothing, so drop them
-- explicitly. A testimonial is about the business, not a specific van.
alter table public.testimonials drop column if exists photo_media_id;
alter table public.testimonials drop column if exists vehicle_id;

-- ── 2. Enums ────────────────────────────────────────────────────────────────

-- Availability, not sale state. A van is never "sold".
create type public.van_status as enum ('draft', 'available', 'limited', 'unavailable');

create type public.roof_height as enum ('standard', 'low', 'high');

create type public.lead_status as enum ('new', 'contacted', 'quoted', 'won', 'lost', 'spam');

-- ── 3. vans — fleet models, not physical units ──────────────────────────────

create table public.vans (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  body_type           text not null,              -- 'HiAce' | 'Sprinter'
  wheelbase_label     text not null,              -- 'LWB' | 'SWLB' | 'SWB' | 'MWB'
  roof                public.roof_height not null,
  tonnage             numeric(3,1) not null,      -- 1.0 | 2.0 | 2.5
  transmission        text not null default 'Automatic',
  fuel                text not null default 'Diesel',
  seats               smallint,

  -- Whole AUD, not cents. Rates are quoted in whole dollars per week and the
  -- site never computes a total, so cents would be false precision.
  price_weekly_from   integer not null,
  price_monthly_from  integer,
  min_hire_days       smallint not null default 28,
  -- The weekly rates are inferred from the old site's tonnage-based pricing
  -- and are NOT client-confirmed. The staff portal badges any van where this
  -- is false so unverified pricing is visible at a glance (CLAUDE.md §3, §7).
  price_verified      boolean not null default false,

  length_mm           integer,
  height_mm           integer,
  width_mm            integer,
  wheelbase_mm        integer,
  load_volume_m3      numeric(4,1),
  payload_kg          integer,
  -- Indicative manufacturer figures for the body type, not measured.
  dimensions_verified boolean not null default false,

  features            text[] not null default '{}',
  summary             text,                        -- card blurb
  description         text,                        -- detail page body
  seo_title           text,
  seo_description     text,

  status              public.van_status not null default 'draft',
  sort_order          smallint not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint vans_price_weekly_positive check (price_weekly_from > 0),
  constraint vans_price_monthly_positive check (price_monthly_from is null or price_monthly_from > 0),
  -- 28 days is the contractual minimum everywhere on the site. Nothing may
  -- imply daily or weekly hire is available (CLAUDE.md §3, "Resolved").
  constraint vans_min_hire_at_least_28 check (min_hire_days >= 28)
);

create index idx_vans_status on public.vans (status);
create index idx_vans_sort on public.vans (sort_order, name);

create table public.van_images (
  id           uuid primary key default gen_random_uuid(),
  van_id       uuid not null references public.vans(id) on delete cascade,
  storage_path text not null,
  -- Not nullable and not blank: this is an SEO site and a screen-reader
  -- audience that works outdoors. Blank alt fails validation in the portal;
  -- the check makes it fail at the database too.
  alt          text not null,
  sort_order   smallint not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),

  constraint van_images_alt_not_blank check (length(btrim(alt)) > 0)
);

-- At most one primary image per van.
create unique index van_images_one_primary on public.van_images (van_id) where is_primary;
create index idx_van_images_van on public.van_images (van_id, sort_order);

-- ── 4. leads — the product ──────────────────────────────────────────────────

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,                     -- E.164 normalised
  email         text not null,
  suburb        text,
  van_id        uuid references public.vans(id) on delete set null,
  van_slug_raw  text,                              -- survives a van deletion
  duration      text,                              -- '1 month' | '2-3 months' | ...
  start_date    date,
  message       text,

  source        text not null default 'website',   -- website | whatsapp | phone | walk-in
  page_path     text,
  referrer      text,
  utm           jsonb not null default '{}'::jsonb,

  -- Retained from the old schema against CLAUDE.md §6's column list, which
  -- omits both. `ip_hash` is a salted hash, never a raw IP, and is what makes
  -- the §9 rate limiting and duplicate detection work — dropping it would
  -- weaken the anti-spam posture the same section asks for. `device` costs one
  -- byte and is the only signal for how the enquiry was made. See
  -- docs/conversion/01-plan.md D5.
  ip_hash       text,
  device        public.device_type,
  consent       jsonb not null default '{}'::jsonb,

  -- Overflow for anything a future form adds, so a new field is not a
  -- migration. The named columns above stay the queryable surface. See D4.
  payload       jsonb not null default '{}'::jsonb,

  status        public.lead_status not null default 'new',
  staff_notes   text,
  assigned_to   uuid references auth.users(id) on delete set null,
  contacted_at  timestamptz,
  created_at    timestamptz not null default now(),

  constraint leads_name_not_blank  check (length(btrim(name)) > 0),
  constraint leads_phone_not_blank check (length(btrim(phone)) > 0)
);

create index idx_leads_status_created on public.leads (status, created_at desc);
create index idx_leads_phone on public.leads (phone);
create index idx_leads_van on public.leads (van_id);

-- Immutable per-lead timeline. CLAUDE.md §6 lists four tables and omits this
-- one, but for a business whose entire model is the lead pipeline, knowing why
-- a lead is in its current state is worth one small table — and the atomic
-- insert below depends on it. See docs/conversion/01-plan.md D6.
create table public.lead_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  actor_id   uuid references auth.users(id) on delete set null,
  event      text not null check (event in (
    'created', 'status_changed', 'note', 'assigned', 'notified'
  )),
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_lead_events_lead on public.lead_events (lead_id, created_at);

-- ── 5. Triggers ─────────────────────────────────────────────────────────────

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_vans_updated_at
before update on public.vans
for each row execute function public.update_updated_at_column();

-- ── 6. Atomic lead insert ───────────────────────────────────────────────────
-- One round trip, one transaction: the lead row and its 'created' event either
-- both land or neither does. CLAUDE.md §9 makes lead durability the highest
-- priority in the product, so the write must not be two statements that can
-- half-fail.
--
-- SECURITY DEFINER with a locked search_path. Callable only by the service
-- role from the server-side enquiry route — never from the browser.

create or replace function public.create_lead_with_event(p_lead jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
begin
  insert into public.leads (
    name, phone, email, suburb, van_id, van_slug_raw, duration, start_date,
    message, source, page_path, referrer, utm, ip_hash, device, consent,
    payload, status
  )
  values (
    p_lead->>'name',
    p_lead->>'phone',
    p_lead->>'email',
    nullif(p_lead->>'suburb', ''),
    nullif(p_lead->>'van_id', '')::uuid,
    nullif(p_lead->>'van_slug_raw', ''),
    nullif(p_lead->>'duration', ''),
    nullif(p_lead->>'start_date', '')::date,
    nullif(p_lead->>'message', ''),
    coalesce(nullif(p_lead->>'source', ''), 'website'),
    nullif(p_lead->>'page_path', ''),
    nullif(p_lead->>'referrer', ''),
    coalesce(p_lead->'utm', '{}'::jsonb),
    nullif(p_lead->>'ip_hash', ''),
    nullif(p_lead->>'device', '')::public.device_type,
    coalesce(p_lead->'consent', '{}'::jsonb),
    coalesce(p_lead->'payload', '{}'::jsonb),
    coalesce(nullif(p_lead->>'status', ''), 'new')::public.lead_status
  )
  returning id into v_lead_id;

  insert into public.lead_events (lead_id, event, data)
  values (v_lead_id, 'created', jsonb_build_object('source', coalesce(p_lead->>'source', 'website')));

  return v_lead_id;
end;
$$;

revoke all on function public.create_lead_with_event(jsonb) from public, anon, authenticated;

-- Privacy hygiene: strip PII from long-closed leads while keeping the row for
-- reporting. Driven by the reminders cron.
create or replace function public.anonymize_stale_leads(p_months integer default 36)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with updated as (
    update public.leads
    set name = 'Redacted',
        phone = 'redacted',
        email = 'redacted',
        message = null,
        suburb = null,
        ip_hash = null,
        staff_notes = null,
        payload = '{}'::jsonb
    where created_at < now() - make_interval(months => p_months)
      and name <> 'Redacted'
    returning 1
  )
  select count(*) into v_count from updated;
  return v_count;
end;
$$;

revoke all on function public.anonymize_stale_leads(integer) from public, anon, authenticated;

-- ── 6b. CTA click tracking ──────────────────────────────────────────────────
-- CLAUDE.md §9: "tel: and wa.me clicks are conversions too. Track them."
--
-- The old `record_cta_click` wrote into `vehicle_daily_stats`, a pre-aggregated
-- analytics table that exists to feed the admin dashboard §7 removes. This
-- replaces it with a plain append-only event log: six vans do not need
-- pre-aggregation, and raw rows keep the option of asking a question nobody
-- anticipated. Nothing renders this in the portal — it is a conversion signal.

create table public.cta_clicks (
  id         uuid primary key default gen_random_uuid(),
  van_id     uuid references public.vans(id) on delete set null,
  channel    text not null check (channel in ('call', 'whatsapp', 'enquire')),
  page_path  text,
  created_at timestamptz not null default now()
);
create index idx_cta_clicks_created on public.cta_clicks (created_at desc);

create or replace function public.record_cta_click(
  p_van_id uuid,
  p_channel text,
  p_page_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cta_clicks (van_id, channel, page_path)
  values (p_van_id, p_channel, p_page_path);
end;
$$;

revoke all on function public.record_cta_click(uuid, text, text) from public, anon, authenticated;

-- ── 7. RLS ──────────────────────────────────────────────────────────────────

alter table public.vans        enable row level security;
alter table public.van_images  enable row level security;
alter table public.leads       enable row level security;
alter table public.lead_events enable row level security;
alter table public.cta_clicks  enable row level security;

-- vans / van_images: public read of anything not draft; full CRUD for staff.
create policy "vans public read non draft" on public.vans
for select using (status <> 'draft' or app_private.is_staff());

create policy "vans staff manage" on public.vans
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "van_images follow van read" on public.van_images
for select using (
  app_private.is_staff() or exists (
    select 1 from public.vans v
    where v.id = van_id and v.status <> 'draft'
  )
);

create policy "van_images staff manage" on public.van_images
for all using (app_private.is_staff()) with check (app_private.is_staff());

-- leads: NO public select, ever. There is deliberately no anon/authenticated
-- insert policy either — public submissions go through the service-role client
-- in the server-side enquiry route, so the browser can never write arbitrary
-- columns (CLAUDE.md §6). Staff read and update all.
create policy "leads staff read" on public.leads
for select using (app_private.is_staff());

create policy "leads staff update" on public.leads
for update using (app_private.is_staff()) with check (app_private.is_staff());

create policy "leads staff delete" on public.leads
for delete using (app_private.has_staff_role('owner', 'admin', 'manager'));

create policy "lead_events staff read" on public.lead_events
for select using (app_private.is_staff());

create policy "lead_events staff insert" on public.lead_events
for insert with check (app_private.is_staff());

-- Written only by record_cta_click() under the service role; never read or
-- written by the browser.
create policy "cta_clicks staff read" on public.cta_clicks
for select using (app_private.is_staff());

-- ── 8. Storage ──────────────────────────────────────────────────────────────

-- The old `media` and `lead-attachments` buckets are the other client's
-- (REBRAND.md §7). Their objects must be deleted from the project, which is a
-- console/API task this migration cannot perform — see docs/handover.md.
delete from storage.objects where bucket_id in ('media', 'lead-attachments');
delete from storage.buckets where id in ('media', 'lead-attachments');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'van-images', 'van-images', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

drop policy if exists "media public read"   on storage.objects;
drop policy if exists "media staff write"   on storage.objects;
drop policy if exists "media staff update"  on storage.objects;
drop policy if exists "media staff delete"  on storage.objects;
drop policy if exists "lead attachments staff read"   on storage.objects;
drop policy if exists "lead attachments staff manage" on storage.objects;

create policy "van images public read" on storage.objects
for select using (bucket_id = 'van-images');

create policy "van images staff write" on storage.objects
for insert with check (bucket_id = 'van-images' and app_private.is_staff());

create policy "van images staff update" on storage.objects
for update using (bucket_id = 'van-images' and app_private.is_staff())
with check (bucket_id = 'van-images' and app_private.is_staff());

create policy "van images staff delete" on storage.objects
for delete using (bucket_id = 'van-images' and app_private.is_staff());

-- ── 9. Settings defaults ────────────────────────────────────────────────────
-- Everything the public site renders about the business lives here so a
-- non-technical operator can change it without a deploy (CLAUDE.md §7).
--
-- Only values authorised by CLAUDE.md §3 are seeded. Opening hours and ABN are
-- TODO(client) and are seeded empty rather than guessed — an invented figure on
-- a page publishing bond and licence terms is a consumer-law problem.

insert into public.settings (key, value) values
  ('company_profile', jsonb_build_object(
    'legal_name', '',
    'trading_name', 'XPDX Rentals',
    'abn', '',
    'email', '',
    'address', '16 Ilma Street, Condell Park NSW 2200',
    'latitude', -33.9325502,
    'longitude', 151.0131701
  )),
  ('phone_numbers', jsonb_build_object(
    'primary', '0433 418 566',
    'whatsapp', '61433418566'
  )),
  ('opening_hours', jsonb_build_object()),
  ('notification_recipients', jsonb_build_object('emails', jsonb_build_array())),
  ('hire_terms', jsonb_build_object(
    'min_hire_days', 28,
    'bond', 750,
    'bond_with_toll_account', 500
  ))
on conflict (key) do update set value = excluded.value;

delete from public.settings where key in ('finance_params', 'blocked_dates');

-- ── 10. Fleet seed — the six vans from CLAUDE.md §3 ─────────────────────────
--
-- Every figure below is transcribed from §3, the only authorised source for
-- business data. Nothing here is inferred or rounded.
--
-- Deliberately NULL, because §3 does not supply them and §1.6 forbids guessing:
--   • load_volume_m3, payload_kg  — TODO(client). The Load Matcher (MOTION.md
--     §4.2) needs load_volume_m3 and runs on a size-rank fallback until it
--     arrives, marked data-provisional.
--   • width_mm, seats, price_monthly_from
--   • summary, description, seo_title, seo_description — copy is written in
--     Phase 4 and must be client-approved.
--
-- Both verification flags are false: the weekly rates are inferred from the old
-- site's tonnage-based pricing and the dimensions are indicative manufacturer
-- figures for the body type, not measured. The staff portal badges both.

insert into public.vans (
  slug, name, body_type, wheelbase_label, roof, tonnage,
  price_weekly_from, length_mm, height_mm, wheelbase_mm,
  features, status, sort_order, price_verified, dimensions_verified
) values
  ('hiace-lwb', 'Toyota HiAce LWB', 'HiAce', 'LWB', 'standard', 1.0,
   300, 5265, 1990, 3210,
   array['Cargo fit-out with bulkhead', 'Reverse camera', 'GPS tracked'],
   'available', 1, false, false),

  ('hiace-swlb', 'Toyota HiAce Super LWB', 'HiAce', 'SWLB', 'high', 2.0,
   350, 5915, 2280, 3860,
   array['Cargo fit-out with bulkhead', 'Reverse camera', 'GPS tracked'],
   'available', 2, false, false),

  ('sprinter-swb', 'Mercedes Sprinter SWB', 'Sprinter', 'SWB', 'low', 2.0,
   385, 5267, 2355, 3250,
   array['Cargo fit-out with bulkhead', 'Reverse camera', 'GPS tracked'],
   'available', 3, false, false),

  ('sprinter-mwb-low', 'Mercedes Sprinter MWB Low Roof', 'Sprinter', 'MWB', 'low', 2.0,
   385, 5932, 2355, 3665,
   array['Cargo fit-out with bulkhead', 'Reverse camera', 'GPS tracked'],
   'available', 4, false, false),

  ('sprinter-mwb-high', 'Mercedes Sprinter MWB High Roof', 'Sprinter', 'MWB', 'high', 2.5,
   400, 5932, 2670, 3665,
   array['Cargo fit-out with bulkhead', 'Reverse camera', 'GPS tracked'],
   'available', 5, false, false),

  ('sprinter-lwb-high', 'Mercedes Sprinter LWB High Roof', 'Sprinter', 'LWB', 'high', 2.5,
   400, 6967, 2715, 4325,
   array['Cargo fit-out with bulkhead', 'Reverse camera', 'GPS tracked'],
   'available', 6, false, false)
on conflict (slug) do nothing;
