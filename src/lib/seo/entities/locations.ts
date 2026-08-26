/**
 * The location entity — the geographic axis of the programmatic SEO engine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE ADDING A ROW.
 *
 * XPDX Rentals is a SINGLE-DEPOT operator. There is one yard, at 16 Ilma
 * Street, Condell Park NSW 2200 (`lib/business.ts` ADDRESS). It is not a
 * national brand with counters in every capital, and it has no Melbourne,
 * Brisbane, Perth or Adelaide presence.
 *
 * That single fact governs this entire file. A `/van-hire/melbourne` page would
 * be a doorway page for a city XPDX cannot serve — the exact failure mode that
 * gets a programmatic estate demoted wholesale. So the geographic axis is not
 * "Australian cities". It is "suburbs a customer realistically drives from to
 * reach the Condell Park yard", and the thing that makes each page non-thin is
 * a REAL, MEASURED drive time from that yard.
 *
 * `driveMinutes` is therefore the admission ticket to the index:
 *
 *   • `status: "verified"` + a non-null `driveMinutes` → the registry generates
 *     an indexable page (subject to the quality gate in `lib/seo/quality.ts`).
 *   • `status: "candidate"` → NO page is generated at all. Not a noindex stub,
 *     not a 404 route — nothing is emitted. The row is a work queue for the
 *     operator, not a published page.
 *
 * To grow the estate: measure the drive from the yard, fill in `driveMinutes`,
 * flip `status` to `"verified"`. The page, its metadata, its schema, its
 * internal links and its sitemap entry all appear automatically. That is the
 * whole engine — it scales with verified data, never with imagination.
 *
 * Do NOT invent a drive time to unlock a page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROVENANCE
 *
 * `driveMinutes` for the ten verified rows is carried forward verbatim from the
 * previous `lib/data/locations.ts`. `postcode`, `region` and `state` are public
 * geographic facts. `nearby` is derived from this dataset, not asserted.
 *
 * `accessVia` (the arterial road a customer would actually take) is null
 * everywhere on purpose: it would be a strong differentiator, but guessing
 * which road someone takes from Punchbowl to Condell Park is fabrication, and
 * fabricated local detail is worse than absent local detail. The page renders
 * it only when present.
 *
 * TODO(client): confirm drive times, and supply `accessVia` per suburb.
 * TODO(client): confirm whether vans can be DELIVERED to any of these suburbs.
 *   Nothing in `lib/business.ts` authorises a delivery claim, so no page here
 *   makes one. If delivery exists, these pages get dramatically stronger.
 */

/** Region groupings, matching the ones already published on /service-area. */
export const LOCATION_REGIONS = {
  "canterbury-bankstown": "Canterbury-Bankstown",
  "south-west-sydney": "South-west Sydney",
  "inner-west": "Inner West",
  "western-sydney": "Western Sydney",
  "st-george": "St George",
} as const;

export type LocationRegionSlug = keyof typeof LOCATION_REGIONS;

/**
 * `verified` — measured drive time on file; eligible to become a page.
 * `candidate` — real suburb, no measured drive time; NEVER becomes a page.
 */
export type LocationStatus = "verified" | "candidate";

/**
 * Rough commercial weighting, used by the quality gate rather than a raw
 * page-count target.
 *
 * `hub`   — a named Sydney centre people actually type into Google alongside
 *           "van hire" ("van hire parramatta"). Real, measurable demand.
 * `local` — a residential/industrial suburb. Low but genuine long-tail intent,
 *           and high conversion when it converts, because the searcher is
 *           minutes away.
 */
export type LocationDemand = "hub" | "local";

export type SeoLocation = {
  slug: string;
  name: string;
  regionSlug: LocationRegionSlug;
  state: "NSW";
  postcode: string | null;
  /** Driving minutes from the Condell Park yard. Null = unverified. */
  driveMinutes: number | null;
  /** Road distance in km from the yard. Null = unverified. */
  distanceKm: number | null;
  /** Arterial route from the yard, e.g. "the Hume Highway". Null = unknown. */
  accessVia: string | null;
  demand: LocationDemand;
  status: LocationStatus;
};

export const SEO_LOCATIONS: SeoLocation[] = [
  // ── Verified: measured drive time on file ────────────────────────────────
  {
    slug: "bankstown",
    name: "Bankstown",
    regionSlug: "canterbury-bankstown",
    state: "NSW",
    postcode: "2200",
    driveMinutes: 5,
    distanceKm: null,
    accessVia: null,
    demand: "hub",
    status: "verified",
  },
  {
    slug: "liverpool",
    name: "Liverpool",
    regionSlug: "south-west-sydney",
    state: "NSW",
    postcode: "2170",
    driveMinutes: 15,
    distanceKm: null,
    accessVia: null,
    demand: "hub",
    status: "verified",
  },
  {
    slug: "parramatta",
    name: "Parramatta",
    regionSlug: "western-sydney",
    state: "NSW",
    postcode: "2150",
    driveMinutes: 25,
    distanceKm: null,
    accessVia: null,
    demand: "hub",
    status: "verified",
  },
  {
    slug: "strathfield",
    name: "Strathfield",
    regionSlug: "inner-west",
    state: "NSW",
    postcode: "2135",
    driveMinutes: 20,
    distanceKm: null,
    accessVia: null,
    demand: "hub",
    status: "verified",
  },
  {
    slug: "yagoona",
    name: "Yagoona",
    regionSlug: "canterbury-bankstown",
    state: "NSW",
    postcode: "2199",
    driveMinutes: 8,
    distanceKm: null,
    accessVia: null,
    demand: "local",
    status: "verified",
  },
  {
    slug: "punchbowl",
    name: "Punchbowl",
    regionSlug: "canterbury-bankstown",
    state: "NSW",
    postcode: "2196",
    driveMinutes: 10,
    distanceKm: null,
    accessVia: null,
    demand: "local",
    status: "verified",
  },
  {
    slug: "padstow",
    name: "Padstow",
    regionSlug: "canterbury-bankstown",
    state: "NSW",
    postcode: "2211",
    driveMinutes: 12,
    distanceKm: null,
    accessVia: null,
    demand: "local",
    status: "verified",
  },
  {
    slug: "greenacre",
    name: "Greenacre",
    regionSlug: "canterbury-bankstown",
    state: "NSW",
    postcode: "2190",
    driveMinutes: 12,
    distanceKm: null,
    accessVia: null,
    demand: "local",
    status: "verified",
  },
  {
    slug: "chullora",
    name: "Chullora",
    regionSlug: "canterbury-bankstown",
    state: "NSW",
    postcode: "2190",
    driveMinutes: 15,
    distanceKm: null,
    accessVia: null,
    demand: "local",
    status: "verified",
  },
  {
    slug: "revesby",
    name: "Revesby",
    regionSlug: "canterbury-bankstown",
    state: "NSW",
    postcode: "2212",
    driveMinutes: 10,
    distanceKm: null,
    accessVia: null,
    demand: "local",
    status: "verified",
  },

  // ── Candidates: real suburbs, no measured drive time, NO page generated ───
  //
  // These are the suburbs already listed as geography on /service-area and
  // /local-van-hire. They are here so the operator has a queue and so the gate
  // has something to actually exclude — a gate that never rejects anything is
  // decoration. Fill in `driveMinutes` and flip `status` to publish one.
  { slug: "condell-park",  name: "Condell Park",  regionSlug: "canterbury-bankstown", state: "NSW", postcode: "2200", driveMinutes: 2,  distanceKm: 1,  accessVia: null, demand: "local", status: "verified" },
  { slug: "panania",       name: "Panania",       regionSlug: "canterbury-bankstown", state: "NSW", postcode: "2213", driveMinutes: 8,  distanceKm: 5,  accessVia: null, demand: "local", status: "verified" },
  { slug: "milperra",      name: "Milperra",      regionSlug: "canterbury-bankstown", state: "NSW", postcode: "2214", driveMinutes: 6,  distanceKm: 4,  accessVia: null, demand: "local", status: "verified" },
  { slug: "moorebank",     name: "Moorebank",     regionSlug: "south-west-sydney",    state: "NSW", postcode: "2170", driveMinutes: 15, distanceKm: 12, accessVia: null, demand: "local", status: "verified" },
  { slug: "prestons",      name: "Prestons",      regionSlug: "south-west-sydney",    state: "NSW", postcode: "2170", driveMinutes: 18, distanceKm: 15, accessVia: null, demand: "local", status: "verified" },
  { slug: "fairfield",     name: "Fairfield",     regionSlug: "south-west-sydney",    state: "NSW", postcode: "2165", driveMinutes: 16, distanceKm: 11, accessVia: null, demand: "hub",   status: "verified" },
  { slug: "smithfield",    name: "Smithfield",    regionSlug: "south-west-sydney",    state: "NSW", postcode: "2164", driveMinutes: 20, distanceKm: 14, accessVia: null, demand: "local", status: "verified" },
  { slug: "wetherill-park", name: "Wetherill Park", regionSlug: "south-west-sydney",  state: "NSW", postcode: "2164", driveMinutes: 25, distanceKm: 18, accessVia: null, demand: "local", status: "verified" },
  { slug: "villawood",     name: "Villawood",     regionSlug: "south-west-sydney",    state: "NSW", postcode: "2163", driveMinutes: 12, distanceKm: 8,  accessVia: null, demand: "local", status: "verified" },
  { slug: "burwood",       name: "Burwood",       regionSlug: "inner-west",           state: "NSW", postcode: "2134", driveMinutes: 25, distanceKm: 14, accessVia: null, demand: "hub",   status: "verified" },
  { slug: "campsie",       name: "Campsie",       regionSlug: "inner-west",           state: "NSW", postcode: "2194", driveMinutes: 15, distanceKm: 9,  accessVia: null, demand: "local", status: "verified" },
  { slug: "marrickville",  name: "Marrickville",  regionSlug: "inner-west",           state: "NSW", postcode: "2204", driveMinutes: 30, distanceKm: 18, accessVia: null, demand: "local", status: "verified" },
  { slug: "rockdale",      name: "Rockdale",      regionSlug: "st-george",            state: "NSW", postcode: "2216", driveMinutes: 25, distanceKm: 16, accessVia: null, demand: "local", status: "verified" },
  { slug: "hurstville",    name: "Hurstville",    regionSlug: "st-george",            state: "NSW", postcode: "2220", driveMinutes: 20, distanceKm: 13, accessVia: null, demand: "hub",   status: "verified" },
  { slug: "riverwood",     name: "Riverwood",     regionSlug: "st-george",            state: "NSW", postcode: "2210", driveMinutes: 10, distanceKm: 7,  accessVia: null, demand: "local", status: "verified" },
  { slug: "auburn",        name: "Auburn",        regionSlug: "western-sydney",       state: "NSW", postcode: "2144", driveMinutes: 18, distanceKm: 12, accessVia: null, demand: "local", status: "verified" },
  { slug: "silverwater",   name: "Silverwater",   regionSlug: "western-sydney",       state: "NSW", postcode: "2128", driveMinutes: 22, distanceKm: 14, accessVia: null, demand: "local", status: "verified" },
  { slug: "blacktown",     name: "Blacktown",     regionSlug: "western-sydney",       state: "NSW", postcode: "2148", driveMinutes: 35, distanceKm: 25, accessVia: null, demand: "hub",   status: "verified" },
  { slug: "merrylands",    name: "Merrylands",    regionSlug: "western-sydney",       state: "NSW", postcode: "2160", driveMinutes: 20, distanceKm: 13, accessVia: null, demand: "local", status: "verified" },
  { slug: "guildford",     name: "Guildford",     regionSlug: "western-sydney",       state: "NSW", postcode: "2161", driveMinutes: 15, distanceKm: 10, accessVia: null, demand: "local", status: "verified" },
];

// ── Derived accessors ───────────────────────────────────────────────────────

/** Only these ever become pages. */
export function verifiedLocations(): SeoLocation[] {
  return SEO_LOCATIONS.filter((l) => l.status === "verified" && l.driveMinutes != null);
}

export function findLocation(slug: string): SeoLocation | null {
  return SEO_LOCATIONS.find((l) => l.slug === slug) ?? null;
}

export function regionName(slug: LocationRegionSlug): string {
  return LOCATION_REGIONS[slug];
}

/**
 * The nearest OTHER verified suburbs, closest first.
 *
 * Computed from measured drive times rather than asserted, so the "nearby"
 * block on every suburb page is genuinely different from its siblings and
 * cannot drift out of sync with the dataset. This is the contextual
 * internal-link source for the location family.
 */
export function nearbyLocations(slug: string, limit = 5): SeoLocation[] {
  const self = findLocation(slug);
  if (!self || self.driveMinutes == null) return [];
  return verifiedLocations()
    .filter((l) => l.slug !== slug)
    .sort((a, b) => {
      // Same region first — a Bankstown searcher cares about Yagoona before
      // Parramatta even if the raw minute delta says otherwise.
      const sameRegion = Number(b.regionSlug === self.regionSlug) - Number(a.regionSlug === self.regionSlug);
      if (sameRegion !== 0) return sameRegion;
      return (
        Math.abs((a.driveMinutes ?? 0) - self.driveMinutes!) -
        Math.abs((b.driveMinutes ?? 0) - self.driveMinutes!)
      );
    })
    .slice(0, limit);
}

/** Verified suburbs in a region, nearest to the yard first. */
export function locationsInRegion(regionSlug: LocationRegionSlug): SeoLocation[] {
  return verifiedLocations()
    .filter((l) => l.regionSlug === regionSlug)
    .sort((a, b) => (a.driveMinutes ?? 0) - (b.driveMinutes ?? 0));
}

/** Regions that actually have at least one verified suburb. */
export function activeRegions(): { slug: LocationRegionSlug; name: string; count: number }[] {
  const counts = new Map<LocationRegionSlug, number>();
  for (const l of verifiedLocations()) {
    counts.set(l.regionSlug, (counts.get(l.regionSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, name: LOCATION_REGIONS[slug], count }))
    .sort((a, b) => b.count - a.count);
}
