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
 * Two properties of the document are enforced here beyond the individual
 * claims:
 *
 * 1. The storage inventory is pinned as a PAIR. What is encrypted and what is
 *    stored as text are one statement in two halves, and the encryption half
 *    alone is an overclaim — a database that yields no coordinates still yields
 *    the street a drive ended on. A test that guarded only the reassuring half
 *    would guard the wrong thing.
 * 2. The page is present tense. `states the system as it stands` fails on
 *    change-log vocabulary anywhere in the rendered text. A privacy policy that
 *    narrates its own revisions reads as unfinished, and the effective date
 *    already carries that information.
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

  /**
   * The storage inventory, pinned as one statement. Both halves are asserted in
   * a single test on purpose: whoever deletes one has to delete the assertion
   * next to the other, and the diff makes the overclaim obvious.
   */
  it('states what is encrypted alongside what is stored as text', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/AES-256-GCM ciphertext and in no other form/i);
    expect(container.textContent).toMatch(/GPS trail of every drive/i);
    // The half that keeps the half above from overclaiming: a database that
    // yields no coordinates still yields the street a drive ended on.
    expect(container.textContent).toMatch(/Stored as text/i);
    expect(container.textContent).toMatch(/street\s+address and place name for a drive/i);
  });

  it('states that the encryption key is held outside the database', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/key is held outside the database/i);
    expect(container.textContent).toMatch(/we cannot read your drives[\s\S]*neither can anyone/i);
    // The other boundary on the guarantee, stated as ordinary practice.
    expect(container.textContent).toMatch(/backups for up\s+to thirty days/i);
  });

  it('states the one-year window on drives and their GPS trails', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/kept for one year, then deleted\s+automatically/i);
    expect(container.textContent).toMatch(/older than 365 days/i);
    expect(container.textContent).not.toMatch(/kept indefinitely/i);
  });

  it('discloses the GPS trail kept for every drive', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/GPS trail/i);
  });

  it('discloses the first names carried in an invite link', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/first names/i);
  });

  it('states what a shared viewer is not shown, including the VIN', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(
      /A viewer does not see what is playing[\s\S]*cannot send the car any command/i,
    );
    expect(container.textContent).toMatch(/whether the car is locked/i);
    expect(container.textContent).toMatch(/or the VIN/i);
    // Owner-minus-VIN is the shape the server-side mask does NOT have.
    expect(container.textContent).not.toMatch(/only thing withheld from a viewer/i);
  });

  /**
   * The register of the document, enforced. Every phrase below narrates a
   * revision rather than describing the system, and one of them reappearing is
   * how a policy page drifts back into reading like a changelog.
   */
  it('states the system as it stands, without narrating changes to it', () => {
    const { container } = render(<PrivacyPolicyScreen />);
    const text = container.textContent ?? '';

    for (const changeLogPhrase of [
      /no longer/i,
      /used to/i,
      /previously/i,
      /what changed/i,
      /we will fix/i,
      /as of this writing/i,
      /work in progress/i,
      /not running yet/i,
    ]) {
      expect(text).not.toMatch(changeLogPhrase);
    }
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
