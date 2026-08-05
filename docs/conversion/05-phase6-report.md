# Phase 6 report — SEO

`CLAUDE.md` §10.

---

## 1. The crawl could not be done. This is a gap, not a completed step.

The brief is explicit: *"Crawl the live xpdx.com.au WordPress site first and
produce docs/conversion/redirects.md before writing any redirect."*

**`xpdx.com.au` is unreachable from this environment.** `WebFetch` reaches the
host and is refused on 443 (`ECONNREFUSED 77.37.37.225:443`); the build host has
no egress at all (DNS times out). Full evidence in
[`redirects.md`](./redirects.md) §1.

What I did instead: derived a URL inventory from four independent web searches,
which consistently returned **exactly four** indexed URLs. That is weak evidence
the site is small, and it is **not** a substitute for the crawl —
search shows only what Google indexed and chose to surface, and WordPress sites
routinely carry archives, `?p=` permalinks and attachment pages that never
appear in results.

`redirects.md` documents the method, the evidence, what is still unknown, and
the exact commands to run when someone has network access.

---

## 2. The redirect map is almost a no-op, and that is a real result

The four known old URLs:

| Old URL | Status today | Lands on | Entry needed? |
|---|---|---|---|
| `/` | 200 | `/` | No |
| `/about-us/` | **308** | `/about-us` | No — automatic |
| `/contact-us/` | **308** | `/contact-us` | No — automatic |
| `/business-van-rental/` | **308** | `/business-van-rental` | No — automatic |

The Phase 4 route list was built against §8, which happens to use the slugs the
live site already uses, so trailing-slash normalisation handles all three. Next
emits 308 rather than 301; Google treats them equivalently for indexing.

**Nothing bulk-redirects to the home page**, per the brief.

I also **removed three inherited redirects** that were still in `next.config.ts`:
`/account/listings → /admin/inventory` (a route deleted in Phase 3, so it
redirected to a 404), `/account(.*) → /admin` and `/vendor(.*) → /admin`. All
three were Cars365 rental-era paths no XPDX URL has ever used, and all three
advertised the staff portal from public URLs — the opposite of §12.

---

## 3. Geo-restriction does not harm SEO — the Phase 0 risk is closed

I flagged this in `00-inventory.md` as **R6** and `01-plan.md` as **D13**: the
proxy serves AU + IN only, and if Googlebot were caught by that, every hour of
this phase would be wasted.

Tested end to end against a production build with `GEO_RESTRICTION_ENABLED=true`
and `GEO_TRUST_PROXY_HEADERS=true`, simulating a US origin:

| Request from a US IP | Result |
|---|---|
| Googlebot → `/faq`, `/vans` | **served** |
| Bingbot → `/faq` | **served** |
| Human → `/faq` | **blocked** (451 page) |
| `robots.txt`, `sitemap.xml` | **served** regardless of origin |
| Human from AU (control) | served |

The exemption is in `evaluateGeoAccess`, ordered before the country check, and
already carried a unit test — *"never blocks Googlebot — it crawls from US IPs
and must reach every page"*. **R6 is closed.**

⚠ One process note: my first attempt at this test showed everything served and
proved nothing, because `GEO_TRUST_PROXY_HEADERS` was unset (so the header was
correctly distrusted) *and* my local `.env.local` had
`GEO_RESTRICTION_ENABLED=false` from Phase 1. A green result from a disabled
feature is worse than no result. The numbers above are from the corrected run.

---

## 4. Deterministic SEO / accessibility audit — 12 findings, all fixed

Lighthouse is not available here: it needs a Chrome binary and there is no
network to install one. Rather than skip the check, I wrote
`scripts/audit-seo.mjs`, which decides the subset of Lighthouse's SEO and
Accessibility audits that can be settled from served markup — deterministically,
in CI, with no browser.

It found 12 real problems. All fixed:

| Finding | Detail |
|---|---|
| Titles over SERP truncation | `/local-van-hire` 72, `/delivery-van-for-rent` 73, `/business-van-rental` 71, `/faq` 74 chars. All now ≤ 60. |
| Descriptions over ~165 chars | `/`, `/vans` (190), `/delivery-van-for-rent`, `/business-van-rental`, `/about-us`. All now ≤ 160. |
| Van detail title too long | The weekly rate pushed `${name} hire — from $400/week` well past truncation on the longer Sprinter names. Rate removed from the title; it is already in the description. |
| No canonical on the legal pages | They used raw `metadata` instead of `pageMetadata()`. |
| Duplicate meta description | `/terms-of-hire` and `/privacy-policy` both inherited the root default. Each now has its own. |

Final run: **PASS, 0 findings** across all 11 public routes.

Also verified by the audit on every route: single `<h1>`, no skipped heading
levels, every `<img>` has `alt`, every link and button has an accessible name,
every form control is labelled, `<main>` landmark present, `lang` on `<html>`,
viewport meta, self-referencing canonical, and **all JSON-LD parses as valid
JSON**.

### What it cannot decide

Colour contrast, tap-target size, layout shift, and anything needing a render.
Those still need a real device pass. `--orange` on `--concrete` is called out in
`MOTION.md` §11 as *marginal at small sizes* and remains unchecked.

---

## 5. Structured data

| Route | Emitted |
|---|---|
| `/` | `AutoRental`, `WebSite`, `FAQPage` (the six visible questions only) |
| `/vans` | `BreadcrumbList` (+ `ItemList` once vans exist) |
| Three service pages | `BreadcrumbList`, `FAQPage` (their four visible questions) |
| `/faq` | `BreadcrumbList`, `FAQPage` (all eighteen) |
| `/contact-us` | `BreadcrumbList`, `AutoRental` |
| `/vans/[slug]` | `BreadcrumbList`, `Product` + `Offer` |

Two rules held throughout: **never mark up a question that is not visible on the
page**, and **never emit a field the client has not supplied** — `openingHours`,
`abn` and aggregate ratings are omitted entirely rather than emitted empty.

**Not validated against Google's Rich Results Test** (§12 requires it) — that
needs network access to a publicly reachable URL. The JSON is well-formed and
the shapes follow schema.org, but that is not the same as Google accepting them.

---

## 6. Analytics

GTM is wired with `GTM-M7BWGFK5` as the default, per §10 (*"Preserve the
existing GTM container unless told otherwise"*), overridable via
`NEXT_PUBLIC_GTM_ID` and disableable with an empty string. Verified present in
the served HTML.

Loaded `afterInteractive` rather than `lazyOnload`: the enquiry form and the
`tel:`/`wa.me` links push conversion events to `dataLayer`, and a container that
loads only at idle can miss a fast caller. Both push sites are guarded, so
nothing breaks when GTM is absent.

⚠ `REBRAND.md` §7 says that container is **the client's own** and to confirm
whether to keep it or start fresh — a container must never be shared between two
clients. §10 and §7 pull in different directions here; §10 wins by default and
this is a one-line change once the client answers.

---

## 7. Lighthouse: not run, not estimated

§10 and the phase brief both ask for actual numbers. **I do not have them.**
Lighthouse needs a Chrome binary; there is none here and no network to fetch
one. `LCP ≤ 2.5s`, `CLS ≤ 0.1`, Performance ≥ 90, SEO 100, Accessibility 100 are
all **unmeasured**.

I am not estimating them. A number I made up would be worse than no number, and
§10 is explicit that "feels fast" is not a measurement.

What I *can* report, measured in a real browser against a production build in
Phase 4b: **initial JS 158.7–170.2 KB gzipped against the 190 KB gate — passing
on every public route.** That is one input to Performance, not a substitute for
it.

**To get the real numbers**, on a machine with Chrome and network:

```bash
npm run build && npm run start
npx lighthouse http://localhost:3100/ \
  --preset=desktop --output=json --output=html --output-path=./lh-home
npx lighthouse http://localhost:3100/vans \
  --form-factor=mobile --throttling-method=simulate --output=html --output-path=./lh-vans
```

Run it against a build with the **fleet seeded**, or the numbers are meaningless
— every fleet grid is currently empty.

---

## 8. Outstanding

- **The crawl** (§1) — blocks the redirect map and therefore cutover.
- **Lighthouse numbers** (§7) — blocks the §12 done criteria.
- **Rich Results Test** (§5).
- **Colour contrast check** on `--orange`, per `MOTION.md` §11.
- **GTM container decision** (§6).
- **`/privacy-policy` and `/terms-of-hire`** are still `noindex` placeholders and
  excluded from the sitemap. If the WordPress site has indexed versions,
  redirecting them here would lose the pages — see `redirects.md` §4.
