# CLAUDE.md

This file provides guidance to AI coding assistants when working with code in this repository.

@AGENTS.md

## What this project is

**XPDX Rentals** — a long-term cargo van hire website for XPDX based in Condell Park, Sydney, Australia. Visitors browse the fleet, submit enquiries, and find location-specific landing pages. Staff manage leads, vans, blog posts and settings via an admin dashboard.

> **Important:** This repo was previously a multi-tenant car-rental SaaS (cars365 / car365). The pivot to XPDX Rentals is complete. Treat any references to "vendor portal", "customer portal", Typesense, Stripe, Resend, Upstash, newsletter, chat, bids, or the multi-tenant model as dead code stubs or doc drift — **when docs and code disagree, trust the code**.

## Commands

```bash
npm run dev            # Next.js dev server (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint — zero-warnings policy
npm run typecheck      # TypeScript type check (no emit)
npm run test           # Vitest unit/property tests, single run
npm run test:watch     # Vitest watch mode
npm run test:rls       # Supabase RLS integration tests (requires live project)
npm run db:types       # Regenerate TS types from linked Supabase project
```

## Architecture

Next.js 16 App Router (React 19, Tailwind v4) on Supabase (Postgres + Auth + RLS), with `ioredis`-backed rate limiting, optional Cloudflare Turnstile, and transactional email over SMTP via `nodemailer` (AWS SES SMTP).

### Application structure under `src/app`

- **`(public)`** — the unauthenticated public site: homepage, fleet listing (`/vans`), vehicle detail pages (`/vans/[slug]`), programmatic SEO landing pages (`/van-hire/[suburb]`, `/use-cases/[slug]`, `/[serviceSlug]`), static pages (about, FAQ, contact, service area, etc.).
- **`admin`** — internal staff dashboard: `leads`, `vans`, `blog`, `roles`, `settings`, `testimonials`, `audit`, `seo`.
- **`admin-login`** — login page (redirects to `/admin` on success).
- **`auth`** — Supabase OAuth callbacks (`/auth/callback`), MFA (`/auth/mfa`), sign-out.
- **`api/v1`** — public REST endpoints: `/api/v1/enquiries` (lead capture), `/api/v1/cta-clicks` (analytics).
- **`api/cron`** — `/api/cron/reminders` — staff lead-reminder emails (protected by `CRON_SECRET`).
- **`api/health`** — `/api/health` — health check.
- **`geo-blocked`** — geo-restriction landing page (served to out-of-region visitors).
- **`offline`** — PWA offline fallback.

### Request enforcement (`src/proxy.ts`)

The file `src/proxy.ts` (NOT `middleware.ts`) is the Next.js 16 middleware. Order of enforcement:
1. Hard-block known bad-actor bots (403).
2. Geo-restriction — serve AU + IN only (451 / branded page).
3. 403 mutation requests to `/api/*` with missing/suspiciously-short UA.
4. Inject `X-Robots-Tag: noindex` on non-public paths; strip fingerprinting headers.
5. Redirect `/?code=` OAuth codes to `/auth/callback`.
6. 301 lowercase-canonicalize programmatic SEO routes (`/van-hire/*`, `/use-cases/*`, etc.).
7. Authenticate and authorize `/admin` (defence-in-depth; RLS is the backstop).

**Only `/admin` (except `/admin-login`) is auth-protected** — public pages skip the Supabase session check.

### Auth/authorization

Admin access = allowlisted email (`ADMIN_EMAIL_ALLOWLIST`) **OR** `app_metadata.platform_role` in {owner, admin, moderator} **OR** active row in `admin_roles` table.

Guards in `src/lib/security/auth.ts`:
- **Server Components/Actions**: `requireUser()`, `requireAdmin()`, `requireAdminRole(roles)`.
- **Route Handlers**: `requireApiUser()`, `requireApiAdmin()`.

`createAdminClient()` (in `src/lib/supabase/admin.ts`) **bypasses RLS** — only call it after authorization is already checked.

### Data layout (`src/lib/`)

| Module | Purpose |
|---|---|
| `src/lib/supabase/{client,server,admin}.ts` | Three Supabase clients (browser, SSR, service-role) |
| `src/lib/data/` | Read-side data access: `public-vans.ts`, `vans.ts`, `leads.ts`, `content.ts`, `settings.ts`, `rows.ts`, `use-cases.ts`, `redirects.ts` |
| `src/lib/leads/` | Lead lifecycle: `submit-enquiry.ts`, `spam-check.ts`, `channels.ts` |
| `src/lib/validation/` | Zod schemas for all inputs (`lead.ts`, `van.ts`, `content.ts`, `admin.ts`) |
| `src/lib/security/` | Auth guards, admin allowlist, rate limiting, Turnstile, geo-restriction, image validation, bot lists |
| `src/lib/email/ses.ts` | Transactional email via SMTP. No-ops when SMTP env is unset |
| `src/lib/redis.ts` | Read-through cache + `invalidateCache()`. Uses the rate-limiter's ioredis client |
| `src/lib/seo/` | JSON-LD, sitemap registry, metadata helpers, SEO quality gate, taxonomy |
| `src/lib/observability/` | API call usage tracking and provider monitoring |
| `src/lib/business.ts` | Canonical business facts: address, geo-coordinates, phone, hours |
| `src/lib/van.ts` | Van display utilities (formatting, feature lists) |

### Cron

`/api/cron/reminders` sends staff reminder emails for unread leads. Fail-closed on `CRON_SECRET` bearer auth — refuses all calls if the secret is unset. `vercel.json` does not register any crons; use an external scheduler (e.g. Vercel Cron or a managed service).

### Database

Postgres via Supabase with RLS. Migrations are **forward-only SQL files** in `supabase/migrations/` (`0001`–`0021`). Never edit schema via the Supabase dashboard; always add a new numbered file. Key tables: `vehicles`, `vehicle_images`, `vehicle_features`, `leads`, `profiles`, `admin_roles`, `activity_logs`, `testimonials`, `blog_articles`, `settings`, `content_pages`, `redirects`, `site_rows`. See `docs/DATABASE.md`.

### SEO system

- **Registry** (`src/lib/seo/registry.ts`): single source of truth for all indexable URLs. The sitemap reads from it directly — no drift.
- **Quality gate** (`src/lib/seo/quality.ts`): enforced at build time; thin/duplicate pages are excluded.
- **JSON-LD** (`src/lib/seo/jsonld.ts`): AutoRental, LocalBusiness, FAQPage, BreadcrumbList schemas.
- **Programmatic SEO**: `src/lib/seo/entities/locations.ts` (10 suburbs), `services.ts` (6 service pages), `core-pages.ts`.

### Security

- **Geo-restriction**: middleware + `src/lib/security/geo-restriction.ts`. Defaults to AU + IN. Controlled via `GEO_RESTRICTION_ENABLED`, `GEO_ALLOWED_COUNTRIES`.
- **Rate limiting**: sliding-window Lua script in ioredis (or in-memory fallback). Applied to enquiry submission and CTA clicks.
- **Turnstile**: `src/lib/security/turnstile.ts`. Optional — fails open (lead is stored, flagged `spam`).
- **Image validation**: `src/lib/security/image-validation.ts`. Applied to van image uploads.
- **CSP**: hardened Content-Security-Policy in `next.config.ts`. Never weaken it.

## Key conventions

- **Server/client boundary**: keep server components server-side. Client components have `"use client"` at the top. Heavy deps (three.js, leaflet, CKEditor) are lazy-loaded with `next/dynamic`.
- **Zero console.log in production**: only `console.error` for legitimate runtime errors is acceptable.
- **Type safety**: `strict` TypeScript. Never use `as any` or `// @ts-ignore` without an explicit justification comment.
- **ESLint zero-warnings policy**: all ESLint warnings are treated as errors in CI.
- **Env guards**: never commit secrets. All env vars are documented in `.env.example`.

## Testing

Vitest + jsdom + Testing Library. Property-based tests (fast-check) in `src/__tests__/properties/`. Co-located `*.test.ts` next to the code they cover.
