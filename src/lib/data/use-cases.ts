import type { SearchIntent } from "@/lib/seo/entities/services";
import type { PublicVan } from "@/lib/data/public-vans";

/**
 * The use-case entity — the job-to-be-done axis.
 *
 * Extended in place (rather than mirrored into a separate SEO table) so there
 * is one definition of a use case for the directory, the landing page, the
 * quality gate, the schema and the sitemap.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY `matches` EXISTS ALONGSIDE `preferredSlugs`
 *
 * The first version of this file selected vans by hardcoded slug only. It
 * failed the moment it met the real fleet: the slugs had been carried over from
 * an older seed dataset, so `group-transport` matched zero live vans and the
 * quality gate 404'd the page. The gate was right — a "vans for group
 * transport" page with no vans on it deserves to 404 — but the underlying
 * coupling was the bug. Renaming a van in the admin panel should not silently
 * delete a landing page.
 *
 * So selection is now two-tier and self-healing:
 *
 *   preferredSlugs — editorial curation. Honoured first, in order, when the
 *                    slug resolves to a live van.
 *   matches        — a predicate over the real fleet, used to top up to
 *                    `limit`. This is the safety net: a renamed or retired van
 *                    degrades the page's curation, it does not destroy it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `termFit` IS THE IMPORTANT FIELD.
 *
 * XPDX's minimum hire is 28 days (`HIRE_TERMS.minHireDays`). That is fatal to
 * a whole class of use-case keywords, and pretending otherwise is the fastest
 * way to earn traffic that bounces:
 *
 *   strong — the job naturally runs a month or more. A courier round, a trade
 *            contract, a standing shuttle. Indexable.
 *   fair   — the job can run long, but often does not. Indexable, with copy
 *            that leads with the term rather than burying it.
 *   poor   — the job is typically over in a day or two. The page is still
 *            built (someone who lands on it deserves a straight answer and a
 *            route to the fleet) but the quality gate REFUSES TO INDEX IT.
 *
 * "Moving house" is the honest casualty. "Moving van hire Sydney" is a large
 * query and XPDX cannot serve the person typing it — they want a van on
 * Saturday, not for 28 days. Ranking for it would buy bounces and phone calls
 * that end in an apology. The page therefore stays `poor`, gets noindexed by
 * the gate, and speaks to the audience that CAN be served: removalists,
 * relocation businesses and staged moves.
 */

export type UseCaseIcon = "home" | "package-search" | "hard-hat" | "snowflake" | "users" | "camera";

/** See the note above — this drives indexation, not just copy. */
export type TermFit = "strong" | "fair" | "poor";

export type UseCase = {
  id: string;
  title: string;
  description: string;
  icon: UseCaseIcon;
  /** Editorial pick, honoured first where the slug resolves to a live van. */
  preferredSlugs: string[];
  /** Fleet predicate used to top up the recommendation. Never returns stale. */
  matches: (van: PublicVan) => boolean;

  // ── SEO fields ────────────────────────────────────────────────────────────
  /** The one query this page owns. Must not collide with another family. */
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent;
  termFit: TermFit;
  /** Why these vans, in terms of the job. Rendered as the page's own prose. */
  fitNotes: string[];
  /** Relevant FAQ ids from `lib/content/faqs.ts`. */
  faqIds: string[];
  /** Service slugs (from `lib/seo/entities/services.ts`) worth linking to. */
  relatedServices: string[];
};

const isPanelVan = (v: PublicVan) => /panel van/i.test(v.bodyType);

export const USE_CASES: UseCase[] = [
  {
    id: "courier-delivery",
    title: "Courier & Delivery",
    description: "Agile, easy-to-park vans with great fuel economy for multi-drop city routes.",
    icon: "package-search",
    preferredSlugs: ["toyota-hiace-slwb", "ford-transit-custom", "mercedes-sprinter-313-l1h1"],
    // Compact-to-mid panel vans: what a multi-drop round actually wants.
    matches: (v) => isPanelVan(v) && (v.lengthMm == null || v.lengthMm <= 5600),
    primaryKeyword: "courier van hire sydney",
    secondaryKeywords: ["delivery van hire sydney", "van for courier work sydney", "multi drop van rental"],
    intent: "use-case",
    termFit: "strong",
    fitNotes: [
      "A courier round is measured in kilometres, and every hire here is unlimited — the busiest week costs the same as the quietest.",
      "Shorter wheelbases park and turn in the places a round actually takes you: laneways, loading docks, residential streets.",
      "Servicing and 24/7 roadside assistance are included, because a van off the road is a round that does not run.",
    ],
    faqIds: ["kilometre-limits", "commercial-use", "breakdown", "fuel"],
    relatedServices: ["cargo-van-hire", "long-term-van-hire"],
  },
  {
    id: "trade-construction",
    title: "Trade & Construction",
    description: "Rugged workhorses with the height and payload for tools, materials and a team.",
    icon: "hard-hat",
    preferredSlugs: ["mercedes-sprinter-313-l2h2", "toyota-hiace-lwb-high-roof", "ldv-deliver-9-lwb"],
    matches: (v) => isPanelVan(v) && (v.roof === "high" || (v.payloadKg ?? 0) >= 1000),
    primaryKeyword: "tradie van hire sydney",
    secondaryKeywords: ["work van hire sydney", "construction van rental sydney", "van hire for tradesmen"],
    intent: "use-case",
    termFit: "strong",
    fitNotes: [
      "Contracts run in months, which is exactly how these hires are priced — weekly rates with discounts at three and six months.",
      "Full bulkhead and tie-down rails as standard, so tools stay behind the cabin and stay put.",
      "Additional drivers can be added to the agreement once they meet the eligibility requirements.",
    ],
    faqIds: ["commercial-use", "additional-drivers", "servicing", "documents"],
    relatedServices: ["high-roof-van-hire", "cargo-van-hire", "long-term-van-hire"],
  },
  {
    id: "cold-chain",
    title: "Refrigerated / Cold Chain",
    description: "Temperature-controlled vans for food, floral, and pharmaceutical transport.",
    icon: "snowflake",
    preferredSlugs: ["mercedes-sprinter-416-refrigerated"],
    matches: (v) => /refrigerat|reefer|chiller/i.test(v.bodyType),
    primaryKeyword: "cold chain van hire sydney",
    secondaryKeywords: ["food delivery van hire sydney", "temperature controlled van rental nsw"],
    intent: "use-case",
    termFit: "strong",
    fitNotes: [
      "Cold chain work is a standing round, not a one-off job — long-term terms match how the work is actually contracted.",
      "The refrigeration unit is covered by the same maintenance program as the vehicle.",
    ],
    faqIds: ["commercial-use", "servicing", "minimum-rental-period"],
    relatedServices: ["refrigerated-van-hire", "long-term-van-hire"],
  },
  {
    id: "group-transport",
    title: "Group Transport",
    description: "Comfortable multi-seat people movers for corporate events or site shuttles.",
    icon: "users",
    preferredSlugs: ["toyota-hiace-commuter"],
    matches: (v) => v.seats != null && v.seats >= 8,
    primaryKeyword: "staff transport van hire sydney",
    secondaryKeywords: ["site shuttle van hire sydney", "corporate people mover hire nsw"],
    intent: "use-case",
    termFit: "fair",
    fitNotes: [
      "A standing shuttle — site to accommodation, depot to yard — runs for months, which suits the terms here.",
      "A one-off charter for a single weekend does not: the minimum hire is 28 days.",
      "Every driver must meet the same eligibility requirements as any other hire.",
    ],
    faqIds: ["minimum-rental-period", "who-can-rent", "additional-drivers", "interstate"],
    relatedServices: ["twelve-seater-van-hire", "long-term-van-hire"],
  },
  {
    id: "event-production",
    title: "Events & Production",
    description:
      "Secure, lockable vans for catering, lighting, sound and production gear.",
    icon: "camera",
    preferredSlugs: ["mercedes-sprinter-313-l2h2", "toyota-hiace-slwb", "ldv-deliver-9-lwb"],
    matches: (v) => isPanelVan(v) && (v.loadVolumeM3 == null || v.loadVolumeM3 >= 6),
    primaryKeyword: "production van hire sydney",
    secondaryKeywords: ["event van hire sydney", "equipment van rental sydney"],
    intent: "use-case",
    termFit: "fair",
    fitNotes: [
      "A season, a tour leg or a build that runs across months fits the 28-day minimum comfortably.",
      "A single weekend load-in does not — worth knowing before you enquire.",
      "Lockable, bulkheaded load bays and GPS tracking on every van.",
    ],
    faqIds: ["minimum-rental-period", "commercial-use", "kilometre-limits"],
    relatedServices: ["cargo-van-hire", "high-roof-van-hire"],
  },
  {
    id: "moving-house",
    title: "Moving House",
    description: "The largest vans in the fleet, for furniture, appliances and full loads.",
    icon: "home",
    preferredSlugs: ["ldv-deliver-9-lwb", "iveco-daily-35s14-pantech", "mercedes-sprinter-313-l2h2"],
    matches: (v) => (v.loadVolumeM3 ?? 0) >= 9 || v.roof === "high" || /pantech/i.test(v.bodyType),
    primaryKeyword: "removalist van hire sydney",
    secondaryKeywords: ["relocation van hire sydney", "furniture van rental sydney"],
    intent: "use-case",
    // See the file header. A weekend house move cannot be served on a 28-day
    // minimum, so this page is built but never indexed.
    termFit: "poor",
    fitNotes: [
      "Worth saying up front: the minimum hire is 28 days, so this is not the right option for a single weekend move.",
      "It is the right option for removalist and relocation businesses, and for staged moves or renovations that run for weeks.",
      "The largest vans in the fleet carry a full household load in one trip rather than three.",
    ],
    faqIds: ["minimum-rental-period", "who-can-rent", "kilometre-limits"],
    relatedServices: ["high-roof-van-hire", "long-term-van-hire"],
  },
];

export function findUseCase(id: string): UseCase | null {
  return USE_CASES.find((u) => u.id === id) ?? null;
}

/**
 * The vans to show for a use case: curation first, predicate as the safety net.
 *
 * The single source of "which vans is this page about", shared by the registry
 * (which gates on the count), the page body and the ItemList schema — so a
 * page can never mark up a van it does not display.
 */
export function recommendedVans(useCase: UseCase, vans: PublicVan[], limit = 3): PublicVan[] {
  const live = vans.filter((v) => v.status !== "draft");
  const picked: PublicVan[] = [];

  for (const slug of useCase.preferredSlugs) {
    const match = live.find((v) => v.slug === slug);
    if (match && !picked.includes(match)) picked.push(match);
  }

  if (picked.length < limit) {
    for (const van of live.filter(useCase.matches).sort((a, b) => a.priceWeeklyFrom - b.priceWeeklyFrom)) {
      if (picked.length >= limit) break;
      if (!picked.includes(van)) picked.push(van);
    }
  }

  return picked.slice(0, limit);
}
