import { getBatteryColor, getBatteryTextColor } from '../data/mockData.ts';

interface BatteryBarProps {
  level: number;
  showLabel?: boolean;
}

export function BatteryBar({ level, showLabel = true }: BatteryBarProps) {
  return (
    <div className="flex items-center gap-3">
      {showLabel && (
        <span className={`tabular-nums text-sm font-medium ${getBatteryTextColor(level)}`}>
          {level}%
        </span>
      )}
      <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBatteryColor(level)}`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}
