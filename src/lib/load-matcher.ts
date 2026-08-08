/**
 * Load Matcher logic — MOTION.md §4.2.
 *
 * "Instead of filtering a list, the selected load physically loads into each
 * van's cargo bay… The overflow is the whole idea — the customer sees the
 * mistake instead of reading about it."
 *
 * ⚠ PROVISIONAL. This needs `load_volume_m3` per van, which CLAUDE.md §3 lists
 * as `TODO(client)`. §4.2 is explicit: "Until it arrives, drive it off the
 * size-rank fallback in the prototype and mark the component `data-provisional`.
 * **Do not invent volumes.**"
 *
 * So nothing here produces or renders a cubic-metre figure. Loads carry a
 * DEMAND RANK on the same 0..1 scale as `sizeRank`, and the comparison is
 * ordinal, not metric. When real volumes arrive, `fillRatio` switches to the
 * true ratio and the verdict thresholds stay as they are.
 */

import type { VanDimensions } from "@/lib/fleet-geometry";

export type LoadPreset = {
  id: string;
  label: string;
  /** What the customer recognises, so they can self-select accurately. */
  hint: string;
  /**
   * Ordinal demand, 0..1, on the same scale as `sizeRank`. NOT a volume, and
   * never rendered as one.
   */
  demand: number;
};

/**
 * The six loads named in MOTION.md §4.2, in ascending size.
 *
 * The `demand` values are ordinal positions chosen to spread across the fleet's
 * own size range — they are a UI ordering, not a measurement of anything.
 */
export const LOAD_PRESETS: LoadPreset[] = [
  { id: "courier", label: "Courier round", hint: "Parcels and satchels", demand: 0.1 },
  { id: "trade", label: "Tools and trade gear", hint: "Toolboxes, ladder, materials", demand: 0.3 },
  { id: "event", label: "Event & exhibition", hint: "AV gear, staging, displays", demand: 0.5 },
  { id: "pallet", label: "Pallet freight", hint: "Standard pallets, upright", demand: 0.72 },
  { id: "bulky", label: "Bulky goods", hint: "Large commercial deliveries", demand: 1 },
];

export type Verdict = "recommended" | "tight" | "too-small";

export type LoadMatch = {
  slug: string;
  verdict: Verdict;
  /** 0..1+ — how full the bay is. Above 1 means it overflows. */
  fillRatio: number;
  /** Text label. Motion is never the sole carrier of meaning (MOTION.md §11). */
  label: string;
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  recommended: "Recommended",
  tight: "Will do the job",
  "too-small": "Too small for this",
};

/** Stack reaching 85%+ of the bay is "tight" rather than comfortable (§4.2). */
const TIGHT_THRESHOLD = 0.85;

export function verdictFor(fillRatio: number): Verdict {
  if (fillRatio > 1) return "too-small";
  if (fillRatio >= TIGHT_THRESHOLD) return "tight";
  return "recommended";
}

/**
 * How full this load leaves this van.
 *
 * `demand` is expressed as a fraction of the LARGEST van in the fleet, and a
 * van's capacity is its own size proxy over the largest van's — both derived
 * from the real dimensions we have, not from an invented volume. A load whose
 * demand matches a van's capacity exactly fills it to the tight threshold.
 *
 * An earlier formulation added a constant baseline to both sides, which made a
 * courier round read as "tight" in a HiAce LWB — the archetypal comfortable
 * case. The unit tests caught it; this model is the fix.
 *
 * Deliberately conservative at the margin: sending someone up a size is a much
 * cheaper mistake than having them arrive with a van the job does not fit.
 */
export function fillRatioFor(
  van: VanDimensions,
  fleet: VanDimensions[],
  load: LoadPreset,
): number | null {
  if (van.lengthMm == null || van.heightMm == null) return null;

  const proxy = (l: number, h: number) => l * h;
  const measured = fleet.filter(
    (v): v is VanDimensions & { lengthMm: number; heightMm: number } =>
      v.lengthMm != null && v.heightMm != null,
  );
  if (measured.length === 0) return null;

  const largest = Math.max(...measured.map((v) => proxy(v.lengthMm, v.heightMm)));
  if (largest <= 0) return null;

  const capacityFraction = proxy(van.lengthMm, van.heightMm) / largest;
  if (capacityFraction <= 0) return null;

  return (load.demand / capacityFraction) * TIGHT_THRESHOLD;
}

export function matchFleet(
  fleet: VanDimensions[],
  load: LoadPreset,
): LoadMatch[] {
  return fleet
    .map((van) => {
      const fillRatio = fillRatioFor(van, fleet, load);
      if (fillRatio === null) return null;
      const verdict = verdictFor(fillRatio);
      return { slug: van.slug, verdict, fillRatio, label: VERDICT_LABELS[verdict] };
    })
    .filter((m): m is LoadMatch => m !== null);
}

/**
 * How many cartons to draw, and how many of them overflow.
 *
 * Purely presentational: the count is a legibility choice, not a claim about
 * how many boxes fit.
 */
export function cartonPlan(fillRatio: number, maxDrawn = 14) {
  const total = Math.max(1, Math.round(Math.min(fillRatio, 1.45) * maxDrawn));
  const inside = Math.min(total, Math.round(Math.min(fillRatio, 1) * maxDrawn));
  return { total, inside, overflow: Math.max(0, total - inside) };
}
