/**
 * Deep links that open the installed iOS app directly (MYR-453).
 *
 * WHY THIS EXISTS. `https://myrobotaxi.app/join/{CODE}` is a Universal Link, and
 * when iOS honours it the app opens with the code and nobody sees a web page at
 * all. But iOS only honours it from surfaces that hand the URL to the system —
 * Messages, Mail, Safari. Tapped inside a third-party in-app browser (Telegram,
 * WhatsApp, Instagram), the link is loaded by that app's own WKWebView and the
 * universal-link machinery never runs. The recipient lands on the web page, and
 * before this ticket the page's only app-facing button was TestFlight: somebody
 * who ALREADY HAD THE APP was sent to an installer and lost their code. That is
 * the bug Aarthi hit from Telegram.
 *
 * A custom-scheme URL is the one hand-off that still works from inside a
 * webview, because it does not depend on AASA resolution — the OS routes it on
 * the scheme alone, which the app claims in `CFBundleURLTypes`.
 *
 * No React code — importable from server components and from `generateMetadata`.
 */

import { sanitizeInviteCode } from './invite-code';

/**
 * The URL scheme the iOS app registers.
 *
 * MUST match `CFBundleURLSchemes` in `App/MyRoboTaxi-Info.plist` and
 * `InviteLink.appScheme` in the iOS repo. Two codebases, one string: if this
 * side changes it alone, every button below silently opens nothing.
 */
export const APP_URL_SCHEME = 'myrobotaxi';

/** First path component of an in-app invite link, mirroring `InviteLink.pathComponent`. */
const APP_JOIN_HOST = 'join';

/**
 * The in-app URL that opens an invite: `myrobotaxi://join/{CODE}`.
 *
 * EXACTLY the shape the app's parser accepts, and deliberately no more. iOS
 * (`InviteLinkRouting.code(fromAppLink:)`) flattens authority and path into one
 * list and requires precisely `["join", CODE]`, so a trailing slash, an extra
 * segment, or the query form `myrobotaxi://join?code=…` all parse to nothing.
 * The generated string is `InviteLink.appURL(code:)` character for character.
 *
 * Runs the code through `sanitizeInviteCode` even though every caller has
 * already sanitized it. That is not distrust of the callers — it is what makes
 * this function TOTAL: there is no argument for which it returns a string that
 * the app would refuse, so a `null` return is the only "no button" signal a
 * caller has to handle. A code that is not six `[A-Z0-9]` characters yields
 * `null` and the app-open CTA is not rendered at all, rather than rendering a
 * button that does nothing when tapped.
 *
 * @param code - Invite code, already sanitized by the caller. Case is forgiven
 *   (the app upper-cases too); anything else is rejected.
 * @returns The scheme URL, or `null` when there is no well-formed code.
 */
export function appJoinURL(code: string | null | undefined): string | null {
  const sanitized = sanitizeInviteCode(code);
  if (!sanitized) return null;

  return `${APP_URL_SCHEME}://${APP_JOIN_HOST}/${sanitized}`;
}
