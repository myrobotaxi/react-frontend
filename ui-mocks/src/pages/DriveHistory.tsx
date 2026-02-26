import { useState } from 'react';
import { Link } from 'react-router-dom';
import { drives, vehicles } from '../data/mockData.ts';

type SortBy = 'date' | 'distance' | 'duration';

export function DriveHistory() {
  // Show drives for first vehicle (current vehicle)
  const vehicle = vehicles[0];
  const vehicleDrives = drives.filter((d) => d.vehicleId === vehicle.id);
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const sortedDrives = [...vehicleDrives].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return b.distanceMiles - a.distanceMiles;
      case 'duration':
        return b.durationMinutes - a.durationMinutes;
      default:
        return new Date(b.date + ' ' + b.startTime).getTime() - new Date(a.date + ' ' + a.startTime).getTime();
    }
  });

  // Group by date
  const groupedDrives: Record<string, typeof sortedDrives> = {};
  for (const drive of sortedDrives) {
    const dateLabel = formatDateLabel(drive.date);
    if (!groupedDrives[dateLabel]) {
      groupedDrives[dateLabel] = [];
    }
    groupedDrives[dateLabel].push(drive);
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      {/* Header */}
      <header className="px-6 pt-16 pb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Drives</h1>
        <p className="text-text-muted text-sm font-light mt-1">{vehicle.name}</p>
      </header>

      {/* Active drive banner */}
      {vehicle.status === 'driving' && (
        <Link
          to="/home"
          className="mx-6 mb-6 flex items-center gap-3 p-4 rounded-xl border border-status-driving/20 bg-status-driving/[0.05]"
        >
          <div className="w-2 h-2 rounded-full bg-status-driving animate-pulse" />
          <span className="text-status-driving text-sm font-medium flex-1">Drive in progress</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* Sort controls — subtle icon-style buttons */}
      <div className="px-6 pb-6 flex gap-2">
        {(['date', 'distance', 'duration'] as SortBy[]).map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              sortBy === option
                ? 'bg-gold/10 text-gold'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Drive list */}
      <div className="px-6 space-y-8">
        {Object.entries(groupedDrives).map(([dateLabel, dateDrives]) => (
          <div key={dateLabel}>
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">{dateLabel}</p>
            <div className="space-y-3">
              {dateDrives.map((drive) => (
                <Link
                  key={drive.id}
                  to={`/drives/${drive.id}`}
                  className="block bg-bg-surface rounded-2xl border border-border-default p-5 hover:bg-bg-surface-hover transition-colors"
                >
                  {/* Route: Origin -> Destination */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-text-primary font-medium min-w-0">
                      <span className="truncate">{drive.startLocation}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted flex-shrink-0">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span className="truncate">{drive.endLocation}</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted flex-shrink-0 ml-2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>

                  {/* Time */}
                  <p className="text-text-muted text-xs font-light mb-4">{drive.startTime} — {drive.endTime}</p>

                  {/* Stats row — clean, minimal */}
                  <div className="flex items-center gap-5 text-xs">
                    <span className="text-text-secondary tabular-nums">{drive.distanceMiles} mi</span>
                    <span className="text-text-secondary tabular-nums">{drive.durationMinutes} min</span>
                    {drive.fsdMiles > 0 && (
                      <span className="text-gold tabular-nums font-medium">
                        FSD {drive.fsdMiles} mi
                      </span>
                    )}
                    <span className="text-text-muted tabular-nums ml-auto">
                      {drive.startChargeLevel}% → {drive.endChargeLevel}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
