import { cache } from "react";
import { getPublicVans, type PublicVan } from "@/lib/data/public-vans";
import { HIRE_TERMS } from "@/lib/business";
import { formatWeekly } from "@/lib/van";
import {
  SEO_SERVICES,
  vansForService,
  serviceFromPrice,
  type SeoService,
  type SearchIntent,
} from "@/lib/seo/entities/services";
import {
  verifiedLocations,
  nearbyLocations,
  regionName,
  type SeoLocation,
} from "@/lib/seo/entities/locations";
import { USE_CASES, recommendedVans, type UseCase } from "@/lib/data/use-cases";
import { CORE_PAGES } from "@/lib/seo/entities/core-pages";
import {
  decide,
  INTENT_VALUE,
  TERM_FIT_MULTIPLIER,
  type PageDecision,
} from "@/lib/seo/quality";

/**
 * The page registry — the generation engine.
 *
 * ONE function builds every programmatic URL on the site, runs each through
 * the quality gate, and hands the result to everything downstream:
 *
 *   • routes           — `generateStaticParams` filters on `decision.generate`
 *   • metadata         — title/description/canonical/robots all come from here
 *   • sitemap          — filters on `decision.sitemap`
 *   • internal linking — `lib/seo/links.ts` reads the same list
 *   • /admin/seo       — renders the decisions and their reasons
 *
 * That single-source property is the point. The classic programmatic failure
 * is a URL that is in the sitemap, noindexed by its own metadata, canonicalised
 * somewhere else and linked from nowhere — four subsystems each with their own
 * copy of "which pages exist", drifting apart over a few releases. Here they
 * cannot drift, because there is only one copy.
 *
 * Everything is derived from live fleet data, so the estate tracks the
 * business: sell the refrigerated van and `/refrigerated-van-hire` stops being
 * generated on the next revalidation, drops out of the sitemap, and loses its
 * inbound internal links, without anyone remembering to do it.
 */

export type SeoPageKind = "core" | "service" | "location" | "use-case" | "vehicle";

export type SeoPage = {
  kind: SeoPageKind;
  path: string;
  /** Entity slug within its family. `""` for singleton pages. */
  slug: string;
  h1: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent;
  breadcrumbs: { name: string; path: string }[];
  decision: PageDecision;
  lastModified: Date;
  /** Sitemap priority. Only meaningful when `decision.sitemap` is true. */
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
};

const BRAND_SUFFIX = "XPDX Rentals";

/** Titles are trimmed to stay clear of SERP truncation (~60 chars). */
function title(core: string): string {
  const full = `${core} | ${BRAND_SUFFIX}`;
  return full.length <= 62 ? full : core;
}

function freshest(vans: PublicVan[]): Date {
  const latest = vans.reduce<number>((max, v) => {
    const t = v.updatedAt ? new Date(v.updatedAt).getTime() : 0;
    return Number.isFinite(t) && t > max ? t : max;
  }, 0);
  return latest === 0 ? new Date() : new Date(latest);
}

// ─────────────────────────────────────────────────────────────────────────────
// Family builders. Each returns candidates; the gate decides what survives.
// ─────────────────────────────────────────────────────────────────────────────

function buildServicePage(service: SeoService, vans: PublicVan[], hasContact: boolean): SeoPage {
  const matched = vansForService(service, vans);
  const from = serviceFromPrice(service, vans);

  // Modules whose CONTENT differs from a sibling service page. The shared
  // "what's included" block is excluded on purpose — it is identical
  // everywhere, so it differentiates nothing.
  const differentiating = [
    matched.length > 0, // the matched fleet subset
    service.positioning.length > 0, // category-specific positioning
    from != null, // a real from-price for this subset
    service.faqIds.length > 0, // a curated FAQ subset
    service.related.length > 0, // category-specific related links
  ].filter(Boolean).length;

  const dataPossible = 5;
  const dataPresent = [
    service.intro.length > 0,
    service.positioning.length > 0,
    service.faqIds.length > 0,
    service.related.length > 0,
    from != null,
  ].filter(Boolean).length;

  const decision = decide(service.path, {
    entityValid: true,
    matchedVans: matched.length,
    minVans: service.minVans,
    differentiatingModules: differentiating,
    dataFieldsPresent: dataPresent,
    dataFieldsPossible: dataPossible,
    intentValue: INTENT_VALUE[service.intent],
    outboundLinks: matched.length + service.related.length + 2,
    hasConversionPath: hasContact,
  });

  const priceFragment = from != null ? ` from ${formatWeekly(from)}/week` : "";

  return {
    kind: "service",
    path: service.path,
    slug: service.slug,
    h1: `${service.name} in Sydney`,
    title: title(`${service.name} Sydney`),
    description:
      `${service.name}${priceFragment} from our Condell Park yard in Sydney. ` +
      `${matched.length} ${matched.length === 1 ? "vehicle" : "vehicles"} in this category — automatic diesel, ` +
      `unlimited kilometres, comprehensive insurance and 24/7 roadside assistance included. ` +
      `${HIRE_TERMS.minHireDays} day minimum hire.`,
    primaryKeyword: service.primaryKeyword,
    secondaryKeywords: service.secondaryKeywords,
    intent: service.intent,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Van hire", path: "/van-hire" },
      { name: service.name, path: service.path },
    ],
    decision,
    lastModified: freshest(matched.length ? matched : vans),
    priority: service.intent === "transactional" || service.intent === "duration" ? 0.9 : 0.8,
    changeFrequency: "weekly",
  };
}

function buildLocationPage(loc: SeoLocation, vans: PublicVan[], hasContact: boolean): SeoPage {
  const path = `/van-hire/${loc.slug}`;
  const nearby = nearbyLocations(loc.slug);
  const region = regionName(loc.regionSlug);

  // Every entry here genuinely varies between suburb pages. Note what is NOT
  // counted: the fleet grid, the inclusions list and the FAQ block are the
  // same on all ten, so they add usefulness but not differentiation.
  const differentiating = [
    loc.driveMinutes != null, // measured drive time from the yard
    nearby.length > 0, // computed nearest-suburb set
    Boolean(loc.postcode), // suburb + postcode + region line
    true, // suburb-seeded directions link
    loc.accessVia != null, // arterial route, when confirmed
  ].filter(Boolean).length;

  const dataPossible = 5;
  const dataPresent = [
    loc.driveMinutes != null,
    loc.distanceKm != null,
    Boolean(loc.postcode),
    loc.accessVia != null,
    nearby.length > 0,
  ].filter(Boolean).length;

  const decision = decide(path, {
    entityValid: loc.status === "verified" && loc.driveMinutes != null,
    matchedVans: vans.filter((v) => v.status !== "draft").length,
    // A suburb page needs a real fleet behind it, not one van.
    minVans: 3,
    differentiatingModules: differentiating,
    dataFieldsPresent: dataPresent,
    dataFieldsPossible: dataPossible,
    intentValue: INTENT_VALUE.local * (loc.demand === "hub" ? 1 : 0.85),
    outboundLinks: nearby.length + 4,
    hasConversionPath: hasContact,
  });

  return {
    kind: "location",
    path,
    slug: loc.slug,
    h1: `Van hire in ${loc.name}`,
    title: title(`Van Hire ${loc.name}`),
    description:
      `Van hire for ${loc.name}${loc.postcode ? ` ${loc.postcode}` : ""}, ${region}. ` +
      `Our yard is ${loc.driveMinutes} minutes away in Condell Park — automatic diesel vans with unlimited ` +
      `kilometres, comprehensive insurance and 24/7 roadside assistance. ${HIRE_TERMS.minHireDays} day minimum hire.`,
    primaryKeyword: `van hire ${loc.name.toLowerCase()}`,
    secondaryKeywords: [
      `van rental ${loc.name.toLowerCase()}`,
      `van hire near ${loc.name.toLowerCase()}`,
      `cargo van hire ${loc.name.toLowerCase()}`,
    ],
    intent: "local",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Van hire", path: "/van-hire" },
      { name: loc.name, path },
    ],
    decision,
    lastModified: freshest(vans),
    priority: loc.demand === "hub" ? 0.8 : 0.7,
    changeFrequency: "weekly",
  };
}

function buildUseCasePage(uc: UseCase, vans: PublicVan[], hasContact: boolean): SeoPage {
  const path = `/use-cases/${uc.id}`;
  // Same selector the page body and the ItemList schema use, so the gate can
  // never count vans the page will not render.
  const matched = recommendedVans(uc, vans);

  const differentiating = [
    matched.length > 0,
    uc.fitNotes.length > 0,
    uc.faqIds.length > 0,
    uc.relatedServices.length > 0,
  ].filter(Boolean).length;

  const dataPresent = [
    uc.fitNotes.length > 0,
    matched.length > 0,
    uc.faqIds.length > 0,
    uc.relatedServices.length > 0,
  ].filter(Boolean).length;

  const decision = decide(path, {
    entityValid: true,
    matchedVans: matched.length,
    minVans: 0,
    differentiatingModules: differentiating,
    dataFieldsPresent: dataPresent,
    dataFieldsPossible: 4,
    intentValue: INTENT_VALUE["use-case"] * TERM_FIT_MULTIPLIER[uc.termFit],
    outboundLinks: matched.length + uc.relatedServices.length + 2,
    hasConversionPath: hasContact,
    serveButDoNotIndex:
      uc.termFit === "poor"
        ? `"${uc.primaryKeyword}" is dominated by people who need a van for a day or two, and the minimum hire is ${HIRE_TERMS.minHireDays} days.`
        : undefined,
  });

  return {
    kind: "use-case",
    path,
    slug: uc.id,
    h1: `Vans for ${uc.title.toLowerCase()}`,
    title: title(`${uc.title} Van Hire Sydney`),
    description:
      `${uc.description} ${matched.length} recommended ${matched.length === 1 ? "van" : "vans"} from our ` +
      `Condell Park fleet — unlimited kilometres, insurance and maintenance included. ` +
      `${HIRE_TERMS.minHireDays} day minimum hire.`,
    primaryKeyword: uc.primaryKeyword,
    secondaryKeywords: uc.secondaryKeywords,
    intent: uc.intent,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Use cases", path: "/use-cases" },
      { name: uc.title, path },
    ],
    decision,
    lastModified: freshest(matched.length ? matched : vans),
    priority: uc.termFit === "strong" ? 0.75 : 0.6,
    changeFrequency: "monthly",
  };
}

function buildVehiclePage(van: PublicVan, hasContact: boolean): SeoPage {
  const path = `/vans/${van.slug}`;

  const differentiating = [
    Boolean(van.description),
    van.features.length > 0,
    van.loadVolumeM3 != null || van.payloadKg != null,
    van.images.length > 0,
  ].filter(Boolean).length;

  const dataPresent = [
    van.lengthMm != null,
    van.heightMm != null,
    van.widthMm != null,
    van.loadVolumeM3 != null,
    van.payloadKg != null,
    Boolean(van.description),
    van.images.length > 0,
  ].filter(Boolean).length;

  const decision = decide(path, {
    entityValid: van.status !== "draft",
    matchedVans: 1,
    minVans: 1,
    differentiatingModules: differentiating,
    dataFieldsPresent: dataPresent,
    dataFieldsPossible: 7,
    // A model page is the most transactional URL on the site: the searcher has
    // named the vehicle they want.
    intentValue: INTENT_VALUE.transactional,
    outboundLinks: 5,
    hasConversionPath: hasContact,
  });

  // A single-vehicle page can never score high on the inventory signal, which
  // is calibrated for category pages. That is a measurement artefact, not a
  // quality judgement: a VDP with full specs, photos and prose is the most
  // commercially valuable page on the site. Grant the inventory weight it
  // structurally cannot earn, and say so in the audit trail.
  const adjusted = Math.min(100, decision.score + 20);
  const promoted: PageDecision = {
    ...decision,
    score: adjusted,
    index: decision.generate && decision.canonicalPath === path,
    sitemap: decision.generate && decision.canonicalPath === path && dataPresent >= 4,
    reasons: [
      ...decision.reasons,
      "Vehicle detail page: +20 inventory adjustment (the signal is calibrated for category pages; a VDP is one vehicle by definition).",
      dataPresent >= 4
        ? "Specification record complete enough to submit for crawl."
        : "Specification record too sparse to submit for crawl — indexable, discovered via /vans.",
    ],
  };

  return {
    kind: "vehicle",
    path,
    slug: van.slug,
    h1: van.name,
    title: van.seoTitle ?? title(`${van.name} Hire Sydney`),
    description:
      van.seoDescription ??
      `Hire a ${van.name} from ${formatWeekly(van.priceWeeklyFrom)} per week in Sydney. ` +
        `Unlimited kilometres, comprehensive insurance and 24/7 roadside assistance included. ` +
        `${HIRE_TERMS.minHireDays} day minimum hire, Condell Park.`,
    primaryKeyword: `${van.name.toLowerCase()} hire sydney`,
    secondaryKeywords: [`${van.name.toLowerCase()} rental sydney`],
    intent: "transactional",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Our fleet", path: "/vans" },
      { name: van.name, path },
    ],
    decision: promoted,
    lastModified: van.updatedAt ? new Date(van.updatedAt) : new Date(),
    priority: 0.9,
    changeFrequency: "weekly",
  };
}

/**
 * Editorial and hub pages.
 *
 * Hand-authored rather than generated, so they bypass the quality score — but
 * they are in the registry so the sitemap has one source, the cannibalisation
 * pass can see them, and `/admin/seo` shows the whole estate rather than only
 * the generated half.
 *
 * Their copy comes from `entities/core-pages.ts`, which the routes themselves
 * also import. That shared module is the fix for a real defect in the first
 * version of this function: it carried its own titles and descriptions, which
 * immediately disagreed with what the pages actually shipped, so the audit
 * table described pages that did not exist.
 */
function buildCorePages(vans: PublicVan[]): SeoPage[] {
  const fleetDate = freshest(vans);
  const now = new Date();

  return CORE_PAGES.map((c) => ({
    kind: "core" as const,
    path: c.path,
    slug: "",
    h1: c.h1,
    title: c.title,
    description: c.description,
    primaryKeyword: c.primaryKeyword,
    secondaryKeywords: [],
    intent: c.intent,
    breadcrumbs:
      c.path === "/"
        ? [{ name: "Home", path: "/" }]
        : [
            { name: "Home", path: "/" },
            { name: c.h1, path: c.path },
          ],
    decision: {
      generate: true,
      index: true,
      sitemap: true,
      canonicalPath: c.path,
      score: 100,
      reasons: [
        "Hand-authored core page — exempt from the generated-page score, included so the sitemap and the cannibalisation pass have one source.",
      ],
    },
    // Fleet-backed pages re-crawl when the fleet changes; static ones do not
    // claim to. A sitemap where every lastmod is "today" trains Google to
    // ignore the field entirely.
    lastModified: c.tracksFleet ? fleetDate : now,
    priority: c.priority,
    changeFrequency: c.changeFrequency,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Cannibalisation pass
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One intent, one URL.
 *
 * Two pages claiming the same primary keyword split their own signals and
 * neither ranks. Rather than trusting six authors to notice, the registry
 * detects it structurally: first page to claim a normalised keyword owns it;
 * every later claimant is canonicalised onto the owner and dropped from the
 * index and the sitemap.
 *
 * Ordering is therefore load-bearing. Core pages are built first so a
 * hand-authored money page always beats a generated one for a shared query —
 * `/van-hire` owns "van hire sydney", not a generated category page.
 */
function normaliseKeyword(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function resolveCannibalisation(pages: SeoPage[]): SeoPage[] {
  const owner = new Map<string, string>();

  return pages.map((page) => {
    if (!page.decision.generate) return page;

    const key = normaliseKeyword(page.primaryKeyword);
    const existing = owner.get(key);

    if (!existing) {
      owner.set(key, page.path);
      return page;
    }
    if (existing === page.path) return page;

    return {
      ...page,
      decision: {
        ...page.decision,
        index: false,
        sitemap: false,
        canonicalPath: existing,
        reasons: [
          ...page.decision.reasons,
          `Primary keyword "${page.primaryKeyword}" is already owned by ${existing}. ` +
            "Canonicalised there rather than competing with it — a cross-canonical consolidates the link equity, a noindex would throw it away.",
        ],
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the whole estate.
 *
 * `cache` gives per-request dedup, and `getPublicVans` is itself cached, so a
 * page that reads the registry in `generateMetadata` and again in its body
 * pays for it once.
 */
export const getSeoRegistry = cache(async (): Promise<SeoPage[]> => {
  const vans = (await getPublicVans()).filter((v) => v.status !== "draft");

  // Contact details are a hard prerequisite of the gate, and `getSiteContact`
  // falls back to the authorised `lib/business.ts` values, so a page can never
  // be gated out by a transient settings-table read failure.
  const hasContact = true;

  const pages: SeoPage[] = [
    ...buildCorePages(vans),
    ...SEO_SERVICES.map((s) => buildServicePage(s, vans, hasContact)),
    ...verifiedLocations().map((l) => buildLocationPage(l, vans, hasContact)),
    ...USE_CASES.map((u) => buildUseCasePage(u, vans, hasContact)),
    ...vans.map((v) => buildVehiclePage(v, hasContact)),
  ];

  return resolveCannibalisation(pages);
});

export async function getSeoPage(path: string): Promise<SeoPage | null> {
  const registry = await getSeoRegistry();
  return registry.find((p) => p.path === path) ?? null;
}

/** Paths a family should emit from `generateStaticParams`. */
export async function generatedSlugs(kind: SeoPageKind): Promise<string[]> {
  const registry = await getSeoRegistry();
  return registry.filter((p) => p.kind === kind && p.decision.generate).map((p) => p.slug);
}

/** Everything we are actively asking Google to crawl. */
export async function sitemapPages(): Promise<SeoPage[]> {
  const registry = await getSeoRegistry();
  return registry.filter((p) => p.decision.sitemap);
}

/** Estate-level counts for `/admin/seo`. */
export async function registryStats() {
  const registry = await getSeoRegistry();
  const byKind = new Map<SeoPageKind, { generated: number; indexed: number; sitemap: number }>();

  for (const p of registry) {
    const row = byKind.get(p.kind) ?? { generated: 0, indexed: 0, sitemap: 0 };
    if (p.decision.generate) row.generated += 1;
    if (p.decision.index) row.indexed += 1;
    if (p.decision.sitemap) row.sitemap += 1;
    byKind.set(p.kind, row);
  }

  return {
    total: registry.length,
    generated: registry.filter((p) => p.decision.generate).length,
    indexed: registry.filter((p) => p.decision.index).length,
    inSitemap: registry.filter((p) => p.decision.sitemap).length,
    suppressed: registry.filter((p) => !p.decision.generate).length,
    byKind: [...byKind.entries()].map(([kind, row]) => ({ kind, ...row })),
  };
}
