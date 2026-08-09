import {
  STATE_CHIP_CLASSES,
  STATE_DOT_CLASSES,
  STATE_LABEL,
} from '@/lib/status/presentation';
import type { ComponentState } from '@/lib/status/types';

/** Props for the StatusChip component. */
export interface StatusChipProps {
  state: ComponentState;
}

/**
 * The one-word verdict next to a component.
 *
 * A dot as well as a colour, and the word spelled out: on a page whose entire
 * content is four colours, colour alone would leave a colour-blind reader
 * guessing at exactly the moment they need a plain answer.
 */
export function StatusChip({ state }: StatusChipProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STATE_CHIP_CLASSES[state]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATE_DOT_CLASSES[state]}`} aria-hidden />
      {STATE_LABEL[state]}
    </span>
  );
}
