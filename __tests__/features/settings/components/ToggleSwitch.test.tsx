import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from '@/features/settings/components/ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders as a switch role', () => {
    render(<ToggleSwitch enabled={false} onToggle={() => {}} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('shows aria-checked=false when disabled', () => {
    render(<ToggleSwitch enabled={false} onToggle={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('shows aria-checked=true when enabled', () => {
    render(<ToggleSwitch enabled={true} onToggle={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle when clicked', () => {
    const handler = vi.fn();
    render(<ToggleSwitch enabled={false} onToggle={handler} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('is a button type to prevent form submission', () => {
    render(<ToggleSwitch enabled={false} onToggle={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('type', 'button');
  });
});
