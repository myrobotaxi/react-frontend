import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // MYR-246 — Tesla's developer portal rejects redirect URIs on non-standard
  // ports, and the telemetry host serves public TLS only on :4443 (443 is
  // reserved for vehicle mTLS). So the registered Tesla OAuth redirect URI
  // lives on this domain and bounces to the telemetry backend's real callback
  // with the code/state query intact (307 preserves the query string).
  async redirects() {
    return [
      {
        source: '/api/tesla/link/callback',
        destination:
          'https://telemetry.myrobotaxi.app:4443/api/tesla/link/callback',
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
});
