# Phase 4 report — public site, static

Companion to `00-inventory.md` and `01-plan.md`.

**Scope:** every route in `CLAUDE.md` §8, built fully static with real content and
**zero animation**. Motion is Phase 4b and nothing in this phase anticipates it
beyond leaving comments where the FleetLine and LoadMatcher will attach.

---

## 1. Newly-authored copy — needs client approval

`docs/content/supplied-copy.md` covers About Us, Our Mission, the ten advantages
and the eighteen FAQs. **Everything below was written by us** because the
supplied copy has nothing for it. It is written in the client's register —
plain, warm, first-person plural, no hype — and states only facts authorised by
`CLAUDE.md` §3.

| Page | What is newly authored |
|---|---|
| `/` | Hero heading and sub-paragraph, section headings, fleet blurb, size-guide framing |
| `/vans` | Intro paragraph, size-guide framing, enquiry section copy |
| `/vans/[slug]` | Section headings, the "confirmed on request" note for missing load volume/payload |
| `/local-van-hire` | **All prose.** Angle: proximity and practicality — the yard vs a franchise counter, how collection works, hiring locally long-term |
| `/delivery-van-for-rent` | **All prose.** Angle: the economics of a courier round — unlimited km as the real differentiator, downtime, fit-out |
| `/business-van-rental` | **All prose.** Angle: hire vs owning, and scale — predictable weekly cost, scaling up/down, drivers and paperwork |
| `/service-area` | All prose, plus the suburb list (see §2) |
| `/contact-us` | Intro paragraph and section headings |
| `/privacy-policy`, `/terms-of-hire` | Placeholder copy only — see §4 |

Every claim traces to §3. Nothing asserts a delivery radius, a response time, a
customer count, an award, or a price that is not in the fleet table.

**One deliberate hedge:** `/business-van-rental` says plainly that whether hiring
or owning suits a business is a question for their own accountant. The page must
not read as financial advice, and the obvious way to write that section would
have drifted straight into it.

---

## 2. Judgement calls worth reviewing

**The `/service-area` suburb list is geography, not a coverage claim.** §3
authorises no delivery or service-radius claim — only that vans are approved for
use within NSW. So the page says these are areas customers *travel from*, never
that we service or deliver to them. If the client does deliver, this page should
say so and would become a strong local-SEO asset. `TODO(client)`.

**The eighteen FAQs live in code, not the `faqs` CMS table.** They are legally
operative — bond amounts, age limits, insurance and servicing obligations — and
the supplied copy is explicit that they must not be reworded to fit a design.
Keeping them in `src/lib/content/faqs.ts` means every change to a legally
operative sentence goes through a reviewed diff rather than a text box.
**Consequence: the admin FAQ screen is now unused by the public site.** Either
wire it up for *additional* questions or remove it — your call, flagged rather
than silently left dangling.

**Reviews are absent, not faked.** The client has supplied none, so the home page
reviews section renders nothing at all rather than showing an empty heading.

**Home page moved into the `(public)` route group.** It previously sat outside
and had its own shell, which is why the old code had a comment explaining that
the entity graph had to be duplicated. One shell now.

---

## 3. Verification

Run against a dev server, not asserted from the source.

- **All 13 §8 routes return 200.** Every deleted car-sales route (`/used-cars`,
  `/about`, `/contact`, `/faqs`, `/finance`) returns 404.
- **Every public route renders static (`○`) or SSG (`●`).** Only `/admin`,
  `/api`, `/auth` and `/geo-blocked` are dynamic. See §5 for the fix that made
  this true.
- **Supplied copy renders verbatim.** Twelve exact sentences asserted against the
  page text, including the client's spaceless em dash (`vehicle—it's`), the $750
  and $500 bond figures, the 28-day minimum and the 12-month licence
  requirement. All 10 advantages present on `/about-us`; all 18 questions in the
  `FAQPage` markup on `/faq`.
- **The three service pages are genuinely distinct.** Measured pairwise 6-gram
  overlap: 12.7%, 14.2%, 15.6% — and that residual is shared chrome (header,
  footer, form labels), not body copy. Distinct H1s and meta descriptions.
- **`FAQPage` markup matches what is visible.** Six questions on home, eighteen
  on `/faq`, four per service page. Nothing is marked up that is not rendered.
- **Metadata is per-route.** Unique title and description, self-referencing
  canonical, `og:site_name` = XPDX Rentals.
- **`tel:` and `wa.me` match §3 exactly** — `tel:+61433418566` and
  `https://wa.me/61433418566`, asserted by unit tests in `src/lib/lead.test.ts`.
- **360px viewport:** no horizontal overflow, sticky bar fixed to the bottom.
- **No portal trace:** no `/admin` link in any public page's HTML.

### Not verified

- **Anything requiring live van data.** There is no database (Q2 unanswered,
  0019 unapplied), so `/vans`, `/vans/[slug]` and the fleet grids render their
  empty states. The card, gallery, spec table and size guide are unexercised.
- **Lighthouse and Core Web Vitals.** Phase 6 owns the numbers, and measuring
  them against an empty fleet would be meaningless anyway.
- **The enquiry endpoint end to end.** `/api/v1/enquiries` is built and validates,
  but it cannot insert without a database. Phase 5 proves it.

---

## 4. `/privacy-policy` and `/terms-of-hire` are placeholders — launch blocker

Phase 1 deleted the inherited legal pages because they described a licensed
used-vehicle dealership with finance and trade-in partners: legally operative
text that was false for this business.

**We have not written replacements and should not.** A privacy policy describes
what a specific business actually does with personal information; terms of hire
bind real customers. Both are the client's to provide, ideally with their own
advice. §1.6 forbids inventing business facts, and this is the most damaging
possible place to do it.

Both routes render an honest "being finalised" placeholder with contact details
and are `noindex` so they cannot be indexed as thin content. They are excluded
from the sitemap. **This blocks launch, not staging.**

---

## 5. Defects found and fixed during this phase

Four of these are Phase 1 misses. Recording them plainly.

1. **Another of the other client's real phone numbers was live.**
   `WhatsAppFloat phone="61451344477"` in the root layout, rendering a floating
   WhatsApp button on every page, plus the same number in `geo-blocked`. This is
   a `REBRAND.md` §3.2 confidentiality item that Phase 1 missed because the
   number was a component default, not a `cars365` string. Removed with the
   component.

2. **A car-sales loading skeleton rendered site-wide.** `src/app/loading.tsx` was
   a grid of six vehicle-card skeletons with `animate-pulse-skeleton` — animation
   in a phase that ships none. Deleted.

3. **An unreachable database hung the page instead of degrading.** The public
   reads had no timeout, so the pages sat in their loading state indefinitely
   rather than falling through to the empty state and the phone number. Added a
   5s request timeout: the fleet grid is nice to have, the call button is the
   business.

4. **Public pages were server-rendered on every request.** The van reads used the
   SSR Supabase client, which touches `cookies()` — and on a login-free site
   there is no session to resolve. That single call opted `/`, `/vans` and all
   three service pages out of static rendering. Added a cookie-free anon client
   (`lib/supabase/public.ts`); all five are now static. RLS still enforces draft
   exclusion, because the anon role is what it applies to.

5. **`tel:` emitted a local number.** `telHref` produced `tel:0433418566` where §3
   specifies `tel:+61433418566`. Local form dials fine from an Australian handset
   and breaks for anyone roaming. Normalised to E.164, with tests asserting the
   exact §3 values.

6. **Root metadata still identified the site as Cars365.** `og:site_name`,
   `applicationName`, the title template and the used-car description leaked onto
   every page. Nominally Phase 7, pulled forward because it directly undermines
   this phase's "works, ranks and converts" goal.

---

## 6. Scope notes

- **`/api/v1/enquiries` replaces `/api/v1/leads`.** The form needs somewhere to
  post for the site to convert, so the endpoint and its Zod schema were rewritten
  here. Phase 5 owns the hardening and the proof: the deliberate notifier
  failure, the channel adapter, and the rate-limit/honeypot behaviour under load.
- **`lib/seo/jsonld.ts` was rewritten**, not extended — the old one published
  `AutoDealer` and `Vehicle` offers. What is here is what §8 needs; Phase 6 adds
  the full per-route treatment.
- **Still zero animation.** A `prefers-reduced-motion` guard is in `globals.css`
  as a standing commitment before Phase 4b, not as a fix for anything shipped.

---

## 7. Outstanding for the client

Carried into `docs/handover.md`:

- Opening hours (rendered as "please call to confirm" everywhere).
- ABN (omitted from the footer rather than blank).
- Privacy policy and terms of hire (§4 — blocks launch).
- Real photographs of all six vans. Every image is a labelled placeholder showing
  the expected filename; §1.5 forbids stock or generated vehicle imagery.
- Load volume (m³) and payload (kg) per van. The spec table omits the rows
  entirely rather than guessing, and `/vans/[slug]` says these are confirmed on
  request. **The Load Matcher in Phase 4b needs `load_volume_m3`.**
- Approval of all newly-authored copy in §1.
- Whether vans can be delivered, and to where (§2).
- A real `info@` address — the email is omitted until one is set.
