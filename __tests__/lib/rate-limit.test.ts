import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to maxAttempts', () => {
    const limiter = createRateLimiter({ maxAttempts: 3, windowMs: 60_000 });

    expect(limiter.check('ip1').allowed).toBe(true);
    expect(limiter.check('ip1').allowed).toBe(true);
    expect(limiter.check('ip1').allowed).toBe(true);
    expect(limiter.check('ip1').allowed).toBe(false);
  });

  it('tracks remaining attempts', () => {
    const limiter = createRateLimiter({ maxAttempts: 3, windowMs: 60_000 });

    expect(limiter.check('ip1').remaining).toBe(2);
    expect(limiter.check('ip1').remaining).toBe(1);
    expect(limiter.check('ip1').remaining).toBe(0);
  });

  it('blocks after limit with retryAfterMs', () => {
    const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 60_000 });

    limiter.check('ip1');
    limiter.check('ip1');
    const result = limiter.check('ip1');

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  it('resets after window expires', () => {
    const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 60_000 });

    limiter.check('ip1');
    limiter.check('ip1');
    expect(limiter.check('ip1').allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(limiter.check('ip1').allowed).toBe(true);
  });

  it('tracks separate keys independently', () => {
    const limiter = createRateLimiter({ maxAttempts: 1, windowMs: 60_000 });

    limiter.check('ip1');
    expect(limiter.check('ip1').allowed).toBe(false);
    expect(limiter.check('ip2').allowed).toBe(true);
  });

  it('reset() clears a specific key', () => {
    const limiter = createRateLimiter({ maxAttempts: 1, windowMs: 60_000 });

    limiter.check('ip1');
    expect(limiter.check('ip1').allowed).toBe(false);

    limiter.reset('ip1');
    expect(limiter.check('ip1').allowed).toBe(true);
  });
});
