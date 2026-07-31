import type { Metadata } from 'next';

import { INVITE_OG_IMAGE_PATH, SITE_ORIGIN } from '@/lib/constants';
import { inviteHeadline, inviteSubline } from '@/lib/invite-copy';

/** Preview title when the link names nobody. */
export const GENERIC_INVITE_TITLE = inviteHeadline(null, null);

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
 *  • **The code never appears**, in any tag. The preview is visible to everyone
 *    the link is forwarded to, and the code is a bearer credential. `og:url` is
 *    omitted for the same reason.
 *  • `noindex` keeps code-bearing URLs out of search engines.
 *
 * @param inviterName - Sender's name: already sanitized (`sanitizeInviterName`)
 *   AND covered by a verified signature, or `null`. This function does not
 *   validate; callers must not hand it raw input (MYR-368).
 * @param recipientName - Recipient's name, under the same contract.
 */
export function buildJoinMetadata(
  inviterName: string | null,
  recipientName: string | null = null,
): Metadata {
  const title = inviteHeadline(inviterName, recipientName);
  const description = inviteSubline(inviterName, recipientName);

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    robots: { index: false, follow: false },
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
