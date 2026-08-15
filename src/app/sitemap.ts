import type { MetadataRoute } from "next";
import { sitemapPages } from "@/lib/seo/registry";
import { siteBaseUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

/**
 * XML sitemap, generated from the SEO registry.
 *
 * The registry is the ONLY input. That is the entire design: a sitemap built
 * from its own hand-maintained list of paths is the subsystem that always
 * drifts first, and the drift is invisible — it takes a Search Console
 * "Submitted URL marked noindex" report weeks later to find out that the
 * sitemap and the pages disagree about what should be indexed. Here they read
 * the same field (`decision.sitemap`, which is strictly narrower than
 * `decision.index`), so they cannot.
 *
 * What that buys, concretely:
 *
 *   • Pages the quality gate declined never appear — including the ones the
 *     old file listed by hand and the ones it forgot entirely (`/use-cases`
 *     and every `/locations/*` page were missing from the previous version, so
 *     sixteen URLs were invisible to Google).
 *   • A page canonicalised onto another for cannibalisation is excluded
 *     automatically, because a URL that points its canonical elsewhere has no
 *     business asking for crawl budget.
 *   • `/privacy-policy` and `/terms-of-hire` stay out while they are noindex
 *     placeholders — the registry simply does not carry them.
 *   • `lastModified` comes from real `updated_at` values on the vans behind
 *     each page, so a category page re-crawls when its fleet actually changes.
 *
 * ON SHARDING: Next supports `generateSitemaps()` for splitting this into a
 * sitemap index. It is not used, because this estate is around fifty URLs and
 * Google's limit is 50,000 — an index here would be ceremony, and it would
 * cost a redirect-chasing crawler an extra round trip for nothing. If the
 * estate ever passes a few thousand URLs, shard on `page.kind`; the registry
 * already groups by it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const pages = await sitemapPages();

  return pages.map((page) => ({
    url: `${base}${page.path === "/" ? "" : page.path}`,
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
