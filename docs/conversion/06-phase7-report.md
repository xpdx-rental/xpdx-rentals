# Phase 7 report — rebrand

`REBRAND.md` end to end.

---

## 1. The first leak audit was worthless, and that is the most important thing here

I wrote `scripts/leak-audit.sh`, ran it, and got a clean sweep of green ticks
across every source-tree check.

**It had searched nothing.** `rg` is not on `PATH` for a spawned script on this
machine, even though it is available interactively. Every `none()` check
returned "no matches" because the binary did not exist, and the script happily
reported that as a pass.

This is the second time this session a green result has come from a check that
never ran — the first was the geo-restriction test in Phase 6, which passed
because the feature was disabled. Both were caught, but only by looking twice.

The script now:

- falls back to `grep -rE` when `rg` is absent, and
- runs a **control check first** — it greps for a string that must exist
  (`XPDX` in `src`) and **aborts the whole audit** if that returns nothing.

A missing search tool now fails loudly instead of certifying the codebase clean.

---

## 2. What the working audit actually found

Once it searched for real, it found genuine leftovers that four previous phases
had missed:

| Finding | Why it mattered |
|---|---|
| `supabase/config.toml` — `project_id = "cars365"`, `site_url = "car365au.vercel.app"` | The other client's Supabase project and hosting, in committed config |
| `package.json` — `"name": "cars365-app"` | `REBRAND.md` §4 |
| `src/app/api/health/route.ts` — `from("vehicles")` | **The health endpoint queried a table migration 0019 drops.** An uptime monitor points at this (`REBRAND.md` §7), so the moment 0019 landed it would have reported `unhealthy` forever and the alert would have looked like a real outage |
| `admin/testimonials/actions.ts` — writes `vehicle_id` | A column 0019 drops from `testimonials`; the insert would have failed |
| `not-found.tsx` — links to `/used-cars` | 404 page pointing at a deleted route |
| `realtime-leads-listener.tsx` | Orphan filtering on `vendor_id` / `organizationId` — tables that have never existed in this schema |
| `lib/validation/vehicle.ts` | Orphaned used-car schema, superseded by `validation/van.ts` in Phase 3 |
| `__tests__/properties/arbitraries.ts` | Rental-era fixtures generating `vendor_name`, `price_per_day` |
| A comment in `ses.ts` naming the other client's domain | Harmless in source, but it ships inside server sourcemaps. Reworded — their domain is no longer written anywhere |
| `"Granville"` in the `/service-area` suburb list | A real suburb, but also the other client's locality. Dropped; nine others cover the same area |

Final state: **LEAK AUDIT PASS**, with one warning (§6).

Also verified, as `REBRAND.md` §9 requires: `Card` 71 hits, `Cargo` 5, `cargo`
20, `carry` 13 — **nobody ran a blind `car` replace.**

The `vehicle` check was rewritten too. Its first version failed on customer
copy, which is wrong: §1 says *"`vehicle` is legitimate in customer copy, wrong
in code"*, and the client's own approved wording is "commercial vehicle
rental". It now matches identifier shapes only — `vehicle_id`, `from("vehicles")`,
`VehicleCard`, `vehicleId`, `/used-cars` — and passes.

---

## 3. Brand tokens (§5)

The palette is in one block in `globals.css`, and every semantic token is
expressed in terms of it, so the brand has exactly one place to change.

`--ink #14161A` · `--steel #6D7681` · `--concrete #E9EAE8` · `--orange #F05A22`
· `--orange-dk #C93F10` · `--plate #F3D71E`

Type swapped to the §5 stack, with Inter and Plus Jakarta Sans removed from
`next/font`, the CSS and the preconnects:

| Role | Face | Verified in the built CSS |
|---|---|---|
| Display | **Archivo**, `wdth 110 / wght 800`, tracking `-0.015em` | ✅ |
| Body | **IBM Plex Sans** | ✅ |
| Utility | **IBM Plex Mono** | ✅ |

19 woff2 files emitted; confirmed in a real browser that `h1` resolves to
Archivo with the specified variation settings, body to IBM Plex Sans, and specs
to IBM Plex Mono.

**Also fixed: a duplicate `.dark` block.** A second one sat further down
`globals.css` redefining the same custom properties with the old slate scale and
the Cars365 yellow. Being later in the file it silently won — so the dark theme
was never the theme the first block described.

---

## 4. Contrast: `MOTION.md` §11's warning was real, and worse than "marginal"

§11 says to check `--orange` on `--concrete` specifically. Measured, rather than
assumed:

| Pair | Ratio | Needs | |
|---|---|---|---|
| **White on `--orange` (CTA text)** | **3.39** | 4.5 | **FAIL** |
| `--orange` on white (link text) | 3.39 | 4.5 | FAIL |
| `--orange` on `--concrete` | 2.81 | 4.5 | FAIL |

The first one is the primary CTA — every "Get a quote", "See the fleet" and
"Call now" button on the site, failing WCAG AA.

Fixed **without drifting `--orange`**, which §5 says must not move:

- **CTA text is now `--ink`, not white.** Ink on `#F05A22` measures **5.34:1**.
  The brand orange stays exactly as specified as the fill; only the text on it
  changed. My original code carried a comment asserting the opposite — that dark
  text on orange would fail — which was an assumption, and measurement disproved
  it.
- **Inline link text uses a new `--link` token = `--orange-dk`**, 5.0:1 on
  white. `--orange` keeps fills, icons and focus rings, where the 3:1 UI
  threshold applies and 3.39 passes.

Verified in the browser with correct alpha compositing (an earlier attempt
misread `oklab()` backgrounds and produced nonsense):

| In-use pair | Ratio | |
|---|---|---|
| CTA text on orange fill | 5.34 | PASS |
| Link on white | 5.00 | PASS |
| Link on `bg-muted/30` (`#f8f8f8`) | 4.71 | PASS |
| Ink heading on white | 18.11 | PASS |
| Body copy on white | 8.15 | PASS |
| Orange as UI boundary | 3.39 (needs 3) | PASS |

**One standing constraint:** link text on *full* `--concrete` is 4.14 and would
fail. No surface currently does that — real surfaces composite to `#f8f8f8` —
but do not introduce one.

---

## 5. Assets

Phase 1 deleted the entire Cars365 icon set, so there was nothing to reuse.
`app/icon.svg` and `app/manifest.ts` are new: a **typographic placeholder**, the
wordmark's initials in the brand orange on ink, with `theme_color #F05A22` per
§5. It invents no mark and no lockup.

⚠ `REBRAND.md` §5 requires the full set regenerated from the client's vector,
and is explicit that the PDF letterhead is a raster that will not scale. **That
vector has not been supplied**, so `favicon.ico` multi-res, `apple-touch-icon`,
the 192/512 PNGs and the maskable icon are all outstanding. Per-van OG images
also need the photographs.

---

## 6. Outstanding — one is a decision, not a code change

**Migrations 0001–0018 still name the other client.** One line:
`0014_syndication_sidecar.sql:51: values ('cars365', 'Cars 365', true)`.

They are forward-only and already applied, and `CLAUDE.md` §9 says never edit an
applied migration — so I have not. The audit reports it as a **WARN** on every
run rather than a silent pass or a permanent red.

**Recommendation: squash 0001–0018 into a single baseline.** `REBRAND.md` §7
requires a *new* Supabase project anyway, so nothing has 0001–0018 applied; on a
fresh project they would create an entire used-car schema purely for 0019 to
drop it again. A squashed XPDX-only baseline is faster, cleaner, and removes the
last trace of the other client from the repo. It interacts with Q2, so it is
your call rather than mine.

Also still open:

- The client's logo vector, and the full icon set (§5).
- `--orange` remains `#F05A22` per `REBRAND.md` §5 over `CLAUDE.md` §3's
  `#F0531E` — one line, see `01-plan.md` Q7.
- GTM container decision (`REBRAND.md` §7 vs `CLAUDE.md` §10).
- **Git history** and the **GitHub PAT** — §3, still yours, still blocking.
- Infrastructure (§7) and the domain cutover (§8) are operational, not code.
