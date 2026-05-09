/**
 * Vehicle-GPS encryption helpers (MYR-63 Phase 1 — TS side).
 *
 * Centralises the dual-write/dual-read pattern for the encrypted shadow
 * columns added to `Vehicle` (`latitudeEnc`, `longitudeEnc`,
 * `destinationLatitudeEnc`, `destinationLongitudeEnc`,
 * `originLatitudeEnc`, `originLongitudeEnc`) per data-classification.md
 * §1.3 and NFR-3.23. Call sites should never reach past these helpers
 * to read/write the columns directly.
 *
 * Atomic-pair semantics: latitude and longitude are persisted as separate
 * columns but consumed as a synchronized pair (vehicle-state-schema.md
 * §3.3 GPS predicates). If an `*Enc` half is non-NULL while its mate is
 * NULL the row is corrupt — readVehicleGPS treats the entire pair as
 * absent rather than returning a half-pair.
 *
 * Float ↔ string conversion uses `String(x)` / `Number(s)` which is
 * lossless for finite IEEE-754 doubles.
 *
 * Rollout phases mirror MYR-62 (account tokens):
 *   1. Dual-write (this PR)
 *   2. Backfill — Phase 2 of MYR-63 (Go-side)
 *   3. Read-flip — separate post-rollout issue
 *   4. Drop plaintext columns — separate post-rollout issue
 */

import { getEncryptor } from '@/lib/account-encryption';

type Pair = 'latitude' | 'destinationLatitude' | 'originLatitude';
type LatField = Pair;
type LngField =
  | 'longitude'
  | 'destinationLongitude'
  | 'originLongitude';

const PAIRS: ReadonlyArray<{ lat: LatField; lng: LngField }> = [
  { lat: 'latitude', lng: 'longitude' },
  { lat: 'destinationLatitude', lng: 'destinationLongitude' },
  { lat: 'originLatitude', lng: 'originLongitude' },
];

/**
 * Subset of a Vehicle row used by readers/writers. Each pair has a
 * Float plaintext column (`latitude`) and a TEXT encrypted shadow
 * (`latitudeEnc`). `latitude` and `longitude` are non-nullable on the
 * schema (default 0); the destination/origin pairs are nullable.
 */
export interface VehicleGPSFields {
  latitude?: number | null;
  longitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  originLatitude?: number | null;
  originLongitude?: number | null;
  latitudeEnc?: string | null;
  longitudeEnc?: string | null;
  destinationLatitudeEnc?: string | null;
  destinationLongitudeEnc?: string | null;
  originLatitudeEnc?: string | null;
  originLongitudeEnc?: string | null;
}

function encOf(v: number | null | undefined): string | null | undefined {
  // `undefined` → leave column untouched (Prisma drops undefined).
  // `null`      → explicitly clear shadow column.
  // number      → encrypt the lossless string form.
  if (v === undefined) return undefined;
  if (v === null) return null;
  return getEncryptor().encryptString(String(v));
}

function decOf(s: string | null | undefined): number | null {
  if (!s) return null;
  const plain = getEncryptor().decryptString(s);
  if (plain === '') return null;
  const n = Number(plain);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve a single `(lat, lng)` pair, preferring the encrypted shadow
 * columns and falling back to the Float plaintext for legacy rows.
 *
 * Returns `null` for the whole pair when either half is corrupt
 * (mismatched NULL state on the `*Enc` columns) — half-pair reads must
 * not leak through to consumers.
 */
function readPair(
  row: VehicleGPSFields,
  lat: LatField,
  lng: LngField,
): { lat: number | null; lng: number | null } {
  const latEncCol = `${lat}Enc` as keyof VehicleGPSFields;
  const lngEncCol = `${lng}Enc` as keyof VehicleGPSFields;
  const latEncRaw = row[latEncCol] as string | null | undefined;
  const lngEncRaw = row[lngEncCol] as string | null | undefined;

  const latEncPresent = latEncRaw != null && latEncRaw !== '';
  const lngEncPresent = lngEncRaw != null && lngEncRaw !== '';

  if (latEncPresent !== lngEncPresent) {
    // Half-pair encrypted write — corrupt. Treat as absent.
    console.warn(
      `[vehicle-gps-encryption] half-pair *Enc detected for (${lat}, ${lng}); reading as null`,
    );
    return { lat: null, lng: null };
  }

  if (latEncPresent && lngEncPresent) {
    return { lat: decOf(latEncRaw), lng: decOf(lngEncRaw) };
  }

  // Fallback to plaintext.
  const latPlain = (row[lat] as number | null | undefined) ?? null;
  const lngPlain = (row[lng] as number | null | undefined) ?? null;
  return { lat: latPlain, lng: lngPlain };
}

/**
 * Read all three GPS pairs from a Vehicle row, applying dual-read
 * fallback and atomic-pair integrity. Suitable for vehicle-mappers
 * and any other code that surfaces GPS to clients.
 */
export function readVehicleGPS(row: VehicleGPSFields): {
  latitude: number | null;
  longitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  originLatitude: number | null;
  originLongitude: number | null;
} {
  const main = readPair(row, 'latitude', 'longitude');
  const dest = readPair(row, 'destinationLatitude', 'destinationLongitude');
  const orig = readPair(row, 'originLatitude', 'originLongitude');
  return {
    latitude: main.lat,
    longitude: main.lng,
    destinationLatitude: dest.lat,
    destinationLongitude: dest.lng,
    originLatitude: orig.lat,
    originLongitude: orig.lng,
  };
}

type GPSWriteInput = Pick<
  VehicleGPSFields,
  | 'latitude'
  | 'longitude'
  | 'destinationLatitude'
  | 'destinationLongitude'
  | 'originLatitude'
  | 'originLongitude'
>;

export interface GPSEncShadowPayload {
  latitudeEnc?: string | null;
  longitudeEnc?: string | null;
  destinationLatitudeEnc?: string | null;
  destinationLongitudeEnc?: string | null;
  originLatitudeEnc?: string | null;
  originLongitudeEnc?: string | null;
}

/**
 * Build the encrypted-shadow payload for a Vehicle create/update/upsert.
 * Returns only the `*Enc` columns; callers continue to write the
 * plaintext columns from their own data via spread (so this helper
 * doesn't have to recreate Prisma's nullability typing for each
 * plaintext field). Spread the result alongside the plaintext payload.
 *
 * Atomic-pair guarantee: if a caller passes only one half of a pair
 * (e.g., `latitude` without `longitude`), neither shadow column is
 * touched and a warning is logged — half-pair encrypted writes are
 * the same corruption mode `readVehicleGPS` rejects on read.
 *
 * `undefined` for any field means "don't touch the shadow column";
 * `null` means "clear the shadow column". A plaintext clear (set
 * `latitude: null` on a nullable column) goes via the caller's main
 * payload as before.
 */
export function buildEncryptedVehicleGPSWrite(
  input: GPSWriteInput,
): GPSEncShadowPayload {
  const out: GPSEncShadowPayload = {};

  for (const { lat, lng } of PAIRS) {
    const latVal = input[lat];
    const lngVal = input[lng];

    const latProvided = latVal !== undefined;
    const lngProvided = lngVal !== undefined;

    if (!latProvided && !lngProvided) continue;

    if (latProvided !== lngProvided) {
      console.warn(
        `[vehicle-gps-encryption] half-pair input for (${lat}, ${lng}); shadow columns left untouched`,
      );
      continue;
    }

    const latEncCol = `${lat}Enc` as keyof GPSEncShadowPayload;
    const lngEncCol = `${lng}Enc` as keyof GPSEncShadowPayload;

    if (latVal === null || lngVal === null) {
      if (latVal !== lngVal) {
        // Mixed null / non-null pair. Clearing both shadows is the
        // correct atomic-pair recovery, but the caller likely has a
        // bug — surface it.
        console.warn(
          `[vehicle-gps-encryption] mixed null/number pair for (${lat}, ${lng}); clearing both shadows`,
        );
      }
      (out as Record<string, unknown>)[latEncCol] = null;
      (out as Record<string, unknown>)[lngEncCol] = null;
      continue;
    }

    (out as Record<string, unknown>)[latEncCol] = encOf(latVal);
    (out as Record<string, unknown>)[lngEncCol] = encOf(lngVal);
  }

  return out;
}
