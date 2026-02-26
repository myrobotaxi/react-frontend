import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update the value before the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a');
  });

  it('updates the value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('b');
  });

  it('resets the timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(200); });
    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a'); // still hasn't settled

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('c'); // 200+100 = 300ms since last change
  });

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });
    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe(1);

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe(2);
  });

  it('works with object values', () => {
    const obj1 = { x: 1 };
    const obj2 = { x: 2 };
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: obj1 } },
    );

    rerender({ value: obj2 });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe(obj2);
  });
});
