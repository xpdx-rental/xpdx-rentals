import type { PublicVan } from "@/lib/data/public-vans";
import { HIRE_TERMS } from "@/lib/business";

/**
 * The service entity — the vehicle-category / rental-intent axis.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THESE FIVE AND NOT FIFTY
 *
 * A service page here is NOT a keyword with a template behind it. It is a
 * QUERY OVER THE REAL FLEET. `matches` is a predicate against `PublicVan`, and
 * a service with no matching van produces no page — no route, no sitemap
 * entry, no schema. If XPDX sells the refrigerated Sprinter tomorrow,
 * `/refrigerated-van-hire` stops existing on the next revalidation. Nothing has
 * to remember to delete it.
 *
 * That constraint is what keeps this honest, and it is why the list is short.
 * Every plausible-sounding page family the brief suggests was tested against
 * two questions — does XPDX actually offer it, and does it have its own search
 * intent — and most failed:
 *
 *   ✗ /moving-van-hire, /weekend-van-hire, /one-way-van-hire, /ute-hire
 *       The minimum hire is ${HIRE_TERMS.minHireDays} days (`lib/business.ts`).
 *       Someone searching "van hire for the weekend" cannot be served. Ranking
 *       for it buys bounces and angry phone calls, not bookings.
 *   ✗ /van-hire/melbourne (and every other capital)
 *       One depot, in Condell Park. See `entities/locations.ts`.
 *   ✗ /automatic-van-hire, /diesel-van-hire
 *       Every van in the fleet is automatic and diesel (`FLEET_COMMON`), so the
 *       page would be a duplicate of /vans with a different <h1>. It is a
 *       genuine differentiator in COPY, not a separate URL.
 *   ✗ /cargo-van-hire/[suburb] and the rest of the service × location grid
 *       See CROSS-PRODUCT below.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CROSS-PRODUCT: DELIBERATELY OFF
 *
 * The registry can generate service × location. It is switched off, per
 * service, via `allowLocationCross`, and every service currently sets it
 * `false`.
 *
 * The reason is cannibalisation, not effort. For a single-depot operator,
 * "cargo van hire bankstown" and "van hire bankstown" resolve to the same
 * business answer: the same yard, the same drive time, an overlapping fleet.
 * Two URLs competing for one intent split their own signals and neither ranks.
 * The 5 × 10 grid would add 50 URLs whose only per-page delta is a drive time
 * already stated on the suburb page.
 *
 * Turn a service's flag on only when its cross pages would carry information
 * the suburb page genuinely does not — e.g. a second depot, suburb-specific
 * pricing, or suburb-specific availability. Then the registry emits them and
 * the gate scores them like anything else.
 */

/**
 * The canonical search intent a page family owns. Two families must never
 * share one — that is the cannibalisation check, enforced in `registry.ts`.
 */
export type SearchIntent =
  /** "van hire sydney", "cargo van hire" — ready to hire, comparing suppliers. */
  | "transactional"
  /** "van hire bankstown", "van hire near me" — ready to hire, geography-led. */
  | "local"
  /** "12 seater van hire", "refrigerated van hire" — vehicle-spec led. */
  | "vehicle"
  /** "long term van hire", "monthly van rental" — duration/commitment led. */
  | "duration"
  /** "van for courier work", "van for moving house" — job-led. */
  | "use-case"
  /** "best van hire sydney", "van hire vs buying" — still comparing. */
  | "commercial-investigation";

export type SeoService = {
  slug: string;
  /** Route path. Root-level: these are the money URLs. */
  path: string;
  /** Used in <h1> and breadcrumbs. Sentence case. */
  name: string;
  /** The one query this page owns. Nothing else may target it. */
  primaryKeyword: string;
  /** Supporting queries. Must NOT be any other family's primaryKeyword. */
  secondaryKeywords: string[];
  intent: SearchIntent;
  /** Shown under the <h1>. States only facts from `lib/business.ts` + fleet. */
  intro: string;
  /** What makes this category the right pick — bullet points, all verifiable. */
  positioning: string[];
  /** Fleet predicate. A service with zero matches produces no page. */
  matches: (van: PublicVan) => boolean;
  /** Below this many matching vans the gate refuses to publish. */
  minVans: number;
  /** FAQ ids from `lib/content/faqs.ts` that are genuinely relevant here. */
  faqIds: string[];
  /** Sibling service slugs to link to. Related, never competing. */
  related: string[];
  /** See CROSS-PRODUCT above. */
  allowLocationCross: boolean;
};

export const SEO_SERVICES: SeoService[] = [
  {
    slug: "cargo-van-hire",
    path: "/cargo-van-hire",
    name: "Cargo van hire",
    primaryKeyword: "cargo van hire sydney",
    secondaryKeywords: ["panel van hire sydney", "cargo van rental sydney", "commercial cargo van hire"],
    intent: "transactional",
    intro:
      "Every cargo van in our fleet is an automatic diesel panel van, fitted out for work — bulkhead, reverse camera and GPS tracking as standard. Collect from our Condell Park yard and run it across New South Wales.",
    positioning: [
      "Fitted out for cargo, not converted from a passenger van — full bulkhead, tie-down rails, load lighting.",
      "Unlimited kilometres on every hire, so a long run costs no more than a short one.",
      "Comprehensive insurance, scheduled servicing and 24/7 roadside assistance are in the weekly rate.",
    ],
    matches: (v) => /panel van/i.test(v.bodyType),
    minVans: 2,
    faqIds: ["commercial-use", "kilometre-limits", "minimum-rental-period", "servicing"],
    related: ["long-term-van-hire", "high-roof-van-hire", "crew-van-hire"],
    allowLocationCross: false,
  },
  {
    slug: "long-term-van-hire",
    path: "/long-term-van-hire",
    name: "Long-term van hire",
    primaryKeyword: "long term van hire sydney",
    secondaryKeywords: [
      "monthly van hire sydney",
      "long term van rental nsw",
      "van hire monthly rates sydney",
    ],
    intent: "duration",
    intro:
      `Long-term hire is the whole business, not a bolt-on. The minimum term is ${HIRE_TERMS.minHireDays} days and the rate is weekly, with discounts at three and six months — so the longer you keep the van, the cheaper the week gets.`,
    positioning: [
      `A ${HIRE_TERMS.minHireDays}-day minimum term, with monthly rates published on every van page.`,
      "Servicing, maintenance and comprehensive insurance stay with us for the length of the hire.",
      "Return the van any time after the initial term with the notice set out in your agreement.",
      "Unlimited kilometres — a long-term hire is not metered.",
    ],
    // Every van meets the minimum term; that IS the offer. The predicate is
    // still a real query rather than `() => true` so the page dies honestly if
    // the terms ever change.
    matches: (v) => v.minHireDays >= HIRE_TERMS.minHireDays,
    minVans: 3,
    faqIds: ["minimum-rental-period", "return-early", "payment", "kilometre-limits"],
    related: ["cargo-van-hire", "crew-van-hire", "refrigerated-van-hire"],
    allowLocationCross: false,
  },
  {
    slug: "high-roof-van-hire",
    path: "/high-roof-van-hire",
    name: "High-roof van hire",
    primaryKeyword: "high roof van hire sydney",
    secondaryKeywords: ["stand up van hire sydney", "tall van hire", "high top van rental sydney"],
    intent: "vehicle",
    intro:
      "High-roof vans let you stand up inside the load bay. If you are packing and unpacking all day, or moving anything tall, this is the part of the fleet to look at.",
    positioning: [
      "Stand-up load bays — significantly less stooping across a full shift.",
      "The largest load volumes in the fleet without stepping up to a truck licence.",
      "Same inclusions as every hire: unlimited kilometres, insurance, roadside assistance.",
    ],
    matches: (v) => v.roof === "high",
    minVans: 2,
    faqIds: ["commercial-use", "kilometre-limits", "who-can-rent"],
    related: ["cargo-van-hire", "long-term-van-hire"],
    allowLocationCross: false,
  },
  {
    slug: "refrigerated-van-hire",
    path: "/refrigerated-van-hire",
    name: "Refrigerated van hire",
    primaryKeyword: "refrigerated van hire sydney",
    secondaryKeywords: ["reefer van hire sydney", "chiller van hire nsw", "cold chain van rental sydney"],
    intent: "vehicle",
    intro:
      "Temperature-controlled hire for operators who cannot break the cold chain — food service, fresh produce, floral and pharmaceutical distribution across New South Wales.",
    positioning: [
      "Purpose-built refrigerated body, not an insulated liner in a standard panel van.",
      "Long-term terms suit a distribution round rather than a one-off delivery.",
      "Refrigeration servicing is covered by the same maintenance program as the vehicle.",
    ],
    matches: (v) => /refrigerat|reefer|chiller/i.test(v.bodyType),
    // A specialist category earns a page on one vehicle: the vehicle's own spec
    // sheet carries enough genuinely unique detail, and the search intent is
    // completely distinct from general van hire.
    minVans: 1,
    faqIds: ["commercial-use", "servicing", "minimum-rental-period", "breakdown"],
    related: ["long-term-van-hire", "cargo-van-hire"],
    allowLocationCross: false,
  },
  {
    slug: "tail-lift-van-hire",
    path: "/tail-lift-van-hire",
    name: "Tail lift van hire",
    primaryKeyword: "tail lift van hire sydney",
    secondaryKeywords: ["pantech hire sydney", "tailgate loader van hire nsw", "furniture truck hire sydney"],
    intent: "vehicle",
    intro:
      "A pantech body with a hydraulic tail lift, for loads that cannot be carried up a ramp. If you are moving appliances, pallets or anything a two-person lift will not manage, this is the one to ask about.",
    positioning: [
      "Hydraulic tail lift — heavy items go on at ground level rather than being lifted.",
      "Box body with more usable cubic space than a panel van of similar length.",
      "Long-term terms, so it suits a standing removals or distribution contract.",
    ],
    matches: (v) => /pantech|tail ?lift|tailgate|box body|luton/i.test(`${v.bodyType} ${v.name}`),
    minVans: 1,
    faqIds: ["who-can-rent", "commercial-use", "minimum-rental-period", "servicing"],
    related: ["cargo-van-hire", "high-roof-van-hire", "long-term-van-hire"],
    allowLocationCross: false,
  },
  {
    // DORMANT BY DESIGN. There is currently no crew van in the fleet, so this
    // service matches nothing and the gate does not generate a page for it —
    // `/admin/seo` shows it as suppressed, with that reason. The definition
    // stays because it is a category XPDX plausibly stocks, and leaving it
    // here means adding one crew van publishes the page, its schema, its
    // internal links and its sitemap entry with no code change. That is the
    // engine working: the estate tracks the yard.
    slug: "crew-van-hire",
    path: "/crew-van-hire",
    name: "Crew van hire",
    primaryKeyword: "crew van hire sydney",
    secondaryKeywords: ["dual cab van hire sydney", "5 seater van hire sydney", "trade crew van rental"],
    intent: "vehicle",
    intro:
      "Crew vans carry the team and the tools in one vehicle — a second row of seats up front, a bulkheaded cargo bay behind. The usual pick for trade teams working across a site.",
    positioning: [
      "Seats the crew without a second vehicle on the road.",
      "Cargo bay stays separated from the cabin by a full bulkhead.",
      "Additional drivers can be added to the agreement once they meet the eligibility requirements.",
    ],
    matches: (v) => /crew/i.test(v.bodyType) || (v.seats != null && v.seats >= 4 && v.seats <= 7),
    minVans: 1,
    faqIds: ["additional-drivers", "who-can-rent", "commercial-use", "documents"],
    related: ["cargo-van-hire", "twelve-seater-van-hire", "long-term-van-hire"],
    allowLocationCross: false,
  },
  {
    slug: "twelve-seater-van-hire",
    path: "/12-seater-van-hire",
    name: "12-seater van hire",
    primaryKeyword: "12 seater van hire sydney",
    secondaryKeywords: ["minibus hire sydney long term", "people mover hire sydney", "12 seat van rental nsw"],
    intent: "vehicle",
    intro:
      "Long-term people-mover hire for site shuttles, corporate transfers and group transport. Same terms as the rest of the fleet — weekly rate, unlimited kilometres, maintenance included.",
    positioning: [
      "Twelve seats, so a whole crew or client group moves in one vehicle.",
      "Long-term terms suit a standing shuttle run rather than a one-off charter.",
      "Drivers must meet the same eligibility requirements as any other hire.",
    ],
    matches: (v) => v.seats != null && v.seats >= 8,
    minVans: 1,
    faqIds: ["who-can-rent", "additional-drivers", "minimum-rental-period", "interstate"],
    related: ["crew-van-hire", "long-term-van-hire"],
    allowLocationCross: false,
  },
];

export function findService(slug: string): SeoService | null {
  return SEO_SERVICES.find((s) => s.slug === slug) ?? null;
}

/** Resolve a service by its public path segment (`/12-seater-van-hire`). */
export function findServiceByPathSegment(segment: string): SeoService | null {
  return SEO_SERVICES.find((s) => s.path === `/${segment}`) ?? null;
}

/**
 * The vans a service actually covers, cheapest first.
 *
 * The single source of "does this page have anything behind it". Used by the
 * quality gate, the page body, the ItemList schema and the internal links, so
 * they can never disagree.
 */
export function vansForService(service: SeoService, vans: PublicVan[]): PublicVan[] {
  return vans
    .filter((v) => v.status !== "draft" && service.matches(v))
    .sort((a, b) => a.priceWeeklyFrom - b.priceWeeklyFrom);
}

/** Cheapest weekly rate in a service, for "from $X/week" claims. Null if none. */
export function serviceFromPrice(service: SeoService, vans: PublicVan[]): number | null {
  const matched = vansForService(service, vans);
  return matched.length ? matched[0].priceWeeklyFrom : null;
}
