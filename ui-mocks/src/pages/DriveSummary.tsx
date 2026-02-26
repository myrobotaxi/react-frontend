import { useParams, Link } from 'react-router-dom';
import { drives, vehicles } from '../data/mockData.ts';
import { MapPlaceholder } from '../components/MapPlaceholder.tsx';

export function DriveSummary() {
  const { driveId } = useParams();
  const drive = drives.find((d) => d.id === driveId) || drives[0];
  // Vehicle info available if needed:
  const _vehicle = vehicles.find((v) => v.id === drive.vehicleId) || vehicles[0];
  void _vehicle;

  // Generate mock speed data for sparkline
  const speedPoints = generateSpeedSparkline(drive.durationMinutes, drive.avgSpeedMph, drive.maxSpeedMph);

  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      {/* Header */}
      <header className="px-6 pt-16 pb-6 flex items-center gap-4">
        <Link to="/drives" className="text-text-muted hover:text-text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-text-primary truncate">
            {drive.startLocation} to {drive.endLocation}
          </h1>
          <p className="text-text-muted text-xs font-light mt-0.5">
            {formatDate(drive.date)} — {drive.startTime}
          </p>
        </div>
      </header>

      {/* Hero map with gold route line */}
      <div className="mx-6 rounded-2xl overflow-hidden mb-8">
        <MapPlaceholder
          showVehicleMarker={false}
          showRoute={true}
          routeCoordinates={drive.routePoints}
          className="h-48"
          zoom={11}
          interactive={false}
        />
      </div>

      {/* Location labels */}
      <div className="mx-6 mb-10">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-status-driving" />
            <div className="w-px h-8 bg-border-default" />
            <div className="w-2.5 h-2.5 rounded-full bg-battery-low" />
          </div>
          <div className="flex-1 min-w-0 space-y-5">
            <div>
              <p className="text-text-primary text-sm font-medium">{drive.startLocation}</p>
              <p className="text-text-muted text-xs font-light">{drive.startAddress}</p>
            </div>
            <div>
              <p className="text-text-primary text-sm font-medium">{drive.endLocation}</p>
              <p className="text-text-muted text-xs font-light">{drive.endAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid — 2 columns, generous spacing */}
      <div className="mx-6 mb-10">
        <div className="grid grid-cols-2 gap-6">
          <StatItem label="Distance" value={`${drive.distanceMiles} mi`} />
          <StatItem label="Duration" value={`${drive.durationMinutes} min`} />
          <StatItem label="FSD Miles" value={`${drive.fsdMiles} mi`} accent />
          <StatItem label="Battery" value={`${drive.startChargeLevel}% → ${drive.endChargeLevel}%`} />
          <StatItem label="Avg Speed" value={`${drive.avgSpeedMph} mph`} />
          <StatItem label="Max Speed" value={`${drive.maxSpeedMph} mph`} />
        </div>
      </div>

      {/* Speed sparkline — gold */}
      <div className="mx-6 mb-10">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">Speed over time</p>
        <div className="h-16 relative">
          <svg viewBox={`0 0 ${speedPoints.length * 4} 64`} className="w-full h-full" preserveAspectRatio="none">
            {/* Speed line in gold */}
            <polyline
              points={speedPoints.map((y, i) => `${i * 4},${64 - y}`).join(' ')}
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Area fill */}
            <polygon
              points={`0,64 ${speedPoints.map((y, i) => `${i * 4},${64 - y}`).join(' ')} ${(speedPoints.length - 1) * 4},64`}
              fill="url(#goldGradient)"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-text-muted font-light">{drive.startTime}</span>
            <span className="text-[10px] text-text-muted font-light">{drive.endTime}</span>
          </div>
        </div>
      </div>

      {/* FSD Section */}
      {drive.fsdMiles > 0 && (
        <div className="mx-6 mb-10">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">Full Self-Driving</p>
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-gold text-lg font-medium tabular-nums">{drive.fsdPercentage}%</p>
              <p className="text-text-muted text-xs font-light">of drive</p>
            </div>
            <div>
              <p className="text-text-primary text-lg font-medium tabular-nums">{drive.fsdMiles} mi</p>
              <p className="text-text-muted text-xs font-light">FSD miles</p>
            </div>
            <div>
              <p className="text-text-primary text-lg font-medium tabular-nums">{drive.interventions}</p>
              <p className="text-text-muted text-xs font-light">{drive.interventions === 1 ? 'intervention' : 'interventions'}</p>
            </div>
          </div>
          <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${drive.fsdPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Share button — gold outline */}
      <div className="mx-6">
        <button className="w-full flex items-center justify-center gap-2 py-4 border border-gold/30 rounded-xl text-gold font-medium text-sm hover:bg-gold/5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share Drive Summary
        </button>
      </div>
    </div>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base font-medium tabular-nums ${accent ? 'text-gold' : 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function generateSpeedSparkline(durationMinutes: number, avgSpeed: number, maxSpeed: number): number[] {
  const points: number[] = [];
  const numPoints = Math.max(20, Math.min(50, durationMinutes));
  const scale = 58 / maxSpeed;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    let speed: number;
    if (t < 0.1) {
      speed = avgSpeed * t * 8;
    } else if (t > 0.85) {
      speed = avgSpeed * (1 - t) * 5;
    } else {
      speed = avgSpeed + (Math.sin(t * 12) * avgSpeed * 0.3) + (Math.sin(t * 5) * avgSpeed * 0.15);
    }
    speed = Math.max(0, Math.min(maxSpeed, speed));
    points.push(speed * scale);
  }
  return points;
}
