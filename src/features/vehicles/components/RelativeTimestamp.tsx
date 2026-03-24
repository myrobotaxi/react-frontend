'use client';

import { useRelativeTime } from '../hooks/use-relative-time';

/** Props for the RelativeTimestamp component. */
export interface RelativeTimestampProps {
  /** ISO 8601 timestamp string. */
  isoString: string;
}

/**
 * Displays a live-updating relative timestamp with a freshness indicator dot.
 * Green dot = updated within 5 minutes. Gray dot = stale.
 * Tapping reveals the absolute time via the title attribute.
 */
export function RelativeTimestamp({ isoString }: RelativeTimestampProps) {
  const { text, isFresh } = useRelativeTime(isoString);

  const absolute = formatAbsoluteTime(isoString);

  return (
    <p className="text-text-muted text-xs flex items-center gap-1.5" title={absolute}>
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isFresh ? 'bg-green-500' : 'bg-text-muted/40'
        }`}
        aria-hidden="true"
      />
      Updated {text}
    </p>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Deterministic format to avoid server/client hydration mismatch from toLocaleString. */
function formatAbsoluteTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Unknown';
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${month} ${day}, ${hour12}:${m} ${ampm}`;
}
