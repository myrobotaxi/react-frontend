-- MYR-510 — the two tables behind the public status page at /status.
--
-- Schema only. The first incident record is a separate, hand-applied file:
-- prisma/sql/20260809_seed_status_incident.sql
--
-- Generated with:
--   npx prisma migrate diff --from-schema-datamodel <previous> \
--     --to-schema-datamodel prisma/schema.prisma --script

-- CreateTable
CREATE TABLE "status_checks" (
    "id" SERIAL NOT NULL,
    "component" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "latency_ms" INTEGER,
    "detail" TEXT,
    "checked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_incidents" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "resolved_at" TIMESTAMPTZ(3),
    "title" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "components" TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_checks_component_checked_at_idx" ON "status_checks"("component", "checked_at");

-- CreateIndex
CREATE INDEX "status_checks_checked_at_idx" ON "status_checks"("checked_at");

-- CreateIndex
CREATE INDEX "status_incidents_started_at_idx" ON "status_incidents"("started_at");
