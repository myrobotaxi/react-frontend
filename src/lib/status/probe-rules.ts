/**
 * What counts as a healthy answer (MYR-510).
 *
 * Split out from `probes.ts` so the judgement is pure: every rule below takes
 * an already-observed response and returns either null (fine) or the sentence
 * the prober will store in `status_checks.detail`. The network lives next door.
 */

/** A file the site must keep serving, and what "serving it" means. */
export interface WellKnownExpectation {
  /** Path on myrobotaxi.app. */
  path: string;
  /** Short name for the failure sentence. */
  label: string;
  /** Required `Content-Type` prefix — the parameters after `;` are ignored. */
  contentType: string;
  /** A string the body must contain, so an empty or wrong file cannot pass. */
  mustContain: string;
}

/**
 * The two files outside systems fetch from this domain (absorbs MYR-504).
 *
 * Apple's CDN reads the first to enable Universal Links; Tesla reads the second
 * at tesla.com/_ak/myrobotaxi.app to pair a virtual key. Both are served by
 * this app, both have broken silently before, and neither has a user who would
 * report it — Apple and Tesla just quietly stop working. Checking status alone
 * is not enough: the extensionless AASA path is exactly the kind of URL a host
 * will happily serve as `text/html`, and a truncated PEM is still HTTP 200.
 */
export const WELL_KNOWN_EXPECTATIONS: readonly WellKnownExpectation[] = [
  {
    path: '/.well-known/apple-app-site-association',
    label: 'apple-app-site-association',
    contentType: 'application/json',
    mustContain: '"applinks"',
  },
  {
    path: '/.well-known/appspecific/com.tesla.3p.public-key.pem',
    label: 'tesla public key',
    contentType: 'application/x-pem-file',
    mustContain: '-----BEGIN PUBLIC KEY-----',
  },
] as const;

/** An HTTP response, reduced to the three things the rules look at. */
export interface HttpObservation {
  status: number;
  contentType: string | null;
  body: string;
}

/**
 * A health endpoint has one acceptable answer.
 *
 * Not `< 400`: /readyz returning 503 is precisely the "I am up but my database
 * is not" signal we want on the page, and a redirect from a health endpoint
 * means something is in front of it that should not be.
 */
export function healthFailure(label: string, status: number): string | null {
  return status === 200 ? null : `${label} returned HTTP ${status}`;
}

/**
 * The real-time endpoint, probed without a WebSocket upgrade.
 *
 * A plain GET to a WebSocket route is answered by the service with a 4xx — it
 * wants an Upgrade header it did not get. That 4xx is the good outcome: it
 * proves the service itself is on the other end. A 5xx is what the platform's
 * edge returns when there is nothing behind it to ask, which is exactly the
 * shape of the 2026-08-09 outage, so 5xx is the failure line.
 */
export function realtimeFailure(status: number): string | null {
  return status >= 500 ? `WebSocket endpoint returned HTTP ${status}` : null;
}

/** Whether a served file is the file we promised outside systems. */
export function wellKnownFailure(
  expectation: WellKnownExpectation,
  observation: HttpObservation,
): string | null {
  if (observation.status !== 200) {
    return `${expectation.label} returned HTTP ${observation.status}`;
  }

  const contentType = (observation.contentType ?? '').split(';')[0].trim().toLowerCase();
  if (contentType !== expectation.contentType) {
    return `${expectation.label} served as ${contentType || 'no content type'}, expected ${expectation.contentType}`;
  }

  if (observation.body.trim().length === 0) {
    return `${expectation.label} is empty`;
  }

  if (!observation.body.includes(expectation.mustContain)) {
    return `${expectation.label} is missing ${expectation.mustContain}`;
  }

  return null;
}

/**
 * Fold a probe's parts into one `detail` string.
 *
 * Failures win and are listed in full; when everything passed, the successes
 * are the detail — a green row that can still show what was actually asked is
 * worth more than one that only says "ok".
 */
export function summarizeProbe(parts: readonly ProbePart[]): {
  ok: boolean;
  detail: string;
} {
  const failures = parts.filter((part) => part.failure !== null);
  if (failures.length > 0) {
    return { ok: false, detail: failures.map((part) => part.failure).join('; ') };
  }
  return { ok: true, detail: parts.map((part) => part.summary).join(', ') };
}

/** One request inside a probe: what it asked, and what was wrong with it. */
export interface ProbePart {
  /** What to print when the whole probe passed, e.g. `healthz 200 in 84ms`. */
  summary: string;
  /** Null when this part was fine. */
  failure: string | null;
}
