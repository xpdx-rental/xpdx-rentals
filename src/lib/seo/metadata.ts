import type { Metadata } from "next";
import { absoluteUrl, canonical } from "@/lib/seo/site";
import type { SeoPage } from "@/lib/seo/registry";

/** Must match the brand in the root layout's title template. */
const BRAND = "XPDX Rentals";

/**
 * Resolve a page title against the root layout's `%s | XPDX Rentals` template.
 *
 * The template is convenient — every page gets the brand for free — but it is
 * unconditional, so any title that already names the brand comes out
 * double-branded. That is not hypothetical: it shipped across the whole
 * programmatic estate at once, because the registry appends the brand when the
 * title has room for it, and the operator-authored `seo_title` values in the
 * `vans` table carry it too:
 *
 *   "Van Hire Bankstown | XPDX Rentals | XPDX Rentals"
 *   "Toyota HiAce SLWB Hire Sydney | XPDX Rentals — from $395/wk | XPDX Rentals"
 *
 * A title already containing the brand is therefore emitted as `absolute`,
 * which suppresses the template. Anything else is passed through and the
 * template appends the brand as intended. One rule, applied where every page's
 * metadata is built, so no caller has to know the template exists.
 */
function resolveTitle(title: string): Metadata["title"] {
  return title.includes(BRAND) ? { absolute: title } : title;
}

/**
 * Builds a complete, self-consistent metadata block for a page.
 *
 * Centralising this fixes a class of bug the codebase had everywhere: pages set
 * only `title` + `description`, then inherited `alternates.canonical` and
 * `openGraph.url` from the root layout — both of which pointed at the homepage.
 * Every page therefore told Google and every social crawler that it *was* the
 * homepage. Routing all pages through one builder makes the canonical, the OG
 * URL and the Twitter card agree by construction.
 *
 * Australian defaults (`en_AU` locale, "XPDX Rentals" site name) are baked
 * in so no caller has to remember them.
 */
export function pageMetadata(input: {
  /** Clean, query-free path this page lives at. */
  path: string;
  title: string;
  description: string;
  /** Absolute or root-relative image; falls back to the site OG image. */
  image?: string | null;
  /** Set for utility pages that should stay out of the index. */
  noindex?: boolean;
  keywords?: string[];
  /**
   * Where this page's ranking signals should go, when that is not itself.
   *
   * Only ever set by the quality gate, to consolidate two URLs that would
   * otherwise compete for one intent. Defaults to `path` — a self-referencing
   * canonical, which is what every normal page wants.
   */
  canonicalPath?: string;
}): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.image || null;

  return {
    title: resolveTitle(input.title),
    description: input.description,
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    alternates: canonical(input.canonicalPath ?? input.path),
    ...(input.noindex
      ? // `follow` is deliberate: a page we do not want ranked is still a page
        // whose links should pass equity to the fleet. `nofollow` would strand
        // it. `max-image-preview` etc. are left at Google's defaults so an
        // indexable page is never quietly downgraded to a text-only result.
        { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : { robots: { index: true, follow: true } }),
    openGraph: {
      type: "website",
      locale: "en_AU",
      siteName: "XPDX Rentals",
      url,
      title: input.title,
      description: input.description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: input.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/**
 * Metadata for a programmatic page, straight from its registry entry.
 *
 * Every programmatic route uses this rather than hand-assembling a title and
 * hoping it agrees with the sitemap. Title, description, canonical and the
 * robots directive all come from the same object the gate ruled on, so a page
 * can never be noindexed by its own `<head>` while sitting in the sitemap —
 * the two read the same field.
 */
export function registryMetadata(page: SeoPage, image?: string | null): Metadata {
  return pageMetadata({
    path: page.path,
    canonicalPath: page.decision.canonicalPath,
    title: page.title,
    description: page.description,
    noindex: !page.decision.index,
    image: image ?? null,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
  });
}

/**
 * Metadata for a path the registry gated out.
 *
 * Such a route should already be 404ing via `dynamicParams = false`, but a
 * `generateMetadata` call can still run for one during a build race or a
 * stale-param request. Returning an indexable head for a page about to 404 is
 * how soft-404s enter an index, so this returns an explicit noindex.
 */
export function suppressedMetadata(path: string): Metadata {
  return pageMetadata({
    path,
    title: "Page not found | XPDX Rentals",
    description: "This page is not available.",
    noindex: true,
  });
}
