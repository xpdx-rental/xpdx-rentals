"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, useInView, useReducedMotion } from "framer-motion";
import { fleetGeometry, wheelRotationDeg, type VanDimensions } from "@/lib/fleet-geometry";
import {
  duration,
  ease,
  bezier,
  spring,
  stagger,
  settle,
  AXLE_SETTLE_OFFSET_S,
  GROUND_LINE,
  FLEET_LINE_IN_VIEW_THRESHOLD,
} from "@/lib/motion";
import { VanSilhouette } from "@/components/fleet/van-silhouette";
import { formatWeekly } from "@/lib/van";

/**
 * The Fleet Line — MOTION.md §4.1. The single most important thing on the site.
 *
 * Six vans drawn true to scale from real dimensions, so a customer can see that
 * a Sprinter SWB is the same length as a HiAce LWB but 365mm taller. The
 * geometry lives in `lib/fleet-geometry.ts` and is unit-tested; this file is
 * only the motion and the interaction.
 *
 * Entrance fires once on in-view. It does not replay on scroll-back — stillness
 * after motion is what makes the motion read as considered (§4.1 "Rest state:
 * parked").
 *
 * `LazyMotion` + `domAnimation` per §8: the reduced feature bundle, not the
 * full package, because this sits below the fold and must not cost the LCP.
 */

const ENTRANCE_TRAVEL_PX = -140;

/**
 * A fixed drawing box keeps the shared mm→px scale stable across breakpoints;
 * the SVG itself scales responsively via its viewBox. Module-level so it is
 * referentially stable across renders.
 */
const BOX = { widthPx: 1120, heightPx: 190 } as const;
const GAP = 26;

export type FleetLineVan = VanDimensions & {
  priceWeeklyFrom: number;
  bodyType: string;
};

export function FleetLine({
  vans,
  className = "",
}: {
  vans: FleetLineVan[];
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(containerRef, {
    once: true,
    amount: FLEET_LINE_IN_VIEW_THRESHOLD,
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [isCoarse, setIsCoarse] = useState(false);

  // Mobile gets less (§2.6): scroll-snap, no wheel rotation, simplified
  // entrance. Detected from the pointer, not the viewport — a small window on a
  // desktop still has a mouse and should keep the full treatment.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { vans: geo } = useMemo(() => fleetGeometry(vans, BOX, { gapPx: GAP }), [vans]);

  // Lay the vans out left to right at their true widths. Computed by scanning
  // rather than by mutating an accumulator inside a map callback — the map
  // callback stays pure, which the React Compiler requires.
  const positioned = useMemo(
    () =>
      geo.map((g, i) => ({
        ...g,
        xPx: geo.slice(0, i).reduce((sum, prev) => sum + prev.bodyWidthPx + GAP, 0),
      })),
    [geo],
  );

  const totalWidth = positioned.length
    ? positioned[positioned.length - 1].xPx + positioned[positioned.length - 1].bodyWidthPx
    : 0;
  const totalHeight = BOX.heightPx;

  if (positioned.length === 0) return null;

  const animate = inView && !reduced;

  function onSelect(slug: string) {
    setSelected(slug);
    // Scroll to that van's card (§4.1). Honour reduced motion here too.
    const card = document.getElementById(`van-card-${slug}`);
    card?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    // Roving tabindex: arrow keys move between vans (§4.1).
    let next = index;
    if (e.key === "ArrowRight") next = Math.min(positioned.length - 1, index + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, index - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = positioned.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(positioned[index].slug);
      return;
    } else return;

    e.preventDefault();
    setFocusIndex(next);
    document.getElementById(`${uid}-van-${next}`)?.focus();
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={containerRef}
        className={`fleet-line ${isCoarse ? "fleet-line--snap" : ""} ${className}`}
        data-animating={animate ? "true" : "false"}
      >
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="fleet-line__svg"
          role="group"
          aria-label="The XPDX fleet drawn to scale, smallest to largest"
        >
          <defs>
            <radialGradient id={`${uid}-bloom`}>
              <stop offset="0%" stopColor="var(--fleet-headlight)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--fleet-headlight)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/*
            Ground line draws left to right, starting 200ms BEFORE the first van
            so the vans arrive onto a road rather than into empty space.
          */}
          <m.line
            x1={0}
            y1={totalHeight - 0.5}
            x2={totalWidth}
            y2={totalHeight - 0.5}
            className="fleet-line__ground"
            initial={reduced ? false : { pathLength: 0 }}
            animate={animate ? { pathLength: 1 } : reduced ? { pathLength: 1 } : undefined}
            transition={{ duration: GROUND_LINE.durationS, ease: bezier(ease.drive) }}
          />

          {positioned.map((g, i) => {
            const dimmed = selected !== null && selected !== g.slug;
            const isSelected = selected === g.slug;
            const delay = animate ? GROUND_LINE.leadS + i * stagger.fleet : 0;

            // Real rotation for the real travel distance (§4.1). Skipped on
            // coarse pointers — invisible at that size and it costs frames.
            const rotation =
              isCoarse || reduced
                ? 0
                : wheelRotationDeg(Math.abs(ENTRANCE_TRAVEL_PX), g.wheelRadiusPx);

            return (
              <m.g
                key={g.slug}
                id={`${uid}-van-${i}`}
                tabIndex={i === focusIndex ? 0 : -1}
                role="button"
                aria-label={`${g.name}, from ${formatWeekly(
                  vans.find((v) => v.slug === g.slug)?.priceWeeklyFrom ?? 0,
                )} per week`}
                aria-pressed={isSelected}
                className="fleet-line__van"
                data-selected={isSelected ? "true" : undefined}
                onClick={() => onSelect(g.slug)}
                onFocus={() => setFocusIndex(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                style={{ transformBox: "fill-box" }}
                initial={
                  reduced
                    ? false
                    : { x: ENTRANCE_TRAVEL_PX, opacity: 0 }
                }
                animate={
                  animate
                    ? {
                        x: 0,
                        opacity: dimmed ? 0.45 : 1,
                        // Suspension settle on arrival: two damped oscillations,
                        // never three.
                        y: [...settle.keyframes],
                      }
                    : reduced
                      ? { x: 0, opacity: dimmed ? 0.45 : 1, y: 0 }
                      : undefined
                }
                transition={{
                  x: { duration: duration.cinematic, ease: bezier(ease.brake), delay },
                  opacity: { duration: duration.ui },
                  y: {
                    duration: settle.totalMs / 1000,
                    ease: bezier(ease.load),
                    times: [...settle.times],
                    // Front axle settles ~40ms before the rear; the whole body
                    // lands just after the travel completes.
                    delay: delay + duration.cinematic - AXLE_SETTLE_OFFSET_S,
                  },
                }}
                whileHover={isCoarse || reduced ? undefined : { y: -4, transition: spring.chassis }}
              >
                <g transform={`translate(${g.xPx} 0)`}>
                  <VanSilhouette
                    geo={g}
                    isHiAce={(vans.find((v) => v.slug === g.slug)?.bodyType ?? "") === "HiAce"}
                    wheelRotationDeg={animate ? rotation : 0}
                  />
                </g>
              </m.g>
            );
          })}
        </svg>

        {/* Captions sit outside the SVG so they stay real, selectable text. */}
        <ul className="fleet-line__captions" style={{ width: "100%" }}>
          {positioned.map((g) => {
            const source = vans.find((v) => v.slug === g.slug);
            return (
              <li
                key={g.slug}
                className="fleet-line__caption"
                data-selected={selected === g.slug ? "true" : undefined}
                style={{ flexGrow: g.bodyWidthPx, flexBasis: 0 }}
              >
                <span className="fleet-line__caption-name">{g.name}</span>
                {source ? (
                  <span className="fleet-line__caption-price">
                    {formatWeekly(source.priceWeeklyFrom)}/wk
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </LazyMotion>
  );
}
