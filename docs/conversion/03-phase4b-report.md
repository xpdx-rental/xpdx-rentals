# Phase 4b report — motion, Tier 1

Tier 1 only, per the phase brief: FleetLine (§4.1), LoadMatcher (§4.2),
shared-element transitions (§4.3). **Tier 2 not started.**

---

## 1. Two substitutions you should know about

**`xpdx-rentals.html` was never supplied.** `CLAUDE.md` §8 makes it the source
for palette, type scale, layout, and the size-rank fallback the Load Matcher
needs. It is not in the repo and I flagged it as blocking in the Phase 4 report.

I proceeded rather than stopping, because the loss turned out to be smaller than
feared: `MOTION.md` §4.1/§4.2 fully specify both components' geometry and
behaviour, `REBRAND.md` §5 gives the authoritative palette and type stack, and
per file precedence those win on visuals anyway. What the prototype would have
given is *layout arrangement*, which Phase 4 already established. The Load
Matcher's size-rank fallback is computed from the real dimensions instead — see
§3.

**React's `<ViewTransition>` is not available on this React version.** Next's own
guide reaches for it, but it only exists on React's *experimental* channel;
`react@19.2.4` does not export it at runtime (verified, not assumed). I did not
move the project onto an experimental React release for a page transition.
`MOTION.md` §4.3 actually specifies the **native** View Transitions API — "no
polyfill, no fallback library" — so that is what is implemented, in about thirty
lines with no dependency.

---

## 2. What shipped

**Motion tokens** — `src/lib/motion.ts`, verbatim from §3. No inline magic
numbers anywhere; durations, easings, springs, stagger and the suspension-settle
keyframes all come from here.

**FleetLine** (§4.1) — six vans as parametric SVG side profiles at one shared
mm→px ratio. Entrance from `x:-140` staggered `stagger.fleet` on `ease.brake`
over `duration.cinematic`, fired once by `IntersectionObserver` at 0.35 and
never replayed. Ground line draws 200ms ahead of the first van. Wheels rotate at
`distance / circumference` — physically consistent, not a decorative spin.
Suspension settle on arrival, two oscillations, front axle 40ms before rear.
Hover lifts on `spring.chassis` with the headlight bloom and plate going to
`--plate` yellow. Click dims the others to 45% and scrolls to that van's card.
Roving tabindex, arrow-key navigation, focus ring on the silhouette itself.
Coarse pointers get scroll-snap and no wheel rotation.

**LoadMatcher** (§4.2) — cutaway bays, cartons dropping in on `ease.load` at
`stagger.tight`, overflow drawn breaking the roofline at 30% opacity with the van
desaturated to 40%. Verdicts are **text** (`Recommended` / `Will do the job` /
`Too small for this`), never colour alone.

**Shared-element transitions** (§4.3) — native View Transitions on the van
photo, name and weekly price; spec rows stagger in behind once the morph
settles. Skipped entirely under `prefers-reduced-motion`; browsers without
support navigate normally.

---

## 3. The Load Matcher is provisional, and says so

`load_volume_m3` is `TODO(client)`. §4.2 is explicit: use the size-rank fallback
and **do not invent volumes**.

So nothing in the Load Matcher produces or renders a cubic-metre figure. Loads
carry an ordinal *demand*, vans an ordinal *capacity* derived from real
length × height, and the comparison is ordinal throughout. The component carries
`data-provisional="true"` and renders a visible line to the customer:

> This is a guide based on van size, not a measured capacity. Tell us what you
> are carrying and we will confirm the right van before you book.

That line is not decoration. A customer choosing a van from a fit guide and
arriving with one that does not fit the job is exactly the kind of harm §1.6
exists to prevent.

**A unit test caught a real bug here.** My first capacity model added a constant
baseline to both sides, which made a courier round read as "tight" in a HiAce
LWB — the archetypal comfortable case. Reformulated and covered by a
monotonicity test: a bigger van is never a worse fit, and a bigger load never
fills a given van less.

---

## 4. Performance — measured, and the gate is met

`MOTION.md` §10 gate: **initial JS ≤ 190KB**. Measured in a real browser against
a production build via `performance.getEntriesByType('resource')` →
`encodedBodySize`, i.e. bytes actually on the wire.

| Route | Before | After | Gate |
|---|---|---|---|
| `/` | 302.9 KB* | **158.7 KB** | PASS |
| `/vans` (both signatures) | 285.6 KB | **159.6 KB** | PASS |
| `/faq` | 290.5 KB* | ~165 KB | PASS |
| `/contact-us` | 297.5 KB* | **170.2 KB** | PASS |

\* Earlier figures from a static gzip estimate, which is more conservative than
the Brotli the server actually ships. The browser numbers are authoritative;
where both exist the browser figure is quoted.

Getting there meant finding four real defects, none of them motion-related:

1. **57KB of Supabase auth/realtime client on every public page.** `MobileNav`
   (client) imported `NAV_LINKS` from `site-nav.tsx` — a *Server* Component that
   pulls `getSiteContact → lib/supabase/admin`. That one constant dragged the
   entire server module graph into the browser bundle. Fixed by moving the
   constant to a dependency-free module.
2. **65KB of Zod on every page with a form.** Identical class of bug:
   `EnquiryForm` imported the `DURATIONS` constant from the module holding the
   Zod schema. The client never validates with Zod — the form is `noValidate`
   and the server is the authority — so Zod had no business in the browser.
3. **Dead client providers at the root.** `MobileStateProvider` and
   `MobileAnimationProvider` had no remaining consumers after the car-sales
   components went, but forced a client boundary and their bundle onto every
   page. Also a duplicated `<Toaster>` — the admin layout has its own, and every
   `toast()` call is admin-only.
4. **~20KB of `@base-ui/react` for the mobile menu.** A dialog primitive on
   every page, desktop included, for the site's only piece of interactive
   chrome. Replaced with a hand-rolled disclosure that keeps the accessibility
   behaviour deliberately: dialog role, focus moved in and restored, focus trap,
   Escape to dismiss, scroll lock, 44px targets. `ui/sheet`, `ui/dialog` and
   `ui/tabs` became unused and were deleted.

Also removed: `@sentry/nextjs` (a dependency that was never configured — no
`sentry.*.config`, never imported) and `@vercel/analytics` +
`@vercel/speed-insights`, which were **404ing on every page load** because their
scripts only exist when deployed on Vercel.

The two signature components are now behind `next/dynamic` with `ssr: false`
(§8, "lazy-load `motion` for anything below the fold"). This is safe because
neither is the content — the size-guide **table** is server-rendered above them
and stays as the accessible, no-JavaScript version of the same data.

### Not measured

- **LCP, CLS, INP, frame rate, Lighthouse.** These need a throttled mid-range
  device and real content. There is no Lighthouse binary here, no database, and
  no device. **I have not estimated them and will not** — "feels fast" is not a
  measurement, and neither is a number I made up. Phase 6 owns them.
- **Frame rate during the FleetLine entrance (≥55fps).** Requires profiling on a
  real mid-range Android with vans on screen.

### Verified

- **The LCP element is not animated.** Walked the whole ancestor chain of the
  hero `<h1>` in the browser: no `animation-name`, no transition, `opacity: 1`,
  `transform: none` at every level. §2.3 holds.

---

## 5. What I could not verify

**Neither signature component has been seen running.** They render from van
dimensions, there is no database (0019 unapplied, Q2 unanswered), and both
return `null` on an empty fleet. So the entrance choreography, the wheel
rotation, the hover bloom, the carton drop and the overflow have been built and
typechecked but never watched.

What *is* verified is the part that carries the correctness claim. The geometry
is pure and unit-tested — 17 tests including the spec's own worked example:

> "a customer can see that a Sprinter SWB is the same length as a HiAce LWB but
> 365mm taller"

Asserted against the §3 figures (lengths within 5mm, height delta exactly
365mm), and asserted again on the *drawn output* — the two silhouettes come out
within 1px of the same length, and the height difference is exactly `365 × scale`
and large enough to see. There is also a test that the fleet is never per-van
normalised, which is the failure mode that would quietly destroy the whole
point.

**Recommendation: apply 0019 before Phase 5** so the fleet renders and these
components can actually be reviewed.

---

## 6. Still outstanding

- `load_volume_m3` and `payload_kg` per van — the Load Matcher stays provisional
  until they arrive.
- Real van photographs — the shared-element morph currently morphs placeholders.
- `xpdx-rentals.html`, if the client still has it.
- A throttled-device performance pass (Phase 6).
- The brand token swap is **Phase 7**, deliberately not done here. The Fleet Line
  declares its colours as CSS custom properties in one block so that swap has a
  single place to change.
