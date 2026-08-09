import { SUPPORT_CONTACT_EMAIL } from '@/lib/constants';

/** Props for the HowThisPageWorks component. */
export interface HowThisPageWorksProps {
  days: number;
}

/**
 * The page's own terms and conditions.
 *
 * Every status page is a claim about a system, made by the people who run it.
 * This section is where the claim's limits are written down — including the one
 * that is genuinely awkward, that the website row is this platform checking
 * itself. Publishing the limits is the difference between a status page and a
 * marketing page with a green dot on it.
 */
export function HowThisPageWorks({ days }: HowThisPageWorksProps) {
  return (
    <section className="mt-12 border-t border-border-default pt-10">
      <h2 className="text-lg font-semibold leading-7 text-text-primary">How this page works</h2>

      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-text-secondary marker:text-gold">
        <li>
          A checker runs once a minute from a different provider than the services it checks, so an
          outage of those services cannot also take out the thing watching them.
        </li>
        <li>
          A component is marked down only after two consecutive failed checks. One failed check
          reads as degraded, because a single failure is as likely to be the network between us as
          it is to be the service.
        </li>
        <li>
          Each bar is one UTC day, coloured by the worst thing that happened that day. Hover a bar
          for that day&apos;s uptime and check count. History goes back {days} days; older checks
          are deleted.
        </li>
        <li>
          Where there are no recent checks, a component reads <strong className="font-medium text-text-primary">No data</strong>{' '}
          — never Operational. If this page ever shows No data everywhere, assume the checker is
          the thing that is broken.
        </li>
        <li>
          The website row is checked from the same platform this site is hosted on. It catches a
          bad deploy or a broken file, which is what it is for; it cannot report that platform
          being down, because then nothing would be checking at all.
        </li>
        <li>
          This page refreshes about once a minute and lists only what we actually measure. There is
          no row here for anything we do not probe.
        </li>
      </ul>

      <p className="mt-4 text-sm leading-6 text-text-secondary">
        Something broken that this page says is fine?{' '}
        <a className="text-gold hover:text-gold-light" href={`mailto:${SUPPORT_CONTACT_EMAIL}`}>
          {SUPPORT_CONTACT_EMAIL}
        </a>
        .
      </p>
    </section>
  );
}
