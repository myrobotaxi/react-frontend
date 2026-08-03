import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PrivacyPolicyScreen } from '@/features/legal/components/PrivacyPolicyScreen';
import { CONTACT_EMAIL, PRIVACY_EFFECTIVE_DATE_ISO } from '@/lib/constants';

/**
 * The privacy policy.
 *
 * These are not copy-editing tests. Each one pins a disclosure that the product
 * genuinely makes and that a future edit could quietly soften — the audit that
 * produced this page found every one of them in the source of the iOS app or
 * the telemetry server, and a policy that stops saying them becomes untrue
 * rather than merely shorter.
 */
describe('PrivacyPolicyScreen', () => {
  it('carries a machine-readable effective date', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    const time = container.querySelector('time');
    expect(time).toHaveAttribute('dateTime', PRIVACY_EFFECTIVE_DATE_ISO);
  });

  it('gives a contact address that is a real mailbox', () => {
    render(<PrivacyPolicyScreen />);

    const [link] = screen.getAllByRole('link', { name: CONTACT_EMAIL });
    expect(link).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
  });

  it('names every company that processes data', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    // Mapbox and Sentry are the two a reader would not guess, and Mapbox
    // receives precise coordinates — omitting either would make the list a
    // misrepresentation rather than an omission.
    for (const processor of ['Apple', 'Tesla', 'Fly.io', 'Supabase', 'Vercel', 'Mapbox', 'Sentry']) {
      expect(container.textContent).toContain(processor);
    }
  });

  it('discloses that a viewer of a shared car sees everything but the VIN', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/only thing withheld from a viewer[\s\S]*VIN/i);
  });

  it('discloses the GPS trail kept for every drive', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/GPS trail/i);
  });

  it('discloses the first names carried in an invite link', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/first names/i);
  });

  it('admits the three columns still awaiting encryption', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/unencrypted copies still exist/i);
  });

  it('admits drive history is not being aged out yet', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/kept indefinitely/i);
  });

  it('describes the two deletion steps only the account holder can perform', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/Two steps only you can do/i);
    expect(container.textContent).toMatch(/Third-Party Apps/i);
  });

  /**
   * The one claim on the page that is absolute. It is safe to make because both
   * the app and the server were searched for an advertising, attribution, or
   * data-broker code path and none exists — but if that ever stops being true,
   * this sentence is the one that has to go first.
   */
  it('states plainly that data is not sold', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/do not sell your personal information/i);
  });
});
