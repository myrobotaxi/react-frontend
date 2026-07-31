import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ComingSoonScreen } from '@/features/landing/components/ComingSoonScreen';

/**
 * The root page — what anyone who types https://myrobotaxi.app gets.
 *
 * Every assertion here is about what is NOT on the page as much as what is: the
 * teaser exists so the apex domain stops handing out the invite experience, and
 * a link, a button, or a mention of invites creeping back in would undo that.
 */
describe('ComingSoonScreen', () => {
  it('renders the brand lockup — the mark and the wordmark', () => {
    render(<ComingSoonScreen />);

    expect(screen.getByRole('heading', { name: /myrobotaxi/i })).toBeInTheDocument();
  });

  it('says one thing, and that thing is "Coming soon"', () => {
    render(<ComingSoonScreen />);

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('has no links at all — internal or outbound', () => {
    const { container } = render(<ComingSoonScreen />);

    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('has no navigation, buttons, or forms', () => {
    const { container } = render(<ComingSoonScreen />);

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelectorAll('form')).toHaveLength(0);
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('never mentions the invite surface or TestFlight', () => {
    const { container } = render(<ComingSoonScreen />);

    expect(container.textContent).not.toMatch(/invite|testflight|join/i);
  });
});
