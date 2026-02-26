import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationTimeline } from '@/features/drives/components/LocationTimeline';

describe('LocationTimeline', () => {
  const props = {
    startLocation: 'Home',
    startAddress: '123 Main St',
    endLocation: 'Work',
    endAddress: '456 Office Blvd',
  };

  it('renders start location name', () => {
    render(<LocationTimeline {...props} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders start address', () => {
    render(<LocationTimeline {...props} />);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('renders end location name', () => {
    render(<LocationTimeline {...props} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('renders end address', () => {
    render(<LocationTimeline {...props} />);
    expect(screen.getByText('456 Office Blvd')).toBeInTheDocument();
  });

  it('renders start and end dots', () => {
    const { container } = render(<LocationTimeline {...props} />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the connecting line', () => {
    const { container } = render(<LocationTimeline {...props} />);
    const line = container.querySelector('.w-px.h-8');
    expect(line).toBeTruthy();
  });
});
