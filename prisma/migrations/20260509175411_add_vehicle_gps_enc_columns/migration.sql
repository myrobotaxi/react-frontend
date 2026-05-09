-- MYR-63 Phase 1 — encrypted shadows for Vehicle GPS columns.
--
-- Adds six nullable TEXT columns to Vehicle for the dual-write rollout
-- of P1-classified GPS coordinates per data-classification.md §1.3 and
-- NFR-3.23. Writes go to BOTH the plaintext Float column AND the
-- matching *Enc TEXT column; reads prefer *Enc with plaintext fallback.
-- The plaintext Float columns will be dropped in a separate
-- post-rollout migration once the backfill completes.
--
-- Atomic-pair semantics (vehicle-state-schema.md §3.3 GPS predicates):
--   latitude/longitude, destinationLatitude/destinationLongitude, and
--   originLatitude/originLongitude must be written + read as pairs.
--   Half-NULL reads (one half present, the other NULL) are treated as
--   NULL by the helper layer — never silently passed through.
--
-- Float→string conversion uses `String(x)` which round-trips losslessly
-- through `Number(s)` for IEEE-754 doubles, keeping precision identical
-- across the dual-write window.
--
-- Ciphertext format owned by lib/cryptox (TS) and internal/cryptox (Go):
--   [1B version=0x01][12B nonce][N B ct + 16B tag], base64(StdEncoding).
--
-- Additive only — no rewrite of existing rows. Phase 2 in the
-- my-robo-taxi-telemetry repo wires the Go writer/reader through the
-- field mapper + repo using the same dual-write contract.

ALTER TABLE "Vehicle"
  ADD COLUMN "latitudeEnc"             TEXT,
  ADD COLUMN "longitudeEnc"            TEXT,
  ADD COLUMN "destinationLatitudeEnc"  TEXT,
  ADD COLUMN "destinationLongitudeEnc" TEXT,
  ADD COLUMN "originLatitudeEnc"       TEXT,
  ADD COLUMN "originLongitudeEnc"      TEXT;
