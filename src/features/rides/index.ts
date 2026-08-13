/**
 * Rides feature — public API.
 *
 * The web half of MYR-540 and nothing more: one standalone landing page that
 * hands a group-ride share link to the iOS app. The ride itself — the map, the
 * members, the ETA, the trip edits — lives in the app, behind sign-in.
 *
 * ── THIS BARREL MUST STAY BACKEND-FREE ──────────────────────────────────────
 * `features/invites/index.ts` re-exports server actions, which pull in Prisma,
 * which is why `app/join/[code]/page.tsx` imports its screen by PATH and says
 * so. Nothing here touches a database, so importing through this barrel is
 * safe. If a server action is ever added to it, `app/ride/[code]/page.tsx` must
 * switch to a direct path import the same way — that page is served to
 * anonymous visitors and must not drag a database client into its bundle.
 */

// Components
export { RideJoinScreen } from './components/RideJoinScreen';
export type { RideJoinScreenProps } from './components/RideJoinScreen';
