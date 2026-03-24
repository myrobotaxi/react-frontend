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

function formatAbsoluteTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
