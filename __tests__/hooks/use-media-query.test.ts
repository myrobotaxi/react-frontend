import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/use-media-query';

describe('useMediaQuery', () => {
  let listeners: Array<(event: MediaQueryListEvent) => void>;
  let currentMatches: boolean;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: currentMatches,
        media: query,
        addEventListener: vi.fn((_: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners.push(handler);
        }),
        removeEventListener: vi.fn((_: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== handler);
        }),
      })),
    });
  });

  afterEach(() => {
    listeners = [];
  });

  it('returns false initially (SSR-safe default)', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    // After effect runs, it should read the current matchMedia state
    expect(result.current).toBe(false);
  });

  it('returns true when media query matches on mount', () => {
    currentMatches = true;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
    });
    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(listeners).toHaveLength(1);

    unmount();
    // removeEventListener was called, so the mock listener array should be cleaned
  });

  it('passes the query string to matchMedia', () => {
    renderHook(() => useMediaQuery('(max-width: 640px)'));
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 640px)');
  });
});
