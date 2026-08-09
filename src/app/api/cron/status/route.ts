import { isProbeThrottled, recordProbeRun } from '@/features/status/api/status-recorder';
import { isAuthorizedCronRequest } from '@/lib/status/cron-auth';
import { runAllProbes } from '@/lib/status/probes';

/**
 * The prober, on Vercel Cron (MYR-510).
 *
 * Scheduled in vercel.json. Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * without a matching secret this endpoint answers 401 and does nothing, because
 * an open endpoint that makes outbound requests and writes rows is a gift to
 * anyone who finds it.
 *
 * It lives here, on Vercel, and not on the telemetry platform, for the reason
 * the whole issue exists: on 2026-08-09 the monitored system went down and
 * nothing noticed, and a monitor that shares a failure domain with its subject
 * cannot notice. Vercel going down instead produces no rows, which the page
 * renders as "No data" — not as health.
 */

/** Prisma and `fetch` with a timeout; both want Node, not the edge runtime. */
export const runtime = 'nodejs';

/** Three probes with an 8s budget each, plus two writes. */
export const maxDuration = 30;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();

  try {
    // Before probing, not after: a run that will not be stored should not send
    // three requests at the service it is supposed to be watching.
    if (await isProbeThrottled(now)) {
      return Response.json(
        { checkedAt: now.toISOString(), throttled: true, written: 0, pruned: 0, results: [] },
        { status: 429, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const results = await runAllProbes();
    const outcome = await recordProbeRun(results, now);

    return Response.json(
      {
        checkedAt: now.toISOString(),
        ...outcome,
        results: results.map(({ component, ok, latencyMs, detail }) => ({
          component,
          ok,
          latencyMs,
          detail,
        })),
      },
      // The prober itself is never cached; a cached probe is not a probe.
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    // Losing a round is survivable and self-announcing: after ten missed
    // minutes the page stops claiming the components are healthy.
    console.error('[status] probe run failed', error);
    return Response.json({ error: 'probe run failed' }, { status: 500 });
  }
}
