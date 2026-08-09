/**
 * The components the status page is allowed to talk about (MYR-510).
 *
 * This list is the page's honesty contract: there is exactly one entry per
 * thing we actually probe, and the page renders exactly this list. Adding a row
 * for something no probe touches — "Dynamic Island service", "iOS app" — would
 * produce a green chip backed by nothing, which is the specific lie a status
 * page exists to avoid. If you want a new row, write the probe first.
 *
 * `probes` is user-facing copy, not configuration: it is printed under the
 * component so a reader can judge for themselves how much the green chip means.
 */

import { SITE_ORIGIN } from '../constants';

/** Ids are stored in `status_checks.component` — changing one orphans history. */
export const COMPONENT_IDS = ['telemetry-api', 'realtime-ws', 'web'] as const;

export type ComponentId = (typeof COMPONENT_IDS)[number];

/** A component as presented on the page. */
export interface StatusComponent {
  id: ComponentId;
  name: string;
  /** One line on what this component is, for someone who is not us. */
  description: string;
  /** Exactly what the prober does, in the prober's own terms. */
  probes: string;
}

export const STATUS_COMPONENTS: readonly StatusComponent[] = [
  {
    id: 'telemetry-api',
    name: 'Telemetry API',
    description: 'The service the app talks to for vehicle data.',
    probes:
      'Every minute we request /healthz and require HTTP 200. That shows the service is running and answering. It does not show that the service can reach its database: there is no readiness endpoint to ask yet, so a database fault could sit behind a green chip here.',
  },
  {
    id: 'realtime-ws',
    name: 'Real-time updates',
    description: 'The WebSocket stream that carries live vehicle position and state.',
    probes:
      'Every minute we open a plain HTTPS request to the WebSocket endpoint and require the service itself to answer. We do not complete a WebSocket upgrade, so this proves the endpoint is being served — not that a stream would stay healthy.',
  },
  {
    id: 'web',
    name: 'Website and app links',
    description:
      'myrobotaxi.app, and the two files Apple and Tesla fetch from it to make Universal Links and vehicle pairing work.',
    probes:
      'Every minute we fetch /.well-known/apple-app-site-association and /.well-known/appspecific/com.tesla.3p.public-key.pem and require HTTP 200, the correct content type, and the expected content in each.',
  },
] as const;

/** Lookup by id, for rendering an incident's affected-component list. */
export function componentName(id: string): string {
  return STATUS_COMPONENTS.find((component) => component.id === id)?.name ?? id;
}

/**
 * Where the prober points.
 *
 * Both are overridable so a preview deployment can probe itself rather than
 * production, but the defaults are the real thing: an unset variable must
 * produce a correct probe, not a silently local one.
 *
 * The telemetry origin is port 4443 on purpose. Port 443 on the same host is a
 * mutual-TLS listener for vehicles — a prober has no client certificate for it,
 * so probing 443 would report a permanent outage that is not happening.
 */
export const TELEMETRY_ORIGIN =
  process.env.STATUS_TELEMETRY_ORIGIN ?? 'https://telemetry.myrobotaxi.app:4443';

/**
 * The health endpoints the telemetry probe requires a 200 from.
 *
 * MYR-510 specified `/healthz` AND `/readyz`. Only the first exists: `/readyz`
 * answers 404 today, verified against production while building this, along
 * with `/health`, `/ready`, `/livez` and `/metrics`. Probing a path that is not
 * there would have published a permanent outage that is not happening — the
 * exact lie in the other direction, and one nobody would have believed for
 * long enough to be useful.
 *
 * So the list is one entry, and the component's `probes` copy says out loud
 * that database reachability is therefore NOT covered. When the telemetry
 * service grows a readiness endpoint, add it here and delete that sentence —
 * those two edits belong in the same commit.
 */
export const TELEMETRY_HEALTH_PATHS = ['/healthz'] as const;

export const WEB_ORIGIN = process.env.STATUS_SITE_ORIGIN ?? SITE_ORIGIN;
