import type { VehicleStatus } from '../data/mockData.ts';
import { statusConfig } from '../data/mockData.ts';

interface StatusBadgeProps {
  status: VehicleStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span style={{ color: config.color }}>{config.label}</span>
    </span>
  );
}
