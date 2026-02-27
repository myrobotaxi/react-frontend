'use client';

import { useState, useCallback } from 'react';

/**
 * Persists state to localStorage with automatic JSON serialization.
 * Falls back to the initial value if the key doesn't exist or parsing fails.
 * Returns a setter that writes to both state and localStorage.
 *
 * @param key - localStorage key
 * @param initialValue - Default value when no stored value exists
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;

        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          console.warn(`[useLocalStorage] Failed to write key "${key}"`);
        }

        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
