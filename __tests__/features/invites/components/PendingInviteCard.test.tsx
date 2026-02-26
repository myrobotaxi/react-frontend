import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PendingInviteCard } from '@/features/invites/components/PendingInviteCard';
import type { Invite } from '@/types/invite';

const pendingInvite: Invite = {
  id: '1',
  label: 'Charlie',
  email: 'charlie@example.com',
  status: 'pending',
  permission: 'live',
  sentDate: '2024-01-15',
};

describe('PendingInviteCard', () => {
  it('renders the invite label', () => {
    render(<PendingInviteCard invite={pendingInvite} />);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders the email', () => {
    render(<PendingInviteCard invite={pendingInvite} />);
    expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
  });

  it('renders the initial as avatar', () => {
    render(<PendingInviteCard invite={pendingInvite} />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders a Resend button with accessible label', () => {
    render(<PendingInviteCard invite={pendingInvite} />);
    expect(screen.getByLabelText('Resend invite to Charlie')).toBeInTheDocument();
  });

  it('renders a Cancel button with accessible label', () => {
    render(<PendingInviteCard invite={pendingInvite} />);
    expect(screen.getByLabelText('Cancel invite for Charlie')).toBeInTheDocument();
  });
});
