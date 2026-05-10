/**
 * MYR-75: GET /api/users/me/export handler tests.
 *
 * Coverage matches the issue's acceptance criteria plus contract-guard
 * gates already enforced on the deletion handler:
 *
 *   1. Auth — 401 when no session / no user id (mirrors DELETE handler).
 *   2. Round-trip — a seeded user (vehicles + stops + drives + invites
 *      sent/received + settings + audit log rows) sees every owned row in
 *      the response.
 *   3. AuditLog write — a `data_exported` row is inserted in the same
 *      Prisma transaction with the documented metadata shape and
 *      classification (CG-DL-5: P0 counts only).
 *   4. Security regression — Account OAuth token columns
 *      (access_token, refresh_token, id_token, *_enc shadows) NEVER
 *      appear anywhere in the response body. Stolen-export must not
 *      escalate to stolen-OAuth.
 *   5. P1 decryption — vehicle GPS, nav route, and drive route columns
 *      are decrypted via the lib/* helpers (which the test mocks). The
 *      raw `*Enc` columns must NOT leak in the response.
 *   6. Failure handling — 500 internal_error envelope when the
 *      transaction throws; auditLog row is not committed (mock-level).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Encryption helper mocks ─────────────────────────────────────────────────
// We don't exercise the real cryptox stack in this unit test — the
// dual-read helpers have their own dedicated tests. Instead we stub the
// helpers to return predictable plaintext so we can assert the export
// shape and the security regression rule (no *Enc columns leak).

vi.mock('@/lib/vehicle-gps-encryption', () => ({
  readVehicleGPS: (row: { latitude: number; longitude: number }) => ({
    latitude: row.latitude,
    longitude: row.longitude,
    destinationLatitude: 47.61,
    destinationLongitude: -122.33,
    originLatitude: 47.6,
    originLongitude: -122.32,
  }),
}));

vi.mock('@/lib/route-blob-encryption', () => ({
  readNavRouteCoordinates: () => [
    [-122.32, 47.6],
    [-122.33, 47.61],
  ],
  readRoutePoints: () => [
    { lat: 47.6, lng: -122.32, timestamp: '2026-05-01T12:00:00Z', speed: 25 },
    { lat: 47.61, lng: -122.33, timestamp: '2026-05-01T12:01:00Z', speed: 30 },
  ],
}));

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const mockUserFindUnique = vi.fn();
const mockAccountFindMany = vi.fn();
const mockSettingsFindUnique = vi.fn();
const mockVehicleFindMany = vi.fn();
const mockDriveFindMany = vi.fn();
const mockInviteFindMany = vi.fn();
const mockAuditLogFindMany = vi.fn();
const mockAuditLogCreate = vi.fn();

interface PrismaTx {
  user: { findUnique: typeof mockUserFindUnique };
  account: { findMany: typeof mockAccountFindMany };
  settings: { findUnique: typeof mockSettingsFindUnique };
  vehicle: { findMany: typeof mockVehicleFindMany };
  drive: { findMany: typeof mockDriveFindMany };
  invite: { findMany: typeof mockInviteFindMany };
  auditLog: {
    findMany: typeof mockAuditLogFindMany;
    create: typeof mockAuditLogCreate;
  };
}

const tx: PrismaTx = {
  user: { findUnique: mockUserFindUnique },
  account: { findMany: mockAccountFindMany },
  settings: { findUnique: mockSettingsFindUnique },
  vehicle: { findMany: mockVehicleFindMany },
  drive: { findMany: mockDriveFindMany },
  invite: { findMany: mockInviteFindMany },
  auditLog: {
    findMany: mockAuditLogFindMany,
    create: mockAuditLogCreate,
  },
};

const mockTransaction = vi.fn(
  async (callback: (t: PrismaTx) => Promise<unknown>) => callback(tx),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (cb: (t: PrismaTx) => Promise<unknown>) => mockTransaction(cb),
  },
}));

// ─── auth mock ───────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

// ─── Import under test ───────────────────────────────────────────────────────

import { GET } from '@/app/api/users/me/export/route';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER_ID = 'cuid_user_export_aaaaaaaaaaaaaa';
const OTHER_USER_ID = 'cuid_user_other_bbbbbbbbbbbbbb';
const NEW_AUDIT_ID = 'cuid_audit_export_cccccccccccc';

const NOW = new Date('2026-05-08T12:00:00.000Z');

function seedUser() {
  return {
    id: USER_ID,
    email: 'owner@example.com',
    name: 'Owner Name',
    image: 'https://example.com/owner.png',
    emailVerified: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function seedAccounts() {
  return [
    {
      id: 'cuid_account_1',
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'google-oauth-sub-12345',
      scope: 'openid email profile',
      expires_at: 1234567890,
    },
  ];
}

function seedSettings() {
  return {
    id: 'cuid_settings_1',
    userId: USER_ID,
    teslaLinked: true,
    teslaVehicleName: 'Roadrunner',
    virtualKeyPaired: true,
    keyPairingDeferredAt: null,
    keyPairingReminderCount: 0,
    notifyDriveStarted: true,
    notifyDriveCompleted: true,
    notifyChargingComplete: true,
    notifyViewerJoined: true,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function seedVehicles() {
  return [
    {
      id: 'cuid_vehicle_1',
      userId: USER_ID,
      teslaVehicleId: 'tesla-vh-1',
      vin: '5YJSA1E26KF1XXXXX',
      name: 'Roadrunner',
      model: 'Model S',
      year: 2024,
      color: 'red',
      licensePlate: 'ABC123',
      chargeLevel: 80,
      estimatedRange: 320,
      chargeState: 'Charging',
      timeToFull: 1.5,
      status: 'parked',
      speed: 0,
      gearPosition: 'P',
      heading: 90,
      locationName: 'Home',
      locationAddress: '123 Main St',
      latitude: 47.6,
      longitude: -122.32,
      latitudeEnc: 'cipher_lat',
      longitudeEnc: 'cipher_lng',
      interiorTemp: 70,
      exteriorTemp: 65,
      odometerMiles: 12345,
      fsdMilesSinceReset: 100.5,
      virtualKeyPaired: true,
      setupStatus: 'connected',
      destinationName: null,
      destinationAddress: null,
      destinationLatitude: null,
      destinationLongitude: null,
      destinationLatitudeEnc: null,
      destinationLongitudeEnc: null,
      originLatitude: null,
      originLongitude: null,
      originLatitudeEnc: null,
      originLongitudeEnc: null,
      etaMinutes: null,
      tripDistanceMiles: null,
      tripDistanceRemaining: null,
      navRouteCoordinates: null,
      navRouteCoordinatesEnc: 'cipher_navroute',
      lastUpdated: NOW,
      createdAt: NOW,
      updatedAt: NOW,
      stops: [
        {
          id: 'cuid_stop_1',
          vehicleId: 'cuid_vehicle_1',
          name: 'Supercharger SEA',
          address: '500 5th Ave',
          type: 'charging',
        },
      ],
    },
  ];
}

function seedDrives() {
  return [
    {
      id: 'cuid_drive_1',
      vehicleId: 'cuid_vehicle_1',
      date: '2026-05-01',
      startTime: '12:00',
      endTime: '12:30',
      startLocation: 'Home',
      startAddress: '123 Main St',
      endLocation: 'Office',
      endAddress: '456 Market St',
      distanceMiles: 12.3,
      durationMinutes: 30,
      avgSpeedMph: 24.6,
      maxSpeedMph: 60,
      energyUsedKwh: 5.0,
      startChargeLevel: 90,
      endChargeLevel: 80,
      fsdMiles: 10.0,
      fsdPercentage: 81.3,
      interventions: 0,
      routePoints: [],
      routePointsEnc: 'cipher_routepoints',
      createdAt: NOW,
    },
  ];
}

function seedInvites() {
  return [
    // Sent by the user
    {
      id: 'cuid_invite_sent',
      vehicleId: 'cuid_vehicle_1',
      senderId: USER_ID,
      label: 'Spouse',
      email: 'spouse@example.com',
      status: 'accepted',
      permission: 'live_history',
      sentDate: NOW,
      acceptedDate: NOW,
      lastSeen: NOW,
      isOnline: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    // Received by the user (via vehicle.userId match — i.e., the
    // OR clause in the handler — sender is someone else, but our user
    // owns the vehicle being shared. Real world: either case can hit
    // depending on how invites are modeled. Using sender != self,
    // vehicleId belongs to USER_ID's vehicle to exercise the OR branch.
    // For coverage we also include a recipient-only invite where the
    // schema doesn't have an explicit recipientId column — the handler
    // includes invites where the user is sender OR vehicle owner.
    {
      id: 'cuid_invite_received',
      vehicleId: 'cuid_vehicle_1',
      senderId: OTHER_USER_ID,
      label: 'Friend',
      email: 'friend@example.com',
      status: 'pending',
      permission: 'live',
      sentDate: NOW,
      acceptedDate: null,
      lastSeen: null,
      isOnline: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

function seedAuditLog() {
  return [
    {
      id: 'cuid_audit_existing_1',
      userId: USER_ID,
      timestamp: NOW,
      action: 'tokens_refreshed',
      targetType: 'account',
      targetId: 'cuid_account_1',
      initiator: 'system_auth',
      metadata: { provider: 'google' },
      createdAt: NOW,
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});

  mockUserFindUnique.mockResolvedValue(seedUser());
  mockAccountFindMany.mockResolvedValue(seedAccounts());
  mockSettingsFindUnique.mockResolvedValue(seedSettings());
  mockVehicleFindMany.mockResolvedValue(seedVehicles());
  mockDriveFindMany.mockResolvedValue(seedDrives());
  mockInviteFindMany.mockResolvedValue(seedInvites());
  mockAuditLogFindMany.mockResolvedValue(seedAuditLog());
  mockAuditLogCreate.mockResolvedValue({
    id: NEW_AUDIT_ID,
    timestamp: NOW,
    createdAt: NOW,
    metadata: {
      vehicleCount: 1,
      driveCount: 1,
      inviteCount: 2,
      auditCount: 1,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/users/me/export', () => {
  describe('authentication', () => {
    it('returns 401 auth_failed when session is null', async () => {
      mockAuth.mockResolvedValue(null);

      const res = await GET();

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({
        error: {
          code: 'auth_failed',
          message: 'authentication required',
          subCode: null,
        },
      });
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('returns 401 auth_failed when session has no user id', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'x@y.com' } });

      const res = await GET();

      expect(res.status).toBe(401);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('returns 401 auth_failed when authenticated but user row is missing', async () => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID } });
      mockUserFindUnique.mockResolvedValue(null);

      const res = await GET();

      expect(res.status).toBe(401);
      // The transaction was entered but no audit row was committed.
      expect(mockAuditLogCreate).not.toHaveBeenCalled();
    });
  });

  describe('round-trip — seeded user with full ownership graph', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID } });
    });

    it('returns 200 with every owned row in the archive', async () => {
      const res = await GET();

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.exportVersion).toBe(1);
      expect(body.auditLogId).toBe(NEW_AUDIT_ID);
      expect(body.exportedAt).toBeDefined();

      // Profile
      expect(body.profile).toMatchObject({
        id: USER_ID,
        email: 'owner@example.com',
        name: 'Owner Name',
      });

      // Accounts (NO token columns)
      expect(body.accounts).toHaveLength(1);
      expect(body.accounts[0]).toMatchObject({
        id: 'cuid_account_1',
        provider: 'google',
        providerAccountId: 'google-oauth-sub-12345',
      });

      // Settings
      expect(body.settings).toMatchObject({
        teslaLinked: true,
        teslaVehicleName: 'Roadrunner',
      });

      // Vehicles + stops
      expect(body.vehicles).toHaveLength(1);
      expect(body.vehicles[0]).toMatchObject({
        id: 'cuid_vehicle_1',
        vin: '5YJSA1E26KF1XXXXX',
        latitude: 47.6,
        longitude: -122.32,
      });
      expect(body.vehicles[0].stops).toHaveLength(1);
      expect(body.vehicles[0].stops[0].name).toBe('Supercharger SEA');

      // Drives — routePoints came via readRoutePoints mock
      expect(body.drives).toHaveLength(1);
      expect(body.drives[0]).toMatchObject({
        id: 'cuid_drive_1',
        distanceMiles: 12.3,
      });
      expect(body.drives[0].routePoints).toHaveLength(2);

      // Invites — both sender and recipient roles included
      expect(body.invites).toHaveLength(2);
      const sentInvite = body.invites.find((i: { id: string }) => i.id === 'cuid_invite_sent');
      const receivedInvite = body.invites.find(
        (i: { id: string }) => i.id === 'cuid_invite_received',
      );
      expect(sentInvite.role).toBe('sender');
      expect(receivedInvite.role).toBe('recipient');

      // Audit log — pre-existing rows + freshly inserted data_exported row
      expect(body.auditLog).toHaveLength(2);
      const insertedRow = body.auditLog.find((r: { id: string }) => r.id === NEW_AUDIT_ID);
      expect(insertedRow).toBeDefined();
      expect(insertedRow.action).toBe('data_exported');
    });

    it('queries only the authenticated user (no cross-user data leak)', async () => {
      await GET();

      expect(mockUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID } }),
      );
      expect(mockAccountFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
      expect(mockSettingsFindUnique).toHaveBeenCalledWith({ where: { userId: USER_ID } });
      expect(mockVehicleFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
      expect(mockDriveFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vehicle: { userId: USER_ID } },
        }),
      );
      expect(mockInviteFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ senderId: USER_ID }, { vehicle: { userId: USER_ID } }],
          },
        }),
      );
      expect(mockAuditLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
    });

    it('writes a data_exported AuditLog row with the documented metadata shape', async () => {
      await GET();

      expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
      const call = mockAuditLogCreate.mock.calls[0][0];
      expect(call.data).toMatchObject({
        userId: USER_ID,
        action: 'data_exported',
        targetType: 'user',
        targetId: USER_ID,
        initiator: 'user',
      });
      expect(call.data.metadata).toEqual({
        vehicleCount: 1,
        driveCount: 1,
        inviteCount: 2,
        auditCount: 1,
      });
    });

    it('AuditLog metadata contains ONLY P0 counts (CG-DL-5)', async () => {
      await GET();

      const call = mockAuditLogCreate.mock.calls[0][0];
      const forbiddenKeys = [
        'email',
        'name',
        'image',
        'lastLogin',
        'lastSeen',
        'gps',
        'latitude',
        'longitude',
        'address',
        'token',
        'accessToken',
        'refreshToken',
        'idToken',
        'vin',
        'routePoints',
        'navRouteCoordinates',
      ];
      for (const key of forbiddenKeys) {
        expect(call.data.metadata).not.toHaveProperty(key);
      }
    });
  });

  describe('security regression — OAuth token columns must NEVER appear', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID } });
    });

    it('account entries do not carry plaintext OAuth tokens', async () => {
      const res = await GET();
      const body = await res.json();
      const serialized = JSON.stringify(body);

      // Plaintext column names from prisma/schema.prisma
      expect(serialized).not.toContain('access_token');
      expect(serialized).not.toContain('refresh_token');
      expect(serialized).not.toContain('id_token');
    });

    it('account entries do not carry encrypted OAuth shadows', async () => {
      const res = await GET();
      const body = await res.json();
      const serialized = JSON.stringify(body);

      // Encrypted shadow column names from MYR-62
      expect(serialized).not.toContain('access_token_enc');
      expect(serialized).not.toContain('refresh_token_enc');
      expect(serialized).not.toContain('id_token_enc');
    });

    it('the Prisma account.findMany call uses an explicit allow-list select', async () => {
      await GET();

      const call = mockAccountFindMany.mock.calls[0][0];
      expect(call.select).toBeDefined();
      // Whatever the call selects, it MUST NOT include any token column.
      const selected = Object.keys(call.select);
      expect(selected).not.toContain('access_token');
      expect(selected).not.toContain('refresh_token');
      expect(selected).not.toContain('id_token');
      expect(selected).not.toContain('access_token_enc');
      expect(selected).not.toContain('refresh_token_enc');
      expect(selected).not.toContain('id_token_enc');
    });
  });

  describe('encryption boundary — *Enc columns are decrypted, not echoed', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID } });
    });

    it('vehicle output exposes decrypted GPS, never the raw *Enc strings', async () => {
      const res = await GET();
      const body = await res.json();
      const serialized = JSON.stringify(body);

      expect(body.vehicles[0].latitude).toBe(47.6);
      expect(body.vehicles[0].longitude).toBe(-122.32);
      // The mocked *Enc placeholders must NOT appear in the serialized
      // body — they're internal representation only.
      expect(serialized).not.toContain('cipher_lat');
      expect(serialized).not.toContain('cipher_lng');
      expect(serialized).not.toContain('cipher_navroute');
      // And the *Enc property names themselves must NOT appear.
      expect(serialized).not.toContain('latitudeEnc');
      expect(serialized).not.toContain('longitudeEnc');
      expect(serialized).not.toContain('navRouteCoordinatesEnc');
    });

    it('drive output exposes decrypted routePoints, never the raw *Enc string', async () => {
      const res = await GET();
      const body = await res.json();
      const serialized = JSON.stringify(body);

      expect(body.drives[0].routePoints).toHaveLength(2);
      expect(body.drives[0].routePoints[0]).toMatchObject({ lat: 47.6, lng: -122.32 });
      expect(serialized).not.toContain('cipher_routepoints');
      expect(serialized).not.toContain('routePointsEnc');
    });
  });

  describe('failure handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID } });
    });

    it('returns 500 internal_error when a query throws', async () => {
      mockVehicleFindMany.mockRejectedValue(new Error('db down'));

      const res = await GET();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({
        error: {
          code: 'internal_error',
          message: 'data export failed',
          subCode: null,
        },
      });
      // Audit row not committed in this transaction (transactional
      // semantics enforced by Prisma — at the mock level we just confirm
      // create was not called when the read failed before it).
      expect(mockAuditLogCreate).not.toHaveBeenCalled();
    });

    it('error envelope never leaks the user identifier', async () => {
      mockUserFindUnique.mockRejectedValue(
        new Error(`internal trace for user ${USER_ID}`),
      );

      const res = await GET();
      const body = await res.json();

      expect(body.error.message).not.toContain(USER_ID);
      expect(body.error.message).toBe('data export failed');
    });
  });
});
