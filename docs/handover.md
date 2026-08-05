# XPDX Rentals — handover

Everything the build cannot finish on its own, in the order it blocks things.

Two rules held throughout and explain most of what is on this list:

- **`CLAUDE.md` §3 is the only authorised source for business facts.** Anything
  not in it is `TODO(client)` and was left blank rather than guessed. This site
  publishes bond amounts, insurance terms and licence conditions; an invented
  figure there is a consumer-law problem, not a typo.
- **Legally operative text is the client's to supply.** Terms of hire and the
  privacy policy describe what a specific business actually does and what binds
  a real customer. They were not drafted here.

---

## 1. Blocking — nothing ships until these are done

### 1.1 Revoke the GitHub personal access token

A PAT is embedded in the git remote URL of the origin repository. Anyone with
read access to the repo config has it.

**Action:** revoke it in GitHub → Settings → Developer settings → Personal
access tokens, then re-point the remote at an SSH URL or a fresh credential.

This is yours to do: it cannot be done from inside this worktree, and rotating
it here would not un-leak the current value.

### 1.2 Clean-history import

`REBRAND.md` §3 requires the XPDX repository to start from a history that has
never contained the other client's data. The current history has.

**Action:** create the new repository and import the final tree as an initial
commit, rather than pushing this history to it. Not possible from this worktree
— `.git` here is a pointer file into the parent checkout.

### 1.3 Is there production data? *(question Q2, never answered)*

`supabase/migrations/0019_xpdx_core.sql` **has not been applied.** It drops 32
tables, 21 enums and 9 functions before creating the XPDX schema. If any
Supabase project holding real data is pointed at this codebase, applying it
destroys that data.

**Action:** confirm, in writing, one of:

- *There is no production data* → apply 0019 and 0020 to the new project.
- *There is production data* → stop, and export it before anything runs.

Until this is answered, seven of the §12 done-criteria cannot be verified at
all — see [`docs/conversion/07-phase8-report.md`](conversion/07-phase8-report.md) §3.

### 1.4 Recommended: squash migrations 0001–0018 into one baseline

`REBRAND.md` §7 requires a **new** Supabase project, so nothing anywhere has
0001–0018 applied. On a fresh project they would build an entire used-car
schema purely so 0019 can drop it again — slower, and it leaves the other
client's naming in the repo (`0014_syndication_sidecar.sql:51`, the last such
line, which the leak audit reports as a standing WARN on every run).

A squashed XPDX-only baseline is faster, cleaner, and removes that line. It
interacts with 1.3, so it is your call. If you take it, `0020` folds in too.

### 1.5 Legal pages

`/terms-of-hire` and `/privacy-policy` currently render an honest placeholder
(`PendingLegalPage`) that says the document is being finalised and points at a
phone number. Both are `noindex` so they cannot be indexed as thin content.

**Action:** supply both texts, ideally with your own advice. The FAQ already
carries the operative detail on bond, insurance, eligibility and interstate
travel, so the pages have somewhere to point in the meantime — but a hire
business publishing no terms is a gap, not a design choice.

---

## 2. Content the client owes

| Item | Where it lands | What happens without it |
|---|---|---|
| **Logo vector** | `REBRAND.md` §5 icon set | `app/icon.svg` is a typographic placeholder — the wordmark's initials in brand orange on ink. `favicon.ico` multi-res, `apple-touch-icon`, the 192/512 PNGs and the maskable icon are all outstanding. §5 is explicit that the PDF letterhead is a raster and will not scale. |
| **Van photographs** | `van_images` (Supabase storage bucket `van-images`) | Fleet cards and detail pages render without imagery. Per-van OG images also need these. |
| **Load volumes (`load_volume_m3`) and payloads (`payload_kg`)** | `vans` table | The **Load Matcher** is driven off these. It currently runs in `data-provisional` mode and answers ordinally ("this fits", "this is tight") without ever printing a volume — `MOTION.md` §4.2's instruction for exactly this situation. It will not print a number it was not given. |
| **Weekly / monthly rates** | `vans.price_weekly_from`, `price_monthly_from` | Seeded rates are **inferred from the old site's tonnage-based pricing and are not confirmed.** Every unconfirmed van carries `price_verified = false`, and the staff portal badges it so unverified pricing is visible at a glance. Confirm the rates, then set the flag. |
| **Van dimensions** | `vans.length_mm` etc. | Seeded from indicative manufacturer figures for the body type, not measured. Flagged by `dimensions_verified = false`. These drive the true-to-scale Fleet Line geometry. |
| **Opening hours** | `settings` → `opening_hours` | The footer and contact page say *"Please call to confirm our opening hours."* A guessed closing time on a yard customers drive to is worse than none. |
| **ABN and legal entity name** | `settings` → `site_contact` | The footer omits the ABN line entirely rather than showing a blank one. |
| **Sending identity for email** | `EMAIL_FROM` / SMTP env | Notifications no-op silently when SMTP env is unset. A lead still persists — that is proven by test, see §4 below — but nobody is told about it. |
| **Approval of newly-authored service-page copy** | `/local-van-hire`, `/delivery-van-for-rent`, `/business-van-rental` | The supplied copy did not cover these three pages. They were written to be genuinely distinct (12.7–15.6% overlap, measured) but they are **not client-approved**. |
| **Can vans be delivered, and where?** | `/service-area` | The page currently makes no delivery claim. |

---

## 3. Decisions needed

| # | Decision | Detail |
|---|---|---|
| Q7 | **Which orange?** | `REBRAND.md` §5 says `#F05A22`; `CLAUDE.md` §3 says `#F0531E`. The build follows REBRAND (`#F05A22`) because §5 is the visual authority. One line in `globals.css` if you want the other. |
| — | **GTM container** | `REBRAND.md` §7 and `CLAUDE.md` §10 differ on whether to ship one. Nothing is installed. |
| — | **SMS / WhatsApp on new lead** | `CLAUDE.md` §9 anticipates it; the notification adapter interface in `src/lib/leads/channels.ts` is ready for it. Not built — nobody asked for it. |

---

## 4. What the build guarantees, and what it does not

**Proven by test, without a database:**

- **A lead survives a broken notifier.** `src/lib/leads/submit-enquiry.test.ts`
  injects a notification channel that throws and asserts the lead is still
  persisted and the caller still gets a success. Notification failure can never
  cost you an enquiry.
- The Load Matcher never emits a volume it was not given
  (`src/lib/load-matcher.test.ts`).
- Fleet Line geometry stays true-to-scale (`src/lib/fleet-geometry.test.ts`).

**Not verified, and honestly so** — these need the database, a real device, or
the live WordPress site. Each is listed with what it would take in
[`docs/conversion/07-phase8-report.md`](conversion/07-phase8-report.md) §3. The
short version: six vans rendering, the enquiry round-trip, both RLS tests, the
operator walkthrough, Lighthouse numbers, the Rich Results Test, Fleet Line
frame rate, reduced-motion on a real device, and the redirect map spot-check.

**The redirect map was never crawled.** `docs/conversion/redirects.md` is
evidence-based, built from what could be established without the live site.
`CLAUDE.md` Phase 6 asks for a crawl of the live `xpdx.com.au` WordPress site
first. That has not happened, so the map should be treated as a draft and
spot-checked against real URLs before DNS cuts over. Nothing bulk-redirects to
the home page.

---

## 5. Environment and infrastructure

Set before the first deploy:

- `NEXT_PUBLIC_SITE_URL` — `robots.txt` and `sitemap.xml` currently emit
  `http://localhost:3000` as `Host:` and `Sitemap:` because it is unset locally.
  Wrong in production this is an SEO problem, not a cosmetic one.
- `REDIS_URL` — rate limiting falls back to in-memory without it, which does not
  hold across serverless instances. It warns loudly in production.
- `CRON_SECRET` — `/api/cron/reminders` fail-closes without it and refuses every
  call. `vercel.json` registers no crons, so an external scheduler is needed if
  you want the staff reminder emails.
- SMTP credentials (`SMTP_USER` / `SMTP_PASS`) and `CONTACT_EMAIL_TO`.
- Turnstile keys, if you want the enquiry form's bot check active.
- `GEO_TRUST_PROXY_HEADERS` — the AU+IN geo restriction is a no-op without it,
  because it will not trust a spoofable country header by default. This was the
  cause of a test that appeared to pass while testing nothing; see
  `docs/conversion/05-phase6-report.md`.

Also operational, from `REBRAND.md` §7–§8: the new Supabase project, the
uptime monitor (point it at `/api/health`, which returns 503 when the database
is unreachable), and the domain cutover.

---

## 6. Where the reasoning lives

Each phase has a report under `docs/conversion/`, including the things that went
wrong and how they were caught:

| File | Covers |
|---|---|
| `00-inventory.md` | Route/schema/dependency inventory, risks R1–R14, other-client exposure |
| `01-plan.md` | Phase plan, disagreements D1–D13, open questions Q1–Q11 |
| `02-phase4-report.md`, `03-phase4b-report.md` | Public site; motion tier 1 |
| `04-phase5-report.md` | Staff portal |
| `05-phase6-report.md` | SEO, performance, geo |
| `06-phase7-report.md` | Rebrand, contrast, leak audit |
| `07-phase8-report.md` | **§12 definition of done, line by line, with evidence** |

`docs/content/supplied-copy.md` is the client-approved copy as supplied.
