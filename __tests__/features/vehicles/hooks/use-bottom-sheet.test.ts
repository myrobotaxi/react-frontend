import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBottomSheet } from '@/features/vehicles/hooks/use-bottom-sheet';
import { SHEET_PEEK_HEIGHT } from '@/lib/constants';

describe('useBottomSheet', () => {
  it('defaults to peek state', () => {
    const { result } = renderHook(() => useBottomSheet());

    expect(result.current.sheetState).toBe('peek');
    expect(result.current.isDragging).toBe(false);
  });

  it('initializes with peek height', () => {
    const { result } = renderHook(() => useBottomSheet());

    expect(result.current.currentHeight).toBe(SHEET_PEEK_HEIGHT);
  });

  it('can be initialized with half state', () => {
    const { result } = renderHook(() => useBottomSheet('half'));

    expect(result.current.sheetState).toBe('half');
  });

  it('returns touch event handlers', () => {
    const { result } = renderHook(() => useBottomSheet());

    expect(typeof result.current.onTouchStart).toBe('function');
    expect(typeof result.current.onTouchMove).toBe('function');
    expect(typeof result.current.onTouchEnd).toBe('function');
  });

  it('returns stable handler references across renders', () => {
    const { result, rerender } = renderHook(() => useBottomSheet());

    const firstStart = result.current.onTouchStart;
    const firstMove = result.current.onTouchMove;

    rerender();

    // Same state = same callbacks (useCallback)
    expect(result.current.onTouchStart).toBe(firstStart);
    expect(result.current.onTouchMove).toBe(firstMove);
  });
});
