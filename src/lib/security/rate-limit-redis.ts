import { Redis } from "ioredis";
import { optionalEnv } from "@/lib/config";

let redisClient: Redis | null = null;
let warnedMissingRedisInProd = false;

export function getRedisClient(): Redis | null {
  const redisUrl = optionalEnv("REDIS_URL");

  if (!redisUrl) {
    // In production, per-instance in-memory rate limiting is NOT reliable on
    // serverless/multi-instance deployments. Warn loudly (once) so this is
    // visible in logs/monitoring instead of silently degrading abuse limits.
    if (process.env.NODE_ENV === "production" && !warnedMissingRedisInProd) {
      warnedMissingRedisInProd = true;
      console.error(
        "[rate-limit] REDIS_URL is not set in production. Falling back to " +
          "per-instance in-memory rate limiting, which does NOT enforce limits " +
          "across serverless instances. Configure REDIS_URL to restore " +
          "distributed rate limiting for leads, contact, and webhook endpoints.",
      );
    }
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }

  return redisClient;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Sliding window rate limiting using Redis sorted sets.
 * More accurate than fixed windows and prevents burst attacks at window boundaries.
 */
export async function rateLimitSlidingWindow(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  // Fallback to in-memory if Redis unavailable
  if (!redis) {
    return fallbackSlidingWindow(key, limit, windowMs);
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  // ── Why this is a Lua script and not a pipeline ────────────────────────────
  //
  // Two bugs in the pipeline version this replaces:
  //
  //  1. **It recorded rejected requests.** `zadd` ran unconditionally, so every
  //     blocked attempt pushed a fresh timestamp into the window. An attacker
  //     hammering the endpoint kept their own window permanently full — which
  //     sounds like a feature until you notice it applies identically to a
  //     legitimate customer who tripped the limit once and now cannot get
  //     back in for as long as they keep retrying. It also meant unbounded
  //     writes to Redis under exactly the load where you least want them.
  //  2. **It was not atomic.** A pipeline is one round trip, not one
  //     transaction: with two instances serving the same key, both could read
  //     `zcard` before either wrote, and both would allow.
  //
  // The script also returns the true oldest entry, so `Retry-After` tells the
  // caller when a slot actually frees up rather than always claiming a full
  // window.
  const script = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local window_start = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local window_ms = tonumber(ARGV[4])
    local member = ARGV[5]

    redis.call('zremrangebyscore', key, '-inf', window_start)
    local count = redis.call('zcard', key)

    if count < limit then
      redis.call('zadd', key, now, member)
      redis.call('pexpire', key, window_ms)
      return {1, count + 1, 0}
    end

    -- Denied: do NOT add an entry. Report when the oldest one ages out.
    redis.call('pexpire', key, window_ms)
    local oldest = redis.call('zrange', key, 0, 0, 'WITHSCORES')
    local retry_ms = window_ms
    if oldest[2] then
      retry_ms = (tonumber(oldest[2]) + window_ms) - now
      if retry_ms < 0 then retry_ms = 0 end
    end
    return {0, count, retry_ms}
  `;

  let allowed: boolean;
  let count: number;
  let retryMs: number;

  try {
    const result = (await redis.eval(
      script,
      1,
      redisKey,
      now,
      windowStart,
      limit,
      windowMs,
      // Collision-resistant member id. Two requests landing in the same
      // millisecond must not overwrite each other in the sorted set.
      `${now}:${Math.random().toString(36).slice(2)}`,
    )) as [number, number, number];

    [allowed, count, retryMs] = [result[0] === 1, result[1], result[2]];
  } catch {
    // A Redis failure must not take down the enquiry endpoint. Degrade to the
    // per-instance limiter, which is weaker but still bounds a single burst.
    return fallbackSlidingWindow(key, limit, windowMs);
  }

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt: new Date(now + (allowed ? windowMs : retryMs)),
    retryAfter: allowed ? undefined : Math.max(1, Math.ceil(retryMs / 1000)),
  };
}

/**
 * Fixed window rate limiting using Redis INCR with expiry.
 * Simpler but less accurate at window boundaries.
 */
export async function rateLimitFixedWindow(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  // Fallback to in-memory if Redis unavailable
  if (!redis) {
    return fallbackFixedWindow(key, limit, windowMs);
  }

  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const redisKey = `ratelimit:fixed:${key}:${windowKey}`;
  const resetAt = new Date((windowKey + 1) * windowMs);

  const current = await redis.incr(redisKey);

  if (current === 1) {
    // First request in this window, set expiry
    await redis.pexpire(redisKey, windowMs);
  }

  const allowed = current <= limit;
  const remaining = Math.max(0, limit - current);

  return {
    allowed,
    limit,
    remaining,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil((resetAt.getTime() - now) / 1000),
  };
}

// In-memory fallback implementations
const slidingWindows = new Map<string, number[]>();
const fixedWindows = new Map<string, { count: number; resetAt: number }>();

function fallbackSlidingWindow(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const resetAt = new Date(now + windowMs);

  const timestamps = slidingWindows.get(key) ?? [];

  // Remove old entries
  const validTimestamps = timestamps.filter((t) => t > windowStart);

  const currentCount = validTimestamps.length;
  const allowed = currentCount < limit;

  if (allowed) {
    validTimestamps.push(now);
  }

  slidingWindows.set(key, validTimestamps);

  // Cleanup old keys periodically
  if (Math.random() < 0.01) {
    cleanupOldSlidingWindows();
  }

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - validTimestamps.length),
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil((resetAt.getTime() - now) / 1000),
  };
}

function cleanupOldSlidingWindows() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  for (const [key, timestamps] of slidingWindows.entries()) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      slidingWindows.delete(key);
    } else {
      slidingWindows.set(key, valid);
    }
  }
}

function fallbackFixedWindow(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const mapKey = `${key}:${windowKey}`;

  let entry = fixedWindows.get(mapKey);

  if (!entry) {
    entry = { count: 0, resetAt: (windowKey + 1) * windowMs };
    fixedWindows.set(mapKey, entry);
  }

  entry.count++;

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  // Cleanup old windows periodically
  if (Math.random() < 0.01) {
    cleanupOldFixedWindows(windowKey - 10);
  }

  return {
    allowed,
    limit,
    remaining,
    resetAt: new Date(entry.resetAt),
    retryAfter: allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000),
  };
}

function cleanupOldFixedWindows(minWindow: number) {
  for (const [key] of fixedWindows.entries()) {
    const windowNum = parseInt(key.split(":").pop() ?? "0");
    if (windowNum < minWindow) {
      fixedWindows.delete(key);
    }
  }
}

/**
 * Token bucket rate limiting for burst handling.
 * Good for APIs where you want to allow bursts but maintain average rate.
 */
export async function rateLimitTokenBucket(
  key: string,
  capacity: number,
  refillRate: number, // tokens per second
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    // Fallback to in-memory token bucket
    return fallbackTokenBucket(key, capacity, refillRate);
  }

  const now = Date.now();
  const bucketKey = `ratelimit:bucket:${key}`;

  const luaScript = `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refill_rate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    
    local bucket = redis.call('hmget', key, 'tokens', 'last_refill')
    local tokens = tonumber(bucket[1]) or capacity
    local last_refill = tonumber(bucket[2]) or now
    
    local elapsed = (now - last_refill) / 1000
    local refill = math.floor(elapsed * refill_rate)
    tokens = math.min(capacity, tokens + refill)
    
    local allowed = tokens >= 1
    if allowed then
      tokens = tokens - 1
    end
    
    redis.call('hmset', key, 'tokens', tokens, 'last_refill', now)
    redis.call('expire', key, 3600)
    
    return {allowed and 1 or 0, tokens, capacity}
  `;

  const result = await redis.eval(
    luaScript,
    1,
    bucketKey,
    capacity,
    refillRate,
    now,
  );

  const [allowedNum, tokens, limit] = result as [number, number, number];
  const allowed = allowedNum === 1;

  // Calculate reset time based on how long to refill one token
  const resetMs = Math.ceil((1 / refillRate) * 1000);

  return {
    allowed,
    limit,
    remaining: tokens,
    resetAt: new Date(now + resetMs),
    retryAfter: allowed ? undefined : Math.ceil(resetMs / 1000),
  };
}

const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function fallbackTokenBucket(key: string, capacity: number, refillRate: number): RateLimitResult {
  const now = Date.now();

  let bucket = tokenBuckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    tokenBuckets.set(key, bucket);
  }

  // Refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refill = Math.floor(elapsed * refillRate);
  bucket.tokens = Math.min(capacity, bucket.tokens + refill);
  bucket.lastRefill = now;

  // Check if request allowed
  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens--;
  }

  const resetMs = Math.ceil((1 / refillRate) * 1000);

  // Cleanup old buckets periodically
  if (Math.random() < 0.001) {
    cleanupOldTokenBuckets(now - 24 * 60 * 60 * 1000);
  }

  return {
    allowed,
    limit: capacity,
    remaining: bucket.tokens,
    resetAt: new Date(now + resetMs),
    retryAfter: allowed ? undefined : Math.ceil(resetMs / 1000),
  };
}

function cleanupOldTokenBuckets(cutoff: number) {
  for (const [key, bucket] of tokenBuckets.entries()) {
    if (bucket.lastRefill < cutoff) {
      tokenBuckets.delete(key);
    }
  }
}
