/**
 * Response shapes for `GET /api/users/me/export` (MYR-75).
 *
 * Pure type definitions — no runtime behaviour. Kept separate from the
 * route handler so the handler stays small enough to read in one sitting.
 */

export interface ExportProfile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportAccountIdentity {
  id: string;
  type: string;
  provider: string;
  providerAccountId: string;
  scope: string | null;
  expiresAt: number | null;
}

export interface ExportSettings {
  teslaLinked: boolean;
  teslaVehicleName: string | null;
  virtualKeyPaired: boolean;
  keyPairingDeferredAt: string | null;
  keyPairingReminderCount: number;
  notifyDriveStarted: boolean;
  notifyDriveCompleted: boolean;
  notifyChargingComplete: boolean;
  notifyViewerJoined: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportTripStop {
  id: string;
  name: string;
  address: string;
  type: string;
}

export interface ExportVehicle {
  id: string;
  teslaVehicleId: string | null;
  vin: string | null;
  name: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  chargeLevel: number;
  estimatedRange: number;
  chargeState: string | null;
  timeToFull: number | null;
  status: string;
  speed: number;
  gearPosition: string | null;
  heading: number;
  locationName: string;
  locationAddress: string;
  latitude: number | null;
  longitude: number | null;
  interiorTemp: number;
  exteriorTemp: number;
  odometerMiles: number;
  fsdMilesSinceReset: number;
  virtualKeyPaired: boolean;
  setupStatus: string;
  destinationName: string | null;
  destinationAddress: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  originLatitude: number | null;
  originLongitude: number | null;
  etaMinutes: number | null;
  tripDistanceMiles: number | null;
  tripDistanceRemaining: number | null;
  navRouteCoordinates: Array<[number, number]> | null;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  stops: ExportTripStop[];
}

export interface ExportDrive {
  id: string;
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  startAddress: string;
  endLocation: string;
  endAddress: string;
  distanceMiles: number;
  durationMinutes: number;
  avgSpeedMph: number;
  maxSpeedMph: number;
  energyUsedKwh: number;
  startChargeLevel: number;
  endChargeLevel: number;
  fsdMiles: number;
  fsdPercentage: number;
  interventions: number;
  routePoints: Array<{ lat: number; lng: number; timestamp: string; speed: number }>;
  createdAt: string;
}

export interface ExportInvite {
  id: string;
  vehicleId: string;
  senderId: string;
  label: string;
  email: string;
  status: string;
  permission: string;
  sentDate: string;
  acceptedDate: string | null;
  lastSeen: string | null;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  role: 'sender' | 'recipient';
}

export interface ExportAuditLog {
  id: string;
  userId: string;
  timestamp: string;
  action: string;
  targetType: string;
  targetId: string;
  initiator: string;
  metadata: unknown;
  createdAt: string;
}

export interface ExportArchive {
  exportVersion: 1;
  exportedAt: string;
  auditLogId: string;
  profile: ExportProfile;
  accounts: ExportAccountIdentity[];
  settings: ExportSettings | null;
  vehicles: ExportVehicle[];
  drives: ExportDrive[];
  invites: ExportInvite[];
  auditLog: ExportAuditLog[];
}
