import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FSDSection } from '@/features/drives/components/FSDSection';

describe('FSDSection', () => {
  const props = {
    fsdPercentage: 82,
    fsdMiles: 11.7,
    interventions: 1,
  };

  it('renders the section heading', () => {
    render(<FSDSection {...props} />);
    expect(screen.getByText('Full Self-Driving')).toBeInTheDocument();
  });

  it('renders the FSD percentage', () => {
    render(<FSDSection {...props} />);
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('renders the FSD miles', () => {
    render(<FSDSection {...props} />);
    expect(screen.getByText('11.7 mi')).toBeInTheDocument();
  });

  it('shows singular "intervention" for 1', () => {
    render(<FSDSection {...props} />);
    expect(screen.getByText('intervention')).toBeInTheDocument();
  });

  it('shows plural "interventions" for multiple', () => {
    render(<FSDSection {...props} interventions={3} />);
    expect(screen.getByText('interventions')).toBeInTheDocument();
  });

  it('renders the progress bar with correct width', () => {
    const { container } = render(<FSDSection {...props} />);
    const bar = container.querySelector('.bg-gold');
    expect(bar?.getAttribute('style')).toContain('width: 82%');
  });
});
