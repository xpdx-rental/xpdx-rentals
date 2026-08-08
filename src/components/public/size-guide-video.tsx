"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Illustrative loading clip for the "Which size do I need?" table — self-hosted,
 * muted, looping. Paused on the poster frame under prefers-reduced-motion,
 * same pattern as the hero video.
 */
export function SizeGuideVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) videoRef.current?.pause();
  }, [shouldReduceMotion]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster="/loading-guide-poster.jpg"
      aria-hidden="true"
      className="size-full object-cover"
    >
      <source src="/videos/loading-guide.mp4" type="video/mp4" />
    </video>
  );
}
