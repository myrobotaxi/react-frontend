/**
 * Gold line-art car icon for the empty state screen.
 * SVG matches ui-mocks/src/pages/HomeEmpty.tsx exactly.
 */
export function CarIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
      {/* Car body outline */}
      <path
        d="M16 48h48M16 48c-2 0-4-2-4-4v-6c0-2 1.5-3.5 3-4l8-12c1.5-2.5 3-4 6-4h22c3 0 4.5 1.5 6 4l8 12c1.5.5 3 2 3 4v6c0 2-2 4-4 4"
        stroke="#C9A84C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Windshield */}
      <path
        d="M26 22l-6 16h40l-6-16"
        stroke="#C9A84C"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Left wheel */}
      <circle cx="24" cy="48" r="5" stroke="#C9A84C" strokeWidth="1.5" />
      <circle cx="24" cy="48" r="2" fill="#C9A84C" opacity="0.3" />
      {/* Right wheel */}
      <circle cx="56" cy="48" r="5" stroke="#C9A84C" strokeWidth="1.5" />
      <circle cx="56" cy="48" r="2" fill="#C9A84C" opacity="0.3" />
      {/* Headlight hints */}
      <circle cx="14" cy="40" r="1.5" fill="#C9A84C" opacity="0.4" />
      <circle cx="66" cy="40" r="1.5" fill="#C9A84C" opacity="0.4" />
    </svg>
  );
}
