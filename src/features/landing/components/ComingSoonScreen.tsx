import { Logo } from '@/components/ui/Logo';

/**
 * The apex domain's public face — `https://myrobotaxi.app`.
 *
 * Deliberately empty of everything except the brand: no navigation, no links,
 * no TestFlight button, no form, no mention of invites. Anyone who types the
 * bare domain lands here; the invite experience belongs to people holding a
 * uniquely generated `/join/{CODE}` link, and a landing page that hands it to
 * every visitor is what this replaces.
 *
 * The gold wash and the glowing lockup are the design system's sign-in backdrop
 * (`ios-app/design/app/screens.jsx:184`), the same one the link-preview card is
 * built from (`scripts/generate-og-image.mjs`).
 */
export function ComingSoonScreen() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-primary px-6">
      {/* Soft gold wash raking in from above the fold. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(140%_100%_at_50%_-20%,rgba(201,168,76,0.3)_0%,rgba(0,0,0,0)_65%)]"
      />

      <div className="relative animate-fade-in text-center">
        <Logo size="lg" glow />
        <p className="text-sm font-light uppercase tracking-[0.28em] text-text-secondary">
          Coming soon
        </p>
      </div>
    </main>
  );
}
