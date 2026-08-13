import type { Metadata } from 'next';

import { appRideURL } from '@/lib/app-link';
import { APPLE_APP_STORE_ID, RIDE_OG_IMAGE_PATH, SITE_ORIGIN } from '@/lib/constants';
import { RIDE_JOIN_SUBLINE, RIDE_JOIN_TITLE } from '@/lib/ride-copy';

/**
 * Safari's smart app banner for a ride share link — the strip across the top of
 * the page offering to open the app.
 *
 * The same mechanism as `app/join/join-metadata.ts`'s `smartAppBanner`, and the
 * reasoning there transfers verbatim: `app-argument` is the SCHEME url rather
 * than the page's own https url, because tapping OPEN in a smart banner is not
 * a universal-link tap — iOS delivers the argument on the openURL channel, and
 * `myrobotaxi` is the scheme the app claims in `CFBundleURLSchemes`.
 *
 * It is BUILT AND DORMANT here for the same reason it is dormant there:
 * `APPLE_APP_STORE_ID` is `''` because MyRoboTaxi has no App Store record, and
 * `app-id` is the one attribute Safari requires and validates. Pasting the
 * digits into that one constant switches the banner on for BOTH surfaces at
 * once, which is why this file mirrors the join file's shape rather than
 * inventing a different one.
 *
 * The code in `app-argument` is the single exception to the rule that no tag on
 * this page carries the code, and it is the same exception the invite surface
 * makes: og:* and twitter:* are scraped and RE-DISPLAYED to a whole group chat,
 * whereas `app-argument` is rendered to nobody — Safari reads it on a device
 * that already has the code in its address bar.
 *
 * @param appStoreId - Numeric App Store id, or `''` when no store record exists
 *   yet. Passed in rather than read from the module so both arms are testable.
 * @param code - Sanitized ride code from the URL path, or `null`.
 * @returns The `itunes` metadata, or `undefined` to emit no banner at all.
 */
export function rideSmartAppBanner(
  appStoreId: string,
  code: string | null,
): Metadata['itunes'] | undefined {
  if (!appStoreId) return undefined;

  const appArgument = appRideURL(code);
  if (!appArgument) return undefined;

  return { appId: appStoreId, appArgument };
}

/**
 * Link-preview metadata for `/ride/{CODE}` (MYR-540).
 *
 * ── THE CARD IS A CONSTANT ──────────────────────────────────────────────────
 * `buildJoinMetadata` takes names, because an invite link carries verified ones
 * and the client-approved copy uses them. This takes only a code, and the code
 * reaches exactly one tag that nothing renders. Every ride link in the world
 * produces byte-identical preview tags.
 *
 * That is the point rather than an omission. A ride share link is forwarded
 * into a group chat by design; the platform scrapes it once, caches the card,
 * and shows it to everyone in the thread — including people who never opened
 * the link and are not on the ride. A ride is a live location, so a preview
 * that named the rider, counted the party, or described the trip would be
 * broadcasting where somebody physically is to an audience nobody chose. There
 * is no signature that makes that safe, which is why this surface has no
 * personalized variant to verify in the first place.
 *
 * Concretely:
 *
 *  • Title and description come from `lib/ride-copy.ts`'s two constants — the
 *    same strings the page body renders, so the card and the page agree.
 *  • The image is a static PNG shared by every ride link.
 *  • `og:url` is omitted, because the URL contains the code.
 *  • `noindex` keeps code-bearing URLs out of search engines.
 *
 * @param code - Sanitized ride code from the URL PATH, for the smart app
 *   banner's `app-argument` only. Defaults to absent.
 */
export function buildRideMetadata(code: string | null = null): Metadata {
  const itunes = rideSmartAppBanner(APPLE_APP_STORE_ID, code);

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: RIDE_JOIN_TITLE,
    description: RIDE_JOIN_SUBLINE,
    robots: { index: false, follow: false },
    // Spread so the key is ABSENT, not `undefined`, when there is no banner —
    // an absent key is what the tests can assert on without ambiguity.
    ...(itunes ? { itunes } : {}),
    openGraph: {
      type: 'website',
      siteName: 'MyRoboTaxi',
      title: RIDE_JOIN_TITLE,
      description: RIDE_JOIN_SUBLINE,
      images: [
        {
          url: RIDE_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: 'MyRoboTaxi',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: RIDE_JOIN_TITLE,
      description: RIDE_JOIN_SUBLINE,
      images: [RIDE_OG_IMAGE_PATH],
    },
  };
}
