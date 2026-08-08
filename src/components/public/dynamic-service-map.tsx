"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * Viewport-gated wrapper around the Leaflet service-area map.
 *
 * ── Why the gate matters more than the code-split ───────────────────────────
 * This component is rendered inside `SiteFooter`, which is in the public
 * layout — so it is on **every page of the site**. `next/dynamic` alone does
 * not help there: a dynamic import starts fetching as soon as the component
 * mounts, and the footer mounts with the rest of the page. So every visit to
 * every page downloaded `leaflet` + `react-leaflet` + `leaflet.css` and then
 * opened connections to OpenStreetMap for map tiles — for a widget sitting
 * below the fold in the footer that most visitors never scroll to.
 *
 * The `IntersectionObserver` here is what actually saves the bytes: nothing is
 * requested until the map is within 300 px of the viewport. On the pages where
 * the map is the point (`/service-area`) that is immediate and invisible; in
 * the footer it is usually never.
 *
 * `rootMargin` is generous on purpose — the chunk and the first tiles want a
 * head start so the map is drawn by the time it is actually looked at, rather
 * than popping in under the reader.
 */
const ServiceMap = dynamic(() => import("./service-map"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "w-full h-[500px] rounded-2xl overflow-hidden border border-border flex items-center justify-center bg-muted"
      }
    >
      <div
        className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin motion-reduce:animate-none"
        role="status"
        aria-label="Loading map"
      />
    </div>
  );
}

interface DynamicServiceMapProps {
  center: [number, number];
  address: string;
  className?: string;
  radiusMiles?: number;
  zoom?: number;
}

export function DynamicServiceMap({
  center,
  address,
  className,
  radiusMiles,
  zoom,
}: DynamicServiceMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (very old browsers) — load rather than show an
    // empty box forever. Failing open is correct for a content element. The
    // timeout is not a delay for its own sake: setting state synchronously in
    // an effect body forces a second render pass before paint.
    if (typeof IntersectionObserver === "undefined") {
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        setVisible(true);
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className ?? "w-full h-[500px]"}>
      {visible ? (
        <ServiceMap
          center={center}
          address={address}
          className="size-full"
          radiusMiles={radiusMiles}
          zoom={zoom}
        />
      ) : (
        <MapPlaceholder className="size-full flex items-center justify-center bg-muted" />
      )}
    </div>
  );
}
