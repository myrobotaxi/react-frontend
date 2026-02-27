import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('passes through HTML input attributes', () => {
    render(<Input type="email" name="email" placeholder="Email" />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('does not show error message when error is undefined', () => {
    const { container } = render(<Input placeholder="Name" />);
    expect(container.querySelector('span')).toBeNull();
  });

  it('shows error message when error prop is provided', () => {
    render(<Input placeholder="Name" error="Name is required" />);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input placeholder="Type here" onChange={handleChange} />);

    await user.type(screen.getByPlaceholderText('Type here'), 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('merges additional className', () => {
    const { container } = render(<Input className="mt-2" placeholder="Test" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('mt-2');
  });
});
