import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageHeader } from '@/components/layout/PageHeader';

// Mock next/navigation
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Drives" />);
    expect(screen.getByText('Drives')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<PageHeader title="Drives" subtitle="Your recent drives" />);
    expect(screen.getByText('Your recent drives')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    const { container } = render(<PageHeader title="Drives" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('does not render back button by default', () => {
    render(<PageHeader title="Drives" />);
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });

  it('renders back button when showBack is true', () => {
    render(<PageHeader title="Drives" showBack />);
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  it('navigates back on click', () => {
    render(<PageHeader title="Drives" showBack />);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('renders action when provided', () => {
    render(<PageHeader title="Drives" action={<button>Sort</button>} />);
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });
});
