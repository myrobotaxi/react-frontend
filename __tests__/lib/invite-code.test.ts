import { describe, it, expect } from 'vitest';

import { sanitizeInviteCode, INVITE_CODE_LENGTH } from '@/lib/invite-code';

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
