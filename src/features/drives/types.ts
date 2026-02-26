/**
 * Feature-specific types for the drives domain.
 * Cross-feature types live in @/types/. These are internal to the drives feature.
 */

import type { DriveSortBy } from '@/types/drive';

/** State for drive sort controls. */
export interface DriveSortState {
  sortBy: DriveSortBy;
  setSortBy: (sort: DriveSortBy) => void;
}

/** Speed sparkline data point for the drive summary chart. */
export interface SpeedPoint {
  x: number;
  y: number;
}
