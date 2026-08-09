import { dayBarTooltip, formatUptimePct, STATE_BAR_CLASSES } from '@/lib/status/presentation';
import type { DayBar } from '@/lib/status/types';

/** Props for the UptimeStrip component. */
export interface UptimeStripProps {
  /** Oldest day first, today last. */
  bars: readonly DayBar[];
  /** Uptime across the whole strip, or null when nothing was measured. */
  uptimePct: number | null;
  days: number;
}

/**
 * The 90-day history: one bar per UTC day, worst-of-day.
 *
 * Rendered on the server as plain divs with a `title`, so the strip works with
 * JavaScript disabled and costs the browser nothing. Days nobody probed are
 * grey rather than absent — the gap in the record is the point.
 */
export function UptimeStrip({ bars, uptimePct, days }: UptimeStripProps) {
  return (
    <div className="mt-5">
      <div className="flex h-8 items-stretch gap-[2px]" role="img" aria-label={summary(bars, uptimePct, days)}>
        {bars.map((bar) => (
          <div
            key={bar.date}
            title={dayBarTooltip(bar)}
            className={`min-w-[2px] flex-1 rounded-[1px] ${STATE_BAR_CLASSES[bar.state]}`}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] leading-4 text-text-muted">
        <span>{days} days ago</span>
        <span className="tabular-nums">
          {uptimePct === null ? 'No data' : `${formatUptimePct(uptimePct)} uptime`}
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}

/** What a screen reader is told instead of ninety unlabelled rectangles. */
function summary(bars: readonly DayBar[], uptimePct: number | null, days: number): string {
  const measured = bars.filter((bar) => bar.total > 0).length;
  if (measured === 0) return `No checks recorded in the last ${days} days.`;

  const bad = bars.filter((bar) => bar.failed > 0).length;
  const daysWord = bad === 1 ? 'day' : 'days';
  return `${formatUptimePct(uptimePct)} uptime over ${measured} measured of the last ${days} days, with failed checks on ${bad} ${daysWord}.`;
}
