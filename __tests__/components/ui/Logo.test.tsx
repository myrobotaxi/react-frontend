import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/ui/Logo';

/**
 * These assertions are the guard against the brand drifting back to the
 * invented lockup this component shipped with: a gold hexagon outline with a
 * center dot, over a tri-color "My<gold>Robo</gold>Taxi" wordmark. Neither
 * exists in the design system.
 */
describe('Logo — wordmark', () => {
  it('renders the wordmark by default', () => {
    render(<Logo />);
    expect(screen.getByText('myrobotaxi')).toBeInTheDocument();
  });

  it('sets the wordmark uppercase via text-transform, not camel case', () => {
    const { container } = render(<Logo />);
    const h1 = container.querySelector('h1');

    expect(h1?.textContent).toBe('myrobotaxi');
    expect(h1?.className).toContain('uppercase');
  });

  it('renders the wordmark in a single color — no nested spans', () => {
    const { container } = render(<Logo />);
    const h1 = container.querySelector('h1');

    expect(h1?.querySelectorAll('span')).toHaveLength(0);
    expect(h1?.className).toContain('text-text-primary');
  });

  it('sets the wordmark in the brand typeface at the design letter-spacing', () => {
    const { container } = render(<Logo />);
    const h1 = container.querySelector('h1');

    expect(h1?.className).toContain('font-brand');
    expect(h1?.className).toContain('font-medium');
    expect(h1?.className).toContain('tracking-[0.04em]');
  });

  it('hides the wordmark when showWordmark is false', () => {
    const { container } = render(<Logo showWordmark={false} />);
    expect(container.querySelector('h1')).toBeNull();
  });
});

describe('Logo — brand mark', () => {
  it('draws the two-tone facet arrow', () => {
    const { container } = render(<Logo />);
    const polygons = container.querySelectorAll('polygon');

    expect(polygons).toHaveLength(2);
    expect(polygons[0].getAttribute('points')).toBe('50,12 50,64 18,85');
    expect(polygons[0].getAttribute('fill')).toBe('#E4D08A');
    expect(polygons[1].getAttribute('points')).toBe('50,12 82,85 50,64');
    expect(polygons[1].getAttribute('fill')).toBe('#9C7E2C');
    expect(container.querySelector('g')?.getAttribute('transform')).toBe('rotate(-22 50 50)');
  });

  it('draws no hexagon and no center dot', () => {
    const { container } = render(<Logo />);

    expect(container.querySelector('path')).toBeNull();
    expect(container.querySelector('circle')).toBeNull();
  });

  it('hides the mark from assistive tech', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the arrow at 56% of the tile at large size', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('34.72');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('renders the arrow at 56% of the tile at small size', () => {
    const { container } = render(<Logo size="sm" />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('22.4');
  });

  it('carries no glow by default and adds one on request', () => {
    const withoutGlow = render(<Logo />).container.innerHTML;
    const withGlow = render(<Logo glow />).container.innerHTML;

    expect(withoutGlow).not.toContain('rounded-full');
    expect(withGlow).toContain('rounded-full');
  });
});
