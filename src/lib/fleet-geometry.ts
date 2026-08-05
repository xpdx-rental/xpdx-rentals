/**
 * Fleet Line geometry — the arithmetic behind MOTION.md §4.1.
 *
 * "Six vans drawn as parametric SVG side profiles from real `length_mm` /
 * `height_mm` / `wheelbase_mm`, all at one shared mm→px ratio, so the
 * comparison is **literally true to scale**. That truthfulness is the point."
 *
 * Everything here is pure so the truthfulness claim can be tested rather than
 * asserted — see `fleet-geometry.test.ts`, which checks the §4.1 example
 * directly: a Sprinter SWB is the same length as a HiAce LWB but 365mm taller,
 * and that must survive into the drawing.
 *
 * A van missing its dimensions is excluded rather than guessed (CLAUDE.md
 * §1.6). A silhouette drawn from an invented length is a lie told in pixels.
 */

export type VanDimensions = {
  slug: string;
  name: string;
  lengthMm: number | null;
  heightMm: number | null;
  wheelbaseMm: number | null;
};

export type MeasuredVan = {
  slug: string;
  name: string;
  lengthMm: number;
  heightMm: number;
  wheelbaseMm: number;
};

/**
 * Wheel diameter used for the drawing, in millimetres.
 *
 * NOT a published business fact and never rendered as one — the client has not
 * supplied wheel sizes, and §1.6 forbids inventing them. It is a drawing
 * constant, applied identically to every van and scaled by the same ratio as
 * the bodies, so it cannot distort the comparison the component exists to make.
 * Commercial vans in this class sit around this figure.
 */
export const WHEEL_DIAMETER_MM = 700;

/** Fraction of the wheelbase inset from the nose to the front axle. */
const FRONT_OVERHANG_RATIO = 0.14;

export function isMeasured(v: VanDimensions): v is MeasuredVan {
  return v.lengthMm != null && v.heightMm != null && v.wheelbaseMm != null;
}

/** Drops vans we cannot draw honestly. */
export function measuredVans(vans: VanDimensions[]): MeasuredVan[] {
  return vans.filter(isMeasured);
}

/**
 * One millimetre-to-pixel ratio for the whole fleet.
 *
 * This single shared number is what makes the comparison true. It is chosen so
 * the longest van and the tallest van both fit the available box — never
 * per-van, which would silently normalise away the differences.
 */
export function sharedScale(
  vans: MeasuredVan[],
  box: { widthPx: number; heightPx: number },
  opts: { gapPx?: number } = {},
): number {
  if (vans.length === 0) return 0;
  const gapPx = opts.gapPx ?? 0;

  const totalLengthMm = vans.reduce((sum, v) => sum + v.lengthMm, 0);
  const tallestMm = Math.max(...vans.map((v) => v.heightMm));

  // Wheels sit below the body, so the vertical envelope is body height plus
  // the part of the wheel that projects past it.
  const verticalEnvelopeMm = tallestMm + WHEEL_DIAMETER_MM * 0.15;

  const availableWidthPx = box.widthPx - gapPx * Math.max(0, vans.length - 1);
  const widthConstrained = availableWidthPx / totalLengthMm;
  const heightConstrained = box.heightPx / verticalEnvelopeMm;

  return Math.min(widthConstrained, heightConstrained);
}

export type VanGeometry = {
  slug: string;
  name: string;
  /** Body box in px, at the shared scale. */
  bodyWidthPx: number;
  bodyHeightPx: number;
  wheelRadiusPx: number;
  /** Axle centres, measured from the van's own left edge. */
  frontAxleXPx: number;
  rearAxleXPx: number;
  /** Cab is the forward portion of the body; used for the window/bonnet break. */
  cabWidthPx: number;
  /** Roof height as a fraction of the tallest van — drives the roofline read. */
  relativeHeight: number;
};

export function vanGeometry(
  van: MeasuredVan,
  scale: number,
  tallestMm: number,
): VanGeometry {
  const bodyWidthPx = van.lengthMm * scale;
  const bodyHeightPx = van.heightMm * scale;
  const wheelRadiusPx = (WHEEL_DIAMETER_MM * scale) / 2;
  const frontAxleXPx = van.lengthMm * FRONT_OVERHANG_RATIO * scale;
  const rearAxleXPx = frontAxleXPx + van.wheelbaseMm * scale;

  return {
    slug: van.slug,
    name: van.name,
    bodyWidthPx,
    bodyHeightPx,
    wheelRadiusPx,
    frontAxleXPx,
    rearAxleXPx,
    cabWidthPx: bodyWidthPx * 0.26,
    relativeHeight: van.heightMm / tallestMm,
  };
}

export function fleetGeometry(
  vans: VanDimensions[],
  box: { widthPx: number; heightPx: number },
  opts: { gapPx?: number } = {},
): { scale: number; vans: VanGeometry[] } {
  const measured = measuredVans(vans);
  if (measured.length === 0) return { scale: 0, vans: [] };
  const scale = sharedScale(measured, box, opts);
  const tallestMm = Math.max(...measured.map((v) => v.heightMm));
  return { scale, vans: measured.map((v) => vanGeometry(v, scale, tallestMm)) };
}

/**
 * Wheel rotation for a given travel distance.
 *
 * MOTION.md §4.1: "Wheels rotate during travel at a rate derived from actual
 * distance covered and the van's wheel radius — so the rotation is physically
 * consistent, not a decorative spin. This detail is invisible and it is why it
 * will look right."
 *
 * A wheel rolling without slipping turns `distance / circumference` times.
 */
export function wheelRotationDeg(travelPx: number, wheelRadiusPx: number): number {
  if (wheelRadiusPx <= 0) return 0;
  const circumference = 2 * Math.PI * wheelRadiusPx;
  return (travelPx / circumference) * 360;
}

/**
 * Size rank, 0..1, used by the Load Matcher while `load_volume_m3` is
 * `TODO(client)`.
 *
 * MOTION.md §4.2: "Until it arrives, drive it off the size-rank fallback in the
 * prototype and mark the component `data-provisional`. **Do not invent
 * volumes.**"
 *
 * So this returns a RANK, never a cubic-metre figure. Nothing derived from it
 * is ever rendered as a measurement — it only orders the fleet and drives a
 * proportional fill. The prototype was not supplied (see
 * docs/conversion/02-phase4-report.md), so the rank is computed from the real
 * dimensions we do have: the cargo box scales with length × height.
 */
export function sizeRank(van: VanDimensions, fleet: VanDimensions[]): number | null {
  if (van.lengthMm == null || van.heightMm == null) return null;
  const measured = measuredVans(fleet);
  if (measured.length === 0) return null;

  const proxy = (v: { lengthMm: number; heightMm: number }) => v.lengthMm * v.heightMm;
  const values = measured.map(proxy);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 1;
  return (proxy({ lengthMm: van.lengthMm, heightMm: van.heightMm }) - min) / (max - min);
}
