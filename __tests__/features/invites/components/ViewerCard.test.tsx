import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewerCard } from '@/features/invites/components/ViewerCard';
import type { Invite } from '@/types/invite';

const onlineInvite: Invite = {
  id: '1',
  label: 'Alice',
  email: 'alice@example.com',
  status: 'accepted',
  permission: 'live+history',
  sentDate: '2024-01-01',
  acceptedDate: '2024-01-02',
  lastSeen: '5 min ago',
  isOnline: true,
};

const offlineInvite: Invite = {
  ...onlineInvite,
  id: '2',
  label: 'Bob',
  isOnline: false,
  lastSeen: '2 hours ago',
  permission: 'live',
};

describe('ViewerCard', () => {
  it('renders the viewer name', () => {
    render(<ViewerCard invite={onlineInvite} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders the initial as avatar', () => {
    render(<ViewerCard invite={onlineInvite} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows "Full access" for live+history permission', () => {
    render(<ViewerCard invite={onlineInvite} />);
    expect(screen.getByText('Full access')).toBeInTheDocument();
  });

  it('shows "Live only" for live permission', () => {
    render(<ViewerCard invite={offlineInvite} />);
    expect(screen.getByText('Live only')).toBeInTheDocument();
  });

  it('shows "Online now" when online', () => {
    render(<ViewerCard invite={onlineInvite} />);
    expect(screen.getByText('Online now')).toBeInTheDocument();
  });

  it('shows last seen time when offline', () => {
    render(<ViewerCard invite={offlineInvite} />);
    expect(screen.getByText('Last seen 2 hours ago')).toBeInTheDocument();
  });

  it('renders a revoke button with accessible label', () => {
    render(<ViewerCard invite={onlineInvite} />);
    expect(screen.getByLabelText('Revoke access for Alice')).toBeInTheDocument();
  });
});
