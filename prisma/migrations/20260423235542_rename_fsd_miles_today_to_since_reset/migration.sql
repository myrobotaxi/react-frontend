-- MYR-24: Rename Vehicle.fsdMilesToday to Vehicle.fsdMilesSinceReset.
--
-- MYR-27 (2026-04-15) established that Tesla's SelfDrivingMilesSinceReset
-- counter does NOT reset daily — it resets on OTA updates, factory resets,
-- etc. The legacy column name "fsdMilesToday" was cosmetic and misleading.
-- Wire and SDK code were renamed in MYR-27 but the Prisma column rename
-- was deferred. This migration closes that gap as part of MYR-24.
--
-- Safe in-place rename: no data transformation, no NULLs introduced.
-- The default (0) is preserved. Deploy ordering: this migration MUST run
-- BEFORE the telemetry server deploys with the new SELECT column name.

ALTER TABLE "Vehicle" RENAME COLUMN "fsdMilesToday" TO "fsdMilesSinceReset";
