/**
 * Motion tokens — MOTION.md §3.
 *
 * Import these everywhere. No inline magic numbers: a duration or easing that
 * appears in a component instead of here is a bug, because the whole point is
 * that the site moves with one consistent weight.
 *
 * The thesis (§1): motion with mass. These vans are two-and-a-half tonnes.
 * Nothing pops, springs, wobbles or bounces. Things accelerate slowly, carry
 * momentum, and settle on suspension. If an animation would look right on a
 * fintech dashboard, it is wrong here.
 */

export const duration = {
  micro: 0.12, // state flips, toggles, plate highlights
  ui: 0.24, // buttons, hovers, form fields
  reveal: 0.52, // section entrances, card staggers
  cinematic: 0.9, // signature moments only
} as const;

export const ease = {
  /** Heavy object getting underway — slow to start, carries through. */
  drive: [0.65, 0.0, 0.35, 1.0],
  /** Braking to a stop — fast approach, long settle. The house easing. */
  brake: [0.16, 1.0, 0.3, 1.0],
  /** Load settling on suspension. */
  load: [0.2, 0.8, 0.2, 1.0],
  /** UI default. */
  ui: [0.4, 0.0, 0.2, 1.0],
} as const;

/** Springs: mass is raised above default deliberately. These are trucks. */
export const spring = {
  chassis: { type: "spring", stiffness: 120, damping: 18, mass: 1.2 },
  panel: { type: "spring", stiffness: 210, damping: 26, mass: 0.9 },
} as const;

export const stagger = { tight: 0.045, fleet: 0.09 } as const;

/**
 * Suspension settle — used whenever a van comes to rest.
 *
 * Two damped oscillations on `y`, amplitude 5px → 1.6px, total 380ms,
 * `ease.load`. MOTION.md §3 is explicit: never more than two. Three reads as
 * cartoon, and this site is selling reliability.
 */
export const settle = {
  amplitudes: [5, 1.6] as const,
  totalMs: 380,
  keyframes: [0, -5, 0, -1.6, 0],
  times: [0, 0.25, 0.5, 0.75, 1],
} as const;

/**
 * The front axle settles ~40ms before the rear (§4.1). A van does not land
 * flat; the nose stops first.
 */
export const AXLE_SETTLE_OFFSET_S = 0.04;

/** Ground line draws over 600ms, starting 200ms before the first van (§4.1). */
export const GROUND_LINE = { durationS: 0.6, leadS: 0.2 } as const;

/** IntersectionObserver threshold for the Fleet Line entrance (§4.1). */
export const FLEET_LINE_IN_VIEW_THRESHOLD = 0.35;

/**
 * Type-safe cubic-bézier for Framer Motion, which wants a 4-tuple rather than
 * the `readonly number[]` these constants infer as.
 */
export type Bezier = [number, number, number, number];
export const bezier = (e: readonly number[]): Bezier => [e[0], e[1], e[2], e[3]];
