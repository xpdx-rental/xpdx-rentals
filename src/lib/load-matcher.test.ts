import { describe, it, expect } from "vitest";
import {
  LOAD_PRESETS,
  VERDICT_LABELS,
  verdictFor,
  fillRatioFor,
  matchFleet,
  cartonPlan,
} from "@/lib/load-matcher";
import type { VanDimensions } from "@/lib/fleet-geometry";

/** CLAUDE.md §3 fleet. */
const FLEET: VanDimensions[] = [
  { slug: "hiace-lwb", name: "Toyota HiAce LWB", lengthMm: 5265, heightMm: 1990, wheelbaseMm: 3210 },
  { slug: "hiace-swlb", name: "Toyota HiAce Super LWB", lengthMm: 5915, heightMm: 2280, wheelbaseMm: 3860 },
  { slug: "sprinter-swb", name: "Mercedes Sprinter SWB", lengthMm: 5267, heightMm: 2355, wheelbaseMm: 3250 },
  { slug: "sprinter-mwb-low", name: "Mercedes Sprinter MWB Low Roof", lengthMm: 5932, heightMm: 2355, wheelbaseMm: 3665 },
  { slug: "sprinter-mwb-high", name: "Mercedes Sprinter MWB High Roof", lengthMm: 5932, heightMm: 2670, wheelbaseMm: 3665 },
  { slug: "sprinter-lwb-high", name: "Mercedes Sprinter LWB High Roof", lengthMm: 6967, heightMm: 2715, wheelbaseMm: 4325 },
];

const smallest = FLEET[0];
const largest = FLEET[FLEET.length - 1];

/**
 * The lightest and heaviest presets, taken from the ends of the list rather
 * than by hardcoded index.
 *
 * This suite was failing on `main`: it read `LOAD_PRESETS[5]`, but the preset
 * list has five entries, so `heaviest` was `undefined` and `fillRatioFor` threw
 * on `load.demand`. Indexing from the ends means the invariants below — the
 * lightest load fits the smallest van, the heaviest load does not overflow the
 * largest — keep holding whatever the operator adds to or removes from the
 * list, which is the property actually worth asserting.
 */
const courier = LOAD_PRESETS[0];
const heaviest = LOAD_PRESETS[LOAD_PRESETS.length - 1];

describe("verdict thresholds (MOTION.md §4.2)", () => {
  it("overflow is 'too small'", () => {
    expect(verdictFor(1.01)).toBe("too-small");
    expect(verdictFor(1.4)).toBe("too-small");
  });

  it("85% or more is 'will do the job'", () => {
    expect(verdictFor(0.85)).toBe("tight");
    expect(verdictFor(0.99)).toBe("tight");
    expect(verdictFor(1)).toBe("tight");
  });

  it("comfortable is 'recommended'", () => {
    expect(verdictFor(0.2)).toBe("recommended");
    expect(verdictFor(0.84)).toBe("recommended");
  });

  it("every verdict has a text label — motion is never the sole carrier of meaning", () => {
    for (const v of ["recommended", "tight", "too-small"] as const) {
      expect(VERDICT_LABELS[v]).toBeTruthy();
      expect(VERDICT_LABELS[v].length).toBeGreaterThan(3);
    }
  });
});

describe("matching is ordinal and sane", () => {
  it("a courier round fits the smallest van", () => {
    const r = fillRatioFor(smallest, FLEET, courier)!;
    expect(r).toBeLessThan(0.85);
    expect(verdictFor(r)).toBe("recommended");
  });

  it("the heaviest load overflows the smallest van", () => {
    const r = fillRatioFor(smallest, FLEET, heaviest)!;
    expect(r).toBeGreaterThan(1);
    expect(verdictFor(r)).toBe("too-small");
  });

  it("the heaviest load does not overflow the largest van", () => {
    const r = fillRatioFor(largest, FLEET, heaviest)!;
    expect(r).toBeLessThanOrEqual(1);
  });

  it("a bigger van is never a worse fit for the same load", () => {
    for (const load of LOAD_PRESETS) {
      const ratios = FLEET.map((v) => ({
        slug: v.slug,
        r: fillRatioFor(v, FLEET, load)!,
      }));
      const small = ratios.find((x) => x.slug === "hiace-lwb")!.r;
      const big = ratios.find((x) => x.slug === "sprinter-lwb-high")!.r;
      expect(big).toBeLessThanOrEqual(small);
    }
  });

  it("a bigger load never fills a given van less", () => {
    for (const van of FLEET) {
      const ratios = LOAD_PRESETS.map((l) => fillRatioFor(van, FLEET, l)!);
      for (let i = 1; i < ratios.length; i++) {
        expect(ratios[i]).toBeGreaterThanOrEqual(ratios[i - 1]);
      }
    }
  });

  it("every load has at least one van that can take it", () => {
    for (const load of LOAD_PRESETS) {
      const matches = matchFleet(FLEET, load);
      expect(matches.some((m) => m.verdict !== "too-small")).toBe(true);
    }
  });
});

describe("never claims a volume", () => {
  it("returns only ordinal ratios and text verdicts", () => {
    const matches = matchFleet(FLEET, heaviest);
    for (const m of matches) {
      expect(Object.keys(m).sort()).toEqual(["fillRatio", "label", "slug", "verdict"]);
      expect(typeof m.fillRatio).toBe("number");
    }
  });

  it("no preset carries a cubic-metre figure", () => {
    for (const p of LOAD_PRESETS) {
      expect(p.label).not.toMatch(/m³|m3|cubic/i);
      expect(p.hint).not.toMatch(/m³|m3|cubic/i);
    }
  });

  it("skips vans it cannot rank rather than guessing", () => {
    const withGap: VanDimensions[] = [
      ...FLEET,
      { slug: "unknown", name: "Unmeasured", lengthMm: null, heightMm: null, wheelbaseMm: null },
    ];
    expect(matchFleet(withGap, courier).map((m) => m.slug)).not.toContain("unknown");
  });
});

describe("carton plan is presentational only", () => {
  it("draws overflow cartons only when the load overflows", () => {
    expect(cartonPlan(0.5).overflow).toBe(0);
    expect(cartonPlan(1.3).overflow).toBeGreaterThan(0);
  });

  it("always draws at least one carton", () => {
    expect(cartonPlan(0).total).toBeGreaterThanOrEqual(1);
  });

  it("caps how far overflow is drawn so the layout cannot break", () => {
    expect(cartonPlan(99).total).toBeLessThanOrEqual(Math.round(1.45 * 14));
  });
});
