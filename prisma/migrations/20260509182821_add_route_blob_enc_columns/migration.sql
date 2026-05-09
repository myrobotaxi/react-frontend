-- MYR-64 Phase 1 — encrypted shadows for route-blob columns.
--
-- Adds two nullable TEXT columns for the dual-write rollout of P1
-- route polylines per data-classification.md §1.4 and NFR-3.23:
--
--   • Vehicle.navRouteCoordinatesEnc — Tesla's planned navigation
--     polyline (the "where the car is going" route, member of the
--     navigation atomic group). Plaintext column is `Json?`.
--   • Drive.routePointsEnc           — recorded drive route polyline
--     (the historical breadcrumb trail of a completed drive).
--     Plaintext column is non-nullable `Json`.
--
-- Wire format owned by lib/cryptox (TS) and internal/cryptox (Go):
--   [1B version=0x01][12B nonce][N B ct + 16B tag], base64(StdEncoding).
-- The plaintext value is JSON.stringify'd at the encryption boundary,
-- so the ciphertext is a serialized string regardless of the column
-- shape (object array vs tuple array).
--
-- Dual-write semantics (mirrors MYR-62 / MYR-63):
--   1. Writes go to BOTH the plaintext Json column AND the *Enc TEXT
--      shadow during the rollout window.
--   2. Reads prefer *Enc (decrypt + JSON.parse), fall back to the
--      plaintext Json column for legacy rows.
--   3. Backfill happens in a separate post-rollout issue.
--   4. The plaintext columns will be dropped in a separate
--      post-rollout migration once backfill completes.
--
-- Additive only — no rewrite of existing rows. Phase 2 in the
-- my-robo-taxi-telemetry repo wires the Go writer/reader through the
-- field mapper + repos using the same dual-write contract.

ALTER TABLE "Vehicle"
  ADD COLUMN "navRouteCoordinatesEnc" TEXT;

ALTER TABLE "Drive"
  ADD COLUMN "routePointsEnc" TEXT;
