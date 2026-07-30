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
 * Only `/join/*` is claimed. Everything else on the apex stays with the browser,
 * so an installed app never swallows a link it has no screen for.
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
        ],
      },
    ],
  },
};
