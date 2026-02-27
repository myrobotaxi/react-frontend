'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleIcon, AppleIcon } from '@/components/ui/SocialIcons';

/**
 * Sign-up form with social auth, email form, and sign-in link.
 * Matches the SignUp.tsx mock: logo, social buttons, divider, form inputs, gold CTA.
 */
export function SignUpForm() {
  const router = useRouter();

  const handleAuth = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="mb-12">
          <Logo size="sm" />
          <p className="text-text-secondary text-sm font-light text-center">Join MyRoboTaxi</p>
        </div>

        {/* Social auth */}
        <div className="space-y-3 mb-8">
          <Button variant="social" icon={<GoogleIcon />} onClick={handleAuth}>
            Sign up with Google
          </Button>
          <Button variant="social" icon={<AppleIcon />} onClick={handleAuth}>
            Sign up with Apple
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-border-default" />
          <span className="text-text-muted text-xs">or use email</span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

        {/* Email Form */}
        <div className="space-y-4 mb-8">
          <Input type="text" placeholder="Full name" />
          <Input type="email" placeholder="Email address" />
          <Input type="password" placeholder="Password" />
          <Button variant="primary" onClick={handleAuth}>
            Create Account
          </Button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-text-muted text-sm font-light">
          Already have an account?{' '}
          <Link href="/signin" className="text-gold font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
