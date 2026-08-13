import { buildRideMetadata } from './ride-metadata';

/**
 * Base link-preview metadata for the /ride surface.
 *
 * A layout cannot read the route's params, so this is the codeless form — which
 * on this surface is the SAME card `/ride/{CODE}` emits, because the tags are
 * constants. The code only ever affects the dormant smart-app-banner argument
 * (see `ride-metadata.ts`), which the page overrides through `generateMetadata`.
 */
export const metadata = buildRideMetadata();

/**
 * Standalone layout for the public group-ride join surface. Renders children
 * only — no header, no bottom nav, no links into the rest of the app.
 *
 * There is deliberately no `page.tsx` beside this file. `/join` has a codeless
 * arm because an invite recipient can be told a code out of band and type it
 * in; there is no equivalent for a ride, so bare `/ride` has nothing to render
 * and 404s. In production it never gets that far — the lockdown 302s it to the
 * teaser, because only a code-shaped `/ride/{CODE}` is exempt.
 */
export default function RideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
