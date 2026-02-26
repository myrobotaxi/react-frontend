/** Props for the LocationTimeline component. */
export interface LocationTimelineProps {
  /** Start location name. */
  startLocation: string;
  /** Start address. */
  startAddress: string;
  /** End location name. */
  endLocation: string;
  /** End address. */
  endAddress: string;
}

/**
 * Vertical timeline showing start and end locations with connecting line.
 * Green dot for start, red dot for end, joined by a subtle vertical line.
 */
export function LocationTimeline({
  startLocation,
  startAddress,
  endLocation,
  endAddress,
}: LocationTimelineProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="w-2.5 h-2.5 rounded-full bg-status-driving" />
        <div className="w-px h-8 bg-border-default" />
        <div className="w-2.5 h-2.5 rounded-full bg-battery-low" />
      </div>
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <p className="text-text-primary text-sm font-medium">{startLocation}</p>
          <p className="text-text-muted text-xs font-light">{startAddress}</p>
        </div>
        <div>
          <p className="text-text-primary text-sm font-medium">{endLocation}</p>
          <p className="text-text-muted text-xs font-light">{endAddress}</p>
        </div>
      </div>
    </div>
  );
}
