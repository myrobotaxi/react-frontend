import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatItem } from '@/features/drives/components/StatItem';

describe('StatItem', () => {
  it('renders the label', () => {
    render(<StatItem label="Distance" value="14.2 mi" />);
    expect(screen.getByText('Distance')).toBeInTheDocument();
  });

  it('renders the value', () => {
    render(<StatItem label="Duration" value="47 min" />);
    expect(screen.getByText('47 min')).toBeInTheDocument();
  });

  it('applies accent class when accent is true', () => {
    const { container } = render(<StatItem label="FSD" value="82%" accent />);
    const valueParagraph = container.querySelectorAll('p')[1];
    expect(valueParagraph.className).toContain('text-gold');
  });

  it('applies primary text class when accent is false', () => {
    const { container } = render(<StatItem label="Speed" value="45 mph" />);
    const valueParagraph = container.querySelectorAll('p')[1];
    expect(valueParagraph.className).toContain('text-text-primary');
  });

  it('renders label in uppercase', () => {
    const { container } = render(<StatItem label="Distance" value="14.2 mi" />);
    const label = container.querySelectorAll('p')[0];
    expect(label.className).toContain('uppercase');
  });
});
