import { Redis } from "ioredis";
import { getRedisClient } from "@/lib/security/rate-limit-redis";

/**
 * Shared read-through cache for public, non-transactional data.
 *
 * ── Scope ───────────────────────────────────────────────────────────────────
 * This cache is for data that is **safe to be a few minutes stale and identical
 * for every visitor**: the published fleet, site settings, opening hours,
 * approved testimonials. Nothing user-specific and nothing transactional ever
 * goes in here. Leads are written straight through to Postgres — a cache in
 * that path could only ever lose a lead.
 *
 * ── Why it shares the rate-limiter's client ─────────────────────────────────
 * The project had two Redis clients: `@upstash/redis` (REST, used here) and
 * `ioredis` (TCP, used by the rate limiter), configured from two different
 * environment variables. That meant two connection pools, two dependencies, two
 * sets of credentials to provision, and a deployment where `REDIS_URL` was set
 * but `UPSTASH_REDIS_REST_*` was not would silently run with no cache at all
 * while appearing configured. There is now one client and one `REDIS_URL`.
 *
 * ── Failure policy ──────────────────────────────────────────────────────────
 * The cache is strictly an optimisation. Every failure path — no client, a
 * timeout, a parse error, a dead server — falls through to the fetcher. A
 * Redis outage must degrade this site to "slower", never to "down". That is
 * also why every Redis call is wrapped in a short timeout: waiting 30 s on an
 * unreachable cache is worse than not having one.
 */

/** Redis must not be able to make a page slower than simply querying Postgres. */
const REDIS_TIMEOUT_MS = 250;

/**
 * Key namespace. The version segment is a global kill-switch: bump
 * `CACHE_VERSION` to invalidate everything at once after a schema or shape
 * change, without needing to enumerate keys or flush a shared Redis.
 */
const CACHE_VERSION = "v1";
const NAMESPACE = "xpdx";

export function cacheKey(...parts: (string | number)[]): string {
  return [NAMESPACE, CACHE_VERSION, ...parts].join(":");
}

/** Distinguishes "cached as null/empty" from "not in the cache". */
type Envelope<T> = { v: T };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

/**
 * In-process single-flight. Two concurrent requests for the same cold key on
 * the same instance share one database round-trip instead of racing — the
 * cheap half of stampede protection, and the half that matters most on a
 * serverless instance handling a burst.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Read-through cache.
 *
 * @param key         Already-namespaced key — build it with `cacheKey()`.
 * @param ttlSeconds  How long a value may be served without re-reading.
 * @param fetcher     The authoritative read. Always called on any cache miss
 *                    or any Redis failure.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis: Redis | null = getRedisClient();

  if (!redis) return fetcher();

  const raw = await withTimeout(redis.get(key), REDIS_TIMEOUT_MS);

  if (typeof raw === "string") {
    try {
      // The envelope is what makes falsy values cacheable. The previous
      // implementation returned the cached value only `if (cached)`, so a
      // legitimately empty result — `0`, `""`, `false` — was treated as a miss
      // and re-queried the database on every single request.
      const parsed = JSON.parse(raw) as Envelope<T>;
      if (parsed && typeof parsed === "object" && "v" in parsed) return parsed.v;
    } catch {
      // Corrupt or legacy-format entry — fall through and overwrite it.
    }
  }

  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = (async () => {
    try {
      const data = await fetcher();
      const envelope: Envelope<T> = { v: data };
      // Fire-and-forget: the caller is already able to return, and a slow
      // write must not be added to their latency.
      void withTimeout(
        redis.set(key, JSON.stringify(envelope), "EX", ttlSeconds),
        REDIS_TIMEOUT_MS,
      );
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Drops specific keys. Called from the admin Server Actions that change the
 * underlying data, so an operator's edit is live immediately rather than up to
 * a full TTL later.
 *
 * Best-effort by design: a failed invalidation means stale-until-TTL, which is
 * the pre-existing behaviour and is never worth failing an admin save over.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const redis = getRedisClient();
  if (!redis) return;
  // Also clear any in-process single-flight entry, so a request that is
  // mid-fetch on this instance does not immediately re-populate the old value.
  for (const key of keys) inFlight.delete(key);
  await withTimeout(redis.del(...keys), REDIS_TIMEOUT_MS);
}
