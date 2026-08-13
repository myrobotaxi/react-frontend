/**
 * Apple App Site Association (AASA) document for myrobotaxi.app.
 *
 * Apple's CDN fetches https://myrobotaxi.app/.well-known/apple-app-site-association
 * when the iOS app is installed and caches the result. It must be served as
 * `application/json`, over HTTPS, with no redirect — a 301/302 anywhere in the
 * chain makes iOS silently fall back to opening the link in Safari.
 *
 * No React code — the route handler and its tests both import this.
 */

/** Team ID + bundle identifier of the MyRoboTaxi iOS app. */
export const IOS_APP_ID = 'NFKX777598.app.myrobotaxi.ios';

/** Structure of the applinks document Apple expects. */
export interface AppleAppSiteAssociation {
  applinks: {
    apps: string[];
    details: Array<{
      appID: string;
      appIDs: string[];
      components: Array<{ '/': string; comment: string }>;
    }>;
  };
}

/**
 * The association document.
 *
 * TWO paths are claimed, `/join/*` and `/ride/*`, and each is a real screen in
 * the app. Everything else on the apex stays with the browser, so an installed
 * app never swallows a link it has no screen for — `/privacy`, `/status` and
 * the apex teaser are read on the web on purpose, and a `/*` catch-all here
 * would silently take all three away from anyone who has the app.
 *
 * ── ONLY THIS FILE CHANGES FOR A NEW PATH (MYR-346's three-things-must-agree) ─
 * A Universal Link works when three things agree: the app's
 * `com.apple.developer.associated-domains` ENTITLEMENT, the PROVISIONING
 * profile that carries it, and this DOCUMENT. The first two are HOST-wide —
 * `applinks:myrobotaxi.app` claims the domain, not a path — so adding
 * `/ride/*` (MYR-540) is a change to this file and nothing else. No
 * entitlement edit, no profile regeneration, no new App Store Connect
 * capability. The corresponding iOS work is routing a link the app is already
 * being handed, not being handed a new kind of link.
 *
 * Apple's CDN caches this document, so a newly claimed path can take a while to
 * reach devices that already have the app installed; a fresh install fetches it
 * immediately. A link to an unclaimed path is not broken in the meantime — it
 * opens the web page, which is the whole reason `/ride/{CODE}` renders install
 * steps and an `myrobotaxi://` button rather than assuming the app got it.
 *
 * `appIDs` + `components` is the iOS 13+ form; `appID` is kept alongside it for
 * older readers. `apps` must be present and empty — Apple rejects the file
 * without it.
 */
export const APPLE_APP_SITE_ASSOCIATION: AppleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appID: IOS_APP_ID,
        appIDs: [IOS_APP_ID],
        components: [
          {
            '/': '/join/*',
            comment: 'Invite links - open the app with the code prefilled',
          },
          {
            '/': '/ride/*',
            comment: 'Group ride share links - open the app on the ride to join',
          },
        ],
      },
    ],
  },
};
