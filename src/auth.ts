import NextAuth from 'next-auth';
import type { Adapter, AdapterAccount } from 'next-auth/adapters';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { buildEncryptedAccountWrite } from '@/lib/account-encryption';
import { prisma } from '@/lib/prisma';
import {
  TESLA_AUTH_URL,
  TESLA_TOKEN_URL,
  TESLA_USERINFO_URL,
  TESLA_AUDIENCE,
  TESLA_ISSUER,
  TESLA_SCOPES,
} from '@/lib/tesla';

/**
 * Wraps `@auth/prisma-adapter`'s `linkAccount` so OAuth tokens are
 * dual-written: plaintext columns AND their *_enc shadows are
 * populated on every Account create. Reads still go through the
 * default adapter — the dual-read fallback is implemented at the
 * call sites that actually consume tokens (e.g., `getTeslaAccessToken`).
 *
 * MYR-62 Phase 1 — paired with internal/cryptox in the telemetry repo.
 */
function withEncryptedAccountAdapter(adapter: Adapter): Adapter {
  const original = adapter.linkAccount;
  if (!original) return adapter;
  // Return-type widening (Promise<void> | Awaitable<AdapterAccount | ...>)
  // makes the inferred wrapper signature too loose. We intentionally
  // mirror the original's exact return shape via a typed cast on the
  // forwarded call so downstream NextAuth code sees the same union it
  // would from the unwrapped adapter.
  const wrapped: Adapter['linkAccount'] = (account: AdapterAccount) => {
    const dual = buildEncryptedAccountWrite({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      id_token: account.id_token,
    });
    // Only override the encrypted shadows — preserve the original
    // plaintext values so NextAuth's adapter contract (which expects
    // them on the returned AdapterAccount) is unaffected.
    const augmented = {
      ...account,
      access_token_enc: dual.access_token_enc,
      refresh_token_enc: dual.refresh_token_enc,
      id_token_enc: dual.id_token_enc,
    } as AdapterAccount;
    return original(augmented) as ReturnType<NonNullable<Adapter['linkAccount']>>;
  };
  return { ...adapter, linkAccount: wrapped };
}

/**
 * Reassign a Tesla account (and its vehicles) from an orphan user to the real
 * authenticated user. Called from the JWT callback when Tesla OAuth creates a
 * separate user because the Tesla profile returned an empty email.
 */
async function reassignTeslaToCurrentUser(
  orphanUserId: string,
  realUserId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.account.updateMany({
      where: { userId: orphanUserId, provider: 'tesla' },
      data: { userId: realUserId },
    }),
    prisma.vehicle.updateMany({
      where: { userId: orphanUserId },
      data: { userId: realUserId },
    }),
    prisma.settings.upsert({
      where: { userId: realUserId },
      create: { userId: realUserId, teslaLinked: true },
      update: { teslaLinked: true },
    }),
  ]);

  // Delete the orphan user — cascade cleans up its Settings row
  await prisma.user.delete({ where: { id: orphanUserId } }).catch(() => {
    // Ignore if already deleted or has remaining dependencies
  });

  // Sync vehicles for the real user — the linkAccount event ran the sync
  // for the orphan before reassignment, so the real user has no vehicles yet.
  try {
    const { syncVehiclesFromTesla } = await import(
      '@/features/vehicles/api/sync'
    );
    await syncVehiclesFromTesla(realUserId);
  } catch (err) {
    console.error('Post-reassignment vehicle sync failed:', err);
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: withEncryptedAccountAdapter(PrismaAdapter(prisma)),
  session: { strategy: 'jwt' },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    ...(process.env.AUTH_APPLE_ID
      ? [Apple({ allowDangerousEmailAccountLinking: true })]
      : []),
    ...(process.env.AUTH_TESLA_ID
      ? [
          {
            id: 'tesla',
            name: 'Tesla',
            type: 'oauth' as const,
            issuer: TESLA_ISSUER,
            clientId: process.env.AUTH_TESLA_ID,
            clientSecret: process.env.AUTH_TESLA_SECRET,
            authorization: {
              url: TESLA_AUTH_URL,
              params: { scope: TESLA_SCOPES },
            },
            token: {
              url: TESLA_TOKEN_URL,
              params: { audience: TESLA_AUDIENCE },
            },
            client: {
              token_endpoint_auth_method: 'client_secret_post' as const,
            },
            userinfo: { url: TESLA_USERINFO_URL },
            profile(profile: Record<string, unknown>) {
              const sub = profile.sub ?? profile.id;
              if (!sub) {
                throw new Error(
                  'Tesla userinfo response missing user identifier (sub/id)',
                );
              }
              return {
                id: String(sub),
                name: String(profile.full_name ?? profile.name ?? 'Tesla User'),
                email: String(profile.email ?? ''),
              };
            },
            allowDangerousEmailAccountLinking: true,
          },
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) {
        if (
          account?.provider === 'tesla' &&
          token.id &&
          token.id !== user.id &&
          !user.email
        ) {
          // Tesla OAuth created an orphan user (empty email couldn't match the
          // existing Google user). Reassign the Tesla account and vehicles to
          // the real user whose session initiated the link.
          await reassignTeslaToCurrentUser(user.id, String(token.id));
          // Keep token.id pointing to the real (Google) user
        } else {
          token.id = user.id;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async linkAccount({ account }) {
      if (account.provider === 'tesla' && account.userId) {
        const userId = account.userId;
        await prisma.settings.upsert({
          where: { userId },
          create: { userId, teslaLinked: true },
          update: { teslaLinked: true },
        });

        // Trigger initial vehicle sync (failure does not block OAuth redirect)
        try {
          const { syncVehiclesFromTesla } = await import(
            '@/features/vehicles/api/sync'
          );
          await syncVehiclesFromTesla(userId);
        } catch (err) {
          console.error('Initial vehicle sync after Tesla link failed:', err);
        }
      }
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
});
