import type { Metadata } from 'next';

import { INVITE_OG_IMAGE_PATH, SITE_ORIGIN } from '@/lib/constants';

/** Preview title when the link names nobody. */
export const GENERIC_INVITE_TITLE = "You're invited to ride a Tesla";

/** Preview title when the link carries a sanitized sender name (MYR-359). */
export function personalizedInviteTitle(inviterName: string): string {
  return `${inviterName} invited you to ride their Tesla`;
}

const DESCRIPTION = 'MyRoboTaxi — tap to join and request rides.';

/**
 * Link-preview metadata for every /join route.
 *
 * ONE builder for the code-carrying route, the codeless landing, and the layout,
 * so the three can never emit different tags for the same visit — the reason
 * this used to live on the layout alone. It moved here when `?from=` made the
 * tags a function of the URL: a layout cannot read search params, and metadata
 * that a scraper never sees is metadata that does not exist.
 *
 * The title is the ONLY thing the name touches:
 *
 *  • **The image stays generic.** Baking a name into the PNG would mean
 *    rendering user-controlled text into an image, cached by every platform that
 *    scrapes it, keyed by a URL anyone can craft. The title is text a scraper
 *    escapes; an image is not.
 *  • **The code never appears**, in any tag. The preview is visible to everyone
 *    the link is forwarded to, and the code is a bearer credential. `og:url` is
 *    omitted for the same reason.
 *  • `noindex` keeps code-bearing URLs out of search engines.
 *
 * @param inviterName - Already sanitized (`sanitizeInviterName`), or `null`.
 *   This function does not validate; callers must not hand it raw input.
 */
export function buildJoinMetadata(inviterName: string | null): Metadata {
  const title = inviterName ? personalizedInviteTitle(inviterName) : GENERIC_INVITE_TITLE;

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description: DESCRIPTION,
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: 'MyRoboTaxi',
      title,
      description: DESCRIPTION,
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
      description: DESCRIPTION,
      images: [INVITE_OG_IMAGE_PATH],
    },
  };
}
