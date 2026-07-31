import { describe, it, expect } from 'vitest';

import { sanitizeInviteCode, isInviteCodeShaped, INVITE_CODE_LENGTH } from '@/lib/invite-code';

describe('sanitizeInviteCode — accepted', () => {
  it('accepts a canonical uppercase alphanumeric code', () => {
    expect(sanitizeInviteCode('RBO246')).toBe('RBO246');
  });

  it('accepts an all-digit code', () => {
    expect(sanitizeInviteCode('123456')).toBe('123456');
  });

  it('accepts an all-letter code', () => {
    expect(sanitizeInviteCode('ABCDEF')).toBe('ABCDEF');
  });

  it('upper-cases a lowercase code', () => {
    expect(sanitizeInviteCode('rbo246')).toBe('RBO246');
  });

  it('upper-cases a mixed-case code', () => {
    expect(sanitizeInviteCode('rBo2G6')).toBe('RBO2G6');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeInviteCode('  RBO246  ')).toBe('RBO246');
  });

  it('trims a trailing newline', () => {
    expect(sanitizeInviteCode('RBO246\n')).toBe('RBO246');
  });
});

describe('sanitizeInviteCode — rejected', () => {
  const rejected: ReadonlyArray<[string, string | undefined | null]> = [
    ['undefined', undefined],
    ['null', null],
    ['empty string', ''],
    ['whitespace only', '   '],
    ['too short (5)', 'RBO24'],
    ['too long (7)', 'RBO2467'],
    ['hyphen separator', 'RBO-24'],
    ['underscore', 'RBO_24'],
    ['inner whitespace', 'RBO 24'],
    ['path traversal', '../../a'],
    ['slash', 'RBO/24'],
    ['percent escape', 'RB%246'],
    ['angle brackets', '<b>abc'],
    ['script fragment', '<script'],
    ['sql-ish quote', "RBO'46"],
    ['embedded null byte', 'RBO24\u0000'],
    ['non-ascii digits', '１２３４５６'],
    ['cyrillic lookalikes', 'АВС123'],
    ['emoji', '🚗🚗🚗🚗🚗🚗'],
    ['accented letters', 'RBÓ246'],
    ['newline injection', 'RBO24\nX'],
    ['query fragment', 'RBO24?'],
  ];

  it.each(rejected)('rejects %s', (_label, input) => {
    expect(sanitizeInviteCode(input)).toBeNull();
  });

  it('rejects a non-string value at runtime', () => {
    // Route params are untrusted; guard against a non-string slipping through.
    expect(sanitizeInviteCode(42 as unknown as string)).toBeNull();
  });
});

describe('sanitizeInviteCode — invariants', () => {
  it('returns a value of exactly INVITE_CODE_LENGTH characters when accepted', () => {
    const result = sanitizeInviteCode('rbo246');
    expect(result).not.toBeNull();
    expect(result).toHaveLength(INVITE_CODE_LENGTH);
  });

  it('is idempotent', () => {
    const once = sanitizeInviteCode('rbo246');
    expect(sanitizeInviteCode(once)).toBe(once);
  });

  it('never returns a string outside the [A-Z0-9] alphabet', () => {
    const inputs = ['rbo246', 'RBO246', ' abc123 ', 'ZZ9999'];
    for (const input of inputs) {
      const result = sanitizeInviteCode(input);
      expect(result).toMatch(/^[A-Z0-9]{6}$/);
    }
  });
});

/**
 * The URL-shape gate the lockdown asks before letting a `/join/…` request reach
 * the invite page at all. Stricter than the sanitizer in one direction — no
 * trimming, because a URL segment is taken exactly as written — and looser in
 * none.
 */
describe('isInviteCodeShaped — accepted', () => {
  const accepted = ['RBO246', 'rbo246', 'rBo2G6', '123456', 'ABCDEF', 'abcdef', 'ZZZZZZ', '000000'];

  it.each(accepted)('accepts %s', (segment) => {
    expect(isInviteCodeShaped(segment)).toBe(true);
  });

  it('accepts either case — a link is not the sender’s to case', () => {
    expect(isInviteCodeShaped('rbo246')).toBe(isInviteCodeShaped('RBO246'));
  });
});

describe('isInviteCodeShaped — rejected', () => {
  const rejected: ReadonlyArray<[string, string | undefined | null]> = [
    ['undefined', undefined],
    ['null', null],
    ['empty string', ''],
    ['whitespace only', '      '],
    ['too short (4) — the reported case', '1234'],
    ['too short (5)', 'RBO24'],
    ['too long (7)', 'RBO2467'],
    ['hyphen separator', 'RBO-24'],
    ['underscore', 'RBO_24'],
    ['inner whitespace', 'RBO 24'],
    ['leading whitespace', ' RBO246'],
    ['trailing whitespace', 'RBO246 '],
    ['trailing newline', 'RBO246\n'],
    ['path traversal', '../../a'],
    ['slash', 'RBO/24'],
    ['nested path', 'RBO246/extra'],
    ['percent escape', 'RB%246'],
    ['percent-encoded space', 'RBO246%20'],
    ['angle brackets', '<b>abc'],
    ['script fragment', '<script'],
    ['sql-ish quote', "RBO'46"],
    ['embedded null byte', 'RBO24\u0000'],
    ['non-ascii digits', '１２３４５６'],
    ['cyrillic lookalikes', 'АВС123'],
    ['emoji', '🚗🚗🚗🚗🚗🚗'],
    ['accented letters', 'RBÓ246'],
    ['newline injection', 'RBO24\nX'],
    ['query fragment', 'RBO24?'],
  ];

  it.each(rejected)('rejects %s', (_label, segment) => {
    expect(isInviteCodeShaped(segment)).toBe(false);
  });

  it('rejects a non-string value at runtime', () => {
    expect(isInviteCodeShaped(42 as unknown as string)).toBe(false);
  });
});

/**
 * Two different questions, and the gap between them is deliberate: the gate
 * reads a URL, the sanitizer reads a value the page is about to render.
 */
describe('isInviteCodeShaped vs sanitizeInviteCode', () => {
  it('agrees with the sanitizer on anything a link can actually carry', () => {
    for (const segment of ['RBO246', 'rbo246', '123456', 'RBO24', 'RBO-24', '1234', '']) {
      expect(isInviteCodeShaped(segment)).toBe(sanitizeInviteCode(segment) !== null);
    }
  });

  it('is stricter about padding, which a URL segment should not have', () => {
    expect(sanitizeInviteCode(' RBO246 ')).toBe('RBO246');
    expect(isInviteCodeShaped(' RBO246 ')).toBe(false);
  });

  it('says nothing about whether the code exists — neither of them does', () => {
    expect(isInviteCodeShaped('ZZZZZZ')).toBe(true);
    expect(sanitizeInviteCode('ZZZZZZ')).toBe('ZZZZZZ');
  });
});
