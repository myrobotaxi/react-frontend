import { describe, it, expect } from 'vitest';

import {
  buildInviteSignaturePayload,
  parseInviteSignatureParam,
  verifyInviteLink,
  INVITE_LINK_PUBLIC_KEY_B64,
  INVITE_LINK_KEY_ID,
} from '@/lib/invite-signature';

/**
 * MYR-368 — the check that separates a link this project minted from one
 * somebody typed.
 *
 * Everything below runs against the TEST key, never the production one: these
 * are reference vectors published with the ticket, produced by a throwaway seed
 * so a test file never has to hold anything that can sign a real invite. The
 * production constant is asserted on separately, for what it IS rather than for
 * what it verifies — nothing here can sign against it, which is the point.
 */
const TEST_PUBLIC_KEY_B64 = 'A6EHv/POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg=';

/** Reference vector: `join:RBO246:1785942245:Alex:Mira`. */
const NAMED = {
  code: 'RBO246',
  expUnix: 1785942245,
  from: 'Alex',
  to: 'Mira',
  sig: 'fPkcqmLr2p_HezqZtbP6J1NC-jQA0nAOp7hiFqTKZHo9L2YGVkNDx162VsdromPEMSZaMvMhxRCBS_xfaRw0BQ',
};

/** Reference vector: `join:RBO246:1785942245::` — both names absent. */
const UNNAMED = {
  code: 'RBO246',
  expUnix: 1785942245,
  sig: 'JU4pQwQScc54t74e2jh9DNLP6xEYYHDcpPFWBqew-XietZmR2OIxtfN_5Eiqk1E1WmJrJDxGFXMHGC99OCOlCA',
};

/** Well before either vector's expiry, so the clock never decides a result. */
const BEFORE_EXPIRY = NAMED.expUnix - 86_400;

function k(expUnix: number, sig: string, keyId = INVITE_LINK_KEY_ID): string {
  return `${keyId}.${expUnix}.${sig}`;
}

/** Judge a link against the test key at a fixed instant. */
function verify(
  input: Parameters<typeof verifyInviteLink>[0],
  nowUnix = BEFORE_EXPIRY,
): Promise<boolean> {
  return verifyInviteLink(input, { nowUnix, publicKeyB64: TEST_PUBLIC_KEY_B64 });
}

describe('buildInviteSignaturePayload', () => {
  /**
   * Five fields, four colons, always. An absent name is an EMPTY FIELD rather
   * than a dropped one — otherwise `from=Alex` with no `to` and `to=Alex` with
   * no `from` would produce the same bytes, and one signature would cover both.
   */
  it('emits five colon-separated fields whether or not the names are present', () => {
    expect(buildInviteSignaturePayload('RBO246', 1785942245, 'Alex', 'Mira')).toBe(
      'join:RBO246:1785942245:Alex:Mira',
    );
    expect(buildInviteSignaturePayload('RBO246', 1785942245, '', '')).toBe(
      'join:RBO246:1785942245::',
    );
    expect(buildInviteSignaturePayload('RBO246', 1785942245, 'Alex', '')).toBe(
      'join:RBO246:1785942245:Alex:',
    );
    expect(buildInviteSignaturePayload('RBO246', 1785942245, '', 'Mira')).toBe(
      'join:RBO246:1785942245::Mira',
    );
  });

  it('never collides across the name positions', () => {
    expect(buildInviteSignaturePayload('RBO246', 1, 'Alex', '')).not.toBe(
      buildInviteSignaturePayload('RBO246', 1, '', 'Alex'),
    );
  });
});

describe('parseInviteSignatureParam', () => {
  it('splits a well-formed parameter into its three fields', () => {
    const parsed = parseInviteSignatureParam(k(NAMED.expUnix, NAMED.sig));

    expect(parsed?.keyId).toBe('1');
    expect(parsed?.expUnix).toBe(NAMED.expUnix);
    expect(parsed?.signature).toHaveLength(64);
  });

  /** Structure only — anything that is not exactly three fields is nothing. */
  const MALFORMED: ReadonlyArray<readonly [string, string | string[] | undefined | null]> = [
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['one field', NAMED.sig],
    ['two fields', `1.${NAMED.expUnix}`],
    ['four fields', `1.${NAMED.expUnix}.${NAMED.sig}.extra`],
    ['non-numeric expiry', `1.later.${NAMED.sig}`],
    ['negative expiry', `1.-1.${NAMED.sig}`],
    ['truncated signature', `1.${NAMED.expUnix}.${NAMED.sig.slice(0, 40)}`],
    ['standard-base64 signature', `1.${NAMED.expUnix}.${NAMED.sig.replace(/-/g, '+')}=`],
    ['repeated parameter', [k(NAMED.expUnix, NAMED.sig), k(NAMED.expUnix, NAMED.sig)]],
  ];

  for (const [label, raw] of MALFORMED) {
    it(`rejects ${label}`, () => {
      expect(parseInviteSignatureParam(raw)).toBeNull();
    });
  }
});

describe('verifyInviteLink — the reference vectors', () => {
  it('accepts the signed link with both names', async () => {
    expect(
      await verify({
        code: NAMED.code,
        k: k(NAMED.expUnix, NAMED.sig),
        from: NAMED.from,
        to: NAMED.to,
      }),
    ).toBe(true);
  });

  it('accepts the signed link with no names', async () => {
    expect(await verify({ code: UNNAMED.code, k: k(UNNAMED.expUnix, UNNAMED.sig) })).toBe(true);
  });

  /**
   * An omitted parameter and an explicitly empty one are the same empty field
   * in the payload, so the no-names vector must verify either way — the app
   * omits them, but a client that appends `&from=` is not forging anything.
   */
  it('treats an omitted name and an empty one identically', async () => {
    expect(
      await verify({ code: UNNAMED.code, k: k(UNNAMED.expUnix, UNNAMED.sig), from: '', to: '' }),
    ).toBe(true);
  });
});

describe('verifyInviteLink — tamper matrix', () => {
  /**
   * Every field the payload covers, changed one at a time, plus the two ways to
   * attack the envelope instead of the contents. All of them must come back
   * `false`, and — just as important — all of them come back the SAME `false`:
   * the caller redirects identically, so nothing here is an oracle for which
   * part was wrong.
   */
  const TAMPERS: ReadonlyArray<readonly [string, Parameters<typeof verifyInviteLink>[0]]> = [
    [
      'changed code',
      { code: 'RBO247', k: k(NAMED.expUnix, NAMED.sig), from: NAMED.from, to: NAMED.to },
    ],
    [
      'lower-cased code in the path',
      { code: 'rbo246', k: k(NAMED.expUnix, NAMED.sig), from: NAMED.from, to: NAMED.to },
    ],
    [
      'changed expiry',
      { code: NAMED.code, k: k(NAMED.expUnix + 1, NAMED.sig), from: NAMED.from, to: NAMED.to },
    ],
    [
      'changed from',
      { code: NAMED.code, k: k(NAMED.expUnix, NAMED.sig), from: 'Mallory', to: NAMED.to },
    ],
    [
      'changed to',
      { code: NAMED.code, k: k(NAMED.expUnix, NAMED.sig), from: NAMED.from, to: 'Mallory' },
    ],
    [
      'swapped names',
      { code: NAMED.code, k: k(NAMED.expUnix, NAMED.sig), from: NAMED.to, to: NAMED.from },
    ],
    [
      'dropped from',
      { code: NAMED.code, k: k(NAMED.expUnix, NAMED.sig), to: NAMED.to },
    ],
    [
      'dropped to',
      { code: NAMED.code, k: k(NAMED.expUnix, NAMED.sig), from: NAMED.from },
    ],
    [
      'appended a second from',
      {
        code: NAMED.code,
        k: k(NAMED.expUnix, NAMED.sig),
        from: [NAMED.from, 'Mallory'],
        to: NAMED.to,
      },
    ],
    [
      'appended a second to',
      {
        code: NAMED.code,
        k: k(NAMED.expUnix, NAMED.sig),
        from: NAMED.from,
        to: [NAMED.to, 'Mallory'],
      },
    ],
    [
      'flipped a byte in the signature',
      {
        code: NAMED.code,
        k: k(NAMED.expUnix, `${NAMED.sig.slice(0, -1)}${NAMED.sig.endsWith('A') ? 'B' : 'A'}`),
        from: NAMED.from,
        to: NAMED.to,
      },
    ],
    [
      'signature from the other vector',
      { code: NAMED.code, k: k(NAMED.expUnix, UNNAMED.sig), from: NAMED.from, to: NAMED.to },
    ],
    [
      'unknown key id',
      { code: NAMED.code, k: k(NAMED.expUnix, NAMED.sig, '2'), from: NAMED.from, to: NAMED.to },
    ],
    [
      'missing k entirely',
      { code: NAMED.code, k: undefined, from: NAMED.from, to: NAMED.to },
    ],
    [
      'malformed k',
      { code: NAMED.code, k: 'not-a-signature', from: NAMED.from, to: NAMED.to },
    ],
  ];

  for (const [label, input] of TAMPERS) {
    it(`rejects: ${label}`, async () => {
      expect(await verify(input)).toBe(false);
    });
  }

  /**
   * A correct signature under the WRONG KEY. This is the case the key id alone
   * cannot catch — an attacker controls the whole `k` parameter and can put
   * `1.` in front of anything — so it has to be the maths that says no.
   */
  it('rejects a link that verifies under a different key', async () => {
    const input = {
      code: NAMED.code,
      k: k(NAMED.expUnix, NAMED.sig),
      from: NAMED.from,
      to: NAMED.to,
    };

    expect(await verify(input)).toBe(true);
    expect(
      await verifyInviteLink(input, {
        nowUnix: BEFORE_EXPIRY,
        publicKeyB64: INVITE_LINK_PUBLIC_KEY_B64,
      }),
    ).toBe(false);
  });

  /** Hostile input must redirect, never 500. WebCrypto throws on bad keys. */
  it('returns false rather than throwing on an unusable key', async () => {
    await expect(
      verifyInviteLink(
        { code: NAMED.code, k: k(NAMED.expUnix, NAMED.sig), from: NAMED.from, to: NAMED.to },
        { nowUnix: BEFORE_EXPIRY, publicKeyB64: 'not base64 at all !!!' },
      ),
    ).resolves.toBe(false);
  });
});

describe('verifyInviteLink — the expiry boundary', () => {
  const input = {
    code: NAMED.code,
    k: k(NAMED.expUnix, NAMED.sig),
    from: NAMED.from,
    to: NAMED.to,
  };

  it('accepts the second before the expiry', async () => {
    expect(await verify(input, NAMED.expUnix - 1)).toBe(true);
  });

  /** `exp` is the last valid second, not the first invalid one. */
  it('accepts the expiry second itself', async () => {
    expect(await verify(input, NAMED.expUnix)).toBe(true);
  });

  it('rejects the second after', async () => {
    expect(await verify(input, NAMED.expUnix + 1)).toBe(false);
  });

  it('rejects a long-expired link', async () => {
    expect(await verify(input, NAMED.expUnix + 86_400 * 365)).toBe(false);
  });

  /**
   * Expiry is checked BEFORE the signature, so an expired link costs no crypto
   * — but it must not be possible to tell the two apart from the outside, and
   * an expired link with a junk signature is still just `false`.
   */
  it('rejects an expired link with a bad signature the same way', async () => {
    expect(await verify({ ...input, k: k(NAMED.expUnix, UNNAMED.sig) }, NAMED.expUnix + 1)).toBe(
      false,
    );
  });
});

describe('the production key', () => {
  /**
   * Pinned so a stray edit is a failing test rather than a site-wide outage of
   * every invite link. Published by `ops invite-link public-key`, key id "1",
   * derived from the signing seed held as a Fly secret.
   */
  it('is the published key, under the published id', () => {
    expect(INVITE_LINK_PUBLIC_KEY_B64).toBe('fPMNjXE+zzvuZ0asiKTNRpG3oG9ixVMXOv9CchOJ+U0=');
    expect(INVITE_LINK_KEY_ID).toBe('1');
  });

  it('is a raw 32-byte Ed25519 public key', () => {
    expect(Buffer.from(INVITE_LINK_PUBLIC_KEY_B64, 'base64')).toHaveLength(32);
  });

  it('is not the test key', () => {
    expect(INVITE_LINK_PUBLIC_KEY_B64).not.toBe(TEST_PUBLIC_KEY_B64);
  });
});
