/** A coordinate pair as [longitude, latitude]. */
export type LngLat = [number, number];

/** A completed drive record with route and stats. */
export interface Drive {
  id: string;
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  startAddress: string;
  endLocation: string;
  endAddress: string;
  distanceMiles: number;
  durationMinutes: number;
  avgSpeedMph: number;
  maxSpeedMph: number;
  energyUsedKwh: number;
  startChargeLevel: number;
  endChargeLevel: number;
  fsdMiles: number;
  fsdPercentage: number;
  interventions: number;
  /** Array of [longitude, latitude] coordinates defining the route. */
  routePoints: LngLat[];
}

/** A group of drives under a date label (e.g., "Today", "Yesterday"). */
export interface DriveGroup {
  label: string;
  date: string;
  drives: Drive[];
}

/** Sort options for the drive history list. */
export type DriveSortBy = 'date' | 'distance' | 'duration';
