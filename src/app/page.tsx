import { redirect } from 'next/navigation';

/**
 * Root route — redirects to sign-in page.
 * The sign-in page lives at /(auth)/signin.
 */
export default function RootPage() {
  redirect('/signin');
}
