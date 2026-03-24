import type { Vehicle } from '@/types/vehicle';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { getBatteryColor, getBatteryTextColor } from '@/lib/vehicle-helpers';

import { GearIndicator } from './GearIndicator';
import { RefreshButton } from './RefreshButton';
import { RelativeTimestamp } from './RelativeTimestamp';

/** Props for the ParkedPeekContent component. */
export interface ParkedPeekContentProps {
  /** The parked/charging/offline vehicle. */
  vehicle: Vehicle;
  /** Whether a refresh/sync is in progress. */
  isRefreshing?: boolean;
  /** Callback to trigger a manual refresh. */
  onRefresh?: () => void;
}

/**
 * Bottom sheet peek content when vehicle is parked, charging, or offline.
 * Shows vehicle name, status badge, location, battery, timestamp, and refresh button.
 */
export function ParkedPeekContent({ vehicle, isRefreshing, onRefresh }: ParkedPeekContentProps) {
  return (
    <div className="px-6">
      {/* Row 1: Vehicle name + gear indicator + refresh + status badge */}
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

      {/* Row 2: Location + timestamp */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-secondary text-sm font-light truncate mr-2">
          {vehicle.locationAddress}
        </p>
        <RelativeTimestamp isoString={vehicle.lastUpdated} />
      </div>

      {/* Row 3: Battery bar — full width */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getBatteryColor(vehicle.chargeLevel, vehicle.status)}`}
            style={{ width: `${vehicle.chargeLevel}%` }}
          />
        </div>
        <span className={`text-sm font-medium tabular-nums ${getBatteryTextColor(vehicle.chargeLevel, vehicle.status)}`}>
          {vehicle.chargeLevel}%
        </span>
      </div>
    </div>
  );
}
