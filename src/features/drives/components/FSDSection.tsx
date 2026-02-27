/** Props for the FSDSection component. */
export interface FSDSectionProps {
  /** FSD percentage of the drive (0-100). */
  fsdPercentage: number;
  /** Total FSD miles driven. */
  fsdMiles: number;
  /** Number of driver interventions. */
  interventions: number;
}

/**
 * Full Self-Driving stats section with percentage, miles, interventions,
 * and a gold progress bar. Only rendered when fsdMiles > 0.
 */
export function FSDSection({ fsdPercentage, fsdMiles, interventions }: FSDSectionProps) {
  return (
    <div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">
        Full Self-Driving
      </p>
      <div className="flex gap-8 mb-4">
        <div>
          <p className="text-gold text-lg font-medium tabular-nums">{fsdPercentage}%</p>
          <p className="text-text-muted text-xs font-light">of drive</p>
        </div>
        <div>
          <p className="text-text-primary text-lg font-medium tabular-nums">{fsdMiles} mi</p>
          <p className="text-text-muted text-xs font-light">FSD miles</p>
        </div>
        <div>
          <p className="text-text-primary text-lg font-medium tabular-nums">{interventions}</p>
          <p className="text-text-muted text-xs font-light">
            {interventions === 1 ? 'intervention' : 'interventions'}
          </p>
        </div>
      </div>
      <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gold"
          style={{ width: `${fsdPercentage}%` }}
        />
      </div>
    </div>
  );
}
