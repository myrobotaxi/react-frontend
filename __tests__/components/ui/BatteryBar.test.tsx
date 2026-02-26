import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatteryBar } from '@/components/ui/BatteryBar';

describe('BatteryBar', () => {
  it('renders the percentage label by default', () => {
    render(<BatteryBar level={78} />);
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('hides the label when showLabel is false', () => {
    render(<BatteryBar level={78} showLabel={false} />);
    expect(screen.queryByText('78%')).not.toBeInTheDocument();
  });

  it('sets the progress bar width based on level', () => {
    const { container } = render(<BatteryBar level={42} />);
    const bar = container.querySelector('[style*="width"]');
    expect(bar?.getAttribute('style')).toContain('width: 42%');
  });

  it('applies green color class for high battery (>50)', () => {
    const { container } = render(<BatteryBar level={78} />);
    const bar = container.querySelector('.bg-battery-high');
    expect(bar).toBeTruthy();
  });

  it('applies yellow color class for mid battery (21-50)', () => {
    const { container } = render(<BatteryBar level={35} />);
    const bar = container.querySelector('.bg-battery-mid');
    expect(bar).toBeTruthy();
  });

  it('applies red color class for low battery (<=20)', () => {
    const { container } = render(<BatteryBar level={15} />);
    const bar = container.querySelector('.bg-battery-low');
    expect(bar).toBeTruthy();
  });

  it('applies matching text color class', () => {
    const { container } = render(<BatteryBar level={78} />);
    const label = container.querySelector('.text-battery-high');
    expect(label).toBeTruthy();
  });
});
