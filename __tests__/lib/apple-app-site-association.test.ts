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

  it('claims exactly the /join/* path', () => {
    expect(detail.components).toHaveLength(1);
    expect(detail.components[0]['/']).toBe('/join/*');
  });

  it('claims nothing outside /join', () => {
    for (const component of detail.components) {
      expect(component['/'].startsWith('/join')).toBe(true);
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
});
