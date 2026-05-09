/**
 * MYR-72: DELETE /api/users/me handler tests.
 *
 * Coverage matches the issue's three required scenarios plus a CG-DL-5
 * metadata classification check:
 *
 *   1. Happy path — seeded user (vehicles + drives + invites + settings)
 *      gets deleted, AuditLog row is created with the orphan userId, all
 *      dependent rows are gone via Prisma cascade.
 *   2. Rollback — auditLog.create throws inside the transaction; assert no
 *      User row was deleted (transaction integrity per data-lifecycle.md
 *      §3.4).
 *   3. Idempotency — second call after success returns 401, not 500
 *      (rest-api.md §7.6 Idempotency).
 *   4. Metadata classification — only {vehicleCount, driveCount,
 *      inviteCount} appear in audit metadata (CG-DL-5; data-lifecycle.md
 *      §4.4).
 *
 * The repo's test convention mocks Prisma + auth at the module boundary
 * rather than spinning up a real DB. Cascade behavior is exercised at the
 * transaction-callback level: the test assertion confirms the handler
 * issues `tx.user.delete({ where: { id: userId } })`, and the cascade
 * itself is enforced by Prisma + Postgres (verified by the schema
 * `onDelete: Cascade` declarations on Account, Vehicle, Drive, TripStop,
 * Invite, Settings).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const mockVehicleCount = vi.fn();
const mockDriveCount = vi.fn();
const mockInviteCount = vi.fn();
const mockAuditLogCreate = vi.fn();
const mockUserDelete = vi.fn();

interface PrismaTx {
  vehicle: { count: typeof mockVehicleCount };
  drive: { count: typeof mockDriveCount };
  invite: { count: typeof mockInviteCount };
  auditLog: { create: typeof mockAuditLogCreate };
  user: { delete: typeof mockUserDelete };
}

const tx: PrismaTx = {
  vehicle: { count: mockVehicleCount },
  drive: { count: mockDriveCount },
  invite: { count: mockInviteCount },
  auditLog: { create: mockAuditLogCreate },
  user: { delete: mockUserDelete },
};

const mockTransaction = vi.fn(
  async (callback: (t: PrismaTx) => Promise<unknown>) => callback(tx),
);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (cb: (t: PrismaTx) => Promise<unknown>) =>
      mockTransaction(cb),
  },
}));

// ─── auth mock ───────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

// ─── Import under test ───────────────────────────────────────────────────────

import { DELETE } from '@/app/api/users/me/route';

// ─── Setup ───────────────────────────────────────────────────────────────────

const USER_ID = 'cuid_user_1234567890abcdef';
const AUDIT_LOG_ID = 'cuid_audit_abcdef1234567890';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});

  mockVehicleCount.mockResolvedValue(2);
  mockDriveCount.mockResolvedValue(3);
  mockInviteCount.mockResolvedValue(2);
  mockAuditLogCreate.mockResolvedValue({ id: AUDIT_LOG_ID });
  mockUserDelete.mockResolvedValue({ id: USER_ID });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DELETE /api/users/me', () => {
  describe('authentication', () => {
    it('returns 401 auth_failed when session is null', async () => {
      mockAuth.mockResolvedValue(null);

      const res = await DELETE();

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

      const res = await DELETE();

      expect(res.status).toBe(401);
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('happy path — seeded user with vehicles + drives + invites', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID } });
    });

    it('returns 200 with {deleted: true, auditLogId} on success', async () => {
      const res = await DELETE();

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        deleted: true,
        auditLogId: AUDIT_LOG_ID,
      });
    });

    it('runs the transaction in the documented order: counts → audit insert → user delete', async () => {
      const order: string[] = [];
      mockVehicleCount.mockImplementation(async () => {
        order.push('vehicle.count');
        return 2;
      });
      mockDriveCount.mockImplementation(async () => {
        order.push('drive.count');
        return 3;
      });
      mockInviteCount.mockImplementation(async () => {
        order.push('invite.count');
        return 2;
      });
      mockAuditLogCreate.mockImplementation(async () => {
        order.push('auditLog.create');
        return { id: AUDIT_LOG_ID };
      });
      mockUserDelete.mockImplementation(async () => {
        order.push('user.delete');
        return { id: USER_ID };
      });

      await DELETE();

      // counts run first (in any order — Promise.all), then audit, then delete
      expect(order.slice(0, 3).sort()).toEqual([
        'drive.count',
        'invite.count',
        'vehicle.count',
      ]);
      expect(order[3]).toBe('auditLog.create');
      expect(order[4]).toBe('user.delete');
    });

    it('counts vehicles owned by the user', async () => {
      await DELETE();
      expect(mockVehicleCount).toHaveBeenCalledWith({
        where: { userId: USER_ID },
      });
    });

    it('counts drives across all of the user vehicles via the vehicle.userId relation filter', async () => {
      await DELETE();
      expect(mockDriveCount).toHaveBeenCalledWith({
        where: { vehicle: { userId: USER_ID } },
      });
    });

    it('counts invites sent by the user', async () => {
      await DELETE();
      expect(mockInviteCount).toHaveBeenCalledWith({
        where: { senderId: USER_ID },
      });
    });

    it('writes the AuditLog row with action=account_deleted, targetType=user, targetId=userId, initiator=user', async () => {
      await DELETE();

      expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
      const call = mockAuditLogCreate.mock.calls[0][0];
      expect(call.data).toMatchObject({
        userId: USER_ID,
        action: 'account_deleted',
        targetType: 'user',
        targetId: USER_ID,
        initiator: 'user',
      });
    });

    it('AuditLog metadata contains ONLY P0 counts (CG-DL-5 / data-lifecycle.md §4.4)', async () => {
      await DELETE();

      const call = mockAuditLogCreate.mock.calls[0][0];
      expect(call.data.metadata).toEqual({
        vehicleCount: 2,
        driveCount: 3,
        inviteCount: 2,
      });

      // Must NOT contain any P1 field. Enumerate forbidden keys explicitly.
      const forbiddenKeys = [
        'email',
        'name',
        'lastLogin',
        'lastLoginAt',
        'lastSeen',
        'gps',
        'latitude',
        'longitude',
        'address',
        'token',
        'accessToken',
        'refreshToken',
        'vin',
        'image',
      ];
      for (const key of forbiddenKeys) {
        expect(call.data.metadata).not.toHaveProperty(key);
      }
    });

    it('deletes the User row after the audit insert (cascade handles the rest)', async () => {
      await DELETE();

      expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: USER_ID } });

      // Audit insert preceded user delete — required by data-lifecycle.md §3.1.
      const auditOrder = mockAuditLogCreate.mock.invocationCallOrder[0];
      const deleteOrder = mockUserDelete.mock.invocationCallOrder[0];
      expect(auditOrder).toBeLessThan(deleteOrder);
    });

    it('the AuditLog userId persists as an orphan reference (no FK to User)', async () => {
      // Re-confirms the design intent of data-lifecycle.md §4.5: the audit
      // row's userId is not an FK, so it survives the User delete.
      await DELETE();

      const auditCall = mockAuditLogCreate.mock.calls[0][0];
      expect(auditCall.data.userId).toBe(USER_ID);
      // The handler MUST NOT pass a `user: { connect: ... }` relation —
      // that would imply a relational FK. The schema declares userId as a
      // plain string column, and the handler writes it as such.
      expect(auditCall.data).not.toHaveProperty('user');
    });
  });

  describe('rollback — audit insert failure aborts the transaction', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID } });
    });

    it('returns 500 internal_error when auditLog.create throws', async () => {
      mockAuditLogCreate.mockRejectedValue(
        new Error('simulated audit insert failure'),
      );
      // Real Prisma $transaction would re-throw and roll back. Our mock
      // delegates to the handler's callback, so when the callback throws
      // the wrapper re-throws too — replicate that.
      mockTransaction.mockImplementation(async (cb) => {
        return cb(tx);
      });

      const res = await DELETE();

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({
        error: {
          code: 'internal_error',
          message: 'account deletion failed',
          subCode: null,
        },
      });
      // user.delete was never reached — the audit failure short-circuited
      // the transaction.
      expect(mockUserDelete).not.toHaveBeenCalled();
    });

    it('returns 500 internal_error and skips audit when count query fails', async () => {
      mockVehicleCount.mockRejectedValue(new Error('db down'));

      const res = await DELETE();

      expect(res.status).toBe(500);
      expect(mockAuditLogCreate).not.toHaveBeenCalled();
      expect(mockUserDelete).not.toHaveBeenCalled();
    });

    it('error envelope never leaks user identifiers (CG-DC-2)', async () => {
      mockAuditLogCreate.mockRejectedValue(
        new Error(`internal trace for user ${USER_ID}`),
      );

      const res = await DELETE();
      const body = await res.json();

      // The internal error message MUST NOT round-trip user-correlated
      // identifiers to the client. Even though userId is P0, the handler
      // collapses the failure to a generic message per rest-api.md §4.1.
      expect(body.error.message).not.toContain(USER_ID);
      expect(body.error.message).toBe('account deletion failed');
    });
  });

  describe('idempotency — second call after success', () => {
    it('first call returns 200; second call (now without a session) returns 401, not 500', async () => {
      // First call succeeds — session resolves to USER_ID.
      mockAuth.mockResolvedValueOnce({ user: { id: USER_ID } });
      // Second call: NextAuth no longer resolves a user (the JWT-bound user
      // row is gone, so even if the cookie is replayed, session.user.id
      // returns undefined).
      mockAuth.mockResolvedValueOnce(null);

      const first = await DELETE();
      expect(first.status).toBe(200);

      const second = await DELETE();
      expect(second.status).toBe(401);
      expect(await second.json()).toMatchObject({
        error: { code: 'auth_failed' },
      });

      // Critically: the second call did NOT reach the transaction layer,
      // so it cannot 500 on a missing User row.
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
