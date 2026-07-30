'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';

import { JOIN_ROUTE } from '@/lib/constants';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps the app in NextAuth's SessionProvider.
 *
 * On the public invite pages the provider is seeded with `session={null}`,
 * which suppresses its mount-time `GET /api/auth/session` fetch. That request
 * would otherwise carry `Referer: /join/{CODE}`, putting a bearer-grade invite
 * code into server access logs. Nothing under /join reads the session, so the
 * seeded null costs nothing.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const isPublicInvitePage = pathname?.startsWith(JOIN_ROUTE) ?? false;

  return (
    <SessionProvider session={isPublicInvitePage ? null : undefined}>
      {children}
    </SessionProvider>
  );
}
