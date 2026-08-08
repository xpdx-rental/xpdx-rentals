"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track if it's a new page (prevents double-tracking on re-renders)
    if (pathname && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;
      
      // Ignore admin routes
      if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

      // Ping our tracking API asynchronously
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname }),
        // keepalive ensures the request fires even if the user navigates away instantly
        keepalive: true,
      }).catch(() => {
        // Silently fail on client if analytics request fails
      });
    }
  }, [pathname]);

  return null;
}
