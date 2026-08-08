/**
 * Full-bleed film-grain texture.
 *
 * ── What changed ────────────────────────────────────────────────────────────
 * This used to be a `"use client"` component rendering a viewport-sized
 * `<svg>` with a live `<feTurbulence>` filter. That is one of the most
 * expensive paint operations a browser offers: fractal noise is generated on
 * the CPU across every pixel of the element, and it is re-rasterised on every
 * resize, orientation change and browser-zoom step. At 1440p that is ~3.7
 * million pixels of procedural noise, on every page, forever — and because it
 * is `position: fixed` it sits in its own compositor layer for the life of the
 * document.
 *
 * `public/noise.svg` is the *same* `feTurbulence`, baked into a 200×200 tile.
 * Tiling it means the browser rasterises 40,000 pixels once and repeats the
 * result, which is a plain image paint. Visually identical, and it is already
 * how `globals.css` textures the body surface (`html.dark body { bg-noise }`),
 * so this now reuses that one definition instead of duplicating the effect in
 * a second, costlier form.
 *
 * Dropping `"use client"` also removes a client-component boundary — and its
 * hydration — from the root layout, which every page in the app inherits.
 */
export function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="bg-noise pointer-events-none fixed inset-0 z-[9998] opacity-[0.035] mix-blend-overlay"
    />
  );
}
