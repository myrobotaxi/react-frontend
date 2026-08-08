import type { Metadata } from 'next';

import { appJoinURL } from '@/lib/app-link';
import { APPLE_APP_STORE_ID, INVITE_OG_IMAGE_PATH, SITE_ORIGIN } from '@/lib/constants';
import { inviteHeadline, inviteSubline } from '@/lib/invite-copy';

/** Preview title when the link names nobody. */
export const GENERIC_INVITE_TITLE = inviteHeadline(null, null);

/**
 * Safari's smart app banner for a code-carrying invite (MYR-453) — the strip
 * across the top of the page offering to open the app.
 *
 * ── WHY THE ARGUMENT IS THE SCHEME URL, NOT THE PAGE'S OWN HTTPS URL ────────
 * This is the part that decides whether the banner works, so it was checked
 * against the app rather than assumed. Tapping OPEN in a smart banner is NOT a
 * universal-link tap: iOS delivers `app-argument` through the **openURL**
 * channel, not as an `NSUserActivity`, so the app receives it on SwiftUI's
 * `.onOpenURL` (`RootView.swift`, added by ios-app#193) and never on
 * `.onContinueUserActivity`. Both funnel into the same `InviteLinkBridge`, and
 * that bridge's parser would in fact accept either URL form. The scheme URL is
 * used anyway, because it is the form the app CLAIMS: `myrobotaxi` is in
 * `CFBundleURLSchemes`, so routing it is guaranteed, whereas handing an https
 * URL to an openURL handler relies on iOS delivering a URL the app has not
 * registered. Same destination, one fewer assumption.
 *
 * ── THE CODE IN THE HEAD, WHICH EVERY OTHER TAG HERE FORBIDS ────────────────
 * `app-argument` carries the invite code, and the rule below is that the code
 * never appears in a tag. The exception is deliberate and narrow. That rule
 * exists because og:* and twitter:* are SCRAPED AND RE-DISPLAYED: a preview card
 * is rendered to people in a group chat who never opened the link, so a code in
 * an og:title is shown to a wider audience than the code's holder. `app-argument`
 * is displayed to nobody. It is read by Safari, on a device that already has the
 * code in its own address bar, and no scraper renders it into anything. The
 * audience of this tag is a strict subset of the audience of the URL it sits at,
 * so it discloses nothing new. og:url stays omitted; the preview tags stay clean.
 *
 * @param appStoreId - Numeric App Store id, or `''` when no store record exists
 *   yet. Passed in rather than read from the module so both arms are testable.
 * @param code - Sanitized invite code from the URL path, or `null`.
 * @returns The `itunes` metadata, or `undefined` to emit no banner at all —
 *   with no id there is no valid banner, and with no code a banner would open
 *   the app on an empty code screen, which is the dead end MYR-453 is about.
 */
export function smartAppBanner(
  appStoreId: string,
  code: string | null,
): Metadata['itunes'] | undefined {
  if (!appStoreId) return undefined;

  const appArgument = appJoinURL(code);
  if (!appArgument) return undefined;

  return { appId: appStoreId, appArgument };
}

/**
 * Link-preview metadata for every /join route.
 *
 * ONE builder for the code-carrying route, the codeless landing, and the layout,
 * so the three can never emit different tags for the same visit — the reason
 * this used to live on the layout alone. It moved here when `?from=` made the
 * tags a function of the URL: a layout cannot read search params, and metadata
 * that a scraper never sees is metadata that does not exist.
 *
 * Title and description are the ONLY things the names touch, and they are the
 * same strings the page itself renders (`lib/invite-copy.ts`):
 *
 *  • **The image stays generic.** Baking a name into the PNG would mean
 *    rendering user-controlled text into an image, cached by every platform that
 *    scrapes it, keyed by a URL anyone can craft. The title is text a scraper
 *    escapes; an image is not. MYR-368's signature makes the names trustworthy,
 *    not the caching behaviour of every messaging platform sane.
 *  • **The code never appears in a PREVIEW tag.** The preview is visible to
 *    everyone the link is forwarded to, and the code is a bearer credential.
 *    `og:url` is omitted for the same reason. The one tag that does carry the
 *    code is `apple-itunes-app`'s `app-argument`, which nothing renders and
 *    which only Safari reads — see `smartAppBanner` for why that is not the same
 *    exposure, and note it is dormant until an App Store id exists.
 *  • `noindex` keeps code-bearing URLs out of search engines.
 *
 * @param inviterName - Sender's name: already sanitized (`sanitizeInviterName`)
 *   AND covered by a verified signature, or `null`. This function does not
 *   validate; callers must not hand it raw input (MYR-368).
 * @param recipientName - Recipient's name, under the same contract.
 * @param code - Sanitized invite code from the URL PATH, for the smart app
 *   banner's `app-argument` (MYR-453). Defaults to absent, which is what every
 *   codeless caller — the layout, `/join` — wants: no code, no banner.
 */
export function buildJoinMetadata(
  inviterName: string | null,
  recipientName: string | null = null,
  code: string | null = null,
): Metadata {
  const title = inviteHeadline(inviterName, recipientName);
  const description = inviteSubline(inviterName, recipientName);
  const itunes = smartAppBanner(APPLE_APP_STORE_ID, code);

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    robots: { index: false, follow: false },
    // Spread so the key is absent, not `undefined`, when there is no banner —
    // Next treats an explicit `itunes: undefined` the same way, but an absent
    // key is what the tests can assert on without ambiguity.
    ...(itunes ? { itunes } : {}),
    openGraph: {
      type: 'website',
      siteName: 'MyRoboTaxi',
      title,
      description,
      images: [
        {
          url: INVITE_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: 'MyRoboTaxi',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [INVITE_OG_IMAGE_PATH],
    },
  };
}
