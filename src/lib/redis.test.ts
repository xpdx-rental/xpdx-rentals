import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The cache is an optimisation, never a source of truth. These tests pin the
 * two properties that make that safe:
 *
 *   1. **Every Redis failure falls through to the fetcher.** A cache outage
 *      degrades the site to "slower", never to "down" or "wrong".
 *   2. **Falsy values round-trip.** The previous implementation returned the
 *      cached value only `if (cached)`, so an empty fleet, a `0` or a `false`
 *      was indistinguishable from a miss and re-queried Postgres on every
 *      single request — the exact load a cache exists to remove.
 */

const getRedisClient = vi.fn();

vi.mock("@/lib/security/rate-limit-redis", () => ({
  getRedisClient: () => getRedisClient(),
}));

type FakeRedis = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

function fakeRedis(over: Partial<FakeRedis> = {}): FakeRedis {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
      return "OK";
    }),
    del: vi.fn(async (...keys: string[]) => {
      let n = 0;
      for (const k of keys) if (store.delete(k)) n++;
      return n;
    }),
    ...over,
  };
}

let withCache: typeof import("@/lib/redis").withCache;
let invalidateCache: typeof import("@/lib/redis").invalidateCache;
let cacheKey: typeof import("@/lib/redis").cacheKey;

beforeEach(async () => {
  vi.resetModules();
  getRedisClient.mockReset();
  const mod = await import("@/lib/redis");
  withCache = mod.withCache;
  invalidateCache = mod.invalidateCache;
  cacheKey = mod.cacheKey;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("cacheKey", () => {
  it("namespaces and versions every key", () => {
    // The version segment is the global kill-switch: bumping it invalidates
    // everything without enumerating keys or flushing a shared Redis.
    expect(cacheKey("vans", "public-list")).toBe("xpdx:v1:vans:public-list");
  });
});

describe("withCache without Redis configured", () => {
  it("calls the fetcher directly", async () => {
    getRedisClient.mockReturnValue(null);
    const fetcher = vi.fn(async () => ["a"]);

    expect(await withCache("k", 60, fetcher)).toEqual(["a"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("withCache with Redis", () => {
  it("populates on a miss and serves from the cache on a hit", async () => {
    const redis = fakeRedis();
    getRedisClient.mockReturnValue(redis);
    const fetcher = vi.fn(async () => ({ vans: 6 }));

    expect(await withCache("k1", 60, fetcher)).toEqual({ vans: 6 });
    expect(await withCache("k1", 60, fetcher)).toEqual({ vans: 6 });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["an empty array", [] as unknown],
    ["zero", 0 as unknown],
    ["an empty string", "" as unknown],
    ["false", false as unknown],
    ["null", null as unknown],
  ])("caches %s instead of treating it as a miss", async (_label, value) => {
    const redis = fakeRedis();
    getRedisClient.mockReturnValue(redis);
    const fetcher = vi.fn(async () => value);

    expect(await withCache("falsy", 60, fetcher)).toEqual(value);
    expect(await withCache("falsy", 60, fetcher)).toEqual(value);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("falls through to the fetcher when GET rejects", async () => {
    const redis = fakeRedis({
      get: vi.fn(async () => {
        throw new Error("connection reset");
      }),
    });
    getRedisClient.mockReturnValue(redis);
    const fetcher = vi.fn(async () => "fresh");

    expect(await withCache("k2", 60, fetcher)).toBe("fresh");
  });

  it("still returns data when SET rejects", async () => {
    const redis = fakeRedis({
      set: vi.fn(async () => {
        throw new Error("read only replica");
      }),
    });
    getRedisClient.mockReturnValue(redis);

    expect(await withCache("k3", 60, async () => "fresh")).toBe("fresh");
  });

  it("overwrites a corrupt entry rather than throwing", async () => {
    const redis = fakeRedis({ get: vi.fn(async () => "{not json") });
    getRedisClient.mockReturnValue(redis);
    const fetcher = vi.fn(async () => "recovered");

    expect(await withCache("k4", 60, fetcher)).toBe("recovered");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("collapses concurrent misses on the same key into one fetch", async () => {
    const redis = fakeRedis();
    getRedisClient.mockReturnValue(redis);

    let release!: (v: string) => void;
    const pending = new Promise<string>((r) => {
      release = r;
    });
    const fetcher = vi.fn(() => pending);

    // Both start before either can populate the cache — without single-flight
    // this is two database round-trips for one cold key.
    const a = withCache("stampede", 60, fetcher);
    const b = withCache("stampede", 60, fetcher);

    // `withCache` awaits the Redis GET before it reaches the single-flight map,
    // so the fetcher has not been reached yet at this point. Wait for the first
    // call rather than releasing into an empty queue.
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalled());
    release("once");

    expect(await a).toBe("once");
    expect(await b).toBe("once");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("invalidateCache", () => {
  it("deletes the given keys so the next read re-fetches", async () => {
    const redis = fakeRedis();
    getRedisClient.mockReturnValue(redis);
    const fetcher = vi.fn(async () => "v1");

    await withCache("price", 3600, fetcher);
    await invalidateCache("price");
    await withCache("price", 3600, fetcher);

    // This is what makes an operator's price edit visible immediately rather
    // than up to a full TTL later.
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(redis.del).toHaveBeenCalledWith("price");
  });

  it("is a no-op with no keys, and never throws without Redis", async () => {
    getRedisClient.mockReturnValue(null);
    await expect(invalidateCache()).resolves.toBeUndefined();
    await expect(invalidateCache("a", "b")).resolves.toBeUndefined();
  });

  it("does not throw when DEL rejects", async () => {
    const redis = fakeRedis({
      del: vi.fn(async () => {
        throw new Error("down");
      }),
    });
    getRedisClient.mockReturnValue(redis);

    // An admin save must never fail because a cache eviction did.
    await expect(invalidateCache("x")).resolves.toBeUndefined();
  });
});
