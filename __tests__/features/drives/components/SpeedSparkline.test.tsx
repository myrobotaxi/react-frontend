import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpeedSparkline } from '@/features/drives/components/SpeedSparkline';

describe('SpeedSparkline', () => {
  const props = {
    durationMinutes: 45,
    avgSpeedMph: 35,
    maxSpeedMph: 65,
    startTime: '2:15 PM',
    endTime: '3:00 PM',
  };

  it('renders the heading', () => {
    render(<SpeedSparkline {...props} />);
    expect(screen.getByText('Speed over time')).toBeInTheDocument();
  });

  it('renders start and end time labels', () => {
    render(<SpeedSparkline {...props} />);
    expect(screen.getByText('2:15 PM')).toBeInTheDocument();
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
  });

  it('renders an SVG chart with role="img"', () => {
    const { container } = render(<SpeedSparkline {...props} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('role')).toBe('img');
  });

  it('includes an aria-label with speed info', () => {
    const { container } = render(<SpeedSparkline {...props} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toContain('35');
    expect(svg?.getAttribute('aria-label')).toContain('65');
  });

  it('renders a polyline (the sparkline)', () => {
    const { container } = render(<SpeedSparkline {...props} />);
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeTruthy();
    expect(polyline?.getAttribute('stroke')).toBe('#C9A84C');
  });

  it('renders a gradient fill polygon', () => {
    const { container } = render(<SpeedSparkline {...props} />);
    const polygon = container.querySelector('polygon');
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute('fill')).toContain('goldGradient');
  });
});
