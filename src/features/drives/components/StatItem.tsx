/** Props for the StatItem component. */
export interface StatItemProps {
  /** Uppercase label text (e.g., "Distance"). */
  label: string;
  /** Formatted value (e.g., "14.2 mi"). */
  value: string;
  /** When true, renders the value in gold accent color. */
  accent?: boolean;
}

/**
 * A single stat in the 2-column stats grid.
 * Muted uppercase label above a bold value. Optional gold accent for FSD stats.
 */
export function StatItem({ label, value, accent }: StatItemProps) {
  return (
    <div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base font-medium tabular-nums ${accent ? 'text-gold' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}
