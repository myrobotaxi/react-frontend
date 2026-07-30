import { APPLE_APP_SITE_ASSOCIATION } from '@/lib/apple-app-site-association';

/**
 * Prerendered at build time — the document is a constant, and Apple's CDN
 * should never wait on a cold serverless start for it.
 */
export const dynamic = 'force-static';

/**
 * Serves the Apple App Site Association document at the exact, extensionless
 * path Apple fetches: /.well-known/apple-app-site-association.
 *
 * A route handler rather than a file in public/ because the path has no
 * extension: a static file is served with whatever Content-Type the host
 * guesses for it (and would need a vercel.json header to correct), whereas
 * this pins `application/json` in the code that produces it, and is
 * unit-testable.
 */
export function GET() {
  return new Response(JSON.stringify(APPLE_APP_SITE_ASSOCIATION), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
