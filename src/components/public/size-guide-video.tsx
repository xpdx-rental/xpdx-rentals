"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Illustrative loading clip for the "Which size do I need?" table.
 *
 * ── What this replaces ──────────────────────────────────────────────────────
 * This component had been changed to render
 *
 *     <iframe src="https://share.gemini.google/iojnPd75X3Jc" …>
 *
 * which does not work in production at all: `frame-src` in the CSP
 * (next.config.ts) allows only challenges.cloudflare.com, maps.google.com,
 * www.google.com and googletagmanager.com, so the browser blocks the frame and
 * the homepage renders an empty bordered box where the size guide should be.
 * It also handed a third party a frame on the highest-traffic page, and left
 * the self-hosted `/videos/loading-guide.mp4` (which already ships in
 * `public/`, with a matching poster) unused.
 *
 * It is back to the self-hosted clip, using the same deferred-load approach as
 * the hero backgrounds: the poster paints immediately through `next/image`, and
 * the 1.4 MB clip is only fetched once the section is actually scrolled near.
 * This one sits well below the fold, so `priority` is off — fetching its poster
 * eagerly would compete with the real LCP element at the top of the page.
 */
export function SizeGuideVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read the query directly — framer-motion's `useReducedMotion()` samples
    // once and can stay `null` after hydration, which silently left this clip
    // (and the hero backgrounds) permanently unloaded. See background-video.tsx.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        setVideoSrc("/videos/loading-guide.mp4");
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!videoSrc) return;
    videoRef.current?.play().catch(() => setVideoSrc(null));
  }, [videoSrc]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Image
        src="/loading-guide-poster.jpg"
        alt="A cargo van being loaded, illustrating how much fits in each van size"
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover"
      />
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          onError={() => setVideoSrc(null)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}
