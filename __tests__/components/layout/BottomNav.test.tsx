import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '@/components/layout/BottomNav';

// Mock next/navigation
let mockPathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('BottomNav', () => {
  it('renders all four nav tabs', () => {
    render(<BottomNav />);
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Drives')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('marks the Map tab as current on /', () => {
    mockPathname = '/';
    render(<BottomNav />);
    const mapLink = screen.getByText('Map').closest('a');
    expect(mapLink?.getAttribute('aria-current')).toBe('page');
  });

  it('marks the Drives tab as current on /drives', () => {
    mockPathname = '/drives';
    render(<BottomNav />);
    const drivesLink = screen.getByText('Drives').closest('a');
    expect(drivesLink?.getAttribute('aria-current')).toBe('page');
  });

  it('marks the Drives tab as current on /drives/[id]', () => {
    mockPathname = '/drives/abc-123';
    render(<BottomNav />);
    const drivesLink = screen.getByText('Drives').closest('a');
    expect(drivesLink?.getAttribute('aria-current')).toBe('page');
  });

  it('marks the Settings tab as current on /settings', () => {
    mockPathname = '/settings';
    render(<BottomNav />);
    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink?.getAttribute('aria-current')).toBe('page');
  });

  it('does not set aria-current on inactive tabs', () => {
    mockPathname = '/';
    render(<BottomNav />);
    const drivesLink = screen.getByText('Drives').closest('a');
    expect(drivesLink?.getAttribute('aria-current')).toBeNull();
  });

  it('has aria-label on the nav element', () => {
    render(<BottomNav />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });
});
