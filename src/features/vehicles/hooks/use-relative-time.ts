'use client';

import { useEffect, useState } from 'react';

import { formatRelativeTime } from '../api/vehicle-mappers';

/** Freshness threshold in milliseconds (5 minutes). */
const FRESH_THRESHOLD_MS = 5 * 60 * 1000;

/** Update interval in milliseconds (30 seconds). */
const UPDATE_INTERVAL_MS = 30 * 1000;

/** Return type of the useRelativeTime hook. */
export interface UseRelativeTimeReturn {
  /** Human-friendly relative time string (e.g., "Just now", "3m ago"). */
  text: string;
  /** Whether the data is considered fresh (updated within 5 minutes). */
  isFresh: boolean;
}

/**
 * Computes a live-updating relative time string from an ISO timestamp.
 * Auto-refreshes every 30 seconds so the display stays accurate.
 */
export function useRelativeTime(isoString: string): UseRelativeTimeReturn {
  const [text, setText] = useState(() => formatRelativeTime(isoString));
  const [isFresh, setIsFresh] = useState(() => checkFreshness(isoString));

  useEffect(() => {
    setText(formatRelativeTime(isoString));
    setIsFresh(checkFreshness(isoString));

    const interval = setInterval(() => {
      setText(formatRelativeTime(isoString));
      setIsFresh(checkFreshness(isoString));
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isoString]);

  return { text, isFresh };
}

function checkFreshness(isoString: string): boolean {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < FRESH_THRESHOLD_MS;
}
