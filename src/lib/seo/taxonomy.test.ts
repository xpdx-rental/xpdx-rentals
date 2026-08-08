import { describe, it, expect } from "vitest";
import {
  SEO_SERVICES,
  findServiceByPathSegment,
  vansForService,
} from "@/lib/seo/entities/services";
import {
  SEO_LOCATIONS,
  verifiedLocations,
  nearbyLocations,
} from "@/lib/seo/entities/locations";
import { USE_CASES, recommendedVans } from "@/lib/data/use-cases";
import type { PublicVan } from "@/lib/data/public-vans";

/**
 * Invariants of the taxonomy.
 *
 * These are the rules a future contributor is most likely to break by adding
 * one plausible-looking row — a second page for a keyword we already rank a
 * page for, a suburb with an invented drive time, a service whose predicate
 * matches nothing. Each one is cheap to assert and expensive to discover in
 * Search Console three months later.
 */

function van(overrides: Partial<PublicVan> = {}): PublicVan {
  return {
    id: "v1",
    slug: "test-van",
    name: "Test Van",
    make: null,
    model: null,
    year: null,
    registration: null,
    bodyType: "Panel Van",
    wheelbaseLabel: "LWB",
    roof: "standard",
    tonnage: 3,
    transmission: "Automatic",
    fuel: "Diesel",
    seats: 2,
    priceWeeklyFrom: 400,
    priceMonthlyFrom: 1500,
    depositAmount: null,
    minHireDays: 28,
    lengthMm: 5000,
    heightMm: 2000,
    widthMm: 1900,
    wheelbaseMm: 3200,
    loadVolumeM3: 6,
    payloadKg: 1000,
    features: [],
    summary: null,
    description: null,
    seoTitle: null,
    seoDescription: null,
    status: "available",
    sortOrder: 1,
    updatedAt: new Date(0).toISOString(),
    images: [],
    primaryImage: null,
    ...overrides,
  };
}

describe("service taxonomy", () => {
  it("gives every service a unique slug and path", () => {
    expect(new Set(SEO_SERVICES.map((s) => s.slug)).size).toBe(SEO_SERVICES.length);
    expect(new Set(SEO_SERVICES.map((s) => s.path)).size).toBe(SEO_SERVICES.length);
  });

  it("never lets two services claim the same primary keyword", () => {
    const keywords = SEO_SERVICES.map((s) => s.primaryKeyword.toLowerCase());
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("never lets one service's secondary keyword be another's primary", () => {
    const primaries = new Set(SEO_SERVICES.map((s) => s.primaryKeyword.toLowerCase()));
    for (const service of SEO_SERVICES) {
      for (const secondary of service.secondaryKeywords) {
        expect(primaries.has(secondary.toLowerCase())).toBe(false);
      }
    }
  });

  it("only names related services that exist", () => {
    const slugs = new Set(SEO_SERVICES.map((s) => s.slug));
    for (const service of SEO_SERVICES) {
      for (const related of service.related) {
        expect(slugs.has(related)).toBe(true);
      }
    }
  });

  it("never marks a service as its own related page", () => {
    for (const service of SEO_SERVICES) {
      expect(service.related).not.toContain(service.slug);
    }
  });

  it("resolves a service from its public path segment", () => {
    // The 12-seater page's slug and its URL segment deliberately differ —
    // a slug cannot start with a digit but the URL should.
    expect(findServiceByPathSegment("12-seater-van-hire")?.slug).toBe("twelve-seater-van-hire");
    expect(findServiceByPathSegment("cargo-van-hire")?.slug).toBe("cargo-van-hire");
    expect(findServiceByPathSegment("not-a-service")).toBeNull();
  });

  it("keeps the service × location cross-product switched off", () => {
    // Not a style preference: for a single-depot operator these pages would
    // cannibalise the suburb pages. If this ever legitimately changes, the
    // change should be deliberate enough to update this test.
    for (const service of SEO_SERVICES) {
      expect(service.allowLocationCross).toBe(false);
    }
  });

  it("excludes draft vans from every service match", () => {
    const drafted = van({ status: "draft" });
    for (const service of SEO_SERVICES) {
      expect(vansForService(service, [drafted])).toHaveLength(0);
    }
  });

  it("sorts matched vans cheapest first, so 'from $X' is really the minimum", () => {
    const cargo = SEO_SERVICES.find((s) => s.slug === "cargo-van-hire")!;
    const matched = vansForService(cargo, [
      van({ id: "a", slug: "a", priceWeeklyFrom: 600 }),
      van({ id: "b", slug: "b", priceWeeklyFrom: 350 }),
      van({ id: "c", slug: "c", priceWeeklyFrom: 480 }),
    ]);
    expect(matched.map((v) => v.priceWeeklyFrom)).toEqual([350, 480, 600]);
  });

  it("matches a refrigerated van only on the refrigerated service", () => {
    const reefer = van({ bodyType: "Refrigerated Van" });
    const matching = SEO_SERVICES.filter((s) => s.matches(reefer)).map((s) => s.slug);
    expect(matching).toContain("refrigerated-van-hire");
    expect(matching).not.toContain("cargo-van-hire");
  });
});

describe("location taxonomy", () => {
  it("gives every location a unique slug", () => {
    expect(new Set(SEO_LOCATIONS.map((l) => l.slug)).size).toBe(SEO_LOCATIONS.length);
  });

  it("only treats a location as verified when it has a measured drive time", () => {
    // The core invariant: an unmeasured suburb has nothing genuinely local to
    // say, so it must never reach the registry.
    for (const location of verifiedLocations()) {
      expect(location.driveMinutes).not.toBeNull();
      expect(location.status).toBe("verified");
    }
  });

  it("never marks a candidate location as verified by accident", () => {
    for (const location of SEO_LOCATIONS) {
      if (location.status === "candidate") {
        expect(location.driveMinutes).toBeNull();
      }
    }
  });

  it("keeps a genuine backlog of unpublished candidates", () => {
    // A gate that never rejects anything is decoration.
    expect(SEO_LOCATIONS.filter((l) => l.status === "candidate").length).toBeGreaterThan(0);
  });

  it("never lists a suburb as nearby to itself", () => {
    for (const location of verifiedLocations()) {
      expect(nearbyLocations(location.slug).map((l) => l.slug)).not.toContain(location.slug);
    }
  });

  it("only ever suggests nearby suburbs that will have pages", () => {
    const publishable = new Set(verifiedLocations().map((l) => l.slug));
    for (const location of verifiedLocations()) {
      for (const near of nearbyLocations(location.slug)) {
        expect(publishable.has(near.slug)).toBe(true);
      }
    }
  });

  it("produces a different nearby set per suburb, not one shared list", () => {
    const verified = verifiedLocations();
    const signatures = verified.map((l) =>
      nearbyLocations(l.slug).map((n) => n.slug).join(","),
    );
    expect(new Set(signatures).size).toBeGreaterThan(1);
  });
});

describe("use-case taxonomy", () => {
  it("gives every use case a unique id and primary keyword", () => {
    expect(new Set(USE_CASES.map((u) => u.id)).size).toBe(USE_CASES.length);
    const keywords = USE_CASES.map((u) => u.primaryKeyword.toLowerCase());
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("never lets a use case claim a service's primary keyword", () => {
    const servicePrimaries = new Set(SEO_SERVICES.map((s) => s.primaryKeyword.toLowerCase()));
    for (const useCase of USE_CASES) {
      expect(servicePrimaries.has(useCase.primaryKeyword.toLowerCase())).toBe(false);
    }
  });

  it("only names related services that exist", () => {
    const slugs = new Set(SEO_SERVICES.map((s) => s.slug));
    for (const useCase of USE_CASES) {
      for (const related of useCase.relatedServices) {
        expect(slugs.has(related)).toBe(true);
      }
    }
  });

  it("gives every use case its own fit reasoning", () => {
    // The failure this guards: six pages whose only difference is the <h1>.
    for (const useCase of USE_CASES) {
      expect(useCase.fitNotes.length).toBeGreaterThan(0);
    }
    const allNotes = USE_CASES.flatMap((u) => u.fitNotes);
    expect(new Set(allNotes).size).toBe(allNotes.length);
  });

  it("makes a poor-term-fit page say so in its own copy, not just its metadata", () => {
    for (const useCase of USE_CASES) {
      if (useCase.termFit === "poor") {
        expect(useCase.fitNotes.join(" ")).toMatch(/28 days/);
      }
    }
  });
});

describe("use-case van selection", () => {
  /**
   * The regression these guard is a real one that shipped: `preferredSlugs`
   * were carried over from an old seed dataset, matched nothing in the live
   * fleet, and the quality gate correctly 404'd a landing page as a result.
   * The gate was right; the hardcoded coupling was the bug.
   */
  it("honours editorial curation, in order, when the slugs resolve", () => {
    const uc = USE_CASES.find((u) => u.id === "courier-delivery")!;
    const fleet = uc.preferredSlugs.map((slug, i) =>
      van({ id: slug, slug, priceWeeklyFrom: 900 - i, bodyType: "Panel Van", lengthMm: 5000 }),
    );
    expect(recommendedVans(uc, fleet).map((v) => v.slug)).toEqual(uc.preferredSlugs);
  });

  it("falls back to the predicate when a curated slug has been renamed away", () => {
    const uc = USE_CASES.find((u) => u.id === "courier-delivery")!;
    // None of the curated slugs exist — exactly the situation that broke before.
    const fleet = [
      van({ id: "a", slug: "renamed-van-a", bodyType: "Panel Van", lengthMm: 5000 }),
      van({ id: "b", slug: "renamed-van-b", bodyType: "Panel Van", lengthMm: 5200 }),
    ];
    expect(recommendedVans(uc, fleet).length).toBeGreaterThan(0);
  });

  it("never recommends a draft van", () => {
    const uc = USE_CASES.find((u) => u.id === "courier-delivery")!;
    const fleet = uc.preferredSlugs.map((slug) =>
      van({ id: slug, slug, status: "draft", bodyType: "Panel Van", lengthMm: 5000 }),
    );
    expect(recommendedVans(uc, fleet)).toHaveLength(0);
  });

  it("never recommends the same van twice", () => {
    const uc = USE_CASES.find((u) => u.id === "courier-delivery")!;
    // The first curated slug also satisfies the predicate, so a naive
    // curation-then-top-up would list it in both passes.
    const fleet = [
      van({ id: "x", slug: uc.preferredSlugs[0], bodyType: "Panel Van", lengthMm: 5000 }),
      van({ id: "y", slug: "other", bodyType: "Panel Van", lengthMm: 5100 }),
    ];
    const picked = recommendedVans(uc, fleet);
    expect(new Set(picked.map((v) => v.id)).size).toBe(picked.length);
  });

  it("respects the limit", () => {
    const uc = USE_CASES.find((u) => u.id === "courier-delivery")!;
    const fleet = Array.from({ length: 8 }, (_, i) =>
      van({ id: `v${i}`, slug: `v${i}`, bodyType: "Panel Van", lengthMm: 5000 }),
    );
    expect(recommendedVans(uc, fleet, 3)).toHaveLength(3);
  });
});
