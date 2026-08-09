-- MYR-510 — the first entry in the public incident log.
--
-- Deliberately NOT part of the schema migration. A migration changes the shape
-- of the database; this is published content, written by a person, and it
-- should be reviewable and re-runnable on its own.
--
-- Idempotent: the id is fixed and the insert is a no-op on a second run. Apply
-- with:
--   psql "$DIRECT_URL" -f prisma/sql/20260809_seed_status_incident.sql
--
-- Written blameless and in plain language. It names what users experienced
-- first, then the cause, then what we changed — and it does not name a person.

INSERT INTO "status_incidents" ("id", "started_at", "resolved_at", "title", "body_md", "components", "created_at")
VALUES (
  'incident_20260809_api_outage',
  TIMESTAMPTZ '2026-08-09 04:02:00+00',
  TIMESTAMPTZ '2026-08-09 04:09:00+00',
  'Telemetry API and real-time updates unavailable during a deploy',
  E'For about seven minutes the telemetry API did not answer. Requests failed, live vehicle updates stopped arriving, and signing in — which depends on the API — did not work. Everything that was affected was unavailable rather than wrong: no data was lost, and nothing incorrect was served or stored.\n\nThe cause was a routine deploy. Replacing the running container image is a two-step operation, and the second step did not complete: the hosting platform''s machine API rejected the calls that would have brought the new instance up, and the single production machine was left stopped. With no instance running there was nothing to serve traffic.\n\nWe started the machine by hand and service returned at 04:09 UTC.\n\nTwo things are changing as a result:\n\n- A blue/green deploy, so a new instance has to be healthy before the old one is retired and a failed image swap can never leave zero instances running.\n- This page, with a prober that runs outside the platform it watches, so an outage of this kind is visible here rather than found by hand.',
  ARRAY['telemetry-api', 'realtime-ws'],
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
