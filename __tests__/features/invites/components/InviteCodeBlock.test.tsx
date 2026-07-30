import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { InviteCodeBlock } from '@/features/invites/components/InviteCodeBlock';

describe('InviteCodeBlock', () => {
  const writeText = vi.fn<(text: string) => Promise<void>>();

  // `userEvent.setup()` installs its own clipboard stub, which would mask the
  // component's real call — drive these with fireEvent instead.
  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the code', () => {
    render(<InviteCodeBlock code="RBO246" />);
    expect(screen.getByTestId('invite-code')).toHaveTextContent('RBO246');
  });

  it('copies the code to the clipboard', async () => {
    render(<InviteCodeBlock code="RBO246" />);

    fireEvent.click(screen.getByRole('button', { name: /copy invite code/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('RBO246'));
  });

  it('confirms the copy in the button label', async () => {
    render(<InviteCodeBlock code="RBO246" />);

    fireEvent.click(screen.getByRole('button', { name: /copy invite code/i }));

    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Copied'));
  });

  it('does not throw when the clipboard is unavailable', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    render(<InviteCodeBlock code="RBO246" />);

    fireEvent.click(screen.getByRole('button', { name: /copy invite code/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    // The code stays on screen and selectable; the label never flips to Copied.
    expect(screen.getByTestId('invite-code')).toHaveTextContent('RBO246');
    expect(screen.getByRole('button')).toHaveTextContent('Copy code');
  });
});
