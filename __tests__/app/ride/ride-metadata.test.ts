import { describe, it, expect } from 'vitest';

import { buildRideMetadata, rideSmartAppBanner } from '@/app/ride/ride-metadata';
import { APPLE_APP_STORE_ID, RIDE_OG_IMAGE_PATH } from '@/lib/constants';
import { RIDE_JOIN_SUBLINE, RIDE_JOIN_TITLE } from '@/lib/ride-copy';

/**
 * MYR-540 — the card a group chat sees BEFORE anyone taps.
 *
 * A ride share link is pasted into a chat on purpose, so its preview is scraped
 * once and re-displayed to everyone in the thread, including people who are not
 * on the ride and never opened the link. Behind the link is a live location.
 * These cases pin the consequence: the card is a CONSTANT.
 */
describe('buildRideMetadata', () => {
  function titles(meta: ReturnType<typeof buildRideMetadata>) {
    return [meta.title, meta.openGraph?.title, meta.twitter?.title];
  }

  function descriptions(meta: ReturnType<typeof buildRideMetadata>) {
    return [meta.description, meta.openGraph?.description, meta.twitter?.description];
  }

  it('serves the ride copy verbatim in every title tag', () => {
    expect(titles(buildRideMetadata())).toEqual(Array(3).fill(RIDE_JOIN_TITLE));
    expect(RIDE_JOIN_TITLE).toBe("You're invited to join a ride 🎉");
  });

  it('serves the ride sub-line verbatim in every description tag', () => {
    expect(descriptions(buildRideMetadata())).toEqual(Array(3).fill(RIDE_JOIN_SUBLINE));
    expect(RIDE_JOIN_SUBLINE).toBe(
      'Someone shared their MyRoboTaxi ride with you. Open it in the app to join.',
    );
  });

  /**
   * The load-bearing case. Two different codes must produce byte-identical
   * tags: there is no per-ride card, so there is no per-ride card to leak.
   */
  it('emits identical tags for every ride link', () => {
    expect(buildRideMetadata('RBO246')).toEqual(buildRideMetadata('ZZZZZZ'));
    expect(buildRideMetadata('RBO246')).toEqual(buildRideMetadata(null));
    expect(buildRideMetadata()).toEqual(buildRideMetadata(null));
  });

  /**
   * The code is a bearer credential and the preview is public to the whole
   * thread. While no App Store id exists the code reaches NO tag at all; the
   * `app-argument` exception is covered in the banner suite below.
   */
  it('never puts the code in a tag anything renders', () => {
    const withBanner = { ...buildRideMetadata('RBO246') };
    delete withBanner.itunes;

    for (const meta of [withBanner, buildRideMetadata(null)]) {
      expect(JSON.stringify(meta)).not.toContain('RBO246');
    }
  });

  it('keeps the OG image static and shared by every ride link', () => {
    const meta = buildRideMetadata('RBO246');
    const images = meta.openGraph && 'images' in meta.openGraph ? meta.openGraph.images : null;

    expect(JSON.stringify(images)).toContain(RIDE_OG_IMAGE_PATH);
    expect(meta.twitter?.images).toEqual([RIDE_OG_IMAGE_PATH]);
    expect(meta.twitter && 'card' in meta.twitter ? meta.twitter.card : undefined).toBe(
      'summary_large_image',
    );
  });

  /** Its own card, not the invite one — the two links say different things. */
  it('uses the ride card rather than the invite card', () => {
    expect(RIDE_OG_IMAGE_PATH).toBe('/og/ride-card.png');
    expect(JSON.stringify(buildRideMetadata())).not.toContain('invite-card');
  });

  it('keeps the preview out of search engines and carries no og:url', () => {
    const meta = buildRideMetadata('RBO246');

    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(
      meta.openGraph && 'url' in meta.openGraph ? meta.openGraph.url : undefined,
    ).toBeUndefined();
  });

  /**
   * Nothing about the ride itself may appear, ever. This is a coarse net over
   * the whole serialized object rather than a per-tag check, because the point
   * is that no future tag smuggles one of these in either.
   */
  it('describes no position, no party and no time', () => {
    const serialized = JSON.stringify(buildRideMetadata('RBO246')).toLowerCase();

    // Word-anchored: "metadataBase" legitimately contains the letters of "eta".
    for (const forbidden of [
      /\beta\b/,
      /\barriv/,
      /\bpickup/,
      /\bdrop/,
      /\briding\b/,
      /\bpassenger/,
      /\blatitude\b/,
      /\blongitude\b/,
      /\bminute/,
    ]) {
      expect(serialized).not.toMatch(forbidden);
    }
  });
});

/**
 * MYR-540 — Safari's smart app banner on the ride surface.
 *
 * Built and dormant, exactly as on `/join/{CODE}`: `app-id` is the one
 * attribute Safari requires and validates, and MyRoboTaxi has no App Store
 * record. These cases pin what ships the day somebody pastes the id into
 * `APPLE_APP_STORE_ID` — one constant that switches BOTH surfaces on at once.
 */
describe('rideSmartAppBanner', () => {
  const APP_ID = '6752104233';

  it('carries the in-app ride URL as the app-argument', () => {
    expect(rideSmartAppBanner(APP_ID, 'RBO246')).toEqual({
      appId: APP_ID,
      appArgument: 'myrobotaxi://ride/RBO246',
    });
  });

  /** The ride arm, not the invite arm — different screen, different scheme host. */
  it('does not route the ride banner at the invite screen', () => {
    const banner = rideSmartAppBanner(APP_ID, 'RBO246');

    expect(JSON.stringify(banner)).not.toContain('//join/');
  });

  it('emits no banner while no App Store record exists', () => {
    expect(rideSmartAppBanner('', 'RBO246')).toBeUndefined();
  });

  it('emits no banner without a code to open the app on', () => {
    expect(rideSmartAppBanner(APP_ID, null)).toBeUndefined();
    expect(rideSmartAppBanner(APP_ID, 'not-a-code')).toBeUndefined();
  });

  it('reaches the page metadata as `itunes` once an id is configured', () => {
    const meta = { ...buildRideMetadata(), itunes: rideSmartAppBanner(APP_ID, 'RBO246') };

    expect(meta.itunes).toEqual({ appId: APP_ID, appArgument: 'myrobotaxi://ride/RBO246' });
  });

  /**
   * Today's shipped behaviour, asserted rather than assumed. When this flips it
   * flips because somebody created the App Store record on purpose — and this
   * test is where they will be told to update it, on both surfaces.
   */
  it('is absent from the metadata this build actually emits', () => {
    expect(APPLE_APP_STORE_ID).toBe('');
    expect('itunes' in buildRideMetadata('RBO246')).toBe(false);
  });
});
