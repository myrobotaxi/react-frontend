import { INVITE_EXPIRY_DAYS } from '@/lib/constants';

/** Props for the JoinSteps component. */
export interface JoinStepsProps {
  /** Whether the visitor arrived with a valid code in the link. */
  hasCode: boolean;
}

/**
 * The three things a recipient does, in the order they do them. The third step
 * differs depending on whether a code came through in the link.
 */
export function JoinSteps({ hasCode }: JoinStepsProps) {
  const steps = [
    'Install MyRoboTaxi from TestFlight',
    'Sign in with Apple',
    hasCode ? 'Enter the code above' : 'Enter the code the sender gave you',
  ];

  return (
    <div className="w-full">
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-left">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 font-mono text-xs text-gold">
              {index + 1}
            </span>
            <span className="text-sm leading-6 text-text-secondary">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-xs leading-5 text-text-muted">
        Invite codes expire {INVITE_EXPIRY_DAYS} days after they are sent. This page
        cannot check a code — if the app says it is invalid, the code may have
        expired and the sender can issue a new one.
      </p>
    </div>
  );
}
