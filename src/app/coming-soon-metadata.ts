import type { Metadata } from 'next';

import { COMING_SOON_OG_IMAGE_PATH, SITE_ORIGIN } from '@/lib/constants';

/** What the apex domain calls itself everywhere a preview shows up. */
export const COMING_SOON_TITLE = 'MyRoboTaxi';

/** The only sentence on the page, and the only one in its preview card. */
export const COMING_SOON_DESCRIPTION = 'Coming soon.';

/**
 * Link-preview metadata for `/` — the coming-soon teaser.
 *
 * Built here rather than inline on the page for the same reason
 * `join-metadata.ts` exists: the tags are the half of the page that a scraper
 * reads instead of rendering it, so they are worth testing on their own.
 *
 * Nothing here hints at the invite surface — including the image, which is the
 * teaser's own card rather than the invite one. The apex domain is shared
 * publicly; a preview telling the public they are invited would undo the point
 * of moving the invite landing behind a code.
 */
export function buildComingSoonMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: COMING_SOON_TITLE,
    description: COMING_SOON_DESCRIPTION,
    openGraph: {
      type: 'website',
      siteName: COMING_SOON_TITLE,
      title: COMING_SOON_TITLE,
      description: COMING_SOON_DESCRIPTION,
      images: [
        {
          url: COMING_SOON_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: COMING_SOON_TITLE,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: COMING_SOON_TITLE,
      description: COMING_SOON_DESCRIPTION,
      images: [COMING_SOON_OG_IMAGE_PATH],
    },
  };
}
