import { describe, it, expect } from 'vitest';

import { buildJoinMetadata, GENERIC_INVITE_TITLE } from '@/app/join/join-metadata';
import { INVITE_OG_IMAGE_PATH } from '@/lib/constants';

/**
 * MYR-359 — the card the recipient sees BEFORE tapping anything. It is built by
 * a scraper that never runs the page's JavaScript, which is why these tags are
 * generated on the server and why they are worth pinning here.
 */
describe('buildJoinMetadata', () => {
  it('names the sender in every title when the link named one', () => {
    const meta = buildJoinMetadata('Thomas');

    expect(meta.title).toBe('Thomas invited you to ride their Tesla');
    expect(meta.openGraph?.title).toBe('Thomas invited you to ride their Tesla');
    expect(meta.twitter?.title).toBe('Thomas invited you to ride their Tesla');
  });

  it('falls back to the generic title when it did not', () => {
    const meta = buildJoinMetadata(null);

    expect(meta.title).toBe(GENERIC_INVITE_TITLE);
    expect(meta.openGraph?.title).toBe(GENERIC_INVITE_TITLE);
    expect(meta.twitter?.title).toBe(GENERIC_INVITE_TITLE);
  });

  /**
   * The image is a static PNG in both cases. Rendering user-controlled text into
   * an image would mean generating, and every platform caching, a bitmap keyed
   * by a URL anyone can craft — and unlike a title, an image is not escaped by
   * anything downstream.
   */
  it('keeps the OG image generic — no name is ever baked into the PNG', () => {
    for (const meta of [buildJoinMetadata('Thomas'), buildJoinMetadata(null)]) {
      const images = meta.openGraph && 'images' in meta.openGraph ? meta.openGraph.images : null;

      expect(JSON.stringify(images)).toContain(INVITE_OG_IMAGE_PATH);
      expect(JSON.stringify(images)).not.toContain('Thomas');
      expect(meta.twitter?.images).toEqual([INVITE_OG_IMAGE_PATH]);
    }
  });

  it('keeps the preview out of search engines and carries no og:url', () => {
    const meta = buildJoinMetadata('Thomas');

    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.openGraph && 'url' in meta.openGraph ? meta.openGraph.url : undefined).toBeUndefined();
  });
});
