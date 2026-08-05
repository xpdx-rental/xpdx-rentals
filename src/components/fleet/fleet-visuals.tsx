"use client";

import dynamic from "next/dynamic";
import type { FleetLineVan } from "@/components/fleet/fleet-line";
import type { LoadMatcherVan } from "@/components/fleet/load-matcher";

/**
 * Code-splitting boundary for the two Tier 1 signature components.
 *
 * MOTION.md §8: "Lazy-load `motion` for anything below the fold." Using
 * `LazyMotion` alone was not enough — importing these components from a Server
 * Component put them, and Framer Motion with them, into the route's initial
 * client bundle whether or not they ever rendered. On `/vans` that was ~100KB
 * over the wire for drawings the visitor may never scroll to.
 *
 * `ssr: false` is deliberate and safe here because neither component is the
 * content. The size-guide table is server-rendered above them and stays — it is
 * the accessible, no-JavaScript version of the same data, not a fallback. The
 * Fleet Line and Load Matcher are progressive enhancement on top of it, so
 * deferring them costs nothing a visitor needs and keeps the LCP clean.
 */

const FleetLineImpl = dynamic(
  () => import("@/components/fleet/fleet-line").then((m) => m.FleetLine),
  { ssr: false },
);

const LoadMatcherImpl = dynamic(
  () => import("@/components/fleet/load-matcher").then((m) => m.LoadMatcher),
  { ssr: false },
);

export function FleetLineLazy({ vans }: { vans: FleetLineVan[] }) {
  if (vans.length === 0) return null;
  return <FleetLineImpl vans={vans} />;
}

export function LoadMatcherLazy({ vans }: { vans: LoadMatcherVan[] }) {
  if (vans.length === 0) return null;
  return <LoadMatcherImpl vans={vans} />;
}
