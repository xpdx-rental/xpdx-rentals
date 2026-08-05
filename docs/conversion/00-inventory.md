# 00 — Inventory & mapping report

**Phase 0. Read-only.** No file in this repository was created, edited, moved,
renamed or deleted while producing this report, other than this file and
`01-plan.md`. No migrations run, no dependencies changed.

Everything below was read from the repository as it stands at
`7dcbe0c` on branch `claude/xpdx-rentals-kickoff-520ed9`. Where the conversion
spec references something that does not exist here, it is marked
**`NOT IN REPO`**.

---

## 0. Known traps — confirmed understood

Restating these so the record shows they were read before any code was touched:

1. **Never bulk-replace the substring `car`.** This repo has `Card`,
   `CardHeader`, `CardContent`, `CardTitle` (shadcn, in ~40 files), `discard`,
   `wildcard`, `cart`, `Carousel`-adjacent naming, plus `carbon` in CSS. It is
   also about to become a **cargo** van site. `sed s/car/van/g` yields `Vand`,
   `discvan`, `vango` — and most of it still compiles. Renames will be done
   whole-token, case-sensitive, from the `REBRAND.md` §4 table, reviewed hit by
   hit with `rg`. Never `sed -i` across the tree.
2. **`vehicle` is correct in prose, wrong as an identifier.** The client's own
   approved copy says "commercial vehicle rental" and "every vehicle in our
   fleet". The `vehicle` → `van` rename is scoped to code only: types, tables,
   columns, routes, filenames, variables. `docs/content/supplied-copy.md` and
   anything that renders as body copy is off limits.
3. **`365` appears in date maths and TTLs.** I will match `cars365` / `car365` /
   `cars-365` as units, never the bare number. Note this repo's canonical domain
   string is the **hyphenated** `www.cars-365.com.au`, which is the form that
   actually appears in code — the unhyphenated `cars365` appears mostly in prose
   and in one real email address.

---

## 1. Other-client exposure — **BLOCKING, read this first**

Per `REBRAND.md` §3 this must be handled before Phase 1. Four findings, one of
them urgent.

### 1.1 🔴 A live GitHub Personal Access Token is in the git remote URL

```
origin  https://github_pat_11CIRY35I0Gjf08Oq54Aam_cxIv…@github.com/cars365-aus/car365.git
```

The token is embedded in `origin`'s URL in the repository config. It is a real,
currently-configured credential belonging to the **other client's** GitHub org
(`cars365-aus`). Anyone who obtains a copy of this working directory obtains
push access to their repository.

**This needs to be revoked at GitHub now, by you — I have not touched it and
will not.** It should be revoked before any further work, not merely rewritten
out of the config, because the value has already been on disk and in this
session's tool output.

Note it is in `.git/config`, not in a tracked file, so the `rg` sweeps in
`REBRAND.md` §3.2 (which glob `*.json`, `*.env*`, `*.yml`) would **not** have
caught it. Worth adding `git remote -v` to that checklist.

### 1.2 🔴 This worktree cannot start clean history — structural conflict

`REBRAND.md` §3.1 requires `rm -rf .git && git init -b main`. That is not
possible from here:

- `.git` is a **file**, not a directory:
  `gitdir: C:/Users/yadav/Desktop/cars100/XPDX/.git/worktrees/xpdx-rentals-kickoff-520ed9`
- History lives in the parent repo at `C:/Users/yadav/Desktop/cars100/XPDX/.git`.
- History is **116 commits** across two contributors:
  `Bikash <ybikash919@gmail.com>` (115) and
  `admin-car365 <admin.car365@gmail.com>` (1) — the second is the other client's
  account, and their identity would ship with any handover.

The clean-history import has to happen at the parent level, outside this
worktree, as a separate manual step. See `01-plan.md` Q1.

### 1.3 🟠 Other client's real business identity is hardcoded in source

Not fixtures — production fallbacks that render on live pages:

| File | Value |
|---|---|
| `src/lib/data/settings.ts:35` | `profile.email = "Sales@cars365.info"` — **overwrites the DB value unconditionally**, so it is not even a fallback |
| `src/lib/data/settings.ts:48` | `"1800 CAR 365"`, `"+61451344477"` — real phone numbers |
| `src/app/(public)/about/page.tsx:8` | "Used Car Dealer in **Granville, NSW**" — the other client's real suburb |
| `src/app/(public)/contact/page.tsx:13` | "Contact Cars365 — **Granville, NSW**" |
| `src/lib/email/ses.ts:50,51,306,308` | `noreply@cars-365.com.au`, `support@cars-365.com.au`, `Cars365 Support` |
| `src/app/api/cron/reminders/route.ts:32` | `support@cars-365.com.au` |
| `src/app/geo-blocked/page.tsx:34` | `support@cars-365.com.au` |
| `src/lib/seo/site.ts:5` | `https://www.cars-365.com.au` — canonical base URL fallback |
| `supabase/config.toml:226` | `admin_email = "noreply@cars-365.com.au"` |
| `public/llms.txt` | 7 absolute `cars-365.com.au` URLs |
| `src/lib/syndication/adapters/*.ts` | 3 more hardcoded `cars-365.com.au` listing URLs |

`src/lib/data/settings.ts:35` is the worst of these: it silently ignores whatever
the operator configures and always publishes the other client's email address.

### 1.4 🟢 Clear on the things I expected to be worse

- **`.env.example` contains no real values.** Every key is blank. The only
  tracked env file is `.env.example`; no `.env.local`/`.env.production` is
  present or tracked. Nothing to rotate from the tree itself — but see §1.1,
  and per `REBRAND.md` "assume exposed" still applies to anything that was ever
  committed historically (not audited; requires the full-history scan noted in
  `01-plan.md` Q1).
- **Seed data is generic, not real.** `0010_seed.sql` uses
  `Your Dealership Pty Ltd`, `sales@example.com`, `1 Example St`,
  `Main Showroom`. No real customers, no real listings, no real dealer records.
- **Test fixtures are synthetic.** `0400000000`, `0412345678` — placeholder
  phone numbers only.
- **No uploaded inventory imagery in the repo.** `public/images/` holds
  body-type illustrations and two stock images; no real vehicle photos. Note
  `public/perth-city.jpg` / `public/perth.png` are the only geographically odd
  assets and appear unused. Storage-bucket contents are on the live Supabase
  project and are **out of my reach** — that purge is a client/infra task.

---

## 2. Route inventory

Verdicts: **KEEP** (survives as-is or near), **RENAME** (concept survives, name
and shape change), **DELETE** (goes in Phase 1).

Note the spec's `app/(staff)/` does not exist. This repo's staff boundary is
`app/admin/` with a separate `app/admin-login/` entry point — which already
satisfies the "separate entry point, own layout" requirement of `CLAUDE.md` §7.

### Public — `src/app/(public)/` and root

| Route | Type | What it is | Verdict |
|---|---|---|---|
| `/` (`app/page.tsx`, 500+ lines) | PUBLIC | Home. Hero + search, featured cars, "Every car inspected / Roadworthy included / Finance available / Trade-ins welcome", 4-step buy journey, guides linking to `/how-it-works`, `/finance`, `/sell-your-car`. Pulls 3 images from `images.unsplash.com` | **DELETE** content, rebuild in Phase 4. Shell/layout patterns reusable |
| `/used-cars` | PUBLIC | Inventory index + filters + pagination | **RENAME** → `/vans`. Shape is right; six items means filters mostly go |
| `/used-cars/[make]` | PUBLIC | Make landing page (programmatic SEO) | **DELETE** — no make/model taxonomy in a 6-van fleet |
| `/used-cars/[make]/[model]` | PUBLIC | Make+model landing | **DELETE** |
| `/used-cars/[make]/[model]/[slug]` | PUBLIC | Vehicle detail page (VDP) | **RENAME** → `/vans/[slug]`, flat. The nested make/model path is the wrong shape |
| `/used-cars/body/[bodyType]` | PUBLIC | Body-type landing | **DELETE** |
| `/search` (+ layout) | PUBLIC | Typesense-backed search UI | **DELETE** — see §4 dependency audit |
| `/finance` | PUBLIC | Finance calculator + finance lead form | **DELETE** — `CLAUDE.md` §1.2/§2 |
| `/trade-in` | PUBLIC | Trade-in valuation form | **DELETE** |
| `/sell-your-car` | PUBLIC | Sell-to-us funnel | **DELETE** |
| `/how-it-works` | PUBLIC | "How buying a car from Cars365 works" | **DELETE** |
| `/about` | PUBLIC + `about-client.tsx` | About, incl. "Unknown History / Hidden Fees / Pushy Sales Tactics" | **RENAME** → `/about-us`, content fully replaced from `supplied-copy.md` |
| `/contact` | PUBLIC | Contact + map + form | **RENAME** → `/contact-us` |
| `/faq` | PUBLIC | FAQ | **RENAME** → `/faq`. ⚠️ see below |
| `/faqs` | PUBLIC | **A second, different FAQ page** | **DELETE** — duplicate. Two live FAQ routes is an existing SEO defect, not something the conversion introduces |
| `/testimonials` | PUBLIC | Reviews, DB-driven | **KEEP** — client has none supplied yet; likely deferred, but the plumbing is sound |
| `/success-stories` | PUBLIC | Marketing stories | **DELETE** |
| `/careers` | PUBLIC | Careers | **DELETE** — not in the §8 route list |
| `/press` | PUBLIC | Press & media | **DELETE** — not in the §8 route list |
| `/thank-you` | PUBLIC | Post-submit landing | **DELETE** — `CLAUDE.md` §9 explicitly wants inline success, not a redirect |
| `/legal/[slug]` | PUBLIC | Hardcoded Terms / Privacy / Disclaimer | **RENAME** → `/privacy-policy` + `/terms-of-hire` as real routes. Content is `TODO(client)` |
| `/legal/rules` | PUBLIC | Site rules | **DELETE** |
| `/geo-blocked` | PUBLIC | 451 page for blocked countries | **KEEP** — but see risk R6 |
| `/offline` | PUBLIC | PWA offline fallback | **KEEP** |
| `/not-found.tsx` | PUBLIC | 404 | **KEEP**, rebrand |
| `/robots.ts`, `/sitemap.ts` | PUBLIC | Generated robots + sitemap | **KEEP** — genuinely good, needs rewiring to `vans` |

**Not in this repo but required by `CLAUDE.md` §8:** `/local-van-hire`,
`/delivery-van-for-rent`, `/business-van-rental`, `/service-area`. All four are
new builds in Phase 4. There is no existing service-page pattern to copy — the
closest analogue is `/used-cars/[make]`, which is a programmatic template, not a
hand-written ranking asset.

**Also absent:** there is **no `/blog` route**, despite `blog_posts`,
`blog_categories` and `blog_articles` tables and a `.kiro/specs/blog-content-hub`
spec. `public/llms.txt` advertises `https://www.cars-365.com.au/blog` to LLM
crawlers. Dead surface, delete both ends.

### Staff — `src/app/admin/`

| Route | Type | What it is | Verdict |
|---|---|---|---|
| `/admin-login` | STAFF | Separate sign-in entry point | **KEEP** — already the shape §7 asks for |
| `/admin` | STAFF | Dashboard with metrics + charts | **DELETE** — §7: "No dashboard with vanity charts." Redirect to leads |
| `/admin/leads` + `/[id]` + `actions.ts` | STAFF | Leads inbox, detail, status transitions | **KEEP** — the most valuable thing in the repo. Becomes the default landing screen |
| `/admin/inventory` + `/new` + `/[id]` + `actions.ts` | STAFF | Vehicle CRUD | **RENAME** → van list + van editor |
| `/admin/catalogue` + `actions.ts` | STAFF | Makes / models / locations reference data | **DELETE** — no taxonomy, one yard |
| `/admin/testimonials` + `actions.ts` | STAFF | Approve/reject reviews | **KEEP** (low priority) |
| `/admin/faqs` + `actions.ts` | STAFF | FAQ CMS | **KEEP** — 18 supplied FAQs are legally operative; DB-editable is right |
| `/admin/settings` + `actions.ts` | STAFF | Key/value settings incl. phone, email, finance params | **KEEP** — maps directly onto §7 screen 5. Strip `finance_params` |
| `/admin/roles` + `actions.ts` | STAFF | Staff role management | **KEEP** — trim to what one operator needs |
| `/admin/audit` | STAFF | Activity log viewer | **KEEP** (low priority) |
| `/admin/api-usage` | STAFF | Third-party API usage metering | **DELETE** — meters services being removed |
| `/admin/inventory/syndication-actions.ts` | STAFF | Channel push actions | **DELETE** |
| `/auth/sign-in` | STAFF | Second sign-in route | **DELETE** — duplicates `/admin-login`; see risk R4 |
| `/auth/mfa` | STAFF | MFA challenge | **KEEP** if MFA stays; ask client |
| `/auth/callback`, `/auth/sign-out` | API | Supabase auth callbacks | **KEEP** |

### API — `src/app/api/`

| Route | What it is | Verdict |
|---|---|---|
| `/api/v1/leads` | **The** lead endpoint. Zod → rate-limit → spam → Turnstile → `create_lead_with_event` RPC → best-effort notify | **KEEP** — near-exactly the §9 design already |
| `/api/leads` | A **second, older** lead endpoint using a different schema (`schemas.ts` not `lead.ts`) and direct email | **DELETE** — see risk R1 |
| `/api/contact` | Contact form. Topics are rental-era: `vendor_onboarding`, `enterprise` | **DELETE**, fold into `/api/v1/leads` |
| `/api/contact-events` | CTA click tracking (duplicate of `/api/v1/cta-clicks`) | **DELETE** |
| `/api/v1/cta-clicks` | `tel:`/`wa.me` click conversions | **KEEP** — §9 wants exactly this |
| `/api/v1/newsletter` | Newsletter signup | **DELETE** unless client wants it — not in the §8 route list |
| `/api/health` | Health check | **KEEP** — `REBRAND.md` §7 points the uptime monitor at it |
| `/api/geocode` | Google Maps geocoding proxy | **DELETE** — one fixed address, geo is a literal in §3 |
| `/api/search`, `/api/search/reindex` | Typesense query + reindex | **DELETE** |
| `/api/vehicles/[id]/view` | View counter | **DELETE** or fold into stats; low value at 6 vans |
| `/api/vehicles/[id]/sold` | Mark sold | **DELETE** — sale semantics |
| `/api/webhooks/meta` | Meta/Facebook Marketplace webhook | **DELETE** |
| `/api/syndication/feed/[channelCode]` | Signed outbound product feed | **DELETE** |
| `/api/cron/reminders` | Staff reminder emails, fail-closed on `CRON_SECRET` | **KEEP** — trim to unread-leads only |
| `/api/cron/price-assertion` | Price-drift assertion | **DELETE** |
| `/api/cron/syndicate` | Syndication sync run | **DELETE** |
| `/api/cron/process-webhooks` | Webhook queue drain | **DELETE** |
| `/api/cron/tiktok-sync` | TikTok display sync | **DELETE** |

`vercel.json` registers `"crons": []` — **none of these cron routes are actually
scheduled.** Whatever survives needs an external scheduler or a real `vercel.json`
entry.

---

## 3. Schema inventory

18 forward-only migrations, `0001`–`0018`, 1,926 lines. (The repo's own
`CLAUDE.md` says `0001`–`0013`; that doc is stale — five syndication migrations
landed after it was written.)

### Enums

| Enum | Verdict |
|---|---|
| `fuel_type`, `transmission_type` | **DELETE** — vans are all Diesel/Automatic; spec makes these plain `text` defaults |
| `body_type` (sedan/hatch/suv/ute/…/van) | **DELETE** — replaced by `body_type text` ('HiAce' \| 'Sprinter') |
| `drive_type` | **DELETE** |
| `vehicle_status` (draft/available/reserved/sold/archived) | **RENAME** → `van_status` (draft/available/limited/unavailable) |
| `feature_category` | **DELETE** — spec uses `features text[]` |
| `lead_type` (8 values incl. finance, trade_in, sell) | **DELETE** — spec's `leads` has no `type` |
| `lead_status` (8 values) | **RENAME** → 6 values (new/contacted/quoted/won/lost/spam) |
| `lead_loss_reason` | **DELETE** |
| `device_type` | **KEEP**-ish — spec drops it; see disagreement D5 |
| `testimonial_source` | **KEEP** |
| `blog_status` | **DELETE** |
| `staff_role` (owner/admin/manager/sales/content) | **KEEP**, trim |
| `bid_status` | **DELETE** |
| `syndication_condition`, `syndication_price_type`, `au_state`, `channel_transport_kind`, `channel_auth_kind`, `channel_connection_status`, `channel_listing_state`, `sync_run_trigger`, `sync_run_status` | **DELETE** — all syndication |
| `media_processing_status` | **DELETE** with the media pipeline, or keep if `van_images` reuses `media_assets` |
| **NOT IN REPO:** `roof_height` | New in Phase 2 |

### Tables

| Table | Notable columns | Verdict |
|---|---|---|
| `vehicles` | `stock_id`, `vin`, `registration`, `rego_expiry`, `mileage_km`, `price`, `previous_price`, `weekly_estimate`, `finance_available`, `trade_in_welcome`, `roadworthy_included`, `sold_at`, `dealer_notes`, `search_tsv` (generated), 10 indexes | **DELETE → recreate as `vans`.** Almost nothing carries over; `slug`, `status`, `seo_title`, `seo_description`, `is_featured`→`sort_order` are the only survivors |
| `vehicle_images` | FK to `media_assets`, `sort_order`, `alt_text`, `is_cover` | **RENAME** → `van_images`. Note spec uses `storage_path` direct + `is_primary`; repo indirects through `media_assets` — see disagreement D3 |
| `vehicle_features` | Join to `features` | **DELETE** — spec uses `text[]` |
| `vehicle_price_history` | Immutable price log + trigger | **DELETE** — a fixed weekly rate does not need an audit trail |
| `vehicle_daily_stats` | views / cta_clicks / leads per day | **DELETE** — §7 forbids the analytics dashboard that consumes it |
| `makes`, `models` | Reference taxonomy | **DELETE** |
| `locations` | Multi-branch, hours, geo | **DELETE** — one yard. Address/hours move to `settings` |
| `features` | Managed vocabulary, `feature_category` | **DELETE** |
| `media_assets` | Storage-key registry + processing status | **DECIDE** — see D3 |
| `leads` | `type`, `payload jsonb`, `utm`, `ip_hash`, `consent`, `assignee_id`, `duplicate_of`, `loss_reason` | **RENAME/recreate.** Closest existing table to the target. Spec's version is flatter (named `suburb`, `duration`, `start_date` columns instead of `payload`) — see D4 |
| `lead_events` | Immutable timeline, 7 event types | **KEEP** — spec omits it; I'd keep it, see D6 |
| `lead_reminders` | Due-dated follow-ups | **KEEP** — feeds the surviving cron |
| `profiles` | Staff profile, `handle_new_user` trigger | **KEEP** |
| `admin_roles` | Role grants | **KEEP** |
| `activity_logs` | Audit trail | **KEEP** |
| `testimonials` | Approved-review store | **KEEP** |
| `faqs` | Q/A CMS with published flag | **KEEP** |
| `pages` | Generic CMS pages | **DELETE** — 4 static legal/service pages don't need a CMS |
| `blog_categories`, `blog_posts`, `blog_articles` | Two parallel blog schemas, **no route consumes either** | **DELETE** |
| `newsletter_subscribers` | Email capture | **DELETE** (pending client) |
| `redirects` | DB-driven 301s | **KEEP** — directly useful for the WordPress cutover in Phase 6 |
| `settings` | Key/value JSONB | **KEEP** — the §7 screen-5 store already exists |
| `search_index_jobs` | Typesense outbox | **DELETE** |
| `bids`, `chat_threads`, `chat_messages` | Buyer↔staff bidding + messaging | **DELETE** — buyer accounts, negotiation; no route consumes them |
| `syndication_dealer`, `syndication_vehicle_extra`, `channel`, `channel_connection`, `channel_listing`, `channel_override`, `channel_enum_map`, `sync_run`, `syndication_event` | 9 tables, migrations `0014`–`0018` | **DELETE** — entire module |
| `webhook_events` | Inbound webhook queue | **DELETE** |

**Count: 34 tables today → 4 in the target** (`vans`, `van_images`, `leads`,
`profiles`) plus the ~7 I argue for keeping (`settings`, `faqs`, `testimonials`,
`redirects`, `admin_roles`, `activity_logs`, `lead_events`, `lead_reminders`).

### Functions

| Function | Verdict |
|---|---|
| `app_private.is_staff()` | **KEEP** — every RLS policy depends on it |
| `app_private.has_staff_role(variadic)` | **KEEP** |
| `public.create_lead_with_event(jsonb)` | **KEEP** — atomic lead+event insert, exactly the §9 durability primitive |
| `public.update_updated_at_column()` | **KEEP** |
| `public.handle_new_user()` | **KEEP** |
| `public.anonymize_stale_leads(months)` | **KEEP** — privacy hygiene |
| `public.handle_vehicle_price_change()` | **DELETE** |
| `public.enqueue_search_index_job()` | **DELETE** |
| `public.get_admin_dashboard_metrics()` | **DELETE** |
| `public.increment_vehicle_view()` | **DELETE** |
| `public.record_cta_click()` | **RENAME/reshape** — §9 wants CTA conversions tracked |
| `public.expire_stale_vdps()` | **DELETE** — sale-lifecycle delisting |
| `public.touch_syndication_vehicle_extra()` | **DELETE** |

### Triggers

`trg_vehicle_price_change` **DELETE** · `trg_vehicles_search_index` **DELETE** ·
`on_auth_user_created` **KEEP** · `trg_bids_updated_at` **DELETE** ·
`trg_chat_threads_updated_at` **DELETE** ·
`trg_touch_syndication_vehicle_extra` **DELETE**

### RLS policies

**71 policies** across the schema. All syndication / blog / bids / chat /
taxonomy policies **DELETE** with their tables. Two things to carry forward:

- `leads` already has **no anon/authenticated insert policy** — public
  submissions go through the service-role client only. That is precisely what
  `CLAUDE.md` §6 asks for, already built.
- ⚠️ `vehicles public read published` allows `status in ('available','reserved','sold')`.
  The new policy must be `status <> 'draft'` over the new enum. Straight
  translation would leak nothing, but it must be rewritten, not adapted.

### Storage buckets

| Bucket | Verdict |
|---|---|
| `media` — public read, staff write/update/delete | **RENAME** → `van-images` (`REBRAND.md` §7) |
| `lead-attachments` — staff-only | **DELETE** unless the enquiry form takes uploads (it does not, in the target design) |

---

## 4. Dependency audit

`package.json`: 30 runtime + 19 dev. Package manager is **npm**
(`package-lock.json`; no `pnpm-lock.yaml`). `node_modules` is not installed in
this worktree.

### Runtime

| Package | Used where | Verdict |
|---|---|---|
| `next` 16.2.6, `react`/`react-dom` 19.2.4 | Everywhere | **KEEP** |
| `@supabase/supabase-js`, `@supabase/ssr` | `src/lib/supabase/*`, `src/proxy.ts` | **KEEP** |
| `zod` ^4 | `src/lib/validation/*` | **KEEP** — §1.7 mandates it |
| `tailwind-merge`, `clsx`, `class-variance-authority` | `cn()` + `ui/*` variants | **KEEP** |
| `lucide-react` | **74 files** | **KEEP** |
| `@base-ui/react` | 5 files — shadcn primitive layer | **KEEP** |
| `sonner` | 11 files — toasts | **KEEP** |
| `sharp` | Image pipeline; required by `next/image` in prod | **KEEP** |
| `framer-motion` ^12 | 6 files | **KEEP** — `MOTION.md` §8 names it. ⚠️ see D8 |
| `nodemailer` + `@types/nodemailer` | `src/lib/email/ses.ts` | **KEEP** |
| `ioredis` | `rate-limit-redis.ts` | **KEEP** — §9 wants IP rate limiting |
| `@marsidev/react-turnstile` | 2 files | **DECIDE** — §9 says "no CAPTCHA unless spam appears". See D7 |
| `date-fns` | 2 files | **KEEP** (or drop — 2 usages, `Intl` covers it) |
| `next-themes` | Theme toggle | **DECIDE** — does a van-hire site need dark mode? Ask client |
| `@sentry/nextjs` | 1 file | **KEEP** — but `REBRAND.md` §7: **new Sentry project, never a shared DSN** |
| `@vercel/analytics`, `@vercel/speed-insights` | Root layout | **KEEP** |
| `tw-animate-css` | Tailwind v4 animation utils | **KEEP** |
| **`typesense`** ^3.0.6 | 7 files: `lib/search/typesense.ts`, `/api/search`, `/api/search/reindex`, `/search` page, `search_index_jobs`, the `enqueue_search_index_job` trigger, and a Supabase edge function | 🔴 **DELETE — strongly recommend** |
| `recharts` ^3.8.1 | **0 files** | **DELETE** — already dead |
| `xlsx` (pinned to a CDN tarball URL) | **0 files** | **DELETE** — dead, *and* a supply-chain smell: it resolves to `https://cdn.sheetjs.com/...`, not the npm registry |
| `csv-stringify` | 1 file — lead CSV export | **KEEP** if export survives; else delete |
| `@t3-oss/env-nextjs` | **0 files** | **DELETE** — the repo hand-rolls `src/lib/config.ts` instead. (Or adopt it properly for §1.7's "Zod at every boundary… env" — see D9) |

### Typesense — explicit assessment, as asked

**Remove it.** With six vans:

- The entire searchable corpus is ~6 rows and fits in a single server-rendered
  page. Any filtering is `Array.prototype.filter` on data already in memory.
- It costs a **live third-party service dependency** — an outage or an expired
  API key degrades or breaks the fleet page for zero user benefit.
- It drags a whole sync apparatus with it: the `search_index_jobs` table, the
  `enqueue_search_index_job` trigger on `vehicles`, the
  `supabase/functions/search-index-worker` edge function, `WORKER_API_KEY`,
  four `TYPESENSE_*` env vars, and a `connect-src https://*.typesense.net` entry
  in the CSP.
- It adds a `connect-src` origin to the CSP for nothing, which is a small but
  real security-posture cost.

I found **no** concrete reason to keep it. The only argument would be future
growth of the fleet, and Postgres `ilike` over six-to-sixty rows will outperform
a network round-trip to Typesense for years.

### Dev

`typescript`, `eslint` + `eslint-config-next`, `tailwindcss` + `@tailwindcss/postcss`,
`vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/*`, `fast-check`
(20 property-test files), `shadcn`, `@types/*` — **KEEP all**.
`cheerio` — **0 files**, **DELETE**.

`overrides: { postcss: ^8.5.10 }` — keep, it's a CVE pin.

---

## 5. Dead-code candidates

Checked each item the kickoff named. Findings:

| Candidate | Present? | Detail |
|---|---|---|
| **Facebook Marketplace ingest** | ✅ Yes | `/api/webhooks/meta`, `/api/cron/process-webhooks`, `webhook_events` table, `lib/syndication/adapters/meta-marketplace.ts`, `META_*` env. Note it's **egress** (catalogue push), not ingest |
| **Syndication / VDP adapters** | ✅ Yes, large | **27 files** + 5 migrations + 9 tables + 4 adapters (`google-vehicle-ads`, `meta-marketplace`, `whatsapp-catalog`, `classifieds-feed`) + signed feed tokens + volume guard + reconciliation + 2 cron routes + an admin panel + ~20 env vars. **This is the single biggest deletion in Phase 1** |
| **Finance calculators** | ✅ Yes | `/finance` page, `components/finance-calculator.tsx`, `finance-panels.tsx`, `leads/finance-form.tsx`, `lib/finance.ts` + `finance.test.ts`, `finance_params` setting, `weekly_estimate` + `finance_available` columns |
| **Trade-in** | ✅ Yes | `/trade-in` page, `leads/sell-trade-form.tsx`, `trade_in` lead type, `trade_in_welcome` column |
| **Rego lookup / Service NSW** | ❌ No | `rego` hits are only the `registration`/`rego_expiry` columns and syndication mappings. No lookup integration |
| **360° imaging** | ❌ No | `360` hits are all `$360`-style copy or Tailwind `rotate-360` |
| **Stripe / payments** | ❌ **None** | Clean |
| **Saved searches** | ❌ No | Only `search_index_jobs` |
| **Compare** | ❌ No | `compare` hits are `Array.sort` comparators |
| **Multi-tenant / dealer scoping** | ⚠️ Vestigial | No `tenant_id` anywhere; already single-tenant. But `syndication_dealer` table, `dealer_notes` column, and rental-era `vendor` strings in `/api/contact` topics survive |
| **AI helpers** | ❌ **None** | No OpenAI/Anthropic SDK, no chatbot. `anthropic` hits are `ClaudeBot` entries in `robots.ts` and the bot allowlist — legitimate, keep |

### Additional dead code I found that the kickoff did not list

- **Blog: three tables (`blog_posts`, `blog_categories`, `blog_articles`), two
  parallel schemas, zero routes.** Advertised in `public/llms.txt`.
- **Bidding + messaging: `bids`, `chat_threads`, `chat_messages`** (migration
  `0012`, 3 tables, 7 RLS policies) — **no route consumes them.**
- **`src/lib/types.ts`** — self-described "LEGACY (rental marketplace) domain
  types — pending removal", with `Vendor`, `PlanCode`, `MemberRole` types. Never
  finished being removed in the previous pivot. **This is the ghost of the last
  conversion, and it is a warning: it is exactly what `CLAUDE.md` §1.1
  ("delete, don't disable") exists to prevent.**
- **`/api/leads` alongside `/api/v1/leads`** — two lead endpoints.
- **`/api/contact-events` alongside `/api/v1/cta-clicks`** — two CTA trackers.
- **`/faq` alongside `/faqs`** — two FAQ pages.
- **`/auth/sign-in` alongside `/admin-login`** — two staff sign-ins.
- **Root-level loose scripts:** `remove-bg.mjs`, `test-email.mjs` (contains
  `cars365` strings), `scripts/fix-media-storage-keys.js`,
  `scripts/match-vehicle-images.js`, `scripts/promote-admins.js`,
  `scripts/grant-admin-role.mjs`.
- **`Used-Car-Marketplace-SRS-BRD.docx`** (94KB) — the other client's product
  spec, committed at the repo root. Delete per `REBRAND.md` §3.2.
- **`.kiro/specs/`** — 10 spec folders, all car-sales/rental era, incl.
  `whatsapp-auto-responder` and `plan-support-tiers`.
- **`docs/`** — `ARCHITECTURE.md` and `README.md` still describe a multi-tenant
  rental marketplace with Stripe/Resend/Upstash that no longer exists;
  `docs/syndication/`, `docs/platform-audit.html` (contains competitor analysis
  of cars24.com.au). All the other client's business context.
- **`public/perth-city.jpg`, `public/perth.png`, `public/LOGO.png`,
  `public/og-image.jpg`, `public/vehicle-placeholder.jpg`,
  `public/images/body-types/*` (6 files), `public/splash/*` (11 files),
  `public/screenshots/*`, `public/icons/*` (9 files)** — full Cars365 asset set.

---

## 6. Reusable core — what genuinely earns its place

This repo is worth converting rather than restarting, chiefly for these:

1. **The lead pipeline** — `/api/v1/leads` already implements
   validate → rate-limit (IP *and* phone) → spam-check → persist via atomic
   `create_lead_with_event` RPC → best-effort notify, with spam silently
   quarantined as `status='spam'` so bots aren't taught what tripped the filter.
   That is `CLAUDE.md` §9 nearly line for line, already built and already
   defensive. **Biggest single saving in the project.** One ordering nit in §7 R2.
2. **`src/proxy.ts`** (343 lines) — bot blocking, geo restriction,
   `X-Robots-Tag` injection, header stripping, admin auth with the public site
   skipping the session check for performance. Well-commented, including *why*
   the file is at `src/proxy.ts` and not root. Keep, trim rule 6.
3. **Auth & authorization** — `src/lib/security/auth.ts`: allowlist **OR**
   `app_metadata.platform_role` **OR** `admin_roles` row; redirect guards for
   Server Components and `NextResponse` guards for route handlers;
   `react.cache`-wrapped dedup. Plus `app_private.is_staff()` underpinning all
   RLS. Defense in depth, already right.
4. **SEO infrastructure** — `src/lib/seo/` is 8 modules: `jsonld.ts`,
   `metadata.ts`, `site.ts` (with a genuinely instructive comment about a
   past canonical-collapse bug), `listing.ts`, `guards.ts`, `templates.ts`, plus
   generated `sitemap.ts`/`robots.ts` and a `redirects` table. For a site whose
   whole value is local ranking, this is the second-most valuable asset here.
5. **shadcn/ui setup** — `components.json`, 14 primitives on `@base-ui/react`,
   Tailwind v4, `cn()`. Rebrand tokens, keep the machinery.
6. **Form primitives & lead forms** — `components/leads/lead-form-kit.tsx` is a
   shared kit; `lib/form-utils.ts` is unit-tested. The enquiry form is a
   reshape, not a rewrite.
7. **Admin table components** — `components/data-table.tsx` (sort tested by
   property tests), `empty-state.tsx`, `error-state.tsx`,
   `components/admin/image-upload.tsx` (client-side resize before upload —
   exactly what §7 screen 4 requires).
8. **Security utilities** — `rate-limit-redis.ts` with a loud in-memory fallback
   warning, `turnstile.ts`, `admin-allowlist.ts` (tested), `bots.ts`,
   `geo-restriction.ts` (tested).
9. **`src/lib/whatsapp.ts`** — AU phone normalization + `wa.me` link building,
   already correct for `0433 418 566` → `61433418566`. Needed by both the public
   site and the staff inbox.
10. **Test infrastructure** — Vitest + jsdom + Testing Library, and **20
    property-based test files using fast-check**. The RLS tests `CLAUDE.md` §6
    demands have somewhere to live.
11. **`next.config.ts`** — a real CSP, HSTS with preload, COOP/CORP, frame-ancestors
    none, tuned `deviceSizes`, AVIF/WebP. Keep; edit `connect-src` and
    `remotePatterns` as services are removed.
12. **`settings` table + `/admin/settings`** — §7 screen 5 already exists.

---

## 7. Risk list — harder than it looks

**R1 · Two lead endpoints, two schemas.** `/api/v1/leads` uses
`lib/validation/lead.ts`; `/api/leads` uses `lib/validation/schemas.ts`. Deleting
the wrong one silently breaks whichever forms point at it. Every form's
`fetch` target must be traced before either is removed. `src/lib/leads/submit.ts`
targets `/api/v1/leads` — but not every form goes through that helper.

**R2 · `/api/v1/leads` awaits notification before responding.** Lines 103–117:
the lead is durably inserted first (good, §9 satisfied — a broken notifier cannot
lose a lead), but `await notifyNewLead(...)` runs *before* the 201. A slow SMTP
handshake becomes user-visible latency. §9 says "insert → respond 200 → notify".
Needs `after()` or a fire-and-forget wrapper. Small fix, easy to miss.

**R3 · `vehicle` touches 98 of 293 source files (33%).** Not a rename — a
rewrite of a third of the codebase. This is why Phase 1 (delete) must genuinely
complete before Phase 2, or a large share of that 98 gets converted and then
thrown away.

**R4 · Two staff sign-in routes.** `/admin-login` and `/auth/sign-in` both exist.
`CLAUDE.md` §12 requires "public site contains no link to, or mention of, the
staff portal" and "staff portal unreachable without auth, including direct URL
and API routes". Two entry points doubles the surface for that audit. Verify
`src/proxy.ts` protects both — it currently exempts `/admin-login` by name.

**R5 · No generated Supabase types exist at all.** `src/lib/database.types.ts`
is **NOT IN REPO**. `createServerClient` is called **untyped** — `domain.ts` says
so explicitly: *"The Supabase clients are untyped, so query functions in
src/lib/data/\* shape raw rows into these types explicitly."* `CLAUDE.md` §1.7
requires "DB types generated from Supabase, not hand-written". So Phase 2 is not
"regenerate types" — it is **building that pipeline for the first time** and
then threading `Database` through three client factories and every `src/lib/data`
module. There are also 21 existing `any`/`as any` sites that §1.7 forbids.

**R6 · Geo restriction blocks everything except AU + IN.** `src/proxy.ts` rule 2
serves a 451 to the rest of the world. For a Condell Park van yard that is
arguably correct, but it will block your own review from a VPN, block Lighthouse
runs from non-AU CI, and — more seriously — **can affect crawlers**. Confirm
Googlebot's paths are exempt before launch, or Phase 6's ranking work is wasted.
Client decision, flagged in `01-plan.md` Q6.

**R7 · Syndication is 27 files / 9 tables / 5 migrations, with a `vehicles` FK.**
`syndication_vehicle_extra` references `vehicles`, and
`0013_fix_search_index_fk.sql` exists because an FK was already got wrong once
here. Drop order matters; migrations `0014`–`0018` must come out cleanly before
`vehicles` can be dropped.

**R8 · `src/lib/types.ts` is a live warning.** The *previous* pivot left legacy
types behind "pending removal" and they are still imported. If this conversion
does the same, `CLAUDE.md` §12's "nobody can tell it was ever a car sales site"
fails. Argues for aggressive Phase 1 deletion.

**R9 · `settings.ts:35` unconditionally overwrites the configured email.** Any
"just change it in the admin panel" assumption is false until that line goes.
Concretely: an operator could set their email in Phase 3, ship, and still
publish `Sales@cars365.info`.

**R10 · The migration chain cannot be cleanly reversed.** 18 applied forward-only
files. The `CLAUDE.md` §6 approach (fresh tables + drop old) is right, but
**depends on there being no production data.** Migration `0010` seeds only
generic placeholders, which suggests a dev/QA project — but I cannot verify the
live Supabase project's contents from here. **Must be confirmed before Phase 2.**

**R11 · `public.handle_new_user()` trigger fires on `auth.users` insert.** It
creates a `profiles` row for every signup. In a staff-only product that is fine,
but combined with public Supabase anon access it is worth re-verifying that
self-signup is disabled in the new project's Auth settings.

**R12 · `next.config.ts` CSP and `remotePatterns` allow `images.unsplash.com`
and `upload.wikimedia.org`.** The home page pulls three Unsplash images at
runtime. `CLAUDE.md` §1.5 / `MOTION.md` §9 forbid non-XPDX vehicle imagery — both
origins must come out of the CSP *and* `remotePatterns` when the home page is
rebuilt, or a future contributor can silently reintroduce stock photography.

**R13 · The three service pages have no precedent here.** `/local-van-hire`,
`/delivery-van-for-rent`, `/business-van-rental` must each be genuinely distinct
(§8: "thin duplicates will be treated as a failure of this phase"), and
`supplied-copy.md` contains **no copy for them.** This is the largest block of
newly-authored prose in the project and needs client sign-off. See Q4.

**R14 · Package manager mismatch.** Every spec command says `pnpm`. This repo has
`package-lock.json` and CI runs `npm ci`. There is also **no `typecheck`
script** — CI calls `npx tsc --noEmit` directly. `pnpm typecheck` as written
would fail. See D1.

---

## 8. Spec artifacts referenced but not present

| Referenced by | Path | Status |
|---|---|---|
| `CLAUDE.md` §3, §8; kickoff | `docs/content/supplied-copy.md` | **NOT IN REPO** — I have the content in this session, but Phase 4 cannot cite a file that isn't committed |
| `CLAUDE.md` §8 | `xpdx-rentals.html` (static reference prototype) | **NOT IN REPO** — this is the source for palette, type scale, layout, the FleetLine strip, and the LoadMatcher size-rank fallback. **Blocking for Phase 4/4b** |
| Kickoff | conversion `CLAUDE.md` / `MOTION.md` / `REBRAND.md` at repo root | **NOT IN REPO** — the root `CLAUDE.md` is the *existing cars365 project doc*. The conversion specs reached me as attachments only |
| `MOTION.md` §3 | `lib/motion.ts` | **NOT IN REPO** — new build, Phase 4b |
| `CLAUDE.md` §6 | `lib/database.types.ts` | **NOT IN REPO** — see R5 |
| `REBRAND.md` §5 | XPDX logo vector, favicon set, OG images | **NOT IN REPO** — client supply |
| `MOTION.md` §9 | Real photographs of the six vans | **NOT IN REPO** — client supply, 36 shots |

**One factual correction to the spec:** `CLAUDE.md` §3 gives the brand accent as
`#F0531E`; `REBRAND.md` §5 gives `--orange: #F05A22`. These are different
colours. `REBRAND.md` says `--orange` "is the one colour that must not drift".
See Q7.
