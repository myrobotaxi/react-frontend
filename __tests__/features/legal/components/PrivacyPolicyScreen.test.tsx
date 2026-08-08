import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PrivacyPolicyScreen } from '@/features/legal/components/PrivacyPolicyScreen';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_EFFECTIVE_DATE_ISO,
  SUPPORT_CONTACT_EMAIL,
} from '@/lib/constants';

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

  /**
   * Both mailboxes, and neither of them a person.
   *
   * A privacy policy naming a developer's personal address makes the promises
   * on it expire with that developer's inbox. The split matters too: a reader
   * exercising a right should not have to guess whether the support queue is
   * the right queue.
   */
  it('publishes a company mailbox for data requests and another for support', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    const [privacyLink] = screen.getAllByRole('link', { name: PRIVACY_CONTACT_EMAIL });
    expect(privacyLink).toHaveAttribute('href', `mailto:${PRIVACY_CONTACT_EMAIL}`);

    const [supportLink] = screen.getAllByRole('link', { name: SUPPORT_CONTACT_EMAIL });
    expect(supportLink).toHaveAttribute('href', `mailto:${SUPPORT_CONTACT_EMAIL}`);

    // No personal address anywhere on a public legal page.
    expect(container.textContent).not.toMatch(/@gmail\.com/i);
  });

  it('says who we are and where the data is held', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/MyRoboTaxi[\s\S]{0,80}operates from the United States/i);
    expect(container.textContent).toMatch(/hosted in the United States/i);
    // The consequence of that location, for the readers it actually costs
    // something — stated on the page rather than left to be inferred.
    expect(container.textContent).toMatch(/transferred to the United States/i);
  });

  /**
   * The processor list.
   *
   * Mapbox stays, and the reason is worth writing down because it was very
   * nearly removed. It is genuinely dead on the two surfaces people look at:
   * the web app's `src/components/map/*` and `src/lib/geocode.ts` are
   * unreachable behind the lockdown in `src/proxy.ts`, and the iOS app replaced
   * Mapbox GL with MapKit outright. But the policy's claim is about the SERVER,
   * and there it is live — `telemetry/internal/geocode/geocode.go` calls
   * api.mapbox.com for drive start and end, parked location, and navigation
   * destination, wired whenever `MAPBOX_TOKEN` is set, which it is on the
   * production Fly app.
   *
   * Dropping the name would have concealed a processor that receives precise
   * user coordinates — the one omission on this page that could not be
   * characterised as a wording choice.
   */
  it('names every company that processes data', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    for (const processor of [
      'Apple',
      'Tesla',
      'Fly.io',
      'Supabase',
      'Vercel',
      'Mapbox',
      'Sentry',
    ]) {
      expect(container.textContent).toContain(processor);
    }
  });

  /**
   * Where the Mapbox geocoding happens, pinned.
   *
   * "We send coordinates to Mapbox" with no boundary invites the reader to
   * assume their phone is doing it. It is not: the app and this website never
   * contact Mapbox, and saying so is the difference between disclosing a
   * processor and alarming people about the wrong one.
   */
  it('confines the Mapbox geocoding to the server', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/on our\s+server and nowhere else/i);
    expect(container.textContent).toMatch(
      /Neither the iOS app nor this website contacts Mapbox/i,
    );
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
    expect(container.textContent).toMatch(/never sell personal data/i);
  });

  /**
   * The breach commitment, pinned to its number.
   *
   * "Without undue delay" on its own is the phrasing that lets a notice arrive
   * whenever it arrives. The 72 hours is what makes it a commitment, so the
   * number is what the test guards.
   */
  it('commits to a 72-hour breach notification', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/without undue delay/i);
    expect(container.textContent).toMatch(/within 72 hours of confirming it/i);
  });

  /**
   * Change of control. All three halves: the protections travel with the data,
   * the notice comes first, and a shutdown ends in deletion rather than in an
   * unattended database.
   */
  it('commits to what happens to data if the company changes hands', () => {
    const { container } = render(<PrivacyPolicyScreen />);

    expect(container.textContent).toMatch(/at least as strong as the ones on this page/i);
    expect(container.textContent).toMatch(/tell you before that happens/i);
    expect(container.textContent).toMatch(/deleted within thirty days of the service ending/i);
  });

  /**
   * Booking a ride for someone else is not a feature.
   *
   * It was removed from the rider surface; only deprecated wire fields remain,
   * with no UI that writes them. A policy describing the collection of a
   * passenger's name and phone number would be describing a product that does
   * not exist — the rarer failure mode of over-disclosure, and still a false
   * statement about what we collect.
   */
  it('does not describe collecting details for a third-party passenger', () => {
    const { container } = render(<PrivacyPolicyScreen />);
    const text = container.textContent ?? '';

    expect(text).not.toMatch(/passenger['’]?s? (name|phone)/i);
    expect(text).not.toMatch(/passenger phone numbers/i);
    expect(text).not.toMatch(/booking a ride for (somebody|someone) else/i);
  });
});
