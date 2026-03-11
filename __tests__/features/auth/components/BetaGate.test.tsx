import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/features/auth/api/validate-beta-password', () => ({
  validateBetaPassword: vi.fn(),
}));

vi.mock('@/features/auth/components/ParticleCanvas', () => ({
  ParticleCanvas: () => <canvas data-testid="particle-canvas" />,
}));

import { BetaGate } from '@/features/auth/components/BetaGate';
import { validateBetaPassword } from '@/features/auth/api/validate-beta-password';

const mockValidate = vi.mocked(validateBetaPassword);

describe('BetaGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title', () => {
    render(<BetaGate />);
    expect(screen.getByText('MYROBOTAXI')).toBeInTheDocument();
  });

  it('renders password input with placeholder', () => {
    render(<BetaGate />);
    expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument();
  });

  it('renders the particle canvas', () => {
    render(<BetaGate />);
    expect(screen.getByTestId('particle-canvas')).toBeInTheDocument();
  });

  it('shows error message on invalid password', async () => {
    mockValidate.mockResolvedValue({ success: false, error: 'Invalid access code' });

    render(<BetaGate />);
    const input = screen.getByPlaceholderText('Enter access code');

    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Invalid access code')).toBeInTheDocument();
    });
  });

  it('redirects to /signin on success', async () => {
    mockValidate.mockResolvedValue({ success: true });

    render(<BetaGate />);
    const input = screen.getByPlaceholderText('Enter access code');

    fireEvent.change(input, { target: { value: 'correct' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signin');
    }, { timeout: 2000 });

    expect(mockValidate).toHaveBeenCalledWith('correct');
  });

  it('does not submit with empty password', async () => {
    render(<BetaGate />);
    const input = screen.getByPlaceholderText('Enter access code');

    fireEvent.submit(input.closest('form')!);

    expect(mockValidate).not.toHaveBeenCalled();
  });

  it('shows rate limit error', async () => {
    mockValidate.mockResolvedValue({
      success: false,
      error: 'Too many attempts. Try again later.',
    });

    render(<BetaGate />);
    const input = screen.getByPlaceholderText('Enter access code');

    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Too many attempts. Try again later.')).toBeInTheDocument();
    });
  });
});
