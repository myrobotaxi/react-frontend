import { buildJoinMetadata } from './join-metadata';

/**
 * Base link-preview metadata for the /join surface.
 *
 * The generic form, which is what any /join route that does not describe itself
 * emits. Both pages override it through `generateMetadata` when the link carries
 * a `?from=` name (MYR-359) — search params are not visible to a layout, and the
 * card has to be right before the recipient taps anything.
 */
export const metadata = buildJoinMetadata(null);

/**
 * Standalone layout for the public invite surface. Renders children only —
 * no header, no bottom nav, no links into the rest of the app.
 */
export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
