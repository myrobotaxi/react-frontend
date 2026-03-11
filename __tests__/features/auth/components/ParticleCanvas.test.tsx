import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

import { ParticleCanvas } from '@/features/auth/components/ParticleCanvas';

const mockMatchMedia = vi.fn();

beforeEach(() => {
  mockMatchMedia.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });
});

describe('ParticleCanvas', () => {
  it('renders a canvas element', () => {
    const { container } = render(<ParticleCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies fixed positioning for full viewport coverage', () => {
    const { container } = render(<ParticleCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toContain('fixed');
    expect(canvas?.className).toContain('inset-0');
  });

  it('is hidden from screen readers', () => {
    const { container } = render(<ParticleCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('checks prefers-reduced-motion media query', () => {
    render(<ParticleCanvas />);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});
