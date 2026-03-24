import type { Vehicle } from '@/types/vehicle';
import type { Drive } from '@/types/drive';

import { StatusBadge } from '@/components/ui/StatusBadge';

import { GearIndicator } from './GearIndicator';
import { RefreshButton } from './RefreshButton';
import { TripProgressBar } from './TripProgressBar';
import { StatRow } from './StatRow';

/** Props for the DrivingPeekContent component. */
export interface DrivingPeekContentProps {
  /** The driving vehicle. */
  vehicle: Vehicle;
  /** The current drive (for origin label). */
  currentDrive?: Drive;
  /** Trip completion fraction (0-1). */
  tripProgress: number;
  /** Whether a refresh/sync is in progress. */
  isRefreshing?: boolean;
  /** Callback to trigger a manual refresh. */
  onRefresh?: () => void;
}

/**
 * Bottom sheet peek content when vehicle is driving.
 * Vehicle name, status badge, destination, trip progress bar, stats row, refresh button.
 */
export function DrivingPeekContent({
  vehicle,
  currentDrive,
  tripProgress,
  isRefreshing,
  onRefresh,
}: DrivingPeekContentProps) {
  return (
    <div className="px-6">
      {/* Vehicle name + gear indicator + refresh + status badge */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-text-primary">{vehicle.name}</h2>
          <GearIndicator gearPosition={vehicle.gearPosition} status={vehicle.status} />
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <RefreshButton isRefreshing={isRefreshing ?? false} onRefresh={onRefresh} />
          )}
          <StatusBadge status={vehicle.status} />
        </div>
      </div>
      <p className="text-sm text-gold font-light mb-3">
        Heading to {vehicle.destinationName}
      </p>

      {/* Trip progress bar */}
      <TripProgressBar
        progress={tripProgress}
        stops={vehicle.stops ?? []}
        originLabel={currentDrive?.startAddress || currentDrive?.startLocation || 'Origin'}
        destinationLabel={vehicle.destinationName ?? 'Destination'}
      />

      {/* Key stats row */}
      <StatRow
        etaMinutes={vehicle.etaMinutes}
        speed={vehicle.speed}
        chargeLevel={vehicle.chargeLevel}
      />
    </div>
  );
}
