# 01 — Execution plan, disagreements, and open questions

Companion to `00-inventory.md`. Read that first.

Estimates are my own, in focused engineering days for one engineer, assuming
client-supplied assets arrive when needed. They exclude client turnaround time.

---

## 1. Ordered execution plan

### Phase −1 · Pre-flight (blocking, mostly not mine to do) — **0.5 day + client time**

Must complete before Phase 1 commits.

1. **Revoke the GitHub PAT in the `origin` remote URL** (`00-inventory.md` §1.1).
   Yours to do at GitHub. Treat as exposed.
2. **Decide and execute the clean-history import** (§1.2). This cannot happen
   inside this worktree — `.git` here is a pointer file into the parent repo.
   Needs a fresh checkout at the parent level, `rm -rf .git`, `git init -b main`,
   new remote. **Everything below assumes this happened; if it doesn't, Phase 7's
   leak audit fails at "git history contains no Cars365 commits".**
3. **Commit `docs/content/supplied-copy.md`** to the repo. Phase 4 depends on it.
4. **Obtain `xpdx-rentals.html`**, the static reference prototype. Phase 4/4b
   depend on it for palette, type scale and the two signature components.
5. **New Supabase project**, `ap-southeast-2`. Confirm the old project holds no
   production data worth preserving (Phase 2 drops tables).

### Phase 1 · Strip — **3 days**

Deletions only, no renames. Largest single phase by file count; simplest by
judgement.

- Syndication module: 27 source files, 4 adapters, 2 cron routes, 1 API route,
  1 admin panel, migrations `0014`–`0018`, ~20 env vars, `docs/syndication/`.
- Typesense: `lib/search/`, 2 API routes, `/search` page,
  `supabase/functions/search-index-worker`, `search_index_jobs`, the
  `enqueue_search_index_job` trigger, 5 env vars, the `*.typesense.net` CSP entry.
- Finance, trade-in, sell-your-car, how-it-works, careers, press,
  success-stories, thank-you, `/faqs`, `/legal/rules`.
- Programmatic SEO routes: `/used-cars/[make]`, `/[make]/[model]`,
  `/body/[bodyType]`.
- Blog (3 tables, 0 routes), bidding + messaging (3 tables, 0 routes).
- Duplicate endpoints: `/api/leads`, `/api/contact`, `/api/contact-events`,
  `/auth/sign-in`.
- Admin dashboard + `/admin/api-usage` + `/admin/catalogue`.
- `src/lib/types.ts` and every consumer (the previous pivot's leftovers).
- Dead deps: `recharts`, `xlsx`, `cheerio`, `@t3-oss/env-nextjs`.
- Other-client data purge (§1.3): `settings.ts:35`, phone fallbacks, Granville
  strings, `Used-Car-Marketplace-SRS-BRD.docx`, `docs/platform-audit.html`,
  `docs/ARCHITECTURE.md`, `.kiro/specs/`, `public/llms.txt`, all Cars365 assets,
  root-level loose scripts.
- Tests and fixtures for everything above.

Gate: `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm run test` clean.
One PR, `chore: strip car-sales surface`.

**Risk:** R1 (two lead endpoints) and R3 (98 files touch `vehicle`) both bite
here. I will trace every form's `fetch` target before deleting either endpoint.

### Phase 2 · Data model — **2.5 days**

One migration, `<ts>_xpdx_core.sql`, implementing `CLAUDE.md` §6 as written
(subject to D3–D6 below, which I'll raise before deviating).

- Drop the old schema; create `vans`, `van_images`, `leads`, keep `profiles`.
- RLS per §6, plus the two mandated tests (anon cannot read `leads`; anon cannot
  read a `draft` van).
- **Build the type-generation pipeline for the first time** (R5) — it does not
  exist. Thread `Database` through all three Supabase client factories and
  every `src/lib/data` module. Eliminate the 21 `any` sites.
- Seed six vans, `price_verified = false`, `dimensions_verified = false`.

### Phase 3 · Staff portal — **3 days**

- Leads inbox as default landing; one-tap `tel:` and `wa.me` (the client's staff
  work this on a phone — I'll test at 360px on a real viewport, not devtools).
- Van list with `sort_order` reorder + unverified-data badges.
- Van editor, Zod-validated, slug uniqueness checked before save.
- Image manager, alt text required (blank alt fails validation).
- Settings screen (mostly exists).
- No dashboard.

### Phase 4 · Public site, static — **5 days**

Zero animation. Real content, real data. Ship to staging before 4b.

- 13 routes per §8. Four are new builds with no precedent here.
- `supplied-copy.md` verbatim; every newly-authored word flagged in the report.
- The three service pages are the real work — genuinely distinct, own H1, own
  meta, internal links, own form. See Q4; this is where I most need client input.
- 18 FAQs in full on `/faq`, six-question subset on home.
- Sticky call/WhatsApp bar under 700px, keyboard focus, `next/image` with real
  alt text, labelled placeholders where photos are missing.

### Phase 4b · Motion — **4 days**

Tier 1 only. `lib/motion.ts` tokens first.

- FleetLine (`MOTION.md` §4.1) — parametric SVG from real `length_mm`/`height_mm`/
  `wheelbase_mm`. Budget most of the phase here; §4 says it should take longer
  than the rest of the front end combined.
- LoadMatcher (§4.2) — `data-provisional` until `load_volume_m3` arrives.
- Shared-element transitions (§4.3), native View Transitions.
- LCP element never animated. Report measured numbers from §10 on a throttled
  mid-range device, plus the `prefers-reduced-motion` version.

### Phase 5 · Leads — **1.5 days**

Mostly hardening what already exists — the pipeline is ~90% of §9 already.

- Fix R2: respond 201 before notifying.
- Reshape schema and forms to the new `leads` table.
- Prove durability by deliberately breaking the notifier and showing the row
  landed.
- Honeypot + timing already exist; Turnstile decision per D7.
- Inline success state, no `/thank-you` redirect. GTM conversion event.
- `tel:`/`wa.me` clicks tracked via the surviving `/api/v1/cta-clicks`.

### Phase 6 · SEO — **2.5 days**

- **Crawl live `xpdx.com.au` first**, produce `docs/conversion/redirects.md`
  before writing a single redirect. Nothing bulk-redirects to `/`.
- `generateMetadata` per route; JSON-LD (`AutoRental` + `LocalBusiness`,
  `Product`+`Offer`, `FAQPage`, `BreadcrumbList`); DB-driven sitemap;
  `robots.txt` disallowing `/admin`.
- Report actual Lighthouse numbers.
- **Resolve R6 (geo restriction vs crawlers) before this phase's numbers mean
  anything.**

### Phase 7 · Rebrand — **2.5 days**

`REBRAND.md` end to end. `rg`, review every hit, no `sed` across the tree.
Brand tokens, full asset regeneration (delete old set first so misses fail
loudly), infra, `xpdx.com.au` cutover. §9 leak audit including the built bundle
in `.next/`, and `rg 'Card|Cargo|carry'` returning normal results.

**Domain cutover is a production migration on a live business.** MX records
unchanged; TTL lowered 48h ahead; WordPress kept running 30 days.

### Phase 8 · Done — **1.5 days**

§12 line by line, evidence for each. Anything unverifiable reported as
unverified, not as done. `docs/handover.md` with every `TODO(client)`.

**Total: ~26 engineering days**, plus client turnaround on photos, copy approval
for the service pages, and the domain cutover window. Phases 4 and 4b are the
long poles; Phase 1 is the one whose thoroughness determines whether the rest
goes smoothly.

---

## 2. Where I disagree with the specs

You asked for this section to be substantive. It is. Nothing here is a refusal —
each is a place where the spec assumes a repo shape that differs from this one,
or where I think a different call serves the site better.

### D1 · `pnpm` is wrong for this repo — **change the specs, or migrate**

`CLAUDE.md` §1.11 and §12 and `REBRAND.md` §6 all gate on
`pnpm build && pnpm typecheck && pnpm lint`. This repo has `package-lock.json`,
no `pnpm-lock.yaml`, and CI runs `npm ci`. **There is also no `typecheck`
script at all** — CI invokes `npx tsc --noEmit` directly. As written, two of the
three gate commands fail regardless of code quality.

**Recommendation:** keep npm, add a `"typecheck": "tsc --noEmit"` script, and
read the gate as `npm run build && npm run typecheck && npm run lint && npm run test`.
Migrating to pnpm mid-conversion buys nothing and risks a lockfile-resolution
difference landing in the same PR as a large deletion. I'd rather not debug both
at once.

### D2 · `app/(staff)/` — the requested structure already exists under a different name

`CLAUDE.md` §7 specifies route group `app/(staff)/` with a distinct login at
`/staff/login` or `/admin/login`. This repo has `app/admin/` with `app/admin-login/`,
its own layout and nav, protected in `src/proxy.ts`.

That already satisfies every stated requirement. Renaming it to `(staff)` means
touching the proxy's path matching, the auth guards, the admin nav, `robots.ts`,
the `X-Robots-Tag` header rules in `next.config.ts`, and every test — for a
cosmetic gain. **I propose keeping `app/admin/` + `/admin-login`.** Flag if you
disagree; it is cheap now and expensive in Phase 7.

### D3 · `van_images` — the spec's flat `storage_path` loses a working pipeline

§6 specifies `van_images.storage_path text not null`. This repo indirects through
a `media_assets` registry holding the storage key, processing status and
derivatives, with `image-upload.tsx` doing client-side resize before upload —
which is exactly what §7 screen 4 asks for.

Going flat means rewriting a pipeline that already works. **I'd keep
`media_assets`** (renamed), or — if you want the simpler schema — accept that
§7's "client-side resize, store a sensible max width" needs rebuilding on top of
it. Either is fine; I want the call made rather than discovering it in Phase 3.
My preference: keep the registry, it's the better shape for the OG-image
generation in `REBRAND.md` §5.

### D4 · `leads` — flattening `payload jsonb` into named columns is a regression

§6's `leads` has named `suburb`, `duration`, `start_date`, `message`. The
existing table has those inside `payload jsonb`, with a comment explaining the
choice: it keeps the schema stable across lead types.

For one enquiry type, named columns are genuinely better — queryable, typed,
visible in the staff inbox. **I'd implement §6 as written, but keep `payload
jsonb` alongside** as an overflow for anything a future form adds. Costs one
column, saves a migration later. Flagging rather than silently adding it.

### D5 · Dropping `device` and `ip_hash` from `leads` loses spam defence and attribution

§6's `leads` has `utm jsonb`, `page_path`, `referrer` — but no `device` and no
`ip_hash`. The existing table has both. `ip_hash` (salted, never raw IP) is what
makes the §9 rate limiting and duplicate detection work, and it is the
privacy-correct way to do it. **I'd carry both forward.** Dropping `ip_hash`
would actively weaken the anti-spam posture §9 asks for.

### D6 · `lead_events` should survive

§6 lists four tables and does not include `lead_events`. The existing immutable
per-lead timeline (created / status_changed / note / assigned / notified) is what
lets a staff member see *why* a lead is in its current state, and it is written
atomically with the lead by `create_lead_with_event`. For a business whose entire
model is the lead pipeline, an audit trail on it is worth one small table.
**Recommend keeping it.** Same for `lead_reminders`, which feeds the surviving
cron.

### D7 · Turnstile: §9 says no CAPTCHA, but it is already built and already wired

`CLAUDE.md` §9: "Honeypot field plus a timing check. No CAPTCHA unless spam
actually appears — it costs conversions." I agree with the reasoning. But
Turnstile is already integrated, and it is *invisible* by default — Cloudflare's
managed mode challenges only suspicious traffic, so the conversion cost is much
lower than a visible CAPTCHA.

The existing code already handles this well: `TURNSTILE_SKIP` disables it, and a
failed verification quarantines as `status='spam'` rather than rejecting the
submission — **so a false positive still captures the lead.** That is strictly
better than either alternative.

**Recommend: keep the code, ship with it disabled** (`TURNSTILE_SKIP=true`,
honeypot + timing only), so turning it on is an env change if spam appears
rather than a rebuild. Tell me if you'd rather it come out entirely.

### D8 · `framer-motion` vs `motion` — package identity check needed

`MOTION.md` §8 specifies `motion` (Framer Motion v11+). This repo has
`framer-motion@^12`. The library was renamed: `motion` is the current package,
`framer-motion` is the legacy name for the same project. v12 here is *newer*
than the v11+ floor, so the requirement is met — but `LazyMotion` +
`domAnimation` (§8's lazy-loading requirement) should be verified against the
v12 API before Phase 4b, not assumed. Minor, but §8 reads as if a swap is needed
and it isn't.

### D9 · `@t3-oss/env-nextjs` is installed and unused, while §1.7 asks for validated env

The dep is in `package.json` with **zero** usages; the repo hand-rolls
`src/lib/config.ts` (`requireEnv`/`optionalEnv`). §1.7 wants "Zod at every
boundary (forms, API routes, **env**)".

Two coherent options: delete the dep and accept `config.ts`, or actually adopt
it and get typed, validated, build-time-checked env. **I'd adopt it** — it
catches a missing `NEXT_PUBLIC_SUPABASE_URL` at build rather than at first
request, which matters during a domain cutover. Half a day. Your call; I've
scheduled the deletion in Phase 1 by default.

### D10 · `REBRAND.md` §3.2's secret sweep would have missed the actual secret

The checklist greps `*.json`, `*.env*`, `*.yml`, `*.yaml`. The one real
credential in this repo is in `.git/config`, which none of those globs reach.
**Suggest adding `git remote -v` and a `.git/config` inspection** to that
checklist. Generalisable: the highest-value secrets often sit in config the
tree-level sweep doesn't see.

### D11 · `#F0531E` vs `#F05A22` — the brand orange is specified twice, differently

`CLAUDE.md` §3 says `#F0531E`. `REBRAND.md` §5 says `--orange: #F05A22` and adds
that it "must not drift". These are visibly different. Per file precedence
(`MOTION.md`/`REBRAND.md` win on visuals) I'd use `#F05A22`, but I won't guess
at a brand colour — see Q7.

### D12 · The `/faq` vs `/faqs` duplicate is a pre-existing SEO defect

Not a conversion issue, but worth naming: two live FAQ routes with different
content compete for the same query. Deleting `/faqs` in Phase 1 is correct, and
it needs a 301 to `/faq` in Phase 6 rather than a plain deletion — otherwise a
currently-indexed URL 404s.

### D13 · Geo-restriction may quietly undermine the entire SEO phase

`src/proxy.ts` serves AU + IN only. `CLAUDE.md` §10 targets Lighthouse SEO 100
and a clean Search Console migration. If Googlebot ever crawls from a
non-allowlisted IP and the allowlist check runs before the bot allowlist, the
site is invisible. The code does allowlist legit crawlers first, so I believe
it's safe — but this must be **verified, not assumed**, before Phase 6. Raising
it here because a spec that says "Lighthouse SEO 100" and a proxy that 451s most
of the internet deserve to be considered together.

---

## 3. Questions I need answered before Phase 1

**Q1 · Clean git history — how, and by whom?** This worktree cannot do it
(`.git` is a pointer into the parent repo). Do you want me to (a) prepare the
import script for you to run at the parent level, (b) work in this worktree and
treat the clean import as a separate delivery step before handover, or
(c) something else? **Blocking for `REBRAND.md` §3.1 compliance, and Phase 8
cannot pass without an answer.** Related: has the GitHub PAT been revoked?

**Q2 · Is there production data in the Supabase project?** `CLAUDE.md` §6 lets
me drop and recreate tables, "confirm that assumption before you rely on it".
Migration `0010` seeds only placeholders, which suggests dev/QA — but I cannot
see the live project. **If there are real leads in that database, say so and I
will write a migration path instead of a drop.** Blocking for Phase 2.

**Q3 · Where is `xpdx-rentals.html`?** `CLAUDE.md` §8 makes it the reference for
palette, type scale, layout, and the source for both signature components —
including the LoadMatcher's size-rank fallback that stands in for the missing
`load_volume_m3`. Without it, Phase 4b has no defined visual target and I'd be
inventing the art direction. Blocking for Phase 4.

**Q4 · Who writes the three service pages?** `/local-van-hire`,
`/delivery-van-for-rent`, `/business-van-rental` are described as "the real
ranking assets" and "thin duplicates will be treated as a failure of this phase"
— but `supplied-copy.md` has no copy for them, and §3 forbids inventing business
facts. I can write them in the client's register (plain, warm, first-person
plural) using only §3 facts and flag every word as newly authored, but they will
need client approval before launch. Confirm that's the intent.

**Q5 · Opening hours and ABN.** Both are `TODO(client)`. Opening hours appear in
`LocalBusiness` JSON-LD, and incomplete local-business markup weakens exactly the
local ranking Phase 6 targets. Are these coming before launch, or do I ship the
markup without `openingHours`?

**Q6 · Keep the AU+IN geo restriction?** It was built for the other client. For
a Condell Park van yard, AU-only is arguably right and IN is certainly not. But
it blocks your own reviews from a VPN and complicates CI Lighthouse runs. Keep
as-is / AU-only / disable? (See D13 — either way I'll verify crawler exemption.)

**Q7 · Which orange — `#F0531E` or `#F05A22`?** Specified differently in two
places, both authoritative for their layer. `REBRAND.md` says this is the one
colour that must not drift, so I want it from the client's actual logo vector
rather than picked from a doc. Related: is that vector available? §5 notes the
PDF letterhead is raster and won't scale.

**Q8 · Van photography — timeline?** `MOTION.md` §9 needs 36 shots, and the
dead-square side profiles are what the FleetLine SVGs get traced from. §1.5
forbids stock or generated van imagery, so until they arrive Phase 4 ships
labelled placeholders. When can we expect them?

**Q9 · GTM container.** `CLAUDE.md` §10 says preserve `GTM-M7BWGFK5`.
`REBRAND.md` §7 says confirm with the client whether to keep it or start fresh,
and warns never to point two clients at one container. Which?

**Q10 · Newsletter, testimonials, dark mode, MFA — keep or cut?** None appear in
the §8 route list, all exist and work. `newsletter_subscribers` +
`/api/v1/newsletter`; `/testimonials` (client has supplied no reviews);
`next-themes` dark mode; `/auth/mfa` for staff. Default if you don't answer:
cut newsletter and dark mode, keep testimonials (unlinked until reviews exist)
and keep MFA.

**Q11 · Price/monthly rate mapping.** §3 gives weekly rates and says the mapping
"must be confirmed before launch", surfaced in the portal as unverified — which
I'll do. But `price_monthly_from` has no source at all in §3. Render nothing, or
is a monthly figure coming?

---

## 4. What I will not do without being told

For the record, since §13 asks me to say rather than work around:

- I will not invent load volumes, payloads, opening hours, ABN, insurance
  excess, or a monthly rate. `TODO(client)` or render nothing.
- I will not ship stock or generated imagery of vans, the yard, or people.
- I will not bulk-replace `car`, or touch `vehicle` inside `supplied-copy.md` or
  any string that renders as body copy.
- I will not drop tables until Q2 is answered.
- I will not start Phase 1 until this report is approved.
