import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RideJoinScreen } from '@/features/rides';
import { PRIVACY_ROUTE, TESTFLIGHT_JOIN_URL } from '@/lib/constants';
import { RIDE_JOIN_SUBLINE, RIDE_JOIN_TITLE } from '@/lib/ride-copy';

/** Collapses the whitespace JSX leaves between nodes, so text can be compared. */
function textOf(container: HTMLElement): string {
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('RideJoinScreen — with a code', () => {
  it('renders the ride join headline and sub-line', () => {
    render(<RideJoinScreen code="RBO246" />);

    expect(screen.getByRole('heading', { name: RIDE_JOIN_TITLE })).toBeInTheDocument();
    expect(screen.getByText(RIDE_JOIN_SUBLINE)).toBeInTheDocument();
  });

  it('offers an app-open CTA carrying the exact code from the page', () => {
    render(<RideJoinScreen code="RBO246" />);

    expect(screen.getByRole('link', { name: /open the ride in the app/i })).toHaveAttribute(
      'href',
      'myrobotaxi://ride/RBO246',
    );
  });

  /**
   * A group ride link lands in a chat where some people have the app and some
   * do not, so the app-open path is the common case and has to be read first —
   * the same ordering fix MYR-453 made on the invite surface.
   */
  it('puts the app-open CTA before the TestFlight one', () => {
    const { container } = render(<RideJoinScreen code="RBO246" />);
    const labels = Array.from(container.querySelectorAll('a')).map((a) => a.textContent);

    expect(labels.indexOf('Open the ride in the app')).toBeLessThan(
      labels.indexOf('Get the app on TestFlight'),
    );
  });

  it('links to the public TestFlight build', () => {
    render(<RideJoinScreen code="RBO246" />);

    expect(screen.getByRole('link', { name: /get the app on testflight/i })).toHaveAttribute(
      'href',
      TESTFLIGHT_JOIN_URL,
    );
  });

  /**
   * The graceful-degradation contract, asserted as the ABSENCE of machinery.
   * No timer, no `visibilitychange`, no scripted redirect: if a future change
   * reintroduces the "did the app open?" heuristic this page stops being
   * server-renderable, and the fallback link disappears from this assertion.
   */
  it('needs no client JavaScript to fall back', () => {
    render(<RideJoinScreen code="RBO246" />);

    expect(screen.getByRole('link', { name: /get the app on testflight/i })).toHaveAttribute(
      'href',
      TESTFLIGHT_JOIN_URL,
    );
    expect(screen.getByText(/don't have the app yet\?/i)).toBeInTheDocument();
  });

  it('suppresses the referrer on the outbound link so the code does not leak', () => {
    render(<RideJoinScreen code="RBO246" />);

    expect(
      screen.getByRole('link', { name: /get the app on testflight/i }).getAttribute('rel'),
    ).toContain('noreferrer');
  });

  it('lists the three onboarding steps', () => {
    render(<RideJoinScreen code="RBO246" />);

    expect(screen.getByText(/install myrobotaxi from testflight/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in with apple/i)).toBeInTheDocument();
    expect(screen.getByText(/open this link again to join the ride/i)).toBeInTheDocument();
  });

  /**
   * The invite page's third step is "Enter the code above". There is no ride
   * code screen in the app, so telling somebody to type one would be a dead end
   * one step later.
   */
  it('never tells the visitor to type a code in', () => {
    const { container } = render(<RideJoinScreen code="RBO246" />);

    expect(textOf(container)).not.toMatch(/enter the code/i);
  });

  it('says out loud that it cannot tell whether the link still works', () => {
    render(<RideJoinScreen code="RBO246" />);

    expect(screen.getByText(/stops working once the ride ends/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot tell whether it has/i)).toBeInTheDocument();
  });
});

describe('RideJoinScreen — without a usable code', () => {
  it('renders no app-open CTA rather than a tappable dead end', () => {
    render(<RideJoinScreen code={null} />);

    expect(screen.queryByRole('link', { name: /open the ride in the app/i })).toBeNull();
    expect(screen.queryByText(/don't have the app yet\?/i)).toBeNull();
  });

  it('still offers the TestFlight link, as the primary action', () => {
    render(<RideJoinScreen code={null} />);

    expect(screen.getByRole('link', { name: /get the app on testflight/i })).toHaveAttribute(
      'href',
      TESTFLIGHT_JOIN_URL,
    );
  });

  it('falls back to step copy that does not assume this link is the ride link', () => {
    render(<RideJoinScreen code={null} />);

    expect(screen.getByText(/open the ride link you were sent/i)).toBeInTheDocument();
  });
});

/**
 * MYR-540's absolute rule: THE LANDING PAGE RENDERS ZERO RIDE DATA.
 *
 * These are the cases that make it a checked property rather than a promise in
 * a comment. The surface is open — a ride link is forwarded into group chats
 * and scraped by every platform that sees it — and behind it is a live
 * location, so anything rendered here is published to an audience nobody chose.
 */
describe('RideJoinScreen — renders zero ride data', () => {
  it('never prints the code, in any casing', () => {
    const { container } = render(<RideJoinScreen code="RBO246" />);

    expect(textOf(container)).not.toMatch(/RBO246/i);
    expect(screen.queryByTestId('invite-code')).toBeNull();
    expect(screen.queryByTestId('ride-code')).toBeNull();
  });

  /**
   * The code reaches EXACTLY ONE place in the DOM — the scheme URL of the
   * app-open button. Asserted over the whole rendered HTML, so a hidden input,
   * a data attribute or a copy-to-clipboard payload would fail this too.
   */
  it('lets the code reach the app-open href and nowhere else', () => {
    const { container } = render(<RideJoinScreen code="RBO246" />);
    const occurrences = (container.innerHTML.match(/RBO246/g) ?? []).length;

    expect(occurrences).toBe(1);
    expect(container.querySelector('a[href="myrobotaxi://ride/RBO246"]')).not.toBeNull();
  });

  /**
   * The whole visible surface, pinned as one string. Any new sentence fails
   * this — which is the point: content is exactly what somebody decided to put
   * here, and a reviewer sees the entire page in the diff.
   */
  it('renders exactly this copy and nothing else', () => {
    const { container } = render(<RideJoinScreen code="RBO246" />);

    expect(textOf(container)).toBe(
      [
        // The brand lockup's wordmark.
        'myrobotaxi',
        RIDE_JOIN_TITLE,
        RIDE_JOIN_SUBLINE,
        'Open the ride in the app',
        "Don't have the app yet?",
        'Get the app on TestFlight',
        '1',
        'Install MyRoboTaxi from TestFlight',
        '2',
        'Sign in with Apple',
        '3',
        'Open this link again to join the ride',
        'This page never shows the ride — where the car is, who is on board, or' +
          ' when it arrives is in the app, after you sign in. A ride link stops' +
          ' working once the ride ends, and this page cannot tell whether it has;' +
          ' if the app says the link is closed, ask for a new one.',
        'Privacy',
      ].join(''),
    );
  });

  /** Two different codes must render the same page but for that one href. */
  it('renders the same page for every code', () => {
    const { container: a } = render(<RideJoinScreen code="RBO246" />);
    const { container: b } = render(<RideJoinScreen code="ZZZZZZ" />);

    expect(textOf(a)).toBe(textOf(b));
    expect(a.innerHTML.replace(/RBO246/g, 'X')).toBe(b.innerHTML.replace(/ZZZZZZ/g, 'X'));
  });

  /** No image, no canvas, no iframe — nothing that could carry a map. */
  it('embeds no image, map or frame', () => {
    const { container } = render(<RideJoinScreen code="RBO246" />);

    expect(container.querySelectorAll('img, canvas, iframe, video')).toHaveLength(0);
  });
});

describe('RideJoinScreen — standalone surface', () => {
  /**
   * Exactly three destinations: the installed app, TestFlight, and the privacy
   * policy (MYR-427). The assertion is on the exact list rather than a count,
   * so a link back into the retired app — or anywhere else — cannot appear
   * without failing this.
   */
  it('links only to the app, TestFlight and the privacy policy', () => {
    const { container } = render(<RideJoinScreen code="RBO246" />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(['myrobotaxi://ride/RBO246', TESTFLIGHT_JOIN_URL, PRIVACY_ROUTE]);
  });

  it('links only to TestFlight and the privacy policy without a code', () => {
    const { container } = render(<RideJoinScreen code={null} />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual([TESTFLIGHT_JOIN_URL, PRIVACY_ROUTE]);
  });
});
