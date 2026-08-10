import { LeafletMap } from "@/components/public/leaflet-map";
import { GEO, ADDRESS } from "@/lib/business";

/**
 * The 30-mile service radius shown on `/local-van-hire`.
 *
 * ── Why this no longer uses Google Maps ─────────────────────────────────────
 * This was built on `@vis.gl/react-google-maps`, and it could not have worked
 * in production:
 *
 *  1. **Blocked by our own CSP.** The Google Maps JS API loads from
 *     `maps.googleapis.com` and calls back to it. Neither host is in
 *     `script-src` or `connect-src` in next.config.ts, so the browser refused
 *     the script and the page rendered an empty grey box.
 *  2. **It advertised a missing environment variable to the public.** When
 *     `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` was unset it rendered a red banner
 *     reading "Warning: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing" over the
 *     map — visible to customers, and a free hint to anyone probing the site.
 *  3. **It hardcoded `mapId="DEMO_MAP_ID"`**, which is Google's sample id, and
 *     it billed per map load against a key that has to be exposed in the
 *     client bundle.
 *
 * The site already had a working, free, CSP-allowed Leaflet map used by the
 * footer and `/service-area`. Pointing this at the same component fixes the
 * page, removes an entire second mapping library from the bundle, and removes
 * the API-key requirement. The coordinates come from `lib/business` rather
 * than being repeated here, so the yard has one canonical location.
 */
export function ServiceAreaMap() {
  return (
    <LeafletMap
      center={[GEO.latitude, GEO.longitude]}
      address={ADDRESS.full}
      radiusKm={20}
      zoom={9}
      className="relative h-[500px] w-full overflow-hidden rounded-3xl border border-border bg-muted/20 shadow-2xl sm:h-[600px]"
    />
  );
}
