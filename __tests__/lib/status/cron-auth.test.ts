import { describe, expect, it } from 'vitest';

import { isAuthorizedCronRequest } from '@/lib/status/cron-auth';

const SECRET = 'a-long-enough-cron-secret-value';

describe('isAuthorizedCronRequest', () => {
  it('accepts the header Vercel Cron sends', () => {
    expect(isAuthorizedCronRequest(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it('refuses everything when no secret is configured', () => {
    expect(isAuthorizedCronRequest(`Bearer ${SECRET}`, undefined)).toBe(false);
    expect(isAuthorizedCronRequest('Bearer anything', '')).toBe(false);
  });

  it('refuses a request with no Authorization header', () => {
    expect(isAuthorizedCronRequest(null, SECRET)).toBe(false);
    expect(isAuthorizedCronRequest('', SECRET)).toBe(false);
  });

  it('refuses a wrong secret of the same length', () => {
    const sameLength = `${SECRET.slice(0, -1)}X`;
    expect(isAuthorizedCronRequest(`Bearer ${sameLength}`, SECRET)).toBe(false);
  });

  it('refuses the bare secret without the scheme, and the wrong scheme', () => {
    expect(isAuthorizedCronRequest(SECRET, SECRET)).toBe(false);
    expect(isAuthorizedCronRequest(`Basic ${SECRET}`, SECRET)).toBe(false);
  });

  it('is not fooled by a prefix or by trailing whitespace', () => {
    expect(isAuthorizedCronRequest('Bearer a', SECRET)).toBe(false);
    expect(isAuthorizedCronRequest(`Bearer ${SECRET} `, SECRET)).toBe(false);
  });
});
