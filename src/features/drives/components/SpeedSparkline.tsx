'use client';

import { useMemo } from 'react';

/** Props for the SpeedSparkline component. */
export interface SpeedSparklineProps {
  /** Drive duration in minutes (used to determine point count). */
  durationMinutes: number;
  /** Average speed in mph. */
  avgSpeedMph: number;
  /** Maximum speed in mph. */
  maxSpeedMph: number;
  /** Start time label (e.g., "2:15 PM"). */
  startTime: string;
  /** End time label (e.g., "3:02 PM"). */
  endTime: string;
}

/**
 * Generates mock speed data for the sparkline visualization.
 * Simulates acceleration, cruising with variation, and deceleration.
 */
function generateSpeedPoints(
  durationMinutes: number,
  avgSpeed: number,
  maxSpeed: number,
): number[] {
  const numPoints = Math.max(20, Math.min(50, durationMinutes));
  const scale = 58 / maxSpeed;
  const points: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    let speed: number;
    if (t < 0.1) {
      speed = avgSpeed * t * 8;
    } else if (t > 0.85) {
      speed = avgSpeed * (1 - t) * 5;
    } else {
      speed = avgSpeed + (Math.sin(t * 12) * avgSpeed * 0.3) + (Math.sin(t * 5) * avgSpeed * 0.15);
    }
    speed = Math.max(0, Math.min(maxSpeed, speed));
    points.push(speed * scale);
  }
  return points;
}

/**
 * Thin gold speed sparkline chart with gradient fill.
 * Renders an SVG with a gold polyline and a subtle gold gradient area beneath.
 */
export function SpeedSparkline({
  durationMinutes,
  avgSpeedMph,
  maxSpeedMph,
  startTime,
  endTime,
}: SpeedSparklineProps) {
  const speedPoints = useMemo(
    () => generateSpeedPoints(durationMinutes, avgSpeedMph, maxSpeedMph),
    [durationMinutes, avgSpeedMph, maxSpeedMph],
  );

  const viewBoxWidth = speedPoints.length * 4;

  return (
    <div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">
        Speed over time
      </p>
      <div className="h-16 relative">
        <svg viewBox={`0 0 ${viewBoxWidth} 64`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,64 ${speedPoints.map((y, i) => `${i * 4},${64 - y}`).join(' ')} ${(speedPoints.length - 1) * 4},64`}
            fill="url(#goldGradient)"
          />
          <polyline
            points={speedPoints.map((y, i) => `${i * 4},${64 - y}`).join(' ')}
            fill="none"
            stroke="#C9A84C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-text-muted font-light">{startTime}</span>
          <span className="text-[10px] text-text-muted font-light">{endTime}</span>
        </div>
      </div>
    </div>
  );
}
