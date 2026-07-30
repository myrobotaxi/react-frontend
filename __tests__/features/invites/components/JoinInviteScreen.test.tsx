import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { JoinInviteScreen } from '@/features/invites/components/JoinInviteScreen';
import { TESTFLIGHT_JOIN_URL } from '@/lib/constants';

describe('JoinInviteScreen — with a code', () => {
  it('renders the invite headline', () => {
    render(<JoinInviteScreen code="RBO246" />);
    expect(
      screen.getByRole('heading', { name: /invited to ride a Tesla on MyRoboTaxi/i }),
    ).toBeInTheDocument();
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

  it('falls back to generic step copy', () => {
    render(<JoinInviteScreen code={null} />);
    expect(screen.getByText(/enter the code the sender gave you/i)).toBeInTheDocument();
  });
});

describe('JoinInviteScreen — standalone surface', () => {
  it('renders no internal navigation links', () => {
    const { container } = render(<JoinInviteScreen code="RBO246" />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual([TESTFLIGHT_JOIN_URL]);
    for (const href of hrefs) {
      expect(href?.startsWith('/')).toBe(false);
    }
  });
});
