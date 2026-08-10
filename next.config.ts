import type { NextConfig } from "next";

/**
 * Content-Security-Policy, built from the origins this application actually
 * talks to. Written as a directive list rather than one string so each entry
 * can carry the reason it is there — an allowlist nobody can justify is an
 * allowlist that only ever grows.
 *
 * Changes from the previous policy:
 *   • `images.unsplash.com` and `placehold.co` removed from `img-src`. Phase 1
 *     deleted the stock-photo homepage, and CLAUDE.md §1.5 forbids vehicle
 *     imagery that is not XPDX's own; leaving the origins allowlisted is how
 *     stock photography quietly returns. Removed from `images.remotePatterns`
 *     below for the same reason.
 *   • `raw.githubusercontent.com` removed from `connect-src`. Nothing in the
 *     application fetches from GitHub; it was inherited.
 *   • `tile.openstreetmap.org` removed — the map now uses CARTO's basemap (see
 *     components/public/service-map.tsx for why).
 *   • Google Maps is permitted again in `frame-src` for the footer iframe map.
 *   • `media-src 'self'` added explicitly. The hero clips are same-origin so
 *     they were already covered by `default-src`, but stating it means a future
 *     change to `default-src` cannot silently break every background video.
 *
 * `'unsafe-inline'` and `'unsafe-eval'` in `script-src` are retained on
 * purpose: Google Tag Manager (GTM-M7BWGFK5, preserved per CLAUDE.md §10)
 * evaluates container code at runtime and injects inline snippets, and removing
 * either breaks all conversion tracking. Replacing them requires moving to a
 * server-side GTM container — noted in the report as remaining work, not
 * something to silently break tagging over.
 */
const CSP_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // GTM inline bootstrap
    "'unsafe-eval'", // GTM container evaluation
    "'wasm-unsafe-eval'", // three.js Draco decoder in the 360 viewer
    "https://challenges.cloudflare.com", // Turnstile
    "https://www.gstatic.com", // Draco decoders
    "https://www.googletagmanager.com",
    "https://maps.googleapis.com", // Google Maps JS API
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.supabase.co", // van photographs in Storage
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://*.basemaps.cartocdn.com", // Leaflet tiles
    "https://maps.googleapis.com", // Google Maps
    "https://maps.gstatic.com", // Google Maps controls/markers
  ],
  "media-src": ["'self'"],
  "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    "blob:",
    "data:",
    "https://*.supabase.co",
    "https://www.gstatic.com",
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://challenges.cloudflare.com", // Turnstile challenge exchange
    "https://maps.googleapis.com", // Google Maps API
  ],
  "worker-src": ["'self'", "blob:"],
  "child-src": ["'self'", "blob:"],
  "frame-src": [
    "https://challenges.cloudflare.com",
    "https://www.googletagmanager.com",
    "https://maps.google.com",
    "https://www.google.com"
  ],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"], // no Flash/Java/PDF plugin surface, ever
};

const contentSecurityPolicy =
  Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ") + "; upgrade-insecure-requests;";

const nextConfig: NextConfig = {
  // Remove "X-Powered-By: Next.js" from every response — reduces attack surface
  // by not advertising the framework to automated scanners.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Shared-element van transitions (MOTION.md §4.3). React's
    // <ViewTransition> over the native View Transitions API — no polyfill and
    // no animation library, so browsers without support simply navigate
    // normally at zero JS cost.
    viewTransition: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  images: {
    // Next.js image optimisation enabled — serves WebP/AVIF at correct size via /_next/image.
    // sharp must be in dependencies (not devDependencies) for this to work in production.
    formats: ["image/avif", "image/webp"],
    // 30-day cache — photos are immutable once uploaded.
    minimumCacheTTL: 2592000,
    // Breakpoints tuned for the listing UI:
    //   640 → mobile card, 828 → medium card, 1080 → tablet card / hero,
    //   1200 → desktop card / detail thumb, 1920 → full-bleed VDP gallery
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [256, 384, 512],
    // Phase 1 removed the images.unsplash.com and upload.wikimedia.org
    // origins along with the stock-photo home page. CLAUDE.md §1.5 and
    // MOTION.md §9 forbid vehicle imagery that is not XPDX's own, so keeping
    // them allowlisted would let stock photography back in silently.
    // Only Supabase Storage. The `images.unsplash.com` and `placehold.co`
    // entries the comment above describes as removed were in fact still here —
    // and an allowlisted remote pattern is not passive: it makes /_next/image a
    // proxy that will fetch and re-serve arbitrary images from those hosts on
    // demand, at our bandwidth and CPU cost, for anyone who constructs the URL.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      // ── Global security headers (all routes) ────────────────────────────────
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Cross-Origin isolation — blocks Spectre/side-channel attacks and
          // prevents other origins from reading our responses.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
        ],
      },
      // ── Non-public paths: instruct crawlers to never index ──────────────────
      // Belt-and-suspenders alongside robots.txt — search engines honour both.
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          // API responses should never be cached by a shared proxy or CDN edge
          // unless the route explicitly opts in with Cache-Control.
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, no-cache" },
        ],
      },
      {
        source: "/auth/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, no-cache" },
        ],
      },
      // ── Static media in /public ─────────────────────────────────────────────
      //
      // Files under `public/` are served with a weak default (`Cache-Control:
      // public, max-age=0`) because Next cannot know whether they change — they
      // have no content hash in their filename, unlike everything under
      // `/_next/static`. The result was that the fleet photographs, the hero
      // clips and the 20 MB GLB were revalidated on **every** navigation.
      //
      // These are versioned by hand (a new photo gets a new upload, a re-encode
      // gets a new file), so a long TTL with `stale-while-revalidate` is the
      // right trade: instant repeat views, and any replacement propagates within
      // a day without a purge. `immutable` is deliberately NOT used — it would
      // make a bad upload uncorrectable for a year without renaming the file.
      {
        source: "/:path*.(mp4|webm|glb|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*.(jpg|jpeg|png|webp|avif|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      // ── Geo-restriction landing page ────────────────────────────────────────
      // Middleware rewrites out-of-region page requests here and already sets
      // these headers on the rewritten response. Repeating them at the route
      // level covers direct navigation to /geo-blocked, so the page can never
      // be indexed or cached by a shared proxy under any access path.
      {
        source: "/geo-blocked",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
  async redirects() {
    // Phase 6 removed three inherited redirects: /account/listings ->
    // /admin/inventory (a route deleted in Phase 3), /account(.*) -> /admin and
    // /vendor(.*) -> /admin. They were inherited rental-era paths that no XPDX URL
    // has ever used, one pointed at a 404, and all three advertised the staff
    // portal from public URLs — the opposite of CLAUDE.md §12.
    //
    // The three known indexed WordPress URLs (/about-us/, /contact-us/,
    // /business-van-rental/) need no entry here: Next's default
    // `trailingSlash: false` already 308s them onto the matching new routes,
    // verified in docs/conversion/redirects.md §3.
    //
    // Add entries here ONLY from the crawl described in that file. Nothing
    // bulk-redirects to the home page — Google reads that as a soft 404.
    return [
      // ── Programmatic SEO: /locations/* → /van-hire/* ──────────────────────
      //
      // The suburb family moved from `/locations/[slug]` to
      // `/van-hire/[suburb]` because the old URL targeted a query nobody types.
      // Nobody searches "locations bankstown"; they search "van hire
      // bankstown", and the URL is a ranking asset.
      //
      // These pages were never deployed, so no index equity is at stake — the
      // 301 exists because a URL that resolved in a preview build should move,
      // not start 404ing, and because the old footer linked all ten of them.
      //
      // Suburb-for-suburb via `:suburb` rather than a bulk redirect to
      // `/van-hire`: sending ten distinct URLs to one destination is a
      // many-to-one redirect, which Google treats as a soft 404 and which
      // throws away whatever relevance the source URL had.
      {
        source: "/locations/:suburb",
        destination: "/van-hire/:suburb",
        permanent: true,
      },
      {
        source: "/locations",
        destination: "/van-hire",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
