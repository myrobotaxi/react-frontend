import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';
import { PRIVACY_ROUTE, TESTFLIGHT_JOIN_URL } from '@/lib/constants';

describe('JoinInviteScreen — with a code', () => {
  it('renders the invite headline', () => {
    render(<JoinInviteScreen code="RBO246" />);
    expect(screen.getByRole('heading', { name: "You're invited! 🎉" })).toBeInTheDocument();
  });

  it('shows the code prominently', () => {
    render(<JoinInviteScreen code="RBO246" />);
    expect(screen.getByTestId('invite-code')).toHaveTextContent('RBO246');
  });

  it('offers a copy button for the code', () => {
    render(<JoinInviteScreen code="RBO246" />);
    expect(screen.getByRole('button', { name: /copy invite code/i })).toBeInTheDocument();
  });

  it('links to the public TestFlight build', () => {
    render(<JoinInviteScreen code="RBO246" />);
    const link = screen.getByRole('link', { name: /get the app on testflight/i });
    expect(link).toHaveAttribute('href', TESTFLIGHT_JOIN_URL);
  });

  /**
   * MYR-453 — the button this page did not have, and the reason the ticket
   * exists. A recipient who tapped the invite inside Telegram's webview gets no
   * Universal Link, lands here, and before this had one app-facing button:
   * TestFlight, carrying no code. Somebody who already had the app was sent to
   * an installer and lost their invite.
   */
  it('offers an app-open CTA carrying the exact code from the page', () => {
    render(<JoinInviteScreen code="RBO246" />);
    const link = screen.getByRole('link', { name: /open in the app/i });

    expect(link).toHaveAttribute('href', 'myrobotaxi://join/RBO246');
  });

  /**
   * Order is the fix, not just presence. The visitor most likely to be on this
   * page in the first place is one whose phone declined to open the app on its
   * own — the app-open path has to be the one they read first.
   */
  it('puts the app-open CTA before the TestFlight one', () => {
    const { container } = render(<JoinInviteScreen code="RBO246" />);
    const labels = Array.from(container.querySelectorAll('a')).map((a) => a.textContent);

    expect(labels.indexOf('Open in the app')).toBeLessThan(
      labels.indexOf('Get the app on TestFlight'),
    );
  });

  /**
   * The graceful-degradation contract, asserted as the ABSENCE of machinery.
   * There is no timer, no `visibilitychange` listener, no scripted redirect —
   * the fallback is a second labelled link the visitor can tap when the first
   * one goes nowhere. If a future change reintroduces the "did the app open?"
   * heuristic, this page stops being renderable on the server and this fails.
   */
  it('needs no client JavaScript to fall back — TestFlight stays a plain link', () => {
    render(<JoinInviteScreen code="RBO246" />);
    const fallback = screen.getByRole('link', { name: /get the app on testflight/i });

    expect(fallback).toHaveAttribute('href', TESTFLIGHT_JOIN_URL);
    expect(screen.getByText(/don't have the app yet\?/i)).toBeInTheDocument();
  });

  /** A code the page could not sanitize yields no button, not a dead one. */
  it('renders no app-open CTA for a code it cannot build a link from', () => {
    render(<JoinInviteScreen code="not-a-code" />);

    expect(screen.queryByRole('link', { name: /open in the app/i })).toBeNull();
  });

  it('suppresses the referrer on the outbound link so the code does not leak', () => {
    render(<JoinInviteScreen code="RBO246" />);
    const link = screen.getByRole('link', { name: /get the app on testflight/i });
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  it('lists the three onboarding steps', () => {
    render(<JoinInviteScreen code="RBO246" />);
    expect(screen.getByText(/install myrobotaxi from testflight/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in with apple/i)).toBeInTheDocument();
    expect(screen.getByText(/enter the code above/i)).toBeInTheDocument();
  });

  it('states the expiry window honestly without claiming to validate', () => {
    render(<JoinInviteScreen code="RBO246" />);
    expect(screen.getByText(/expire 7 days after they are sent/i)).toBeInTheDocument();
    expect(screen.getByText(/may have\s+expired/i)).toBeInTheDocument();
  });
});

describe('JoinInviteScreen — without a code', () => {
  it('renders no code section', () => {
    render(<JoinInviteScreen code={null} />);
    expect(screen.queryByTestId('invite-code')).toBeNull();
    expect(screen.queryByRole('button', { name: /copy invite code/i })).toBeNull();
  });

  it('still offers the TestFlight link', () => {
    render(<JoinInviteScreen code={null} />);
    expect(
      screen.getByRole('link', { name: /get the app on testflight/i }),
    ).toHaveAttribute('href', TESTFLIGHT_JOIN_URL);
  });

  /**
   * `myrobotaxi://join/` with no code parses to nothing on the app side, so this
   * arm is unchanged by MYR-453: one button, still the gold primary, exactly as
   * the codeless route rendered before.
   */
  it('offers no app-open CTA — there is no code to open the app on', () => {
    render(<JoinInviteScreen code={null} />);

    expect(screen.queryByRole('link', { name: /open in the app/i })).toBeNull();
    expect(screen.queryByText(/don't have the app yet\?/i)).toBeNull();
  });

  it('falls back to generic step copy', () => {
    render(<JoinInviteScreen code={null} />);
    expect(screen.getByText(/enter the code the sender gave you/i)).toBeInTheDocument();
  });
});

/**
 * MYR-359 / MYR-368 — the names the link carried, rendered in the
 * client-approved copy. The heading and sub-line here are the SAME strings the
 * page's `generateMetadata` puts in `og:title` and `og:description`, so the
 * recipient reads the same sentence before and after tapping.
 */
describe('JoinInviteScreen — named by the link', () => {
  it('greets the recipient and names the owner when the link carried both', () => {
    render(<JoinInviteScreen code="RBO246" inviterName="Alex" recipientName="Mira" />);
    expect(screen.getByRole('heading', { name: "You're in, Mira! 🎉" })).toBeInTheDocument();
    expect(
      screen.getByText('Alex is sharing their Tesla with you on MyRoboTaxi.'),
    ).toBeInTheDocument();
  });

  it('welcomes without a name when only the owner is named', () => {
    render(<JoinInviteScreen code="RBO246" inviterName="Alex" />);
    expect(screen.getByRole('heading', { name: "You're in! 🎉" })).toBeInTheDocument();
    expect(screen.getByText('Alex is sharing their Tesla with you.')).toBeInTheDocument();
  });

  it('falls back to the generic copy with no names', () => {
    for (const absent of [null, undefined]) {
      const { unmount } = render(
        <JoinInviteScreen code="RBO246" inviterName={absent} recipientName={absent} />,
      );
      expect(screen.getByRole('heading', { name: "You're invited! 🎉" })).toBeInTheDocument();
      expect(
        screen.getByText('Someone is sharing their Tesla with you on MyRoboTaxi.'),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('shows the code and both app routes exactly as before — only the copy changes', () => {
    render(<JoinInviteScreen code="RBO246" inviterName="Alex" recipientName="Mira" />);
    expect(screen.getByTestId('invite-code')).toHaveTextContent('RBO246');
    expect(screen.getByRole('link', { name: /get the app on testflight/i })).toHaveAttribute(
      'href',
      TESTFLIGHT_JOIN_URL,
    );
    expect(screen.getByRole('link', { name: /open in the app/i })).toHaveAttribute(
      'href',
      'myrobotaxi://join/RBO246',
    );
  });

  /**
   * Some invites are location-only — they grant no rides at all — so the old
   * "ride their Tesla" copy was wrong on that tier. Nothing on the page may
   * promise one again, in any variant.
   */
  it('promises no ride, whichever names the link carried', () => {
    for (const props of [
      { inviterName: 'Alex', recipientName: 'Mira' },
      { inviterName: 'Alex' },
      {},
    ]) {
      const { container, unmount } = render(<JoinInviteScreen code="RBO246" {...props} />);
      expect(container.textContent).not.toMatch(/ride/i);
      unmount();
    }
  });
});

describe('JoinInviteScreen — standalone surface', () => {
  /**
   * The page links to exactly three places and no others: the installed app,
   * TestFlight, and the privacy policy (MYR-427) — which is here because a
   * recipient deciding whether to install the app should be able to read what it
   * collects first.
   *
   * The assertion is on the exact list rather than on a count, so a link back
   * into the retired app cannot appear without failing this test. That was the
   * original point of this case and it still holds; only the allowed set grew —
   * MYR-453 added the first entry, and the in-app URL is the only new
   * destination it is allowed to have added.
   */
  it('links only to the app, TestFlight and the privacy policy', () => {
    const { container } = render(<JoinInviteScreen code="RBO246" />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(['myrobotaxi://join/RBO246', TESTFLIGHT_JOIN_URL, PRIVACY_ROUTE]);
  });

  /** The codeless arm keeps the original two-link surface untouched. */
  it('links only to TestFlight and the privacy policy without a code', () => {
    const { container } = render(<JoinInviteScreen code={null} />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual([TESTFLIGHT_JOIN_URL, PRIVACY_ROUTE]);
  });
});
