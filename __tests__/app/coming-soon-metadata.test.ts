import { describe, it, expect } from 'vitest';

import {
  buildComingSoonMetadata,
  COMING_SOON_DESCRIPTION,
  COMING_SOON_TITLE,
} from '@/app/coming-soon-metadata';
import { COMING_SOON_OG_IMAGE_PATH, INVITE_OG_IMAGE_PATH } from '@/lib/constants';

/**
 * The half of the root page a scraper reads instead of rendering it. Whatever a
 * shared https://myrobotaxi.app link previews as, it is this.
 */
describe('buildComingSoonMetadata', () => {
  it('titles every surface with the brand', () => {
    const meta = buildComingSoonMetadata();

    expect(meta.title).toBe(COMING_SOON_TITLE);
    expect(meta.openGraph?.title).toBe(COMING_SOON_TITLE);
    expect(meta.twitter?.title).toBe(COMING_SOON_TITLE);
    expect(COMING_SOON_TITLE).toBe('MyRoboTaxi');
  });

  it('describes it as coming soon, and nothing more', () => {
    const meta = buildComingSoonMetadata();

    expect(meta.description).toBe(COMING_SOON_DESCRIPTION);
    expect(meta.openGraph?.description).toBe(COMING_SOON_DESCRIPTION);
    expect(meta.twitter?.description).toBe(COMING_SOON_DESCRIPTION);
    expect(COMING_SOON_DESCRIPTION).toBe('Coming soon.');
  });

  it('uses the teaser card as the preview image', () => {
    const meta = buildComingSoonMetadata();
    const images = meta.openGraph && 'images' in meta.openGraph ? meta.openGraph.images : null;

    expect(JSON.stringify(images)).toContain(COMING_SOON_OG_IMAGE_PATH);
    expect(meta.twitter?.images).toEqual([COMING_SOON_OG_IMAGE_PATH]);
    expect(meta.twitter && 'card' in meta.twitter ? meta.twitter.card : undefined).toBe(
      'summary_large_image',
    );
  });

  /**
   * The invite card carries "You're invited to ride a Tesla" in the PNG itself,
   * where no amount of copy on this page can qualify it. The apex link is
   * posted publicly; borrowing that card would tell every passer-by they were
   * invited, which is the thing the teaser exists to stop.
   */
  it('never borrows the invite card', () => {
    expect(JSON.stringify(buildComingSoonMetadata())).not.toContain(INVITE_OG_IMAGE_PATH);
  });

  it('resolves relative asset URLs against the public origin', () => {
    const meta = buildComingSoonMetadata();

    expect(meta.metadataBase?.toString()).toContain('myrobotaxi.app');
  });

  it('says nothing about invites — the apex link is shared publicly', () => {
    expect(JSON.stringify(buildComingSoonMetadata())).not.toMatch(/invited|invite code|ride a Tesla/i);
  });
});
