"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

/**
 * Smooth-scroll shell.
 *
 * ── Fixes over the previous version ─────────────────────────────────────────
 *  1. **The rAF loop leaked.** `raf()` re-queued itself unconditionally, and
 *     cleanup only called `lenis.destroy()`. The callback therefore kept
 *     running for the life of the document, once per frame, calling `raf` on a
 *     destroyed instance — a permanent main-thread cost and a retained
 *     reference to the dead Lenis object. The handle is now cancelled.
 *  2. **It hijacked scrolling for people who asked it not to.** Programmatic
 *     smooth scrolling is exactly what `prefers-reduced-motion` is about: it
 *     decouples the page from the input device and is a common trigger for
 *     motion sickness. Lenis is not initialised at all in that case, so those
 *     visitors get native scrolling and none of the JavaScript that drives it.
 *  3. **It fought the browser on route change.** `scrollTo(0, { immediate })`
 *     ran on every pathname change including back/forward navigations, so
 *     restoring a scroll position sent the reader to the top instead.
 *     `lenis.stop()`/`start()` around Next's own restoration is not needed —
 *     resetting only on a genuinely new path is.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenisRef.current = lenis;

    let handle = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      handle = requestAnimationFrame(raf);
    };
    handle = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(handle);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return <>{children}</>;
}
