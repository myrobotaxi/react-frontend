/**
 * Simple in-memory rate limiter for serverless environments.
 * Resets on cold start — acceptable for beta gate deterrence.
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiter {
  check: (key: string) => RateLimitResult;
  reset: (key: string) => void;
}

/**
 * Creates a rate limiter with the given config.
 * Stale entries are cleaned on each check call.
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const store = new Map<string, RateLimitEntry>();

  function cleanStale(now: number) {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }

  function check(key: string): RateLimitResult {
    const now = Date.now();
    cleanStale(now);

    const entry = store.get(key);

    if (!entry) {
      store.set(key, { count: 1, resetAt: now + config.windowMs });
      return { allowed: true, remaining: config.maxAttempts - 1, retryAfterMs: 0 };
    }

    if (entry.count >= config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.resetAt - now,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: config.maxAttempts - entry.count,
      retryAfterMs: 0,
    };
  }

  function reset(key: string) {
    store.delete(key);
  }

  return { check, reset };
}
