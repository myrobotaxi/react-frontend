/**
 * Feature-specific types for the auth domain.
 */

/** Sign-in form data. */
export interface SignInFormData {
  email: string;
  password: string;
}

/** Sign-up form data. */
export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
}

/** Auth provider types for social login. */
export type AuthProvider = 'google' | 'apple' | 'email';
