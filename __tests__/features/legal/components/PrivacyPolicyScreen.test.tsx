import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PrivacyPolicyScreen } from '@/features/legal/components/PrivacyPolicyScreen';
import { CONTACT_EMAIL, PRIVACY_EFFECTIVE_DATE_ISO } from '@/lib/constants';

/**
 * The privacy policy.
 *
 * These are not copy-editing tests. Each one pins a statement that the product
 * genuinely supports and that a future edit could quietly turn into a lie.
 *
 * The original ten pinned disclosures of gaps — unencrypted columns, drives
 * kept forever, a viewer who saw everything but the VIN. Those gaps were closed
 * (MYR-433, MYR-435, MYR-439) and the page now states protections instead, so
 * the tests moved with the claims. The direction of the risk inverted with
 * them: before, the danger was a page that stopped admitting something; now it
 * is a page that claims more than the code delivers. Hence the two tests that
 * pin the LIMITS of the encryption claim — the plaintext addresses and the
 * backup window — as firmly as the claim itself. Deleting those two would leave
 * the reassuring half of a sentence standing alone, which is the exact failure
 * this file exists to prevent.
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

  it('states that stored coordinates are AES-256-GCM ciphertext with no other copy', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/AES-256-GCM ciphertext and in no other form/i);
    expect(container.textContent).toMatch(/unencrypted copies[\s\S]*have been\s+deleted/i);
  });

  it('states that the encryption key is not in the database', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/key is not in the database/i);
    expect(container.textContent).toMatch(/we cannot read your drives[\s\S]*neither can anyone/i);
  });

  /**
   * The counterweight to the two tests above. Street addresses, place names,
   * plates and passenger phone numbers are still ordinary text, so "we cannot
   * read your drives" is true of coordinates and false of the words beside
   * them. The page has to say so in the same breath, or the claim overreaches.
   */
  it('keeps the limit on the encryption claim visible', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/honest limit/i);
    expect(container.textContent).toMatch(/stored as ordinary text/i);
    // The backup window is the other place the guarantee does not reach.
    expect(container.textContent).toMatch(/survive in a backup/i);
  });

  it('states the one-year window on drives and their GPS trails', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/kept for one year, then deleted\s+automatically/i);
    expect(container.textContent).toMatch(/older than 365 days/i);
    // The claim it replaced, in the present tense only: the "what changed"
    // section legitimately says drives WERE kept indefinitely, and that
    // sentence is the page keeping its promise to record the change. A page
    // that says they ARE is a page whose pruner stopped running.
    expect(container.textContent).not.toMatch(/are kept indefinitely/i);
  });

  it('discloses the GPS trail kept for every drive', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/GPS trail/i);
  });

  it('discloses the first names carried in an invite link', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/first names/i);
  });

  it('states what a shared viewer no longer sees, and that the VIN is still withheld', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(
      /What is playing on its screen[\s\S]*withheld[\s\S]*cannot\s+send the car any command/i,
    );
    expect(container.textContent).toMatch(/whether it is locked/i);
    expect(container.textContent).toMatch(/and the VIN are all withheld/i);
    // The shape the mask used to have. Owner-minus-VIN is what MYR-435 removed.
    expect(container.textContent).not.toMatch(/only thing withheld from a viewer/i);
  });

  it('keeps drive history owner-only', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/Drive history is not shared/i);
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
