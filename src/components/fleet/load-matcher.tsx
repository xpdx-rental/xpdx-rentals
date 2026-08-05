"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  LOAD_PRESETS,
  matchFleet,
  cartonPlan,
  type LoadPreset,
  type Verdict,
} from "@/lib/load-matcher";
import { fleetGeometry, type VanDimensions } from "@/lib/fleet-geometry";
import { duration, ease, bezier, stagger, settle } from "@/lib/motion";
import { formatWeekly } from "@/lib/van";

/**
 * The Load Matcher — MOTION.md §4.2. Turns a filter into a demonstration.
 *
 * The customer picks what they are moving and the load physically stacks into
 * each van's cargo bay. When it does not fit, the stack breaks the roofline and
 * the overflow is drawn outside the van — "the customer sees the mistake
 * instead of reading about it".
 *
 * ⚠ `data-provisional`: this needs `load_volume_m3`, which is `TODO(client)`.
 * It currently runs on the ordinal size-rank fallback in `lib/load-matcher.ts`,
 * which never produces or displays a volume. The note rendered at the bottom of
 * the component says so to the customer in plain words — a fit guide a customer
 * relies on has to be honest about being a guide.
 *
 * Verdicts are text, never colour alone (MOTION.md §11).
 */

const VERDICT_CLASS: Record<Verdict, string> = {
  recommended: "load-matcher__van--recommended",
  tight: "load-matcher__van--tight",
  "too-small": "load-matcher__van--too-small",
};

export type LoadMatcherVan = VanDimensions & {
  priceWeeklyFrom: number;
};

export function LoadMatcher({ vans }: { vans: LoadMatcherVan[] }) {
  const reduced = useReducedMotion();
  const [load, setLoad] = useState<LoadPreset>(LOAD_PRESETS[1]);

  const matches = useMemo(() => matchFleet(vans, load), [vans, load]);

  // Cutaway boxes share the fleet's scale so the bays stay comparable.
  const { vans: geo } = useMemo(
    () => fleetGeometry(vans, { widthPx: 1200, heightPx: 150 }, { gapPx: 0 }),
    [vans],
  );

  if (geo.length === 0) return null;

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="load-matcher" data-provisional="true">
        <fieldset className="load-matcher__loads">
          <legend className="load-matcher__legend">What are you moving?</legend>
          <div className="load-matcher__options" role="radiogroup" aria-label="What are you moving?">
            {LOAD_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={p.id === load.id}
                onClick={() => setLoad(p)}
                className="load-matcher__option"
                data-active={p.id === load.id ? "true" : undefined}
              >
                <span className="load-matcher__option-label">{p.label}</span>
                <span className="load-matcher__option-hint">{p.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <ul className="load-matcher__grid">
          {geo.map((g) => {
            const match = matches.find((mm) => mm.slug === g.slug);
            if (!match) return null;
            const source = vans.find((v) => v.slug === g.slug);
            const plan = cartonPlan(match.fillRatio);

            // Cutaway box: cab outlined, cargo bay open.
            const boxW = 190;
            const boxH = 120;
            const cabW = boxW * 0.26;
            const bayX = cabW;
            const bayW = boxW - cabW;
            const bayH = boxH * (0.5 + g.relativeHeight * 0.45);
            const bayY = boxH - bayH;

            const cols = 4;
            const rows = Math.ceil(plan.total / cols);
            const cartonW = (bayW - 10) / cols;
            const cartonH = Math.min(cartonW * 0.72, (bayH - 6) / Math.max(rows, 1));

            return (
              <li
                key={g.slug}
                className={`load-matcher__van ${VERDICT_CLASS[match.verdict]}`}
              >
                <svg viewBox={`0 0 ${boxW} ${boxH + 4}`} className="load-matcher__svg" aria-hidden="true">
                  {/* Cab outline */}
                  <path
                    d={`M 2 ${boxH} L 2 ${bayY + bayH * 0.34} L ${cabW * 0.55} ${bayY + bayH * 0.16} L ${cabW} ${bayY + bayH * 0.16} L ${cabW} ${boxH} Z`}
                    className="load-matcher__cab"
                  />
                  {/* Cargo bay, open */}
                  <path
                    d={`M ${bayX} ${boxH} L ${bayX} ${bayY} L ${boxW - 2} ${bayY} L ${boxW - 2} ${boxH}`}
                    className="load-matcher__bay"
                  />
                  {/* Roofline — the thing the overflow breaks */}
                  <line x1={bayX} y1={bayY} x2={boxW - 2} y2={bayY} className="load-matcher__roofline" />
                  {/* Ground */}
                  <line x1={0} y1={boxH + 1} x2={boxW} y2={boxH + 1} className="load-matcher__ground" />

                  {Array.from({ length: plan.total }).map((_, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    const x = bayX + 5 + col * cartonW;
                    const y = boxH - (row + 1) * cartonH - 2;
                    const isOverflow = i >= plan.inside;

                    return (
                      <m.rect
                        key={`${load.id}-${i}`}
                        x={x}
                        y={y}
                        width={cartonW - 3}
                        height={cartonH - 3}
                        rx={1.5}
                        className={
                          isOverflow ? "load-matcher__carton load-matcher__carton--over" : "load-matcher__carton"
                        }
                        initial={reduced ? false : { y: y - 40, opacity: 0 }}
                        animate={{ y, opacity: isOverflow ? 0.3 : 1 }}
                        transition={
                          reduced
                            ? { duration: 0 }
                            : {
                                // Drop in with a small settle, staggered tight.
                                y: {
                                  duration: settle.totalMs / 1000,
                                  ease: bezier(ease.load),
                                  delay: i * stagger.tight,
                                },
                                opacity: { duration: duration.ui, delay: i * stagger.tight },
                              }
                        }
                      />
                    );
                  })}
                </svg>

                <div className="load-matcher__meta">
                  <p className="load-matcher__name">
                    <Link href={`/vans/${g.slug}`}>{g.name}</Link>
                  </p>
                  {/* Verdict as TEXT — never colour alone (§11). */}
                  <p className="load-matcher__verdict">{match.label}</p>
                  {source ? (
                    <p className="load-matcher__price">
                      From {formatWeekly(source.priceWeeklyFrom)}/wk
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="load-matcher__note">
          This is a guide based on van size, not a measured capacity. Tell us what you are
          carrying and we will confirm the right van before you book.
        </p>
      </div>
    </LazyMotion>
  );
}
