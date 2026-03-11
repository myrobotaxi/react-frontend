import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSet = vi.fn();
const mockHeadersGet = vi.fn();

vi.mock('next/headers', async () => ({
  cookies: vi.fn(async () => ({ set: mockSet })),
  headers: vi.fn(async () => ({ get: mockHeadersGet })),
}));

import { validateBetaPassword } from '@/features/auth/api/validate-beta-password';

describe('validateBetaPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeadersGet.mockReturnValue('192.168.1.1');
    process.env.BETA_ACCESS_PASSWORD = 'test-beta-secret';
  });

  it('returns success and sets cookie for correct password', async () => {
    const result = await validateBetaPassword('test-beta-secret');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockSet).toHaveBeenCalledWith(
      'beta-access',
      'granted',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
  });

  it('returns error for wrong password', async () => {
    const result = await validateBetaPassword('wrong-password');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid access code');
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('returns error for empty password', async () => {
    const result = await validateBetaPassword('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid access code');
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('returns error when env var is not set', async () => {
    delete process.env.BETA_ACCESS_PASSWORD;

    const result = await validateBetaPassword('anything');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid access code');
  });

  it('rate limits after 5 failed attempts', async () => {
    // Use a unique IP to avoid pollution from other tests
    mockHeadersGet.mockReturnValue('10.0.0.99');

    for (let i = 0; i < 5; i++) {
      await validateBetaPassword('wrong');
    }

    const result = await validateBetaPassword('wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many attempts. Try again later.');
  });

  it('extracts first IP from x-forwarded-for header', async () => {
    mockHeadersGet.mockReturnValue('1.2.3.4, 5.6.7.8');

    const result = await validateBetaPassword('test-beta-secret');
    expect(result.success).toBe(true);
  });
});
