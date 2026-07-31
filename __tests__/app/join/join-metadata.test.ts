import { describe, it, expect } from 'vitest';

import { buildJoinMetadata, GENERIC_INVITE_TITLE } from '@/app/join/join-metadata';
import { INVITE_OG_IMAGE_PATH } from '@/lib/constants';

/**
 * MYR-359 / MYR-368 — the card the recipient sees BEFORE tapping anything. It
 * is built by a scraper that never runs the page's JavaScript, which is why
 * these tags are generated on the server and why they are worth pinning here.
 *
 * The strings are client-approved and asserted verbatim, emoji included: this
 * copy went through review, so "close enough" is a regression.
 */
describe('buildJoinMetadata', () => {
  /** Every title tag, in one shot — they must never diverge. */
  function titles(meta: ReturnType<typeof buildJoinMetadata>) {
    return [meta.title, meta.openGraph?.title, meta.twitter?.title];
  }

  function descriptions(meta: ReturnType<typeof buildJoinMetadata>) {
    return [meta.description, meta.openGraph?.description, meta.twitter?.description];
  }

  it('greets the recipient by name when the link carried both', () => {
    const meta = buildJoinMetadata('Alex', 'Mira');

    expect(titles(meta)).toEqual(Array(3).fill("You're in, Mira! 🎉"));
    expect(descriptions(meta)).toEqual(
      Array(3).fill('Alex is sharing their Tesla with you on MyRoboTaxi.'),
    );
  });

  it('drops the name but keeps the welcome when only the owner is named', () => {
    const meta = buildJoinMetadata('Alex', null);

    expect(titles(meta)).toEqual(Array(3).fill("You're in! 🎉"));
    expect(descriptions(meta)).toEqual(Array(3).fill('Alex is sharing their Tesla with you.'));
  });

  it('falls back to the generic card when the link names nobody', () => {
    const meta = buildJoinMetadata(null, null);

    expect(GENERIC_INVITE_TITLE).toBe("You're invited! 🎉");
    expect(titles(meta)).toEqual(Array(3).fill(GENERIC_INVITE_TITLE));
    expect(descriptions(meta)).toEqual(
      Array(3).fill('Someone is sharing their Tesla with you on MyRoboTaxi.'),
    );
  });

  /** Callers that predate `to` keep the owner-only card. */
  it('defaults the recipient to absent', () => {
    expect(buildJoinMetadata('Alex')).toEqual(buildJoinMetadata('Alex', null));
  });

  /**
   * The product also sends location-only invites, which grant no rides at all.
   * The old copy promised one in every variant; nothing may promise one again.
   */
  it('promises no ride in any variant', () => {
    for (const meta of [
      buildJoinMetadata('Alex', 'Mira'),
      buildJoinMetadata('Alex', null),
      buildJoinMetadata(null, null),
    ]) {
      expect(JSON.stringify([titles(meta), descriptions(meta)])).not.toMatch(/ride/i);
    }
  });

  /**
   * The image is a static PNG in every case. Rendering user-controlled text into
   * an image would mean generating, and every platform caching, a bitmap keyed
   * by a URL anyone can craft — and unlike a title, an image is not escaped by
   * anything downstream. A verified signature does not change that.
   */
  it('keeps the OG image generic — no name is ever baked into the PNG', () => {
    for (const meta of [buildJoinMetadata('Alex', 'Mira'), buildJoinMetadata(null, null)]) {
      const images = meta.openGraph && 'images' in meta.openGraph ? meta.openGraph.images : null;

      expect(JSON.stringify(images)).toContain(INVITE_OG_IMAGE_PATH);
      expect(JSON.stringify(images)).not.toMatch(/Alex|Mira/);
      expect(meta.twitter?.images).toEqual([INVITE_OG_IMAGE_PATH]);
    }
  });

  it('keeps the preview out of search engines and carries no og:url', () => {
    const meta = buildJoinMetadata('Alex', 'Mira');

    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.openGraph && 'url' in meta.openGraph ? meta.openGraph.url : undefined).toBeUndefined();
  });
});
