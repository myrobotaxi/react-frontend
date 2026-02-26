import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('renders the driving label', () => {
    render(<StatusBadge status="driving" />);
    expect(screen.getByText('Driving')).toBeInTheDocument();
  });

  it('renders the parked label', () => {
    render(<StatusBadge status="parked" />);
    expect(screen.getByText('Parked')).toBeInTheDocument();
  });

  it('renders the charging label', () => {
    render(<StatusBadge status="charging" />);
    expect(screen.getByText('Charging')).toBeInTheDocument();
  });

  it('renders the offline label', () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('applies the correct status color to the label', () => {
    const { container } = render(<StatusBadge status="driving" />);
    const labelSpan = container.querySelectorAll('span')[2]; // outer > dot, label
    expect(labelSpan.style.color).toBe('rgb(48, 209, 88)'); // #30D158
  });

  it('renders a colored dot indicator', () => {
    const { container } = render(<StatusBadge status="parked" />);
    const dot = container.querySelector('.w-2.h-2.rounded-full');
    expect(dot).toBeTruthy();
    // jsdom normalizes hex colors to rgb() format
    expect(dot?.getAttribute('style')).toContain('background-color');
    expect(dot?.getAttribute('style')).toContain('rgb(59, 130, 246)');
  });
});
