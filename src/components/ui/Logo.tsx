/**
 * Per-variant geometry for the brand lockup.
 *
 * Every number is derived from the design system's own ratios: the tile's
 * corner radius is `size * 0.225`, the arrow is `size * 0.56`, the glow disc is
 * `size * 0.92`, and the tile's drop shadow is `0 size*0.04 size*0.12`. They are
 * spelled out as literal class strings (rather than computed into inline
 * styles) so Tailwind's scanner emits them.
 */
const VARIANTS = {
  lg: {
    tile: 'h-[62px] w-[62px] rounded-[13.95px] shadow-[0_2.48px_7.44px_rgba(0,0,0,0.5),inset_0_0_0_0.5px_rgba(255,255,255,0.07)] mb-7',
    glow: 'h-[57.04px] w-[57.04px]',
    arrow: 34.72,
    wordmark: 'text-[28px] mb-3',
  },
  sm: {
    tile: 'h-[40px] w-[40px] rounded-[9px] shadow-[0_1.6px_4.8px_rgba(0,0,0,0.5),inset_0_0_0_0.5px_rgba(255,255,255,0.07)] mb-5',
    glow: 'h-[36.8px] w-[36.8px]',
    arrow: 22.4,
    wordmark: 'text-[18px] mb-2',
  },
} as const;

/** Props for the Logo component. */
export interface LogoProps {
  /** Size variant: 'lg' for sign-in and the invite landing, 'sm' elsewhere. */
  size?: 'lg' | 'sm';
  /** Whether to show the brand wordmark under the mark. Defaults to true. */
  showWordmark?: boolean;
  /**
   * Whether the mark carries its gold glow. Off by default, matching the
   * design system's own default and its sign-in lockup; the first-run screens
   * there turn it on.
   */
  glow?: boolean;
}

/**
 * The MyRoboTaxi brand lockup: the facet-arrow mark above the wordmark.
 *
 * A faithful port of the design system's `HexLogo` + `Wordmark`
 * (`ios-app/design/app/components.jsx:9-45`); the lockup's proportions follow
 * the sign-in screen there (`app/screens.jsx:188-189` — mark 62, wordmark 28),
 * and the glow follows the adjacent first-run screen (`screens.jsx:264`).
 *
 * Two things this component must never drift back into. The mark is NOT a
 * hexagon — `HexLogo` is a legacy name kept for its call sites, and the shape
 * it draws is a two-tone gold arrow cut from two facets on a matte near-black
 * tile. And the wordmark is a SINGLE color, set uppercase via text-transform;
 * it is never camel-cased and never multi-colored.
 */
export function Logo({ size = 'lg', showWordmark = true, glow = false }: LogoProps) {
  const variant = VARIANTS[size];

  return (
    <div className="text-center">
      <div
        className={`${variant.tile} relative mx-auto flex shrink-0 items-center justify-center overflow-hidden bg-[linear-gradient(155deg,#1b1407_0%,#0d0b06_55%,#090806_100%)]`}
      >
        {/* Gold wash, raking in from the upper left. */}
        <div className="absolute inset-0 bg-[radial-gradient(95%_80%_at_32%_2%,rgba(201,168,76,0.16),rgba(201,168,76,0)_60%)]" />
        {glow && (
          <div
            className={`${variant.glow} absolute rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.28),rgba(201,168,76,0)_62%)]`}
          />
        )}
        <svg
          width={variant.arrow}
          height={variant.arrow}
          viewBox="0 0 100 100"
          className="relative block"
          aria-hidden="true"
        >
          <g transform="rotate(-22 50 50)">
            <polygon points="50,12 50,64 18,85" fill="#E4D08A" />
            <polygon points="50,12 82,85 50,64" fill="#9C7E2C" />
          </g>
        </svg>
      </div>
      {showWordmark && (
        <h1
          className={`${variant.wordmark} font-brand font-medium uppercase leading-none tracking-[0.04em] text-text-primary`}
        >
          myrobotaxi
        </h1>
      )}
    </div>
  );
}
