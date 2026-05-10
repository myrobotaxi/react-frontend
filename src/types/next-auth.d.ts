import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /**
       * Unix seconds at most-recent OAuth sign-in. Mirrors the OIDC
       * `auth_time` claim. Powers the recent-login re-auth gate on
       * destructive / bulk-export endpoints (MYR-76, `src/lib/reauth.ts`).
       */
      authTime?: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    /** See Session.user.authTime — set on first JWT issuance, preserved on refresh. */
    authTime?: number;
  }
}
