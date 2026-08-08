/** Validates that a redirect target is a safe same-origin relative path. */
export function isSafeRedirectPath(next: string): boolean {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return false;
  if (next.includes(":")) return false;
  return true;
}

/** The staff admin panel — the only authenticated zone on the site. */
export function isAdminZone(path: string): boolean {
  return path.startsWith("/admin") && !path.startsWith("/admin-login");
}

/**
 * URL prefixes owned by the programmatic SEO engine.
 *
 * A literal list rather than something derived from the SEO registry: the
 * proxy runs on every request, and importing the registry would drag
 * `getPublicVans` — and a Supabase client with it — into the edge bundle to
 * answer a question that is pure string matching.
 */
export const PROGRAMMATIC_PREFIXES = ["/van-hire/", "/use-cases/", "/vans/"] as const;

/**
 * Should this path be 301'd to its lowercase form?
 *
 * Mixed-case URLs are the classic duplicate-content source on a programmatic
 * estate: `/Van-Hire/Bankstown` from a hand-typed link or a careless CMS export
 * resolves in Next but is a distinct URL to Google.
 *
 * Extracted from `proxy.ts` so it can be tested — the previous inline version
 * had a bug that a unit test would have caught immediately: it ran
 * `startsWith` against the RAW path, so `/Van-Hire/Bankstown`, the exact URL
 * the rule exists to fix, failed the prefix check and 404'd. Only casing
 * variation AFTER the prefix was ever caught. The prefix test must run on the
 * lowercased path.
 */
export function canonicalLowercasePath(path: string): string | null {
  const lowercase = path.toLowerCase();
  if (path === lowercase) return null;
  if (!PROGRAMMATIC_PREFIXES.some((prefix) => lowercase.startsWith(prefix))) return null;
  return lowercase;
}
