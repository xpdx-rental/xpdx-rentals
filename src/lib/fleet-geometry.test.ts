import { describe, it, expect } from "vitest";
import {
  fleetGeometry,
  sharedScale,
  measuredVans,
  wheelRotationDeg,
  sizeRank,
  WHEEL_DIAMETER_MM,
  type VanDimensions,
} from "@/lib/fleet-geometry";

/**
 * The Fleet Line's entire value is that the comparison is literally true to
 * scale (MOTION.md §4.1). That is a claim about arithmetic, so it is tested
 * rather than eyeballed.
 *
 * The fleet below is transcribed from CLAUDE.md §3 — the only authorised
 * source for these figures.
 */
const FLEET: VanDimensions[] = [
  { slug: "hiace-lwb", name: "Toyota HiAce LWB", lengthMm: 5265, heightMm: 1990, wheelbaseMm: 3210 },
  { slug: "hiace-swlb", name: "Toyota HiAce Super LWB", lengthMm: 5915, heightMm: 2280, wheelbaseMm: 3860 },
  { slug: "sprinter-swb", name: "Mercedes Sprinter SWB", lengthMm: 5267, heightMm: 2355, wheelbaseMm: 3250 },
  { slug: "sprinter-mwb-low", name: "Mercedes Sprinter MWB Low Roof", lengthMm: 5932, heightMm: 2355, wheelbaseMm: 3665 },
  { slug: "sprinter-mwb-high", name: "Mercedes Sprinter MWB High Roof", lengthMm: 5932, heightMm: 2670, wheelbaseMm: 3665 },
  { slug: "sprinter-lwb-high", name: "Mercedes Sprinter LWB High Roof", lengthMm: 6967, heightMm: 2715, wheelbaseMm: 4325 },
];

const BOX = { widthPx: 1200, heightPx: 220 };

describe("shared scale", () => {
  it("uses ONE ratio for the whole fleet", () => {
    const { scale, vans } = fleetGeometry(FLEET, BOX);
    for (const g of vans) {
      const source = FLEET.find((v) => v.slug === g.slug)!;
      expect(g.bodyWidthPx / source.lengthMm!).toBeCloseTo(scale, 10);
      expect(g.bodyHeightPx / source.heightMm!).toBeCloseTo(scale, 10);
    }
  });

  it("never normalises each van to its own box", () => {
    const { vans } = fleetGeometry(FLEET, BOX);
    const widths = vans.map((v) => v.bodyWidthPx);
    const heights = vans.map((v) => v.bodyHeightPx);
    // If anything were per-van normalised these would all be equal.
    expect(new Set(widths.map((w) => w.toFixed(3))).size).toBeGreaterThan(1);
    expect(new Set(heights.map((h) => h.toFixed(3))).size).toBeGreaterThan(1);
  });

  it("fits the fleet inside the available box", () => {
    const gapPx = 24;
    const { vans } = fleetGeometry(FLEET, BOX, { gapPx });
    const total = vans.reduce((s, v) => s + v.bodyWidthPx, 0) + gapPx * (vans.length - 1);
    expect(total).toBeLessThanOrEqual(BOX.widthPx + 0.001);
    const tallest = Math.max(...vans.map((v) => v.bodyHeightPx));
    expect(tallest).toBeLessThanOrEqual(BOX.heightPx + 0.001);
  });
});

describe("the MOTION.md §4.1 worked example survives into the drawing", () => {
  /**
   * "a customer can see that a Sprinter SWB is the same length as a HiAce LWB
   * but 365mm taller, which is exactly the mistake people make when booking."
   */
  const hiace = FLEET.find((v) => v.slug === "hiace-lwb")!;
  const sprinter = FLEET.find((v) => v.slug === "sprinter-swb")!;

  it("confirms the premise against the §3 figures", () => {
    expect(Math.abs(sprinter.lengthMm! - hiace.lengthMm!)).toBeLessThanOrEqual(5);
    expect(sprinter.heightMm! - hiace.heightMm!).toBe(365);
  });

  it("draws them at near-identical length", () => {
    const { vans } = fleetGeometry(FLEET, BOX);
    const h = vans.find((v) => v.slug === "hiace-lwb")!;
    const s = vans.find((v) => v.slug === "sprinter-swb")!;
    const lengthDeltaPx = Math.abs(s.bodyWidthPx - h.bodyWidthPx);
    expect(lengthDeltaPx).toBeLessThan(1);
  });

  it("draws the 365mm height difference visibly, at the shared scale", () => {
    const { scale, vans } = fleetGeometry(FLEET, BOX);
    const h = vans.find((v) => v.slug === "hiace-lwb")!;
    const s = vans.find((v) => v.slug === "sprinter-swb")!;
    const heightDeltaPx = s.bodyHeightPx - h.bodyHeightPx;
    // Exactly 365mm at the shared ratio — not an approximation.
    expect(heightDeltaPx).toBeCloseTo(365 * scale, 6);
    // And large enough for a human to actually see.
    expect(heightDeltaPx).toBeGreaterThan(4);
  });
});

describe("axles", () => {
  it("places axles a real wheelbase apart, at the shared scale", () => {
    const { scale, vans } = fleetGeometry(FLEET, BOX);
    for (const g of vans) {
      const source = FLEET.find((v) => v.slug === g.slug)!;
      expect(g.rearAxleXPx - g.frontAxleXPx).toBeCloseTo(source.wheelbaseMm! * scale, 6);
    }
  });

  it("keeps both axles under the body", () => {
    const { vans } = fleetGeometry(FLEET, BOX);
    for (const g of vans) {
      expect(g.frontAxleXPx).toBeGreaterThan(0);
      expect(g.rearAxleXPx).toBeLessThan(g.bodyWidthPx);
    }
  });

  it("scales wheels identically for every van, so they cannot skew the read", () => {
    const { scale, vans } = fleetGeometry(FLEET, BOX);
    for (const g of vans) {
      expect(g.wheelRadiusPx).toBeCloseTo((WHEEL_DIAMETER_MM * scale) / 2, 10);
    }
  });
});

describe("wheel rotation", () => {
  it("derives rotation from distance and radius, not decoration", () => {
    const r = 10;
    const circumference = 2 * Math.PI * r;
    expect(wheelRotationDeg(circumference, r)).toBeCloseTo(360, 6);
    expect(wheelRotationDeg(circumference * 2, r)).toBeCloseTo(720, 6);
    expect(wheelRotationDeg(0, r)).toBe(0);
  });

  it("turns a smaller wheel further over the same distance", () => {
    expect(wheelRotationDeg(100, 5)).toBeGreaterThan(wheelRotationDeg(100, 20));
  });

  it("is safe when geometry is degenerate", () => {
    expect(wheelRotationDeg(100, 0)).toBe(0);
  });
});

describe("vans without dimensions", () => {
  it("are excluded rather than drawn from a guess", () => {
    const withGap: VanDimensions[] = [
      ...FLEET,
      { slug: "unknown", name: "Unmeasured van", lengthMm: null, heightMm: null, wheelbaseMm: null },
    ];
    expect(measuredVans(withGap)).toHaveLength(6);
    expect(fleetGeometry(withGap, BOX).vans.map((v) => v.slug)).not.toContain("unknown");
  });

  it("degrades to nothing rather than dividing by zero", () => {
    expect(fleetGeometry([], BOX)).toEqual({ scale: 0, vans: [] });
    expect(sharedScale([], BOX)).toBe(0);
  });
});

describe("size rank (Load Matcher fallback while load_volume_m3 is TODO)", () => {
  it("orders the fleet smallest to largest", () => {
    const ranked = [...FLEET].sort((a, b) => sizeRank(a, FLEET)! - sizeRank(b, FLEET)!);
    expect(ranked[0].slug).toBe("hiace-lwb");
    expect(ranked[ranked.length - 1].slug).toBe("sprinter-lwb-high");
  });

  it("is normalised 0..1", () => {
    for (const v of FLEET) {
      const r = sizeRank(v, FLEET)!;
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it("returns null when a van cannot be ranked", () => {
    const v: VanDimensions = { slug: "x", name: "X", lengthMm: null, heightMm: null, wheelbaseMm: null };
    expect(sizeRank(v, FLEET)).toBeNull();
  });
});
