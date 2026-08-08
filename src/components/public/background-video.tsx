"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Decorative full-bleed background video.
 *
 * ── The problem this replaces ───────────────────────────────────────────────
 * Four near-identical components (the homepage hero, the business hero, the
 * use-cases hero and the admin-login backdrop) each rendered:
 *
 *     <video autoPlay loop muted playsInline preload="auto" poster="…">
 *
 * `preload="auto"` on an `autoPlay` element tells the browser to fetch the
 * whole file at high priority, immediately, competing directly with the LCP
 * image and the render-blocking CSS. Across the four clips that is ~7.4 MB, and
 * every byte of it is decoration — the clips are `aria-hidden`, muted and
 * looping, and nothing on the page depends on them.
 *
 * ── What this does instead ──────────────────────────────────────────────────
 *  1. The **poster is the paint**, and it goes through `next/image` so it is
 *     served as AVIF/WebP at the visitor's actual viewport width instead of as
 *     a raw JPEG at the `poster` attribute's one fixed size. On most pages this
 *     poster *is* the LCP element, so it is marked `priority`.
 *  2. The `<video>` has **no `src` at all** until three things are true: the
 *     page is idle, the element is near the viewport, and the visitor's device
 *     and connection have not asked us not to. Until then it costs nothing.
 *  3. It never loads for someone who has asked for reduced motion, enabled
 *     Save-Data, or is on a connection the browser reports as 2g/slow-2g. Those
 *     visitors get the poster, which is the same frame — not a broken hero.
 *
 * The result is a hero that paints from a ~40 KB image instead of racing a
 * multi-megabyte download, on every page that uses one.
 */

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * True when we should not spend a visitor's bandwidth on decoration.
 *
 * `navigator.connection` is Chromium-only, so this is a progressive
 * enhancement: where it is unavailable we fall through to loading the video,
 * which is the pre-existing behaviour.
 */
function prefersLessData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return conn.effectiveType === "slow-2g" || conn.effectiveType === "2g";
}

/**
 * Read the media query directly rather than going through framer-motion's
 * `useReducedMotion()`.
 *
 * That hook is `useState(prefersReducedMotion.current)` — it samples once, on
 * first render, and never updates. On a hydrating server-rendered component the
 * value it samples can still be the server's `null`, and it stays `null` for
 * the life of the component. Gating on it (`!== false`) therefore left the
 * video permanently unloaded: the hero rendered its poster and nothing else,
 * silently, on every visit. Verified in the browser before this was changed.
 *
 * `matchMedia` runs inside an effect, so it is client-only by construction and
 * returns a real boolean. `LenisProvider` gates on the same query.
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BackgroundVideo({
  src,
  poster,
  posterAlt = "",
  className = "",
  objectPosition = "object-top",
  priority = true,
  sizes = "100vw",
}: {
  /** Self-hosted clip. Same-origin, so no CSP `media-src` change is needed. */
  src: string;
  /** Poster frame. Rendered through `next/image` — pass the source asset path. */
  poster: string;
  /**
   * Empty by default: these clips are decorative, and the surrounding section
   * always carries the real heading. A description here would be read out as
   * duplicate content.
   */
  posterAlt?: string;
  className?: string;
  objectPosition?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Set once we have decided to actually fetch the clip. */
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  /** Cross-fades the video over the poster, so there is never a black flash. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || prefersLessData()) return;

    const el = containerRef.current;
    if (!el) return;

    let cancel: (() => void) | undefined;
    const start = () => setVideoSrc(src);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        // Defer past the critical path: even in-viewport, the clip must not
        // compete with the LCP image or hydration for bandwidth.
        //
        // `requestIdleCallback` is unavailable on Safari before 17, which is
        // still a meaningful slice of Australian mobile traffic — hence the
        // timeout fallback rather than assuming it exists.
        if (typeof window.requestIdleCallback === "function") {
          const id = window.requestIdleCallback(start, { timeout: 2500 });
          cancel = () => window.cancelIdleCallback(id);
        } else {
          const id = window.setTimeout(start, 1200);
          cancel = () => window.clearTimeout(id);
        }
      },
      // Start a little before it scrolls in, so the fade has landed by the time
      // the section is actually on screen.
      { rootMargin: "200px" },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancel?.();
    };
  }, [src]);

  // Autoplay can be refused (low power mode, per-site setting). If it is, drop
  // the video entirely and keep the poster rather than sitting on a frozen
  // first frame over the top of it.
  useEffect(() => {
    if (!videoSrc) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setVideoSrc(null));
  }, [videoSrc]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <Image
        src={poster}
        alt={posterAlt}
        aria-hidden={posterAlt === "" ? true : undefined}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${objectPosition}`}
      />

      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          muted
          playsInline
          // The element is only rendered once we have already decided to fetch,
          // so "none" here just keeps the browser from speculatively buffering
          // beyond what playback needs.
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          onError={() => setVideoSrc(null)}
          className={`absolute inset-0 size-full object-cover ${objectPosition} transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}
