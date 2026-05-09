-- MYR-73: NOTIFY trigger for Vehicle DELETE so the Go telemetry server
-- can react within seconds (no polling fallback).
--
-- Implements the §3.5 cleanup contract in
-- docs/contracts/data-lifecycle.md (telemetry repo): when the Next.js
-- FR-10.1 deletion transaction commits, the trigger fires a
-- pg_notify('vehicle_deleted', ...) event carrying the (vehicleId,
-- userId, vin) tuple. The Go side LISTENs on a dedicated long-lived
-- connection and publishes a domain event that closes:
--   1. WebSocket clients subscribed to the vehicle (close code 4002).
--   2. The active inbound Tesla mTLS stream for that VIN (registry
--      lookup is VIN-keyed, hence the VIN payload field).
--   3. The JWT user-existence cache entry for the owning user.
--
-- Operator notes:
--   * `vin` may be NULL on early-setup vehicles (the Vehicle row exists
--     before pairing completes). The Go side tolerates a null VIN: only
--     the WebSocket cleanup path runs in that case (no mTLS stream
--     can exist for an un-paired vehicle).
--   * pg_notify payloads are capped at 8000 bytes by Postgres. The
--     three-field JSON payload here is well under the limit.
--   * Triggers do not round-trip through `prisma db pull`. If the
--     database is rebuilt without replaying migrations the function
--     and trigger MUST be re-created from this file.
--   * The function name `notify_vehicle_deleted` and the trigger name
--     `notify_vehicle_deleted_trigger` are stable identifiers; do not
--     rename without updating the telemetry-repo LISTEN code.
--   * Channel name is `vehicle_deleted` (snake_case). The Go listener
--     in internal/store/notify_listener.go must use the same name.

CREATE OR REPLACE FUNCTION notify_vehicle_deleted()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'vehicle_deleted',
        json_build_object(
            'vehicleId', OLD."id",
            'userId', OLD."userId",
            'vin', OLD."vin"
        )::text
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_vehicle_deleted_trigger
    AFTER DELETE ON "Vehicle"
    FOR EACH ROW
    EXECUTE FUNCTION notify_vehicle_deleted();
