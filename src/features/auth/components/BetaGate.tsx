'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { validateBetaPassword } from '../api/validate-beta-password';
import { ParticleCanvas } from './ParticleCanvas';

/**
 * Beta access gate — password form with animated particle background.
 * On success, particles accelerate toward center before redirecting to /signin.
 */
export function BetaGate() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || !password.trim()) return;

    setIsSubmitting(true);
    setError('');

    const result = await validateBetaPassword(password);

    if (result.success) {
      setShowSuccess(true);
      scheduleTimeout(() => router.push('/signin'), 800);
    } else {
      setError(result.error ?? 'Invalid access code');
      setShake(true);
      scheduleTimeout(() => setShake(false), 500);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative">
      <ParticleCanvas accelerate={showSuccess} />

      <div className={`relative z-10 w-full max-w-sm -translate-y-8 ${shake ? 'animate-shake' : ''}`}>
        {/* Title */}
        <h1 className="text-3xl font-light tracking-[0.3em] text-white text-center mb-16 select-none">
          MYROBOTAXI
        </h1>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access code"
            disabled={isSubmitting}
            className="w-full px-5 py-3.5 rounded-2xl
              bg-white/5 backdrop-blur-md
              border border-white/10
              text-white placeholder:text-white/30
              text-base font-light tracking-wide
              outline-none
              focus:border-white/25 focus:bg-white/8
              transition-all duration-200
              disabled:opacity-50"
          />

          {error && (
            <p className="text-red-400 text-sm text-center font-light animate-fade-in">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
