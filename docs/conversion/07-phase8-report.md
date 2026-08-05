# Phase 8 report — definition of done

`CLAUDE.md` §12, line by line. Each item is **verified**, **partly verified** or
**not verified**, with the evidence or the reason it could not be obtained.

Nothing here is marked done on the strength of an argument. Where a check could
not run, it says so.

**Summary: 11 verified, 3 partly verified, 10 not verified.** Every one of the
ten needs the database, a real device, or the live WordPress site — see §3.

---

## 1. Verified

### ✅ 1. `build`, `typecheck`, `lint` all clean. No `any`. No warnings ignored.

```
tsc --noEmit    clean
eslint          clean — 0 errors, 0 warnings
vitest          20 files, 181 tests passed
next build      compiled successfully, 26 static pages
```

Getting here took two real changes, not just suppressions:

**The 15 `any`s are gone, and the cause with them.** They all sat at the
Supabase row boundary in `src/lib/data/`, under four file-level
`eslint-disable @typescript-eslint/no-explicit-any` headers. The root cause is
R5: the clients are untyped because `supabase gen types` needs a live project.

I did not write a full hand-made `Database` generic across all 11 tables —
types that claim to be the schema but were never checked against a database are
worse than none. Instead `src/lib/data/rows.ts` declares the row shapes the
mappers actually consume, mirrored from migration 0019, with the file saying
plainly that it is not generated and must be replaced when the project exists.

That change immediately earned itself: it **caught a real mismatch on the first
compile**. `lead_events.event` has a five-value CHECK constraint that the mapper
was widening to `string`. Two facts easy to get wrong are now encoded in the
types — PostgREST serialises `numeric` as a *string* (hence `tonnage` and
`load_volume_m3` are `number | string`), and a to-one embed arrives as an object
on some versions and a one-element array on others.

**Warnings went 14 → 0** by deleting orphaned code rather than silencing it:
`src/components/animations/`, `star-rating`, `image-with-fallback`,
`empty-state`, `use-swipe-gesture`, plus — found during this phase —
`src/lib/actions/admin-auth.ts`, `src/lib/seo/guards.ts` (see §2), and four
orphan hooks (`use-reduced-motion`, `use-body-scroll-lock`, `use-pinch-zoom`,
`use-scroll-position`).

### ✅ 2. `REBRAND.md` §9 leak audit complete, including the built bundle

`bash scripts/leak-audit.sh` → **PASS**, with one standing WARN (the historical
migration line, §1.4 of the handover). It checks the source tree, the served
`.next` output and the sourcemaps separately.

It also now checks the §12 item-3 vocabulary directly. Getting it to actually
work is §2 of this report — it is the most important thing in it.

### ✅ 3. Zero references to cars, sales, finance, dealers or Cars365

This item **failed** when I first checked it properly, and the failures were
live defects, not stale comments:

| Found | Why it mattered |
|---|---|
| `supabase/config.toml` — `sender_name = "Cars365"` | The other client's brand on **every transactional auth email** XPDX would send. The leak audit had passed this file four times; §2 explains how. |
| `/geo-blocked` — *"Our inventory, pricing and finance offers are built for buyers in…"* | Live customer-facing car-sales copy on a real rendered page, in the old brand yellow. Rewritten for van hire, on brand tokens. |
| `/admin/faqs` | An admin screen writing to a `faqs` table **nothing reads** — the eighteen supplied FAQs live in `src/lib/content/faqs.ts`. An operator could edit an answer, watch it save, and never see the site change. Deleted, with the nav entry. |
| `/admin/roles` — role "Sales", *"quick-change vehicle status"* | Car-sales vocabulary in a live staff screen. Relabelled to the hire desk. |
| `staff_role` enum value `'sales'` | Relabelling the UI would have left `sales` in the database, in the RLS helper's argument lists and in every audit row. **Migration `0020_staff_role_hire_desk.sql`** renames the enum value in place — no row is touched, no policy redefined, and it is safe whether or not the project holds data. |
| `.finance-range` slider CSS | Styling for a finance calculator deleted in Phase 1. |
| 20 unused CSS classes | `.card-lift` (still carrying the old blue `rgba(11,95,255)`), `.glass-panel`, `.text-gradient`, `.badge-glow-*`, `.animate-*`, `.safe-area-*`, `.touch-target`. **globals.css: 25,365 → 20,835 bytes.** |
| `src/lib/van.ts` comment | Claimed `src/lib/domain.ts` "still holds the used-car types". That file no longer exists. |

Re-sweep after the fixes: `cars365`, `\bcars\b`, `\bdealer\b`, `used-cars` all
return **nothing** across `src/`, `public/`, `supabase/config.toml`,
`next.config.ts` and `package.json`.

**One judged deviation, per §13.** Doc comments recording *why* something was
removed — "the inherited version published `AutoDealer` and `Vehicle` offers" —
were kept, with the old brand name stripped from all of them. Scrubbing the
engineering history would make the codebase worse for the next maintainer, and
the audit confirms none of it reaches the served bundle or the sourcemaps. The
brand *name* is gone from the tree entirely; the descriptions are not.

### ✅ 4. `rg 'Card|Cargo|carry'` still returns normal results

`Card` 71 · `Cargo` 5 · `cargo` 20 · `carry` 12 — all non-zero, checked
**case-sensitively** (see §2). Nobody ran a blind `car` replace.

### ✅ 10. Public site contains no link to, or mention of, the staff portal

All twelve public routes fetched and scanned for `admin`, `staff portal`,
`sign in`, `log in`, `/auth/` — **clean on every one**. `sitemap.xml` contains
no admin or auth URL; `robots.txt` disallows `/admin/`, `/admin-login`, `/api/`,
`/auth/` and `/geo-blocked` for every named agent and for `*`.

### ✅ 11. Staff portal unreachable without auth, including direct URL and API routes

Against the production server, unauthenticated:

| Route | Result |
|---|---|
| `/admin`, `/admin/leads`, `/admin/vans`, `/admin/vans/new`, `/admin/settings`, `/admin/roles`, `/admin/audit`, `/admin/leads/{uuid}` | **307 → `/admin-login?redirectedFrom=…`** |
| `/api/cron/reminders` | **401** (fail-closed on `CRON_SECRET`) |
| `/api/health` | 503 — correct: no database |

The redirect **chain was followed to completion**: final `200` at
`/admin-login`. That check exists because in Phase 1 auth held correctly and
landed on a 404 — a 307 alone proves nothing.

One test artifact worth recording so nobody repeats it: my first pass showed
`403` on *everything*, including `/`. That was not a finding — bare `curl` sends
`User-Agent: curl/8.x`, and `curl/` is a deliberate entry in the proxy's bad-bot
list. With a browser UA the real behaviour above appears.

### ✅ 13. Three service pages have genuinely distinct content

Measured on 8-word shingles with nav, header and footer stripped — shared
vocabulary does not count, only reused sentences do:

| Pair | Overlap |
|---|---|
| local-van-hire vs delivery-van-for-rent | **5.4%** |
| local-van-hire vs business-van-rental | **3.4%** |
| delivery-van-for-rent vs business-van-rental | **3.9%** |

523 / 395 / 487 words. The shared shingles are the common FAQ block all three
import deliberately.

*(This supersedes the 12.7–15.6% figure in the Phase 6 report, which included
shared page chrome. The lower numbers here are the correctly scoped ones.)*

### ✅ 16. Initial JS ≤ 190KB gzipped

**Worst route 159.9KB against a 190KB budget.**

| Route | Initial JS (gzip) |
|---|---|
| `/vans` | **159.9KB** |
| `/`, `/local-van-hire`, `/delivery-van-for-rent`, `/business-van-rental` | 158.9KB |
| `/contact-us`, `/about-us`, `/service-area` | 153.6KB |
| `/faq`, `/terms-of-hire`, `/privacy-policy` | 151.0KB |

This number was hard to get right and three of my attempts were wrong — one
returned all zeros while reporting `PASS: true`. §2 covers that. The figure
above is the browser's own `encodedBodySize` on a real navigation, cross-checked
three independent ways that agree exactly.

A note on a tempting wrong answer: scraping every `/_next/static/*.js` from the
HTML gives 189.7–198.6KB and would fail the budget. The difference is one 38.7KB
chunk loaded via `<script noModule>` — the legacy polyfill, which **no modern
browser fetches**. Counting it would be counting bytes this audience never
downloads.

### ✅ 19. The LCP element is not animated. No fade or stagger on the hero heading.

The hero `h1` — *"Long-term van hire for Sydney trades and couriers"* —
computes to `animationName: none`, `opacity: 1`, `transform: none`, and has
**no motion wrapper anywhere in its ancestry**. Every one of the three largest
above-the-fold elements is likewise motion-free, and **no element in the first
viewport starts below full opacity** — there is no fade-in start state to
recover from.

*(The measured LCP element with six real vans could differ; see §3.)*

### ✅ 23. Tested at 360px width — no horizontal overflow

At a 360×780 viewport, all eleven public routes: `scrollWidth` 352px against a
360px viewport. **Zero overflowing elements on every route.**

This also turned up a real accessibility gap, now fixed. Footer links — the nav
columns, phone, email, Instagram, Facebook — rendered at **~20px tall**, below
WCAG 2.5.8's 24px minimum and far below the 44px this audience needs
(`MOTION.md` §11: outdoor work, cracked phones). They now get a 44px row on
touch and the original density from `sm:` up. **Re-measured: 13 footer links per
page, 0 under 44px.**

Two apparent failures in the same scan were **not** defects, and it is worth
recording why: the 24px `input[name="website"]` is the honeypot
(`tabIndex={-1}`, label "Do not fill this in"), and the 20px consent checkbox
sits inside a full-width clickable `<label>`, so its real target is the whole
row. Neither needed changing.

### ✅ 24. `docs/handover.md` lists every outstanding `TODO(client)`

Written. Every `TODO(client)` marker in `src/` and `supabase/` is represented,
grouped by what it blocks rather than by file.

---

## 2. The audit that had been lying for four phases

This is the part of Phase 8 worth reading.

`scripts/leak-audit.sh` falls back from `rg` to `grep` because `rg` is not on
PATH for a spawned script on this machine — that fallback was itself the fix for
an earlier bug where the script reported a clean PASS having searched nothing.

The fallback line read:

```sh
grep -rInE --binary-files=without-match ...
```

`-I` is `--binary-files=without-match`. `-i` is `--ignore-case`. **Only one of
them was there.** The `search()` function documented itself as
"case-insensitive", the `rg` branch passed `-i`, and the grep branch did not.

So on this machine — the machine every audit has run on — **every check in the
file was silently case-sensitive.** Reproduced directly:

```
$ grep -rInE  'cars?-?365' config.toml   → no match   (exit 1)
$ grep -rInEi 'cars?-?365' config.toml   → sender_name = "Cars365"
```

That is how `sender_name = "Cars365"` survived four phases inside a file the
audit explicitly searched, and it is why item 3 above found what it did. The two
bundle greps had the same defect.

**This is the fourth time this session a green result came from a check that
never ran** — after the geo test that passed because the feature was disabled,
the first leak audit that passed because `rg` did not exist, and the provider
registry that typechecked while empty. Fixes, in the script:

- `-i` restored, with a comment naming the exact trap.
- **A case-fold control** that greps for a lowercase string matching only
  mixed-case text in the tree, and **aborts the whole run** if it returns
  nothing. A missing `-i` can no longer produce a PASS.
- A `searchcs()` for the two checks that *depend* on capitalisation. Turning
  case-insensitivity on broke them in the opposite direction: `Vehicle[A-Z(]`
  folded to `vehicle[a-z(]` and started matching "our vehicles" in the client's
  own approved copy. Those checks are now explicitly case-sensitive.
- The §12 item-3 vocabulary added as first-class checks, so `cars` / `sales` /
  `finance` / `dealer` cannot regress silently. Word-bounded, so `cargo`,
  `carry`, `Card` and `Carousel` still do not match.

**The same pattern bit the bundle measurement in this phase.** Item 16 took four
attempts: resource-timing entries double-counted across soft navigations; a
`content-length` approach silently measured *decoded* bytes because the server
uses chunked encoding; and one attempt returned `js_KB: 0` for all eleven routes
**and reported `PASS: true`**, because a zero total is under any budget. The
final version refuses to report a pass if any chunk measures zero. A budget
check that cannot fail is not a budget check.

Two smaller finds while verifying reduced motion: `globals.css` had **two
identical `@media (prefers-reduced-motion: reduce)` blocks** — the same
duplication class as the `.dark` block found in Phase 7 — now collapsed to one;
and a comment claiming the headlight/plate hover transitions "stay active even
under prefers-reduced-motion" was simply false, since the global
`transition-duration: 0.01ms !important` overrides them. The behaviour is
correct (instant, not animated); the comment describing it was not.

---

## 3. Not verified — and what each one needs

I am not marking any of these done.

### Needs migration 0019 applied (blocked on Q2, §1.3 of the handover)

| # | Item |
|---|---|
| 5 | **Six vans render from the database on `/vans`, each with a working detail page.** `/vans` currently renders its empty state; `/vans/[slug]` has no instances to build, so its bundle and its shared-element transition are also unmeasured. |
| 6 | **Enquiry submits, persists, and appears in the staff inbox within seconds.** The form validates and the API route answers correctly (a `POST` of `{}` returns 400 from the Zod boundary), but nothing can be persisted or read back. |
| 7 | **Lead submitted with the notification service deliberately broken → still in the DB.** The *logic* is proven: `submit-enquiry.test.ts` injects a throwing channel and asserts the lead still persists and the caller still succeeds. That is a unit test with an injected fake, **not** the live end-to-end proof this line asks for. |
| 8 | **Anonymous Supabase client cannot read `leads`.** Test written (`src/lib/supabase/rls.integration.test.ts`), never executed. |
| 9 | **Anonymous client cannot read a `draft` van.** Same. |
| 12 | **A non-technical operator can add a van, upload and reorder photos, change a price, and mark a lead as contacted — without a deploy and without help.** The screens exist and are reachable behind auth; the walkthrough needs a working database and, to mean anything, a person who is not me. |

### Needs a real device or a tool not available here

| # | Item | What it needs |
|---|---|---|
| 14 | **JSON-LD validates in Google's Rich Results Test.** | Verified as far as I can: every page's blocks **parse**, carry `@context`, and have the required fields for their type — `AutoRental` and `WebSite` on `/`, `FAQPage` on `/`, `/faq` and the service pages, `BreadcrumbList` throughout. That is not the same as Google's verdict. It needs the deployed public URL. Note `/vans` currently emits only `BreadcrumbList`; with six vans it should also emit the fleet `ItemList`, which is unverified. |
| 15 | **Lighthouse mobile: Performance ≥ 90, SEO 100, Accessibility 100. LCP ≤ 2.2s, CLS ≤ 0.05, INP ≤ 180ms. Actual numbers reported.** | **No numbers to report.** The browser pane is not displayed in this session, so the page composites no frames — LCP, CLS and INP never record, and no Lighthouse run is possible. I will not estimate these; the instruction was explicit that actual numbers are required. |
| 17 | **Fleet Line entrance holds ≥ 55fps on a mid-range Android. Profiled, not assumed.** | A mid-range Android. Same compositing limitation, and a desktop figure would not answer the question anyway. |
| 18 | **`prefers-reduced-motion: reduce` produces a complete, deliberate-looking page — verified on a real device.** | Partly verified: the CSS media query exists (now exactly once), and Fleet Line, Load Matcher and the van transition each check `useReducedMotion()` / `matchMedia` independently, which is what CSS alone cannot do. Whether the result *looks deliberate* is a judgement that needs eyes on a real device. |
| 22 | **Full keyboard pass on the enquiry form and staff portal.** | Structure is right — the form is native `<label>`-wrapped controls, the mobile nav implements a labelled dialog with focus trap, restore and Escape. But a real pass means driving the keyboard, which needs the pane displayed; and the portal half needs auth and a database. |

### Needs the live WordPress site

| # | Item |
|---|---|
| 21 | **Redirect map applied and spot-checked against the live WordPress URLs.** The crawl of `xpdx.com.au` that `CLAUDE.md` Phase 6 asks for **was never run.** `docs/conversion/redirects.md` is evidence-based rather than crawl-based and should be treated as a draft. Nothing bulk-redirects to the home page. |

---

## 4. Changes made in this phase

**Deleted:** `src/app/admin/faqs/` (orphan writer), `src/lib/seo/guards.ts` +
test (zero callers, for routes that no longer exist, behind a comment falsely
claiming it was wired in), `src/lib/actions/admin-auth.ts` (orphan), four orphan
hooks, `.finance-range` and 20 unused CSS classes, one duplicate
`prefers-reduced-motion` block.

**Added:** `src/lib/data/rows.ts` (typed row boundary),
`supabase/migrations/0020_staff_role_hire_desk.sql` (SQL syntax-validated
against libpg_query, as was 0019 — 121 statements, both parse clean),
`docs/handover.md`.

**Fixed:** `sender_name` in `supabase/config.toml`; `/geo-blocked` copy, brand
tokens, and a `mailto:null` / `wa.me/null` that rendered when contact env was
unset; admin roles vocabulary; footer touch targets; the leak audit's case
sensitivity, plus a control that aborts if it regresses.

---

## 5. Standing recommendation

Squash migrations 0001–0018 into a single XPDX baseline. It is the last line
naming the other client, a new Supabase project is required anyway, and on a
fresh project those files build an entire used-car schema purely so 0019 can
drop it. Handover §1.4. It interacts with Q2, so it is your call, not mine.
