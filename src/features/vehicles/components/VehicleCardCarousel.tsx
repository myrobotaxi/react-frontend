'use client';

import { useRef, useCallback, useEffect } from 'react';

import type { Vehicle } from '@/types/vehicle';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getBatteryColor, getBatteryTextColor } from '@/lib/vehicle-helpers';

import { useRelativeTime } from '../hooks/use-relative-time';

/** Props for the VehicleCardCarousel component. */
export interface VehicleCardCarouselProps {
  /** All vehicles to display. */
  vehicles: Vehicle[];
  /** Index of the currently selected vehicle. */
  currentIndex: number;
  /** Callback when a vehicle card is selected (by swipe or tap). */
  onSelect: (index: number) => void;
}

/**
 * Horizontal swipeable card carousel for switching between vehicles.
 * Replaces the tiny dot indicators. Each card shows vehicle name,
 * status badge, battery level, and relative timestamp.
 * Swiping snaps to the nearest card and triggers onSelect.
 */
export function VehicleCardCarousel({ vehicles, currentIndex, onSelect }: VehicleCardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScroll = useRef(true);

  // Scroll to the selected card when currentIndex changes (e.g., from map marker tap)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    isUserScroll.current = false;
    const cardWidth = container.offsetWidth * 0.82;
    const gap = 12;
    const offset = currentIndex * (cardWidth + gap);
    const padding = (container.offsetWidth - cardWidth) / 2;
    container.scrollTo({ left: offset - padding, behavior: 'smooth' });

    // Re-enable user scroll detection after animation
    const timer = setTimeout(() => { isUserScroll.current = true; }, 400);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Detect scroll snap and select the centered card
  const handleScrollEnd = useCallback(() => {
    if (!isUserScroll.current) return;
    const container = scrollRef.current;
    if (!container) return;

    const cardWidth = container.offsetWidth * 0.82;
    const gap = 12;
    const padding = (container.offsetWidth - cardWidth) / 2;
    const scrollLeft = container.scrollLeft + padding;
    const index = Math.round(scrollLeft / (cardWidth + gap));
    const clampedIndex = Math.max(0, Math.min(index, vehicles.length - 1));

    if (clampedIndex !== currentIndex) {
      onSelect(clampedIndex);
    }
  }, [currentIndex, vehicles.length, onSelect]);

  if (vehicles.length <= 1) return null;

  return (
    <div className="absolute top-16 left-0 right-0 z-20">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory
          px-[9%] pb-2 no-scrollbar"
        onScrollCapture={handleScrollEnd}
        role="tablist"
        aria-label="Vehicle selector"
      >
        {vehicles.map((v, idx) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            isActive={idx === currentIndex}
            onTap={() => onSelect(idx)}
          />
        ))}
      </div>
    </div>
  );
}

/** Props for an individual vehicle card. */
interface VehicleCardProps {
  vehicle: Vehicle;
  isActive: boolean;
  onTap: () => void;
}

/** Individual vehicle card within the carousel. */
function VehicleCard({ vehicle, isActive, onTap }: VehicleCardProps) {
  const { text: relativeTime, isFresh } = useRelativeTime(vehicle.lastUpdated);

  return (
    <button
      onClick={onTap}
      className={`shrink-0 w-[82%] snap-center rounded-2xl px-4 py-3 text-left transition-all duration-200
        ${isActive
          ? 'bg-bg-surface/90 backdrop-blur-xl border border-gold/30 shadow-lg'
          : 'bg-bg-surface/60 backdrop-blur-sm border border-border-default/50 opacity-70'
        }`}
      role="tab"
      aria-selected={isActive}
      aria-label={`${vehicle.name} — ${vehicle.status}`}
    >
      {/* Row 1: Name + Status */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-semibold truncate mr-2 ${
          isActive ? 'text-text-primary' : 'text-text-secondary'
        }`}>
          {vehicle.name}
        </span>
        <StatusBadge status={vehicle.status} />
      </div>

      {/* Row 2: Battery bar + percentage + timestamp */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getBatteryColor(vehicle.chargeLevel, vehicle.status)}`}
            style={{ width: `${vehicle.chargeLevel}%` }}
          />
        </div>
        <span className={`text-xs font-medium tabular-nums ${getBatteryTextColor(vehicle.chargeLevel, vehicle.status)}`}>
          {vehicle.chargeLevel}%
        </span>
        <span className="text-text-muted text-[10px] flex items-center gap-1">
          <span
            className={`w-1 h-1 rounded-full ${isFresh ? 'bg-green-500' : 'bg-text-muted/40'}`}
            aria-hidden="true"
          />
          {relativeTime}
        </span>
      </div>
    </button>
  );
}
