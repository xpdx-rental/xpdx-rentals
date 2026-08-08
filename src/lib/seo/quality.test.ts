import { describe, it, expect } from "vitest";
import { decide, QUALITY_THRESHOLDS, INTENT_VALUE, TERM_FIT_MULTIPLIER } from "@/lib/seo/quality";

/**
 * The quality gate is the one piece of the SEO engine where a silent
 * regression publishes something. A broken template renders badly and someone
 * notices; a gate that quietly starts returning `index: true` for thin pages
 * ships forty doorway pages and nobody finds out until traffic drops.
 *
 * These tests pin the behaviours that must not drift — particularly the ones
 * where a high score must NOT win.
 */

/** A page that passes everything, so each test can break exactly one thing. */
function healthy(overrides: Partial<Parameters<typeof decide>[1]> = {}) {
  return {
    entityValid: true,
    matchedVans: 9,
    minVans: 3,
    differentiatingModules: 4,
    dataFieldsPresent: 5,
    dataFieldsPossible: 5,
    intentValue: 1,
    outboundLinks: 6,
    hasConversionPath: true,
    ...overrides,
  };
}

describe("quality gate — hard prerequisites", () => {
  it("does not generate a route for an entity that does not exist", () => {
    const d = decide("/van-hire/nowhere", healthy({ entityValid: false }));
    expect(d.generate).toBe(false);
    expect(d.index).toBe(false);
    expect(d.sitemap).toBe(false);
  });

  it("does not generate a category page with no inventory behind it", () => {
    const d = decide("/refrigerated-van-hire", healthy({ matchedVans: 0, minVans: 1 }));
    expect(d.generate).toBe(false);
    expect(d.reasons.join(" ")).toMatch(/matching van/i);
  });

  it("does not generate a page below the family's declared minimum", () => {
    const d = decide("/cargo-van-hire", healthy({ matchedVans: 1, minVans: 2 }));
    expect(d.generate).toBe(false);
  });

  it("does not generate a landing page with no conversion path", () => {
    const d = decide("/van-hire/bankstown", healthy({ hasConversionPath: false }));
    expect(d.generate).toBe(false);
  });

  it("a perfect score cannot buy past a missing prerequisite", () => {
    const d = decide("/cargo-van-hire", healthy({ matchedVans: 99, entityValid: false }));
    expect(d.generate).toBe(false);
    expect(d.score).toBe(0);
  });
});

describe("quality gate — thresholds", () => {
  it("indexes and submits a fully-backed page", () => {
    const d = decide("/cargo-van-hire", healthy());
    expect(d.score).toBeGreaterThanOrEqual(QUALITY_THRESHOLDS.sitemap);
    expect(d.index).toBe(true);
    expect(d.sitemap).toBe(true);
    expect(d.canonicalPath).toBe("/cargo-van-hire");
  });

  it("keeps sitemap strictly narrower than index", () => {
    // Middling page: real, useful, not worth crawl budget.
    const d = decide("/van-hire/somewhere", healthy({
      matchedVans: 3,
      differentiatingModules: 1,
      dataFieldsPresent: 1,
      intentValue: 0.5,
      outboundLinks: 1,
    }));
    if (d.index) expect(d.score).toBeGreaterThanOrEqual(QUALITY_THRESHOLDS.index);
    if (d.sitemap) expect(d.index).toBe(true);
  });

  it("serves but never indexes a page below the index threshold", () => {
    const d = decide("/thin", healthy({
      matchedVans: 3,
      minVans: 3,
      differentiatingModules: 0,
      dataFieldsPresent: 0,
      dataFieldsPossible: 5,
      intentValue: 0,
      outboundLinks: 0,
    }));
    if (d.generate) {
      expect(d.index).toBe(false);
      expect(d.sitemap).toBe(false);
    }
  });
});

describe("quality gate — servability block", () => {
  const unservable = "Minimum hire is 28 days and this query wants a weekend.";

  it("holds an otherwise excellent page out of the index", () => {
    const d = decide("/use-cases/moving-house", healthy({ serveButDoNotIndex: unservable }));

    // The point of the test: it scores well and is STILL not indexed.
    expect(d.score).toBeGreaterThanOrEqual(QUALITY_THRESHOLDS.sitemap);
    expect(d.generate).toBe(true);
    expect(d.index).toBe(false);
    expect(d.sitemap).toBe(false);
  });

  it("records the reason so the decision is auditable", () => {
    const d = decide("/use-cases/moving-house", healthy({ serveButDoNotIndex: unservable }));
    expect(d.reasons.join(" ")).toContain(unservable);
  });

  it("still self-canonicalises — the page is real, just not for search", () => {
    const d = decide("/use-cases/moving-house", healthy({ serveButDoNotIndex: unservable }));
    expect(d.canonicalPath).toBe("/use-cases/moving-house");
  });
});

describe("quality gate — cannibalisation", () => {
  it("canonicalises a duplicate intent onto the owner rather than noindexing it blindly", () => {
    const d = decide("/monthly-van-hire", healthy({ duplicateIntentOf: "/long-term-van-hire" }));
    expect(d.generate).toBe(true);
    expect(d.index).toBe(false);
    expect(d.sitemap).toBe(false);
    // A cross-canonical consolidates equity; a bare noindex would strand it.
    expect(d.canonicalPath).toBe("/long-term-van-hire");
  });
});

describe("intent scoring", () => {
  it("ranks money queries above research queries", () => {
    expect(INTENT_VALUE.transactional).toBeGreaterThan(INTENT_VALUE["commercial-investigation"]);
    expect(INTENT_VALUE.local).toBeGreaterThan(INTENT_VALUE["use-case"]);
  });

  it("zeroes a use case the 28-day minimum cannot serve", () => {
    expect(TERM_FIT_MULTIPLIER.poor).toBe(0);
    expect(INTENT_VALUE["use-case"] * TERM_FIT_MULTIPLIER.poor).toBe(0);
  });

  it("discounts rather than zeroes a partial fit", () => {
    expect(TERM_FIT_MULTIPLIER.fair).toBeGreaterThan(0);
    expect(TERM_FIT_MULTIPLIER.fair).toBeLessThan(TERM_FIT_MULTIPLIER.strong);
  });
});
