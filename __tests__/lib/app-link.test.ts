import { describe, it, expect } from 'vitest';

import { APP_URL_SCHEME, appJoinURL } from '@/lib/app-link';

/**
 * MYR-453 — the string that opens the installed app from inside a webview.
 *
 * Pinned character for character, because it is one half of a contract with
 * another repository: the iOS parser
 * (`InviteLinkRouting.code(fromAppLink:)`) flattens authority and path and
 * requires exactly `["join", CODE]`, and `InviteLink.appURL(code:)` composes the
 * same string on that side. A URL this side "improves" — a trailing slash, a
 * query form, a lower-cased code — is a button that opens the app on an empty
 * code screen, which is the bug the ticket is about.
 */
describe('appJoinURL', () => {
  it('builds the exact scheme URL the iOS app parses', () => {
    expect(appJoinURL('RBO246')).toBe('myrobotaxi://join/RBO246');
  });

  it('uses the scheme the app registers in CFBundleURLSchemes', () => {
    expect(APP_URL_SCHEME).toBe('myrobotaxi');
    expect(appJoinURL('RBO246')?.startsWith(`${APP_URL_SCHEME}://`)).toBe(true);
  });

  /**
   * No trailing slash, no second path segment, no `?code=`. Each of those is a
   * shape the app's parser rejects outright, so this asserts the negative
   * directly rather than trusting the positive above to have covered it.
   */
  it('emits no shape the app would refuse', () => {
    const url = appJoinURL('RBO246') ?? '';

    expect(url.endsWith('/')).toBe(false);
    expect(url).not.toContain('?');
    expect(url.replace(`${APP_URL_SCHEME}://`, '').split('/')).toEqual(['join', 'RBO246']);
  });

  /** Messaging apps lower-case links; the app upper-cases, and so does this. */
  it('upper-cases a code that reached the page in lower case', () => {
    expect(appJoinURL('rbo246')).toBe('myrobotaxi://join/RBO246');
  });

  /**
   * Total by construction: every input either yields a URL the app accepts or
   * yields `null`, which is the caller's signal to render no button at all. A
   * partially-salvaged code would be a tappable dead end.
   */
  it('returns null rather than a broken link for anything that is not a code', () => {
    for (const junk of [
      null,
      undefined,
      '',
      'ABC',
      'ABCDEFG',
      'RBO-246',
      'RBO 246',
      '../../etc',
      'RBO24!',
    ]) {
      expect(appJoinURL(junk)).toBeNull();
    }
  });
});
