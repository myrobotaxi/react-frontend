import { describe, it, expect } from 'vitest';
import type { Metadata } from 'next';

import { buildJoinMetadata, GENERIC_INVITE_TITLE, smartAppBanner } from '@/app/join/join-metadata';
import { APPLE_APP_STORE_ID, INVITE_OG_IMAGE_PATH } from '@/lib/constants';

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

  /**
   * MYR-453 — the code reaches exactly ONE tag, and it is not a preview tag.
   * The rule the rest of this file pins is that a bearer credential never lands
   * anywhere a scraper re-displays it to a group chat. `app-argument` is read by
   * Safari on a device that already has the code in its address bar, and is
   * rendered to nobody; og:*, twitter:* and the title stay clean either way.
   */
  it('never puts the code in a tag anything renders, banner or no banner', () => {
    const withBanner = { ...buildJoinMetadata('Alex', 'Mira', 'RBO246') };
    delete withBanner.itunes;

    for (const meta of [withBanner, buildJoinMetadata('Alex', 'Mira', null)]) {
      expect(JSON.stringify(meta)).not.toContain('RBO246');
    }
  });
});

/**
 * MYR-453 — Safari's smart app banner, the native path for the OTHER browser.
 *
 * Built and dormant. Tested through the pure builder rather than only through
 * `buildJoinMetadata`, because the switch is a constant that is empty today: the
 * app has no App Store record (TestFlight only), and `app-id` is the one part of
 * `apple-itunes-app` that Safari requires and validates. These cases pin what
 * ships the day somebody pastes the id in, so switching it on is a one-line
 * change and not a rediscovery of what the argument was supposed to be.
 */
describe('smartAppBanner', () => {
  const APP_ID = '6752104233';

  /**
   * The scheme URL, NOT the page's own https URL. Tapping OPEN in a smart
   * banner is not a universal-link tap: iOS delivers `app-argument` on the
   * openURL channel (`.onOpenURL`, ios-app#193), and `myrobotaxi` is the scheme
   * the app claims in `CFBundleURLSchemes`.
   */
  it('carries the in-app URL for the code as the app-argument', () => {
    expect(smartAppBanner(APP_ID, 'RBO246')).toEqual({
      appId: APP_ID,
      appArgument: 'myrobotaxi://join/RBO246',
    });
  });

  it('emits no banner while no App Store record exists', () => {
    expect(smartAppBanner('', 'RBO246')).toBeUndefined();
  });

  /**
   * A banner with no code would open the app on an empty six-box code screen —
   * precisely the dead end MYR-453 is about. Better to show no banner.
   */
  it('emits no banner without a code to open the app on', () => {
    expect(smartAppBanner(APP_ID, null)).toBeUndefined();
    expect(smartAppBanner(APP_ID, 'not-a-code')).toBeUndefined();
  });

  it('reaches the page metadata as `itunes` once an id is configured', () => {
    const meta: Metadata = { ...buildJoinMetadata(null, null), itunes: smartAppBanner(APP_ID, 'RBO246') };

    expect(meta.itunes).toEqual({ appId: APP_ID, appArgument: 'myrobotaxi://join/RBO246' });
  });

  /**
   * Today's shipped behaviour, asserted rather than assumed: the tag is absent
   * from a real `/join/{CODE}` page. When this flips, it flips because somebody
   * created the App Store record on purpose — and this test is where they will
   * be told to update it.
   */
  it('is absent from the metadata this build actually emits', () => {
    expect(APPLE_APP_STORE_ID).toBe('');
    expect(buildJoinMetadata('Alex', 'Mira', 'RBO246').itunes).toBeUndefined();
    expect('itunes' in buildJoinMetadata('Alex', 'Mira', 'RBO246')).toBe(false);
  });
});
