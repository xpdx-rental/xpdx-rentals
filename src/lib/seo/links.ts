import { getSeoRegistry, type SeoPage } from "@/lib/seo/registry";
import { SEO_SERVICES, findService } from "@/lib/seo/entities/services";
import { nearbyLocations, findLocation } from "@/lib/seo/entities/locations";
import { USE_CASES } from "@/lib/data/use-cases";

/**
 * The internal-link graph.
 *
 * Two rules, both of which exist because the obvious implementation is wrong:
 *
 *  1. NEVER LINK TO A PAGE THAT DOES NOT EXIST. Every link here is resolved
 *     against the registry and dropped if the target was gated out. The old
 *     `/locations/[slug]` pages linked to a `/locations` hub that was never
 *     built — a 404 in the breadcrumb trail and in the BreadcrumbList schema.
 *     Deriving links from the same list that decides what gets generated makes
 *     that class of bug unrepresentable.
 *
 *  2. NO LINK DUMPS. A footer listing all sixty URLs passes roughly no equity
 *     and reads as machine-generated. Each block below is capped and ordered
 *     by genuine relevance to the page it sits on — nearest suburbs first,
 *     related categories only.
 */

export type SeoLink = { href: string; label: string; sublabel?: string };

/** Links to pages the registry actually generated, in the order given. */
async function resolve(paths: { path: string; label: string; sublabel?: string }[]): Promise<SeoLink[]> {
  const registry = await getSeoRegistry();
  const live = new Map(registry.filter((p) => p.decision.generate).map((p) => [p.path, p]));

  return paths
    .filter((p) => live.has(p.path))
    .map((p) => ({ href: p.path, label: p.label, sublabel: p.sublabel }));
}

/** Vehicle categories — the money pages. Linked from almost everywhere. */
export async function serviceLinks(exclude?: string, limit = 6): Promise<SeoLink[]> {
  return (
    await resolve(
      SEO_SERVICES.filter((s) => s.slug !== exclude).map((s) => ({
        path: s.path,
        label: s.name,
        sublabel: s.primaryKeyword,
      })),
    )
  ).slice(0, limit);
}

/** Sibling categories declared as related — never the full list. */
export async function relatedServiceLinks(serviceSlug: string): Promise<SeoLink[]> {
  const service = findService(serviceSlug);
  if (!service) return [];

  return resolve(
    service.related
      .map((slug) => findService(slug))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ path: s.path, label: s.name })),
  );
}

/**
 * Nearest other suburbs, closest first.
 *
 * Computed from measured drive times (see `entities/locations.ts`), so the
 * block genuinely differs page to page instead of being the same alphabetical
 * list ten times over.
 */
export async function nearbyLocationLinks(slug: string, limit = 5): Promise<SeoLink[]> {
  return resolve(
    nearbyLocations(slug, limit).map((l) => ({
      path: `/van-hire/${l.slug}`,
      label: l.name,
      sublabel: l.driveMinutes != null ? `${l.driveMinutes} min from the yard` : undefined,
    })),
  );
}

/** All suburb pages, nearest first — for the `/van-hire` hub and the footer. */
export async function allLocationLinks(limit = 20): Promise<SeoLink[]> {
  const registry = await getSeoRegistry();
  return registry
    .filter((p) => p.kind === "location" && p.decision.generate)
    .map((p) => {
      const loc = findLocation(p.slug);
      return {
        href: p.path,
        label: loc?.name ?? p.slug,
        sublabel: loc?.driveMinutes != null ? `${loc.driveMinutes} min` : undefined,
        _sort: loc?.driveMinutes ?? 999,
      };
    })
    .sort((a, b) => a._sort - b._sort)
    .slice(0, limit)
    .map(({ href, label, sublabel }) => ({ href, label, sublabel }));
}

/**
 * Job-led pages. Only the ones the registry kept.
 *
 * Named `jobLinks` rather than `useCaseLinks` because ESLint's
 * `react-hooks/rules-of-hooks` treats any `use*` identifier as a hook and
 * rejects it inside an async Server Component — which is every caller here.
 */
export async function jobLinks(exclude?: string, limit = 6): Promise<SeoLink[]> {
  return (
    await resolve(
      USE_CASES.filter((u) => u.id !== exclude).map((u) => ({
        path: `/use-cases/${u.id}`,
        label: u.title,
      })),
    )
  ).slice(0, limit);
}

/** Categories a use case names as relevant. See the naming note on `jobLinks`. */
export async function jobServiceLinks(useCaseId: string): Promise<SeoLink[]> {
  const uc = USE_CASES.find((u) => u.id === useCaseId);
  if (!uc) return [];

  return resolve(
    uc.relatedServices
      .map((slug) => findService(slug))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ path: s.path, label: s.name })),
  );
}

/**
 * Pages whose gate decision is `index: false`.
 *
 * Useful when auditing: a noindex page still passes equity through its links
 * (`follow`), so it is worth knowing which pages are quietly doing that work.
 */
export async function noindexPages(): Promise<SeoPage[]> {
  const registry = await getSeoRegistry();
  return registry.filter((p) => p.decision.generate && !p.decision.index);
}
