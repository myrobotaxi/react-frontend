import { useState, useRef, useCallback, useMemo } from 'react';
import { vehicles, drives, getStatusMessage, statusConfig, getBatteryColor, getBatteryTextColor } from '../data/mockData.ts';
import { MapPlaceholder } from '../components/MapPlaceholder.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';

type SheetState = 'peek' | 'half';

const SHEET_HEIGHTS = { peek: 260, half: Math.round(window.innerHeight * 0.5) };

export function Home() {
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const vehicle = vehicles[currentVehicleIndex];
  const config = statusConfig[vehicle.status];

  // Find the most recent drive for the current vehicle to get route points + origin info
  const currentDrive = useMemo(() => {
    const vehicleDrives = drives
      .filter((d) => d.vehicleId === vehicle.id)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startTime.localeCompare(a.startTime);
      });
    return vehicleDrives.length > 0 ? vehicleDrives[0] : undefined;
  }, [vehicle.id]);

  const currentRoutePoints = currentDrive?.routePoints;

  // Trip progress (0-1) for the driving state
  const tripProgress = vehicle.tripDistanceMiles && vehicle.tripDistanceRemaining != null
    ? (vehicle.tripDistanceMiles - vehicle.tripDistanceRemaining) / vehicle.tripDistanceMiles
    : 0;

  // --- Bottom sheet drag ---
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = SHEET_HEIGHTS[sheetState];
    setIsDragging(true);
  }, [sheetState]);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = dragStartY.current - e.touches[0].clientY;
    setSheetOffset(deltaY);
  }, [isDragging]);

  const handleSheetTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const newHeight = dragStartHeight.current + sheetOffset;

    const midpoint = (SHEET_HEIGHTS.peek + SHEET_HEIGHTS.half) / 2;
    if (newHeight > midpoint) {
      setSheetState('half');
    } else {
      setSheetState('peek');
    }
    setSheetOffset(0);
  }, [isDragging, sheetOffset]);

  const currentSheetHeight = isDragging
    ? Math.max(120, Math.min(SHEET_HEIGHTS.half, dragStartHeight.current + sheetOffset))
    : SHEET_HEIGHTS[sheetState];

  const isDriving = vehicle.status === 'driving';

  return (
    <div className="h-screen bg-bg-primary relative overflow-hidden">
      {/* FULL SCREEN MAP */}
      <div className="absolute inset-0">
        <MapPlaceholder
          showVehicleMarker={true}
          showRoute={isDriving}
          routeCoordinates={currentRoutePoints}
          vehiclePosition={isDriving ? [vehicle.longitude, vehicle.latitude] : undefined}
          heading={vehicle.heading}
          center={[vehicle.longitude, vehicle.latitude]}
          zoom={12}
          className="absolute inset-0"
        >
          {/* Compass direction labels */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none">N</div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none" style={{ bottom: `${currentSheetHeight + 8}px` }}>S</div>
          <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none">E</div>
          <div className="absolute top-1/2 left-3 -translate-y-1/2 z-10 text-[10px] text-white/30 font-light select-none pointer-events-none">W</div>

          {/* Vehicle dot indicators */}
          {vehicles.length > 1 && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {vehicles.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setCurrentVehicleIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentVehicleIndex
                      ? 'bg-gold w-6'
                      : 'bg-text-muted/40 w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </MapPlaceholder>
      </div>

      {/* Bottom Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 bg-bg-secondary/95 backdrop-blur-2xl rounded-t-[24px] border-t border-border-default"
        style={{
          height: currentSheetHeight,
          transition: isDragging ? 'none' : 'height 0.3s ease-out',
        }}
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0">
          <div className="w-9 h-1 rounded-full bg-bg-elevated" />
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto" style={{ height: `calc(100% - 28px)` }}>
          <div className="px-6">
            {isDriving ? (
              /* ========== DRIVING PEEK STATE ========== */
              <>
                {/* 1. Vehicle name + status badge + destination */}
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-semibold text-text-primary">{vehicle.name}</h2>
                  <StatusBadge status={vehicle.status} />
                </div>
                <p className="text-sm text-gold font-light mb-3">Heading to {vehicle.destinationName}</p>

                {/* 2. Trip progress bar */}
                <div className="mb-3">
                  {/* Glowing progress bar */}
                  <div className="relative h-1.5 bg-bg-elevated rounded-full">
                    {/* Filled portion with glow */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{
                        width: `${tripProgress * 100}%`,
                        background: '#C9A84C',
                        boxShadow: '0 0 8px rgba(201, 168, 76, 0.6), 0 0 20px rgba(201, 168, 76, 0.3)',
                      }}
                    >
                      {/* Pulsing leading-edge dot */}
                      <div
                        className="absolute top-1/2 right-0 animate-gold-glow"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#C9A84C',
                          boxShadow: '0 0 6px rgba(201, 168, 76, 0.8), 0 0 12px rgba(201, 168, 76, 0.4)',
                        }}
                      />
                    </div>
                    {/* Stop markers on the bar track */}
                    {vehicle.stops && vehicle.stops.length > 0 && vehicle.stops.map((stop, i) => {
                      const stopPosition = ((i + 1) / (vehicle.stops!.length + 1));
                      return (
                        <div
                          key={i}
                          className="absolute top-1/2 text-text-muted text-[8px] leading-none select-none pointer-events-none"
                          style={{ left: `${stopPosition * 100}%`, transform: 'translate(-50%, -50%)' }}
                          title={stop.name}
                        >&#9670;</div>
                      );
                    })}
                  </div>
                  {/* Labels below the bar */}
                  <div className="relative mt-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-text-muted font-light">
                        {currentDrive?.startLocation ?? 'Origin'}
                      </span>
                      <span className="text-[10px] text-text-muted font-light">
                        {vehicle.destinationName ?? 'Destination'}
                      </span>
                    </div>
                    {/* Stop labels positioned below their markers */}
                    {vehicle.stops && vehicle.stops.length > 0 && vehicle.stops.map((stop, i) => {
                      const stopPosition = ((i + 1) / (vehicle.stops!.length + 1));
                      return (
                        <span
                          key={i}
                          className="absolute text-[10px] text-text-muted font-light"
                          style={{ left: `${stopPosition * 100}%`, transform: 'translateX(-50%)', top: 0 }}
                        >
                          {stop.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Key stats row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center flex-1">
                    <p className="text-xl font-semibold tabular-nums text-text-primary">{vehicle.etaMinutes} min</p>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">ETA</p>
                  </div>
                  <div className="w-px h-8 bg-border-default" />
                  <div className="text-center flex-1">
                    <p className="text-xl font-semibold tabular-nums text-text-primary">{vehicle.speed} mph</p>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Speed</p>
                  </div>
                  <div className="w-px h-8 bg-border-default" />
                  <div className="text-center flex-1">
                    <p className={`text-xl font-semibold tabular-nums ${getBatteryTextColor(vehicle.chargeLevel)}`}>{vehicle.chargeLevel}%</p>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Battery</p>
                  </div>
                </div>

              </>
            ) : (
              /* ========== PARKED / CHARGING / OFFLINE PEEK STATE ========== */
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">{vehicle.name}</h2>
                    <p className="text-text-secondary text-sm font-light mt-0.5">{getStatusMessage(vehicle)}</p>
                  </div>
                  <StatusBadge status={vehicle.status} />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-text-secondary text-sm font-light">{vehicle.locationName}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium tabular-nums ${getBatteryTextColor(vehicle.chargeLevel)}`}>
                      {vehicle.chargeLevel}%
                    </span>
                    <div className="w-16 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getBatteryColor(vehicle.chargeLevel)}`}
                        style={{ width: `${vehicle.chargeLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* === HALF STATE: Extended details === */}
          {(sheetState === 'half' || (isDragging && currentSheetHeight > (SHEET_HEIGHTS.peek + 30))) && (
            <div className="px-6 mt-6 pb-8 animate-fade-in">
              <div className="h-px bg-border-default mb-6" />

              {isDriving ? (
                /* ========== DRIVING HALF STATE ========== */
                <>
                  {/* Start / Destination */}
                  <div className="mb-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Start</p>
                    <p className="text-text-primary text-sm font-light">
                      {currentDrive?.startLocation ?? 'Unknown'} — {currentDrive?.startAddress ?? ''}
                    </p>
                  </div>

                  <div className="mb-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Destination</p>
                    <p className="text-text-primary text-sm font-light">
                      {vehicle.destinationName} — {vehicle.destinationAddress}
                    </p>
                  </div>

                  {/* Stops */}
                  {vehicle.stops && vehicle.stops.length > 0 && (
                    <div className="mb-5">
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">Stops</p>
                      {vehicle.stops.map((stop, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2">
                          {stop.type === 'charging' ? (
                            <svg className="w-4 h-4 text-gold mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8.5 1L4 9h3.5v6L12 7H8.5V1z" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-text-muted mt-1.5 ml-1 mr-1 shrink-0" />
                          )}
                          <div>
                            <p className="text-text-primary text-sm">{stop.name}</p>
                            <p className="text-text-muted text-xs font-light">{stop.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="h-px bg-border-default mb-5" />

                  {/* Vehicle details */}
                  <div className="mb-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">Vehicle</p>
                    <p className="text-text-primary font-medium">{vehicle.year} {vehicle.model}</p>
                    <p className="text-text-secondary text-sm font-light mt-1">{vehicle.color}</p>
                    <p className="text-text-muted text-xs mt-1">{vehicle.licensePlate}</p>
                  </div>

                  <div className="flex gap-10 mb-5">
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Odometer</p>
                      <p className="text-text-primary text-sm tabular-nums">{vehicle.odometerMiles.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">FSD Today</p>
                      <p className="text-gold text-sm tabular-nums font-medium">{vehicle.fsdMilesSinceReset} mi</p>
                    </div>
                  </div>

                  <div className="flex gap-10 mb-5">
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Interior</p>
                      <p className="text-text-primary text-sm tabular-nums">{vehicle.interiorTemp}&deg;F</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Exterior</p>
                      <p className="text-text-primary text-sm tabular-nums">{vehicle.exteriorTemp}&deg;F</p>
                    </div>
                  </div>

                  <p className="text-text-muted text-xs">Updated {vehicle.lastUpdated}</p>
                  <div className="h-6" />
                </>
              ) : (
                /* ========== PARKED / CHARGING / OFFLINE HALF STATE ========== */
                <>
                  <div className="mb-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Location</p>
                    <p className="text-text-primary text-sm font-light">{vehicle.locationAddress}</p>
                  </div>

                  <div className="flex gap-10 mb-5">
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Odometer</p>
                      <p className="text-text-primary text-sm tabular-nums">{vehicle.odometerMiles.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">FSD Today</p>
                      <p className="text-gold text-sm tabular-nums font-medium">{vehicle.fsdMilesSinceReset} mi</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Heading</p>
                      <p className="text-text-secondary text-sm tabular-nums">{vehicle.heading}&deg;</p>
                    </div>
                  </div>

                  <div className="h-px bg-border-default mb-5" />

                  <div className="mb-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">Vehicle</p>
                    <p className="text-text-primary font-medium">{vehicle.year} {vehicle.model}</p>
                    <p className="text-text-secondary text-sm font-light mt-1">{vehicle.color}</p>
                    <p className="text-text-muted text-xs mt-1">{vehicle.licensePlate}</p>
                  </div>

                  <div className="flex gap-10 mb-5">
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Interior</p>
                      <p className="text-text-primary text-sm tabular-nums">{vehicle.interiorTemp}&deg;F</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Exterior</p>
                      <p className="text-text-primary text-sm tabular-nums">{vehicle.exteriorTemp}&deg;F</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Estimated Range</p>
                    <p className="text-text-primary text-sm tabular-nums">{vehicle.estimatedRange} miles</p>
                  </div>

                  <div className="mb-5">
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">Battery</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-medium tabular-nums ${getBatteryTextColor(vehicle.chargeLevel)}`}>
                        {vehicle.chargeLevel}%
                      </span>
                      <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBatteryColor(vehicle.chargeLevel)}`}
                          style={{ width: `${vehicle.chargeLevel}%`, backgroundColor: config.color }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-text-muted text-xs">Updated {vehicle.lastUpdated}</p>
                  <div className="h-6" />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
