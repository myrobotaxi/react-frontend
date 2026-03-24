'use client';

/** Props for the RefreshButton component. */
export interface RefreshButtonProps {
  /** Whether a refresh is currently in progress. */
  isRefreshing: boolean;
  /** Callback to trigger a refresh. */
  onRefresh: () => void;
}

/**
 * Compact circular-arrow refresh button for the vehicle sheet header.
 * Spins while refreshing, stays tappable as an accessible alternative to pull-to-refresh.
 */
export function RefreshButton({ isRefreshing, onRefresh }: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="w-8 h-8 flex items-center justify-center rounded-full
        bg-bg-elevated/60 active:bg-bg-elevated transition-colors"
      aria-label={isRefreshing ? 'Refreshing vehicle data' : 'Refresh vehicle data'}
    >
      <svg
        className={`w-4 h-4 text-text-secondary ${isRefreshing ? 'animate-spin' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
