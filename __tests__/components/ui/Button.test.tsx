import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('defaults to primary variant with gold styling', () => {
    const { container } = render(<Button>Primary</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-gold');
  });

  it('renders secondary variant with border', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('border');
    expect(btn?.className).not.toContain('bg-gold');
  });

  it('renders social variant with border', () => {
    const { container } = render(<Button variant="social">Social</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('border');
  });

  it('renders icon when provided', () => {
    render(
      <Button icon={<span data-testid="icon">★</span>}>With Icon</Button>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('respects the disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('passes through additional HTML attributes', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('merges additional className', () => {
    const { container } = render(<Button className="mt-4">Custom</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('mt-4');
  });
});
