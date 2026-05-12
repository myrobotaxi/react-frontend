/**
 * Route-blob encryption helpers (MYR-64 Phase 1 — TS side).
 *
 * Centralises the dual-write/dual-read pattern for the encrypted
 * shadow columns added to the two large P1-classified route polylines
 * (data-classification.md §1.4, NFR-3.23):
 *
 *   • Vehicle.navRouteCoordinatesEnc — Tesla's planned navigation
 *     polyline ("where the car is going" — destination route, member
 *     of the navigation atomic group). Plaintext column type: `Json?`.
 *   • Drive.routePointsEnc           — recorded drive route polyline
 *     (the historical breadcrumb trail of a completed drive).
 *     Plaintext column type: non-nullable `Json`.
 *
 * Wire format owned by lib/cryptox (TS) and internal/cryptox (Go):
 *   [1B version=0x01][12B nonce][N B ct + 16B tag], base64(StdEncoding).
 * The plaintext value is JSON.stringify'd at the encryption boundary,
 * so the ciphertext is always a serialized string regardless of the
 * column shape (object array vs tuple array). The decrypt boundary
 * JSON.parses the result back into the typed shape.
 *
 * Empty-array semantics align with the cryptox empty-string sentinel:
 * `encryptString("")` returns `""`, so an empty array (`[]`) — or any
 * "absent value" — yields a `null` shadow rather than an encrypted
 * empty string.
 *
 * Decrypt errors do NOT throw: route blobs can be 100KB+ and a key
 * rotation gone wrong should not 500 the live nav-route view. The
 * helper logs `console.warn` and falls back to the plaintext column.
 *
 * Rollout phases mirror MYR-62 / MYR-63:
 *   1. Dual-write (this PR — TS Phase 1)
 *   2. Phase 2 — Go telemetry pipeline (separate, telemetry)
 *   3. Backfill — separate post-rollout issue
 *   4. Read-flip — separate post-rollout issue
 *   5. Drop plaintext columns — separate post-rollout issue
 */

import { getEncryptor } from '@/lib/account-encryption';

// ─── Shape contracts ─────────────────────────────────────────────────────────

/**
 * Tesla's planned navigation polyline. Stored as `[lng, lat]` tuples
 * in `Vehicle.navRouteCoordinates` per the existing schema (matches
 * Mapbox/GeoJSON ordering). The Go telemetry server is the only
 * writer in production; the TS app reads via `vehicle-mappers.ts`.
 */
export type NavRouteCoordinate = [number, number];

/**
 * A single recorded route point as written by `lib/drive-detection`.
 * The shape is intentionally narrow: any extra fields the writer
 * passes survive the JSON.stringify roundtrip without re-declaring
 * them here.
 */
export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
}

// ─── Vehicle.navRouteCoordinates ────────────────────────────────────────────

/**
 * The slice of a Vehicle row used for nav-route reads. Both columns
 * are nullable: legacy rows have only the plaintext `Json?`, dual-write
 * rows populate both, post-read-flip rows will populate only `*Enc`.
 */
export interface NavRouteFields {
  navRouteCoordinates?: unknown;
  navRouteCoordinatesEnc?: string | null;
}

export interface NavRouteEncShadowPayload {
  navRouteCoordinatesEnc?: string | null;
}

/**
 * Build the encrypted-shadow payload for a Vehicle create/update/upsert
 * touching `navRouteCoordinates`. Returns ONLY the `*Enc` column;
 * callers continue to write the plaintext Json column from their own
 * data via spread.
 *
 * Semantics:
 *   • `undefined`            → leave the shadow column untouched.
 *   • `null` / empty array   → clear the shadow column (`null`).
 *   • populated array        → JSON.stringify + encrypt into `*Enc`.
 */
export function buildEncryptedNavRouteWrite(
  coords: NavRouteCoordinate[] | null | undefined,
): NavRouteEncShadowPayload {
  if (coords === undefined) return {};
  if (coords === null || coords.length === 0) {
    return { navRouteCoordinatesEnc: null };
  }
  const json = JSON.stringify(coords);
  return { navRouteCoordinatesEnc: getEncryptor().encryptString(json) };
}

/**
 * Read `Vehicle.navRouteCoordinates`, preferring the encrypted shadow
 * with plaintext fallback.
 *
 * Returns `null` for absent data. Decrypt or JSON.parse failures fall
 * through to the plaintext column with a `console.warn` — corruption
 * of a 100KB+ blob must not 500 the request.
 */
export function readNavRouteCoordinates(
  row: NavRouteFields,
): NavRouteCoordinate[] | null {
  const enc = row.navRouteCoordinatesEnc;
  if (enc != null && enc !== '') {
    try {
      const plaintext = getEncryptor().decryptString(enc);
      if (plaintext === '') {
        // Empty-string sentinel — fall through to plaintext fallback.
      } else {
        const parsed = JSON.parse(plaintext) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as NavRouteCoordinate[];
        }
        console.warn(
          '[route-blob-encryption] navRouteCoordinatesEnc decoded to non-array; falling back to plaintext',
        );
      }
    } catch (err) {
      console.warn(
        `[route-blob-encryption] navRouteCoordinatesEnc decrypt/parse failed; falling back to plaintext: ${
          (err as Error).message
        }`,
      );
    }
  }

  const plain = row.navRouteCoordinates;
  if (plain == null) return null;
  if (Array.isArray(plain)) return plain as NavRouteCoordinate[];
  return null;
}

// ─── Drive.routePoints ──────────────────────────────────────────────────────

/**
 * The slice of a Drive row used for routePoints reads. The plaintext
 * column is non-nullable on the schema, but at the read boundary we
 * accept partial rows (some queries `select` a narrow set of columns).
 */
export interface RoutePointsFields {
  routePoints?: unknown;
  routePointsEnc?: string | null;
}

export interface RoutePointsEncShadowPayload {
  routePointsEnc?: string | null;
}

/**
 * Build the encrypted-shadow payload for a Drive create/update touching
 * `routePoints`. Returns ONLY the `*Enc` column; the caller continues
 * to write the plaintext Json column from its own data via spread.
 *
 * Semantics mirror `buildEncryptedNavRouteWrite`:
 *   • `undefined`            → leave the shadow column untouched.
 *   • `null` / empty array   → clear the shadow column (`null`).
 *   • populated array        → JSON.stringify + encrypt into `*Enc`.
 */
export function buildEncryptedRoutePointsWrite(
  points: RoutePoint[] | null | undefined,
): RoutePointsEncShadowPayload {
  if (points === undefined) return {};
  if (points === null || points.length === 0) {
    return { routePointsEnc: null };
  }
  const json = JSON.stringify(points);
  return { routePointsEnc: getEncryptor().encryptString(json) };
}

/**
 * Read `Drive.routePoints`, preferring the encrypted shadow with
 * plaintext fallback. Returns an empty array for absent data — the
 * column is non-nullable on the schema, but legacy rows may carry
 * `[]` and downstream code already treats nullish as empty.
 *
 * Decrypt or JSON.parse failures fall through to the plaintext column
 * with a `console.warn` — same rationale as readNavRouteCoordinates.
 */
export function readRoutePoints(row: RoutePointsFields): RoutePoint[] {
  const enc = row.routePointsEnc;
  if (enc != null && enc !== '') {
    try {
      const plaintext = getEncryptor().decryptString(enc);
      if (plaintext === '') {
        // Empty-string sentinel — fall through to plaintext fallback.
      } else {
        const parsed = JSON.parse(plaintext) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as RoutePoint[];
        }
        console.warn(
          '[route-blob-encryption] routePointsEnc decoded to non-array; falling back to plaintext',
        );
      }
    } catch (err) {
      console.warn(
        `[route-blob-encryption] routePointsEnc decrypt/parse failed; falling back to plaintext: ${
          (err as Error).message
        }`,
      );
    }
  }

  const plain = row.routePoints;
  if (plain == null) return [];
  if (Array.isArray(plain)) return plain as RoutePoint[];
  return [];
}
