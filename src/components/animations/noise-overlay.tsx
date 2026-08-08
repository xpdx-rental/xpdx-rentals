"use client";

import { useId } from "react";

export function NoiseOverlay() {
  const filterId = useId();

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.035] mix-blend-overlay">
      <svg
        className="h-full w-full opacity-100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0 1" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
    </div>
  );
}
