'use client';

import { useState, useMemo } from 'react';

import type { Drive, DriveSortBy } from '@/types/drive';

/** Return type for the useDriveSort hook. */
export interface UseDriveSortResult {
  sortBy: DriveSortBy;
  setSortBy: (sort: DriveSortBy) => void;
  sortedDrives: Drive[];
}

/**
 * Sorts an array of drives by the selected criterion.
 * Default sort is by date (newest first).
 */
export function useDriveSort(drives: Drive[]): UseDriveSortResult {
  const [sortBy, setSortBy] = useState<DriveSortBy>('date');

  const sortedDrives = useMemo(() => {
    return [...drives].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return b.distanceMiles - a.distanceMiles;
        case 'duration':
          return b.durationMinutes - a.durationMinutes;
        default: {
          const dateA = new Date(`${a.date} ${a.startTime}`).getTime();
          const dateB = new Date(`${b.date} ${b.startTime}`).getTime();
          return dateB - dateA;
        }
      }
    });
  }, [drives, sortBy]);

  return { sortBy, setSortBy, sortedDrives };
}
