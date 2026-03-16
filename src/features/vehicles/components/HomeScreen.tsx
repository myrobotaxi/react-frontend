'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

import type { Vehicle } from '@/types/vehicle';
import type { Drive } from '@/types/drive';
import { SetupBanner } from '@/components/ui/SetupBanner';
import { TESLA_KEY_PAIRING_URL } from '@/lib/constants';

import { BottomSheet, shouldShowHalfContent } from '@/components/layout/BottomSheet';

import { useBottomSheet } from '../hooks/use-bottom-sheet';
import { useBackgroundSync } from '../hooks/use-background-sync';
import { usePullToRefresh } from '../hooks/use-pull-to-refresh';
import { VehicleDotSelector } from './VehicleDotSelector';
import { DrivingPeekContent } from './DrivingPeekContent';
import { ParkedPeekContent } from './ParkedPeekContent';
import { DrivingHalfContent } from './DrivingHalfContent';
import { ParkedHalfContent } from './ParkedHalfContent';

// Dynamic import — Mapbox depends on window/document
const VehicleMap = dynamic(
  () => import('@/components/map/VehicleMap').then((m) => ({ default: m.VehicleMap })),
  { ssr: false },
);

/** Props for the HomeScreen component. */
export interface HomeScreenProps {
  /** All linked vehicles. */
  vehicles: Vehicle[];
  /** All drives (used to find the latest drive for the current vehicle). */
  drives: Drive[];
  /** Server action to trigger a background sync from Tesla. */
  onSync?: () => Promise<void>;
}

/**
 * Main home screen orchestrator — full-screen map with bottom sheet.
 * Coordinates VehicleMap, VehicleDotSelector, BottomSheet, and peek/half content.
 */
export function HomeScreen({ vehicles, drives, onSync }: HomeScreenProps) {
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);
  const [dismissedVehicleIds, setDismissedVehicleIds] = useState<Set<string>>(new Set());
  const sheet = useBottomSheet('peek');
  const syncAction = useMemo(() => onSync ?? (() => Promise.resolve()), [onSync]);
  const isAutoSyncing = useBackgroundSync(syncAction);
  const { pullDistance, isRefreshing } = usePullToRefresh(syncAction, sheet.sheetState);
  const isSyncing = isAutoSyncing || isRefreshing;

  const vehicle = vehicles[currentVehicleIndex];

  // Find the active drive for the current vehicle.
  // An in-progress drive has endTime === '' (sentinel from drive-detection.ts).
  // If none is in progress, fall back to the most recent completed drive.
  const currentDrive = useMemo(() => {
    const vehicleDrives = drives.filter((d) => d.vehicleId === vehicle.id);

    // Prefer the in-progress drive (endTime is empty string)
    const activeDrive = vehicleDrives.find((d) => d.endTime === '');
    if (activeDrive) return activeDrive;

    // Fallback: most recent completed drive by date descending, startTime descending
    vehicleDrives.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.startTime.localeCompare(a.startTime);
    });
    return vehicleDrives[0] as Drive | undefined;
  }, [vehicle.id, drives]);

  const isDriving = vehicle.status === 'driving';
  const routePoints = currentDrive?.routePoints;

  // Trip progress (0-1)
  const tripProgress =
    vehicle.tripDistanceMiles && vehicle.tripDistanceRemaining != null
      ? (vehicle.tripDistanceMiles - vehicle.tripDistanceRemaining) / vehicle.tripDistanceMiles
      : 0;

  const showHalf = shouldShowHalfContent(sheet.sheetState, sheet.isDragging, sheet.currentHeight);

  return (
    <div className="h-screen bg-bg-primary relative overflow-hidden">
      {/* Full-screen map — disable interaction during sheet drag */}
      <div className="absolute inset-0" style={{ pointerEvents: sheet.isDragging ? 'none' : 'auto' }}>
        <VehicleMap
          showVehicleMarker
          showRoute={isDriving}
          routeCoordinates={routePoints}
          vehiclePosition={isDriving ? [vehicle.longitude, vehicle.latitude] : undefined}
          heading={vehicle.heading}
          center={[vehicle.longitude, vehicle.latitude]}
          zoom={12}
        >
          {/* Compass labels */}
          <CompassLabels sheetHeight={sheet.currentHeight} />

          {/* Vehicle dot selector */}
          <VehicleDotSelector
            vehicles={vehicles}
            currentIndex={currentVehicleIndex}
            onSelect={setCurrentVehicleIndex}
          />
        </VehicleMap>
      </div>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 transition-transform"
          style={{ top: Math.min(pullDistance - 30, 56) }}
        >
          <div className="w-8 h-8 rounded-full bg-bg-surface/80 backdrop-blur-sm border border-border-default flex items-center justify-center shadow-lg">
            <svg
              className="w-4 h-4 text-gold transition-transform"
              style={{ transform: `rotate(${pullDistance * 4}deg)`, opacity: Math.min(pullDistance / 80, 1) }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      {/* Sync indicator */}
      {isSyncing && pullDistance === 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20" role="status">
          <div className="px-3 py-1 bg-bg-surface/80 backdrop-blur-sm rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-xs text-text-secondary">Updating...</span>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        height={sheet.currentHeight}
        isDragging={sheet.isDragging}
        sheetState={sheet.sheetState}
        onTouchStart={sheet.onTouchStart}
        onTouchMove={sheet.onTouchMove}
        onTouchEnd={sheet.onTouchEnd}
        onToggle={sheet.toggle}
      >
        {/* Setup banner — shown when virtual key is not paired */}
        {!vehicle.virtualKeyPaired && !dismissedVehicleIds.has(vehicle.id) && (
          <div className="px-6 mb-4">
            <SetupBanner
              title="Complete Setup"
              description="Pair your virtual key to unlock live location, temperatures, and vehicle name"
              actionLabel="Pair Now"
              onAction={() => window.open(TESLA_KEY_PAIRING_URL, '_blank')}
              onDismiss={() => setDismissedVehicleIds((prev) => new Set(prev).add(vehicle.id))}
            />
          </div>
        )}

        {/* Peek content */}
        {isDriving ? (
          <DrivingPeekContent
            vehicle={vehicle}
            currentDrive={currentDrive}
            tripProgress={tripProgress}
          />
        ) : (
          <ParkedPeekContent vehicle={vehicle} />
        )}

        {/* Half content */}
        {showHalf && (
          isDriving ? (
            <DrivingHalfContent vehicle={vehicle} currentDrive={currentDrive} />
          ) : (
            <ParkedHalfContent vehicle={vehicle} />
          )
        )}

        {/* Spacer for BottomNav overlap */}
        <div className="h-20" />
      </BottomSheet>
    </div>
  );
}

/** Subtle compass direction labels overlaying the map. */
function CompassLabels({ sheetHeight }: { sheetHeight: number }) {
  return (
    <>
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none">
        N
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none"
        style={{ bottom: `${sheetHeight + 8}px` }}
      >
        S
      </div>
      <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none">
        E
      </div>
      <div className="absolute top-1/2 left-3 -translate-y-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none">
        W
      </div>
    </>
  );
}
