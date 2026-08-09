/**
 * The prober (MYR-510).
 *
 * Cardinal rule: this must not run on the thing it watches. It runs as a Vercel
 * cron job; the telemetry service it probes runs on a different platform, and
 * the database it writes to is a third. A monitor that shares a failure domain
 * with its subject reports "all clear" for the one event that matters.
 *
 * The one exception is honest and stated on the page: the website component is
 * Vercel probing Vercel. It catches a broken file or a bad deploy, which is
 * what it is for; it cannot catch Vercel being down, because then the cron does
 * not run either — and no rows is what the page renders as "No data".
 */

import {
  TELEMETRY_HEALTH_PATHS,
  TELEMETRY_ORIGIN,
  WEB_ORIGIN,
  type ComponentId,
} from './components';
import {
  healthFailure,
  realtimeFailure,
  summarizeProbe,
  wellKnownFailure,
  WELL_KNOWN_EXPECTATIONS,
  type ProbePart,
} from './probe-rules';

/**
 * Per-request budget. Generous enough that a cold start on the far side is not
 * called an outage, short enough that three probes plus two writes finish well
 * inside a serverless invocation.
 */
export const PROBE_TIMEOUT_MS = 8_000;

/** One component's verdict for one cron run — exactly one row per component. */
export interface ProbeResult {
  component: ComponentId;
  ok: boolean;
  latencyMs: number;
  detail: string;
}

/** Run every probe concurrently. Never throws: a thrown probe is a failed one. */
export async function runAllProbes(): Promise<ProbeResult[]> {
  return Promise.all([probeTelemetryApi(), probeRealtimeWs(), probeWeb()]);
}

/**
 * The telemetry service's health endpoints — see `TELEMETRY_HEALTH_PATHS` for
 * why that is currently a list of one, and what the page says about the gap.
 */
export async function probeTelemetryApi(): Promise<ProbeResult> {
  const started = Date.now();

  const parts = await Promise.all(
    TELEMETRY_HEALTH_PATHS.map(async (path): Promise<ProbePart> => {
      const observation = await observe(`${TELEMETRY_ORIGIN}${path}`, false);
      const label = path.slice(1);

      if (observation.error) {
        return { summary: '', failure: `${label} did not answer (${observation.error})` };
      }

      return {
        summary: `${label} ${observation.status} in ${observation.latencyMs}ms`,
        failure: healthFailure(label, observation.status),
      };
    }),
  );

  return { component: 'telemetry-api', ...summarizeProbe(parts), latencyMs: Date.now() - started };
}

/** The WebSocket endpoint, asked over plain HTTPS. See `realtimeFailure`. */
export async function probeRealtimeWs(): Promise<ProbeResult> {
  const started = Date.now();
  const observation = await observe(`${TELEMETRY_ORIGIN}/api/ws`, false);

  const part: ProbePart = observation.error
    ? { summary: '', failure: `WebSocket endpoint did not answer (${observation.error})` }
    : {
        summary: `/api/ws ${observation.status} in ${observation.latencyMs}ms (no upgrade attempted)`,
        failure: realtimeFailure(observation.status),
      };

  return { component: 'realtime-ws', ...summarizeProbe([part]), latencyMs: Date.now() - started };
}

/** The two `.well-known` files, checked for status, content type and content. */
export async function probeWeb(): Promise<ProbeResult> {
  const started = Date.now();

  const parts = await Promise.all(
    WELL_KNOWN_EXPECTATIONS.map(async (expectation): Promise<ProbePart> => {
      const observation = await observe(`${WEB_ORIGIN}${expectation.path}`, true);

      if (observation.error) {
        return {
          summary: '',
          failure: `${expectation.label} did not answer (${observation.error})`,
        };
      }

      return {
        summary: `${expectation.label} ${observation.status} in ${observation.latencyMs}ms`,
        failure: wellKnownFailure(expectation, observation),
      };
    }),
  );

  return { component: 'web', ...summarizeProbe(parts), latencyMs: Date.now() - started };
}

/** A single request, reduced to what the rules need. Never throws. */
interface Observation {
  status: number;
  contentType: string | null;
  body: string;
  latencyMs: number;
  /** Set when there was no HTTP response at all — DNS, TLS, refused, timeout. */
  error: string | null;
}

async function observe(url: string, readBody: boolean): Promise<Observation> {
  const started = Date.now();

  try {
    const response = await fetch(url, {
      // A cached answer would be a probe of Vercel's cache, not of the service.
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { 'User-Agent': 'myrobotaxi-status-prober/1' },
    });

    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      body: readBody ? await response.text() : '',
      latencyMs: Date.now() - started,
      error: null,
    };
  } catch (error) {
    return {
      status: 0,
      contentType: null,
      body: '',
      latencyMs: Date.now() - started,
      error: describeError(error),
    };
  }
}

/** A short, stable phrase — this string is published on the page. */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return `no response within ${PROBE_TIMEOUT_MS}ms`;
    return error.message.slice(0, 120);
  }
  return 'unknown error';
}
