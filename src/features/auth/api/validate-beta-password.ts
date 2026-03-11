'use server';

import { timingSafeEqual } from 'crypto';

import { cookies, headers } from 'next/headers';

import {
  BETA_COOKIE_NAME,
  BETA_COOKIE_VALUE,
  BETA_COOKIE_MAX_AGE,
} from '@/lib/beta-gate';
import { createRateLimiter } from '@/lib/rate-limit';

interface ValidateBetaResult {
  success: boolean;
  error?: string;
}

const rateLimiter = createRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

/**
 * Validates the beta access password and sets an httpOnly cookie on success.
 * Rate-limited to 5 attempts per IP per 15-minute window.
 */
export async function validateBetaPassword(
  password: string,
): Promise<ValidateBetaResult> {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const limit = rateLimiter.check(ip);
  if (!limit.allowed) {
    return { success: false, error: 'Too many attempts. Try again later.' };
  }

  const expected = process.env.BETA_ACCESS_PASSWORD;
  if (!expected) {
    return { success: false, error: 'Invalid access code' };
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { success: false, error: 'Invalid access code' };
  }

  const cookieStore = await cookies();
  cookieStore.set(BETA_COOKIE_NAME, BETA_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: BETA_COOKIE_MAX_AGE,
    path: '/',
  });

  return { success: true };
}
