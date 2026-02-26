/** Props for the ToggleSwitch component. */
export interface ToggleSwitchProps {
  /** Whether the toggle is on. */
  enabled: boolean;
  /** Callback fired when the toggle is tapped. */
  onToggle: () => void;
}

/**
 * Gold-accent toggle switch matching the Tesla design language.
 * Gold background when on, elevated background when off.
 */
export function ToggleSwitch({ enabled, onToggle }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
        enabled ? 'bg-gold' : 'bg-bg-elevated'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
