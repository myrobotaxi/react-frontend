'use client';

import { useState } from 'react';

/** Props for the InviteCodeBlock component. */
export interface InviteCodeBlockProps {
  /** Sanitized 6-character invite code. */
  code: string;
}

/** How long the "Copied" confirmation stays visible (ms). */
const COPIED_FEEDBACK_MS = 2_000;

/**
 * Displays an invite code in large monospaced type with a copy-to-clipboard
 * button. Purely local — copying never touches the network, so the code is
 * never sent anywhere by this page.
 */
export function InviteCodeBlock({ code }: InviteCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard is unavailable (insecure context, permission denied).
      // The code is on screen and selectable, so there is nothing to recover.
    }
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-bg-surface px-6 py-5">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Your invite code</p>
      <p
        className="mt-3 select-all font-mono text-4xl font-semibold tracking-[0.35em] text-gold"
        data-testid="invite-code"
      >
        {code}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy invite code ${code}`}
        className="mt-4 w-full rounded-xl border border-border-default py-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-surface-hover"
      >
        {copied ? 'Copied' : 'Copy code'}
      </button>
    </div>
  );
}
