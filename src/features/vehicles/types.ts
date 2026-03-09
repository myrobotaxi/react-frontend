/**
 * Feature-specific types for the vehicles domain.
 * Cross-feature types live in @/types/. These are internal to the vehicles feature.
 */

import type { Vehicle } from '@/types/vehicle';
import type { Drive } from '@/types/drive';

/** Bottom sheet snap states. */
export type SheetState = 'peek' | 'half' | 'full';

/** Vehicle data combined with its latest drive for the home screen. */
export interface VehicleWithTrip {
  vehicle: Vehicle;
  latestDrive: Drive | null;
}

/** Props for the drag-to-snap bottom sheet. */
export interface BottomSheetConfig {
  peekHeight: number;
  halfHeight: number;
}
