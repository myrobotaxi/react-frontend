import { PRIVACY_ROUTE } from '@/lib/constants';

/**
 * How the footer sits on the page.
 *
 * `anchored` pins it to the bottom of a positioned ancestor, for the teaser,
 * whose whole composition is a lockup centred in the viewport — a footer in the
 * flex flow there would push the mark off centre. `inline` puts it in normal
 * flow under content that can be taller than the screen, which is the invite
 * landing on a small phone.
 */
export type LegalFooterVariant = 'anchored' | 'inline';

/** Props for the LegalFooter component. */
export interface LegalFooterProps {
  variant: LegalFooterVariant;
}

const PLACEMENT: Record<LegalFooterVariant, string> = {
  anchored: 'absolute inset-x-0 bottom-0 pb-8',
  inline: 'mt-12',
};

/**
 * The one link on the site's public surfaces.
 *
 * Both the coming-soon teaser and the invite landing are deliberately free of
 * navigation, and this does not reopen that: it is a single muted link to the
 * privacy policy, which an app distributed through TestFlight has to publish
 * somewhere a person can actually find. Set in `text-text-muted` so it reads as
 * a footer rather than an invitation to go somewhere else.
 *
 * Plain `<a>` rather than `next/link`: on the teaser, a prefetching Link would
 * pull the whole policy down for every visitor who never asked for it.
 */
export function LegalFooter({ variant }: LegalFooterProps) {
  return (
    <footer className={`${PLACEMENT[variant]} text-center`}>
      <a
        href={PRIVACY_ROUTE}
        className="text-xs tracking-wide text-text-muted transition-colors hover:text-text-secondary"
      >
        Privacy
      </a>
    </footer>
  );
}
