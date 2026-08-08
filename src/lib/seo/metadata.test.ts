import { describe, it, expect } from "vitest";
import { pageMetadata, suppressedMetadata } from "@/lib/seo/metadata";

/**
 * The root layout declares `title: { template: "%s | XPDX Rentals" }`.
 *
 * That template is unconditional, so it double-brands any title that already
 * names the brand — which shipped across the entire programmatic estate at
 * once ("Van Hire Bankstown | XPDX Rentals | XPDX Rentals"). These tests pin
 * the rule that fixes it, because the failure is invisible in code review:
 * every individual title looks correct.
 */
describe("pageMetadata — title template interaction", () => {
  it("suppresses the layout template when the title already names the brand", () => {
    const meta = pageMetadata({
      path: "/van-hire/bankstown",
      title: "Van Hire Bankstown | XPDX Rentals",
      description: "d".repeat(60),
    });
    expect(meta.title).toEqual({ absolute: "Van Hire Bankstown | XPDX Rentals" });
  });

  it("handles an operator-authored seo_title with the brand mid-string", () => {
    // Real shape from the `vans` table — brand in the middle, price on the end.
    const title = "Toyota HiAce SLWB Hire Sydney | XPDX Rentals — from $395/wk";
    const meta = pageMetadata({ path: "/vans/toyota-hiace-slwb", title, description: "d".repeat(60) });
    expect(meta.title).toEqual({ absolute: title });
  });

  it("lets the template append the brand when the title does not carry it", () => {
    const meta = pageMetadata({
      path: "/cargo-van-hire",
      title: "Cargo van hire Sydney",
      description: "d".repeat(60),
    });
    // A bare string means "apply the template" to Next.
    expect(meta.title).toBe("Cargo van hire Sydney");
  });

  it("never produces a title carrying the brand twice", () => {
    for (const title of [
      "Van Hire Bankstown | XPDX Rentals",
      "Search Vans by Use Case — XPDX Rentals",
      "Cargo van hire Sydney",
      "Our van fleet — HiAce and Sprinter hire",
    ]) {
      const meta = pageMetadata({ path: "/x", title, description: "d".repeat(60) });
      const rendered =
        typeof meta.title === "string" ? `${meta.title} | XPDX Rentals` : (meta.title as { absolute: string }).absolute;
      expect([...rendered.matchAll(/XPDX Rentals/g)]).toHaveLength(1);
    }
  });
});

describe("pageMetadata — canonical and robots", () => {
  it("self-canonicalises by default", () => {
    const meta = pageMetadata({ path: "/cargo-van-hire", title: "t", description: "d" });
    expect(meta.alternates?.canonical).toContain("/cargo-van-hire");
  });

  it("honours a cross-canonical when the gate consolidates two URLs", () => {
    const meta = pageMetadata({
      path: "/monthly-van-hire",
      canonicalPath: "/long-term-van-hire",
      title: "t",
      description: "d",
    });
    expect(meta.alternates?.canonical).toContain("/long-term-van-hire");
    expect(meta.alternates?.canonical).not.toContain("/monthly-van-hire");
  });

  it("keeps noindex pages followable so their links still pass equity", () => {
    const meta = pageMetadata({ path: "/use-cases/moving-house", title: "t", description: "d", noindex: true });
    expect(meta.robots).toMatchObject({ index: false, follow: true });
  });

  it("never puts a query string in a canonical", () => {
    // Filter permutations must collapse onto the clean hub path.
    const meta = pageMetadata({ path: "/vans", title: "t", description: "d" });
    expect(meta.alternates?.canonical).not.toContain("?");
  });

  it("marks a suppressed path noindex rather than shipping an indexable soft-404", () => {
    const meta = suppressedMetadata("/van-hire/nowhere");
    expect(meta.robots).toMatchObject({ index: false });
  });
});

describe("pageMetadata — social cards", () => {
  it("keeps the OG url in step with the page path", () => {
    const meta = pageMetadata({ path: "/cargo-van-hire", title: "t", description: "d" });
    expect(meta.openGraph?.url).toContain("/cargo-van-hire");
  });

  it("uses Australian locale", () => {
    const meta = pageMetadata({ path: "/", title: "t", description: "d" });
    expect(meta.openGraph).toMatchObject({ locale: "en_AU" });
  });

  it("omits images entirely rather than emitting an empty array", () => {
    const meta = pageMetadata({ path: "/", title: "t", description: "d" });
    expect(meta.openGraph && "images" in meta.openGraph).toBe(false);
  });
});
