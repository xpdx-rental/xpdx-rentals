import type { NextConfig } from "next";

const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com;"
    : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;";

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
            value:
              `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; frame-src https://challenges.cloudflare.com https://maps.google.com https://www.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`,
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
    return [];
  },
};

export default nextConfig;
