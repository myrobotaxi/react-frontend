import type { Metadata } from 'next';

import { INVITE_OG_IMAGE_PATH, SITE_ORIGIN } from '@/lib/constants';

const TITLE = "You're invited to ride a Tesla";
const DESCRIPTION = 'MyRoboTaxi — tap to join and request rides.';

/**
 * Link-preview metadata for every /join route.
 *
 * Declared on the layout, not the page, so the code-carrying route and the
 * codeless landing emit byte-identical tags. Messaging apps scrape these before
 * the recipient taps, and the preview is visible to anyone the link is
 * forwarded to — so it must never contain the invite code, the sender's name,
 * or the recipient's. `og:url` is deliberately omitted for the same reason.
 *
 * `noindex` keeps code-bearing URLs out of search engines.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: 'MyRoboTaxi',
    title: TITLE,
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
    title: TITLE,
    description: DESCRIPTION,
    images: [INVITE_OG_IMAGE_PATH],
  },
};

/**
 * Standalone layout for the public invite surface. Renders children only —
 * no header, no bottom nav, no links into the rest of the app.
 */
export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
