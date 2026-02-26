import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/ui/Logo';

describe('Logo', () => {
  it('renders the wordmark by default', () => {
    render(<Logo />);
    expect(screen.getByText('Robo')).toBeInTheDocument();
  });

  it('renders the full brand name', () => {
    const { container } = render(<Logo />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('MyRoboTaxi');
  });

  it('hides the wordmark when showWordmark is false', () => {
    const { container } = render(<Logo showWordmark={false} />);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('renders the SVG logo', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders at large size by default', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('48');
  });

  it('renders at small size', () => {
    const { container } = render(<Logo size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('40');
  });
});
