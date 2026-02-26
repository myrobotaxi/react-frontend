import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CarIcon } from '@/features/vehicles/components/CarIcon';

describe('CarIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<CarIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('is aria-hidden (decorative icon)', () => {
    const { container } = render(<CarIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has gold (#C9A84C) stroke colors', () => {
    const { container } = render(<CarIcon />);
    const paths = container.querySelectorAll('path');
    expect(paths[0].getAttribute('stroke')).toBe('#C9A84C');
  });

  it('renders wheel circles', () => {
    const { container } = render(<CarIcon />);
    const circles = container.querySelectorAll('circle');
    // 2 wheel outlines + 2 wheel fills + 2 headlight dots = 6 circles
    expect(circles.length).toBe(6);
  });
});
