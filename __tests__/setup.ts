/**
 * Vitest global test setup.
 * Extends expect with jest-dom matchers for DOM assertions.
 *
 * Sets a deterministic ENCRYPTION_KEY so any test that exercises code
 * paths through `@/lib/cryptox` or the dual-write helpers in
 * `@/lib/account-encryption` / `@/lib/vehicle-gps-encryption` works
 * without each test having to stub the env. Tests that mutate the key
 * in beforeEach still take precedence — this is the default.
 */
import { Buffer } from 'node:buffer';

import '@testing-library/jest-dom/vitest';

if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 0x11).toString('base64');
}
