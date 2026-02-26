import { useState } from 'react';
import { Link } from 'react-router-dom';
import { vehicles, getStatusMessage, statusConfig, getBatteryColor, getBatteryTextColor } from '../data/mockData.ts';
import { MapPlaceholder } from '../components/MapPlaceholder.tsx';

type SheetState = 'peek' | 'half';

export function SharedViewer() {
  const vehicle = vehicles[0];
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const config = statusConfig[vehicle.status];

  const sheetHeights: Record<SheetState, string> = {
    peek: 'h-[180px]',
    half: 'h-[340px]',
  };

  return (
    <div className="h-screen bg-bg-primary relative overflow-hidden">
      {/* Full-bleed map */}
      <MapPlaceholder
        showVehicleMarker={true}
        heading={vehicle.heading}
        center={[vehicle.longitude, vehicle.latitude]}
        className="absolute inset-0"
      >
        {/* Top banner — "Watching Thomas's Model Y" */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="bg-bg-primary/80 backdrop-blur-md px-6 pt-14 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <p className="text-text-secondary text-sm font-light">
                Watching <span className="text-gold font-medium">Thomas's Model Y</span>
              </p>
            </div>
          </div>
        </div>

        {/* Sheet state toggle (mockup) */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-bg-primary/60 backdrop-blur-md rounded-full p-1">
          {(['peek', 'half'] as SheetState[]).map((state) => (
            <button
              key={state}
              onClick={() => setSheetState(state)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${
                sheetState === state
                  ? 'bg-gold text-bg-primary'
                  : 'text-text-muted'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </MapPlaceholder>

      {/* Simplified bottom sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 bg-bg-secondary/95 backdrop-blur-2xl rounded-t-[24px] border-t border-border-default transition-all duration-300 ease-out ${sheetHeights[sheetState]}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-1 rounded-full bg-bg-elevated" />
        </div>

        <div className="px-6">
          {/* Vehicle name + status */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-text-primary">{vehicle.name}</h2>
            <span className="text-xs font-medium" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>

          {/* Status message */}
          <p className="text-text-secondary text-sm font-light mb-4">{getStatusMessage(vehicle)}</p>

          {/* Speed + Battery */}
          <div className="flex items-center justify-between">
            {vehicle.status === 'driving' ? (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-light tabular-nums text-text-primary">{vehicle.speed}</span>
                <span className="text-sm text-text-muted font-light">mph</span>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium tabular-nums ${getBatteryTextColor(vehicle.chargeLevel)}`}>
                {vehicle.chargeLevel}%
              </span>
              <div className="w-14 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBatteryColor(vehicle.chargeLevel)}`}
                  style={{ width: `${vehicle.chargeLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Half state — sign up nudge */}
        {sheetState === 'half' && (
          <div className="px-6 mt-8 animate-fade-in">
            <div className="h-px bg-border-default mb-8" />
            <p className="text-text-muted text-xs font-light mb-5">
              Sign up for more features including drive history and notifications.
            </p>
            <Link
              to="/signup"
              className="inline-block text-gold text-sm font-medium hover:text-gold-light transition-colors"
            >
              Sign up for more &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
