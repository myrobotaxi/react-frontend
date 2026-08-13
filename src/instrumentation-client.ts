import * as Sentry from '@sentry/nextjs';

import { scrubBearerCodePaths } from '@/lib/sentry-scrub';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // /join/{CODE} URLs are credentials — redact them out of every payload.
  beforeSend: (event) => scrubBearerCodePaths(event),
  beforeSendTransaction: (event) => scrubBearerCodePaths(event),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
