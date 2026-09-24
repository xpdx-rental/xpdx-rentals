import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/seo/site";

/**
 * robots.ts — Crawler access policy
 *
 * Strategy:
 *  • Good-faith SEO bots (Googlebot, Bingbot, etc.) get full access — SEO
 *    must not be impacted.
 *  • Known bad-actor scrapers (AI training, aggressive SEO tools) are
 *    explicitly blocked. This is belt-and-suspenders alongside the
 *    edge proxy UA blocklist.
 *  • Generic unknown bots get a Crawl-delay to throttle polite crawlers.
 *  • Admin, API, and auth paths are never crawlable by anyone.
 *  • `/geo-blocked` (the out-of-region landing page) is never crawlable — it is
 *    an internal rewrite target, not a real page. Crawlers themselves are
 *    exempt from the geo gate (see src/lib/security/geo-restriction.ts), so
 *    they always receive the real page for the URL they requested.
 *
 * Note: bad bots that ignore robots.txt are handled at the edge proxy layer
 * (hard 403). This file targets bots that DO respect the standard.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
