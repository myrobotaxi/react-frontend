/**
 * Formatting utilities for dates, distances, speeds, and durations.
 * Uses Intl APIs for zero-bundle-cost formatting. No external date libraries.
 */

/**
 * Returns a human-readable date label: "Today", "Yesterday", or a formatted date.
 * @param dateString - ISO date string (e.g., "2026-02-22")
 */
export function formatDateLabel(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats a duration in minutes to a human-readable string.
 * @param minutes - Duration in minutes
 * @returns e.g., "1h 15m" or "35m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

/**
 * Formats a distance in miles with one decimal place.
 * @param miles - Distance in miles
 * @returns e.g., "14.2 mi"
 */
export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

/**
 * Formats a speed value in mph.
 * @param mph - Speed in miles per hour
 * @returns e.g., "65 mph"
 */
export function formatSpeed(mph: number): string {
  return `${Math.round(mph)} mph`;
}

/**
 * Formats a battery percentage.
 * @param level - Battery level 0-100
 * @returns e.g., "78%"
 */
export function formatBatteryLevel(level: number): string {
  return `${Math.round(level)}%`;
}

/**
 * Formats an ETA in minutes.
 * @param minutes - ETA in minutes
 * @returns e.g., "23 min"
 */
export function formatEta(minutes: number): string {
  return `${Math.round(minutes)} min`;
}

/**
 * Formats a temperature in Fahrenheit.
 * @param temp - Temperature in Fahrenheit
 * @returns e.g., "72°F"
 */
export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°F`;
}

/**
 * Formats an odometer reading with locale-aware thousand separators.
 * @param miles - Odometer reading in miles
 * @returns e.g., "12,847 mi"
 */
export function formatOdometer(miles: number): string {
  return `${new Intl.NumberFormat('en-US').format(Math.round(miles))} mi`;
}

/**
 * Formats energy usage in kWh.
 * @param kwh - Energy in kilowatt-hours
 * @returns e.g., "4.8 kWh"
 */
export function formatEnergy(kwh: number): string {
  return `${kwh.toFixed(1)} kWh`;
}
