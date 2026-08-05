import type { MetadataRoute } from "next";
import { getPublicVanSlugs } from "@/lib/data/public-vans";
import { siteBaseUrl } from "@/lib/seo/site";

export const revalidate = 3600;

/**
 * XML sitemap, generated from the database.
 *
 * Two rules carried over from the previous build, both still right:
 *
 *  1. Only indexable URLs. `/privacy-policy` and `/terms-of-hire` are
 *     deliberately absent — they are `noindex` placeholders until the client
 *     supplies the text, and listing a noindex URL asks Google to crawl a page
 *     we simultaneously tell it to ignore.
 *  2. Real `lastModified`. Van pages carry their own `updated_at`; the fleet
 *     hub inherits the freshest of them, so it re-crawls when the fleet
 *     actually changes rather than on a date that never moves.
 *
 * Draft vans are excluded by RLS, not by a filter here — see
 * `lib/data/public-vans.ts`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const vans = await getPublicVanSlugs();

  const freshest = vans.reduce<Date>((latest, v) => {
    const d = v.updatedAt ? new Date(v.updatedAt) : null;
    return d && d > latest ? d : latest;
  }, new Date(0));
  const fleetDate = freshest.getTime() === 0 ? new Date() : freshest;

  const url = (
    path: string,
    lastModified: Date,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  const now = new Date();

  return [
    url("/", fleetDate, 1, "weekly"),
    url("/vans", fleetDate, 0.9, "weekly"),
    // The three service pages are the ranking assets (CLAUDE.md §8).
    url("/local-van-hire", now, 0.8, "monthly"),
    url("/delivery-van-for-rent", now, 0.8, "monthly"),
    url("/business-van-rental", now, 0.8, "monthly"),
    url("/service-area", now, 0.7, "monthly"),
    url("/about-us", now, 0.6, "monthly"),
    url("/faq", now, 0.7, "monthly"),
    url("/contact-us", now, 0.7, "monthly"),
    ...vans.map((v) =>
      url(`/vans/${v.slug}`, v.updatedAt ? new Date(v.updatedAt) : now, 0.9, "weekly"),
    ),
  ];
}
