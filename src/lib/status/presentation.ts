/**
 * The words and the palette (MYR-510).
 *
 * Pure strings, no React — kept out of the components so the copy the page
 * commits to can be asserted in a test rather than read off a screenshot.
 *
 * Tone: this is a page people read on a bad day. Green is quiet, amber is a
 * statement of fact, red is reserved for something actually being down right
 * now, and history is never red — a resolved incident from six weeks ago is a
 * record, not an alarm.
 */

import type { ComponentState, DayBar } from './types';

/** The chip next to a component. */
export const STATE_LABEL: Record<ComponentState, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
  no_data: 'No data',
};

/** The banner headline. */
export const OVERALL_HEADLINE: Record<ComponentState, string> = {
  operational: 'All systems operational',
  degraded: 'Some systems are degraded',
  outage: 'Service outage',
  no_data: 'Status unknown',
};

/** The line under the headline — what the reader should do with it. */
export const OVERALL_SUBHEAD: Record<ComponentState, string> = {
  operational: 'Every component we monitor answered its last two checks.',
  degraded: 'A component is failing checks intermittently, or has just recovered.',
  outage: 'A component has failed two consecutive checks and is treated as down.',
  no_data:
    'We have no recent checks for at least one component, so we cannot say it is healthy. This can mean the component is unreachable, or that the prober itself is not running.',
};

/** Chip colours. Written as whole class strings so Tailwind can see them. */
export const STATE_CHIP_CLASSES: Record<ComponentState, string> = {
  operational: 'border-status-driving/30 bg-status-driving/10 text-status-driving',
  degraded: 'border-status-in-service/30 bg-status-in-service/10 text-status-in-service',
  outage: 'border-battery-low/30 bg-battery-low/10 text-battery-low',
  no_data: 'border-border-default bg-bg-elevated text-text-muted',
};

/** The dot inside a chip, and the leading dot on the banner. */
export const STATE_DOT_CLASSES: Record<ComponentState, string> = {
  operational: 'bg-status-driving',
  degraded: 'bg-status-in-service',
  outage: 'bg-battery-low',
  no_data: 'bg-text-muted',
};

/** One bar in the 90-day strip. Muted next to the chips: history, not news. */
export const STATE_BAR_CLASSES: Record<ComponentState, string> = {
  operational: 'bg-status-driving/70',
  degraded: 'bg-status-in-service/80',
  outage: 'bg-battery-low/80',
  no_data: 'bg-bg-elevated',
};

/** `99.98%`, or an em dash when nothing was measured. */
export function formatUptimePct(value: number | null): string {
  if (value === null) return '—';
  // Never round 99.99% up to a clean 100%: the one number a reader checks for
  // honesty is the one that claims perfection.
  const floored = Math.floor(value * 100) / 100;
  return `${floored.toFixed(2)}%`;
}

/** The `title` on a day bar — the tooltip a reader hovers for. */
export function dayBarTooltip(bar: DayBar): string {
  if (bar.total === 0) return `${bar.date} — no checks recorded`;
  const checks = bar.total === 1 ? '1 check' : `${bar.total} checks`;
  const failures = bar.failed === 1 ? '1 failed' : `${bar.failed} failed`;
  return `${bar.date} — ${formatUptimePct(bar.uptimePct)} uptime, ${checks}, ${failures}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * `9 Aug 2026, 04:07 UTC`.
 *
 * Always UTC, always spelled out. The alternative — the reader's local zone —
 * needs client-side JavaScript to compute, which would make the timestamp the
 * one part of this page that cannot render when things are going badly.
 */
export function formatUtcTimestamp(date: Date | null): string {
  if (!date) return '—';
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
}

/** `9 Aug 2026, 04:02–04:09 UTC · 7 minutes`, or `…–ongoing` while open. */
export function formatIncidentWindow(startedAt: Date, resolvedAt: Date | null): string {
  const start = formatUtcTimestamp(startedAt);
  if (!resolvedAt) return `${start} — ongoing`;

  const end = `${String(resolvedAt.getUTCHours()).padStart(2, '0')}:${String(
    resolvedAt.getUTCMinutes(),
  ).padStart(2, '0')}`;
  const sameDay = startedAt.toISOString().slice(0, 10) === resolvedAt.toISOString().slice(0, 10);
  const window = sameDay
    ? `${start.replace(' UTC', '')}–${end} UTC`
    : `${start} — ${formatUtcTimestamp(resolvedAt)}`;

  return `${window} · ${formatDuration(startedAt, resolvedAt)}`;
}

/** `7 minutes`, `1 hour 4 minutes`. Rounded to the minute — nobody needs more. */
export function formatDuration(from: Date, to: Date): string {
  const totalMinutes = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(hours === 1 ? '1 hour' : `${hours} hours`);
  if (minutes > 0 || hours === 0) {
    parts.push(minutes === 1 ? '1 minute' : `${minutes} minutes`);
  }
  return parts.join(' ');
}
