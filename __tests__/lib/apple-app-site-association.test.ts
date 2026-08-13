import { describe, it, expect } from 'vitest';

import {
  APPLE_APP_SITE_ASSOCIATION,
  IOS_APP_ID,
} from '@/lib/apple-app-site-association';
import { GET } from '@/app/.well-known/apple-app-site-association/route';

describe('APPLE_APP_SITE_ASSOCIATION document', () => {
  const detail = APPLE_APP_SITE_ASSOCIATION.applinks.details[0];

  it('declares the MyRoboTaxi iOS app ID (team + bundle)', () => {
    expect(IOS_APP_ID).toBe('NFKX777598.app.myrobotaxi.ios');
    expect(detail.appID).toBe(IOS_APP_ID);
    expect(detail.appIDs).toEqual([IOS_APP_ID]);
  });

  it('includes the empty apps array Apple requires', () => {
    expect(APPLE_APP_SITE_ASSOCIATION.applinks.apps).toEqual([]);
  });

  /**
   * The exact list, in order. Growing it is how an installed app starts
   * swallowing links it has no screen for, so a new claim has to be a visible
   * edit to this line.
   */
  it('claims exactly /join/* and /ride/*', () => {
    expect(detail.components.map((component) => component['/'])).toEqual([
      '/join/*',
      '/ride/*',
    ]);
  });

  /**
   * MYR-540 — the group ride share link. Its own claim rather than a widening
   * of `/join/*`, because the app routes the two to different screens.
   */
  it('claims the group ride share links', () => {
    const ride = detail.components.find((component) => component['/'] === '/ride/*');

    expect(ride).toBeDefined();
    expect(ride?.comment).toMatch(/ride/i);
  });

  /**
   * Everything NOT claimed stays with the browser. `/privacy`, `/status` and
   * the apex teaser are read on the web on purpose — a catch-all here would
   * take all three away from anyone who has the app installed, silently, on
   * Apple's CDN schedule.
   */
  it('claims no catch-all and nothing outside the two code-bearing routes', () => {
    for (const component of detail.components) {
      expect(component['/']).not.toBe('/*');
      expect(/^\/(join|ride)\/\*$/.test(component['/'])).toBe(true);
    }
  });

  /** Every claim is annotated — the file is read by people, not just by iOS. */
  it('explains each claim', () => {
    for (const component of detail.components) {
      expect(component.comment.length).toBeGreaterThan(0);
    }
  });

  it('serializes to valid JSON', () => {
    expect(() => JSON.parse(JSON.stringify(APPLE_APP_SITE_ASSOCIATION))).not.toThrow();
  });
});

describe('GET /.well-known/apple-app-site-association', () => {
  it('responds 200', () => {
    expect(GET().status).toBe(200);
  });

  it('serves application/json', () => {
    expect(GET().headers.get('content-type')).toBe('application/json');
  });

  it('returns the association document verbatim', async () => {
    const body = await GET().json();
    expect(body).toEqual(APPLE_APP_SITE_ASSOCIATION);
  });

  it('is cacheable for Apple CDN', () => {
    expect(GET().headers.get('cache-control')).toContain('max-age=');
  });

  /**
   * MYR-504 — the deploy guard, at the unit level.
   *
   * `vercel --prod` is run by hand here (the Git integration is disconnected),
   * and a deploy that drops or empties this document silently disables EVERY
   * Universal Link for every installed app, with no error anywhere in our
   * stack. The 2026-08-09 pairing incident was that failure mode on the other
   * `.well-known` file. So the served BODY is asserted, not just the handler's
   * status: both claimed paths have to be in what actually goes over the wire.
   */
  it('serves both claimed paths in the body a deploy would publish', async () => {
    const body = await GET().json();
    const claimed = body.applinks.details[0].components.map(
      (component: { '/': string }) => component['/'],
    );

    expect(claimed).toEqual(['/join/*', '/ride/*']);
    expect(body.applinks.details[0].appID).toBe(IOS_APP_ID);
  });

  it('is never empty, which is the shape a broken deploy would serve', async () => {
    const text = await GET().text();

    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe('{}');
    expect(text).toContain('/ride/*');
  });
});
