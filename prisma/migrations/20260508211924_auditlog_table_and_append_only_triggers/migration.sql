-- MYR-70: AuditLog table + append-only triggers.
--
-- Implements docs/contracts/data-lifecycle.md §4 (telemetry repo) for
-- FR-10.2 / NFR-3.29. The Next.js app owns this table per §1.4; the Go
-- telemetry server holds Insert-only access via raw pgx for system-initiated
-- rows (drives_pruned, mask_applied, tokens_refreshed).
--
-- `userId` is intentionally NOT a foreign key — see §4.5. The audit row must
-- outlive the User row when FR-10.1 cascade deletion runs.

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "initiator" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- ---------------------------------------------------------------------------
-- Append-only enforcement (data-lifecycle.md §4.3, NFR-3.29).
--
-- Any UPDATE or DELETE on AuditLog raises an exception. Enforced at the
-- database level so ad-hoc psql sessions, future code paths, or out-of-band
-- migrations cannot silently corrupt the audit trail.
--
-- Operator notes:
--   * TRUNCATE bypasses BEFORE DELETE triggers by design — bulk-clearing
--     the audit log via TRUNCATE is not blocked at the trigger level.
--     NFR-3.29 forbids it at the policy level.
--   * Postgres triggers do not round-trip through `prisma db pull`. If the
--     database is rebuilt without replaying migrations (e.g. a manual
--     restore) the function and both triggers MUST be re-created from this
--     file.
--   * The function name `prevent_audit_log_mutation` and the trigger names
--     `prevent_audit_log_update` / `prevent_audit_log_delete` are stable
--     identifiers; do not rename without updating the contract doc.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AuditLog rows are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_update
    BEFORE UPDATE ON "AuditLog"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER prevent_audit_log_delete
    BEFORE DELETE ON "AuditLog"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();
