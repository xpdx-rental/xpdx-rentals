import { describe, it, expect } from "vitest";
import { CORE_PAGES, corePage } from "@/lib/seo/entities/core-pages";
import { SEO_SERVICES } from "@/lib/seo/entities/services";
import { USE_CASES } from "@/lib/data/use-cases";

/**
 * `CORE_PAGES` feeds two consumers that must never disagree — the routes'
 * `<head>` and the SEO registry (sitemap, cannibalisation, /admin/seo). These
 * tests pin the properties that make that safe.
 */
describe("core page copy", () => {
  it("has no duplicate paths", () => {
    expect(new Set(CORE_PAGES.map((p) => p.path)).size).toBe(CORE_PAGES.length);
  });

  it("never lets two core pages claim the same primary keyword", () => {
    // The regression that shipped: `/` and `/van-hire` both claimed "van hire
    // sydney", so the registry's cannibalisation pass canonicalised the hub
    // onto the home page — silently removing the programmatic estate's own hub
    // from the index and the sitemap.
    const keywords = CORE_PAGES.map((p) => p.primaryKeyword.toLowerCase());
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("never lets a core page collide with a generated family", () => {
    // Core pages are built first, so a collision here does not break the core
    // page — it silently demotes a generated one. That is worse, because
    // nothing on the core page looks wrong.
    const core = new Set(CORE_PAGES.map((p) => p.primaryKeyword.toLowerCase()));
    for (const service of SEO_SERVICES) {
      expect(core.has(service.primaryKeyword.toLowerCase())).toBe(false);
    }
    for (const useCase of USE_CASES) {
      expect(core.has(useCase.primaryKeyword.toLowerCase())).toBe(false);
    }
  });

  it("gives every page a title and description worth shipping", () => {
    for (const page of CORE_PAGES) {
      expect(page.title.trim().length).toBeGreaterThan(10);
      // Google truncates descriptions well before 200 characters.
      expect(page.description.trim().length).toBeGreaterThan(50);
      expect(page.description.length).toBeLessThanOrEqual(200);
    }
  });

  it("keeps paths clean and canonical — no query strings, no trailing slash", () => {
    for (const page of CORE_PAGES) {
      expect(page.path.startsWith("/")).toBe(true);
      expect(page.path).not.toContain("?");
      expect(page.path).toBe(page.path.toLowerCase());
      if (page.path !== "/") expect(page.path.endsWith("/")).toBe(false);
    }
  });

  it("excludes the noindex legal placeholders", () => {
    // Listing a noindex URL asks Google to crawl a page we tell it to ignore.
    const paths = CORE_PAGES.map((p) => p.path);
    expect(paths).not.toContain("/privacy-policy");
    expect(paths).not.toContain("/terms-of-hire");
  });

  it("only marks fleet-backed pages as tracking the fleet", () => {
    // A sitemap where every lastmod is "today" trains Google to ignore it.
    const tracking = CORE_PAGES.filter((p) => p.tracksFleet).map((p) => p.path);
    expect(tracking).toEqual(["/", "/van-hire", "/vans"]);
  });

  it("throws loudly for an unknown path rather than returning nothing", () => {
    // Every caller is a route that knows its own literal path, so a miss is a
    // typo — and the useful moment to find out is the build, not production.
    expect(() => corePage("/not-a-core-page")).toThrow(/core-pages/);
  });

  it("resolves every path a route asks for", () => {
    for (const page of CORE_PAGES) {
      expect(corePage(page.path).title).toBe(page.title);
    }
  });
});
