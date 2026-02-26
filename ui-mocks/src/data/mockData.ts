// Mock data for MyRoboTaxi UI mockups
// All data is static — no backend, no API calls

export type VehicleStatus = 'driving' | 'parked' | 'charging' | 'offline';

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  chargeLevel: number;
  estimatedRange: number;
  status: VehicleStatus;
  speed: number;
  heading: number;
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  interiorTemp: number;
  exteriorTemp: number;
  lastUpdated: string;
  odometerMiles: number;
  fsdMilesToday: number;
  // Active trip info (only when status === 'driving')
  destinationName?: string;
  destinationAddress?: string;
  etaMinutes?: number;
  tripDistanceMiles?: number;
  tripDistanceRemaining?: number;
  stops?: { name: string; address: string; type: 'charging' | 'waypoint' }[];
}

export interface Drive {
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
  routePoints: [number, number][];
}

export interface Invite {
  id: string;
  label: string;
  email: string;
  status: 'pending' | 'accepted';
  permission: 'live' | 'live+history';
  sentDate: string;
  acceptedDate?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

export const vehicles: Vehicle[] = [
  {
    id: 'v1',
    name: 'Midnight Runner',
    model: 'Model Y Long Range',
    year: 2024,
    color: 'Midnight Silver Metallic',
    licensePlate: 'RTX-4090',
    chargeLevel: 78,
    estimatedRange: 245,
    status: 'driving',
    speed: 65,
    heading: 280,
    locationName: 'I-35 North',
    locationAddress: 'I-35 N near 51st St, Austin, TX',
    latitude: 30.3250,
    longitude: -97.7380,
    interiorTemp: 72,
    exteriorTemp: 88,
    lastUpdated: '3s ago',
    odometerMiles: 12847,
    fsdMilesToday: 15.3,
    destinationName: 'Domain Northside',
    destinationAddress: '11506 Century Oaks Terrace, Austin, TX',
    etaMinutes: 23,
    tripDistanceMiles: 14.2,
    tripDistanceRemaining: 8.7,
    stops: [
      { name: 'Tesla Supercharger', address: '1201 Barbara Jordan Blvd', type: 'charging' as const },
    ],
  },
  {
    id: 'v2',
    name: 'Pearl',
    model: 'Model 3 Performance',
    year: 2025,
    color: 'Pearl White Multi-Coat',
    licensePlate: 'EV-2025',
    chargeLevel: 42,
    estimatedRange: 128,
    status: 'charging',
    speed: 0,
    heading: 0,
    locationName: 'Tesla Supercharger',
    locationAddress: '1201 Barbara Jordan Blvd, Austin, TX 78723',
    latitude: 30.2990,
    longitude: -97.7069,
    interiorTemp: 68,
    exteriorTemp: 88,
    lastUpdated: '12s ago',
    odometerMiles: 3201,
    fsdMilesToday: 4.9,
  },
];

export const drives: Drive[] = [
  {
    id: 'd1',
    vehicleId: 'v1',
    date: '2026-02-22',
    startTime: '2:15 PM',
    endTime: '3:02 PM',
    startLocation: 'Thompson Hotel',
    startAddress: '506 San Jacinto Blvd, Austin, TX',
    endLocation: 'Domain Northside',
    endAddress: '11506 Century Oaks Terrace, Austin, TX',
    distanceMiles: 14.2,
    durationMinutes: 47,
    avgSpeedMph: 38,
    maxSpeedMph: 72,
    energyUsedKwh: 4.8,
    startChargeLevel: 92,
    endChargeLevel: 78,
    fsdMiles: 12.1,
    fsdPercentage: 85,
    interventions: 1,
    routePoints: [
      [-97.7405, 30.2650],  // Thompson Hotel, downtown Austin
      [-97.7420, 30.2720],  // Congress Ave north
      [-97.7430, 30.2800],  // Capitol area
      [-97.7435, 30.2880],  // UT south
      [-97.7430, 30.2960],  // UT campus
      [-97.7410, 30.3050],  // Guadalupe
      [-97.7380, 30.3150],  // Hyde Park south
      [-97.7380, 30.3250],  // Hyde Park — VEHICLE IS HERE (midway)
      [-97.7360, 30.3350],  // North Loop
      [-97.7330, 30.3450],  // Brentwood
      [-97.7300, 30.3550],  // Allandale
      [-97.7270, 30.3650],  // Anderson Lane
      [-97.7250, 30.3750],  // Northgate
      [-97.7230, 30.3850],  // Northcross
      [-97.7220, 30.3950],  // Burnet/Domain area
      [-97.7240, 30.4020],  // Domain Northside
    ],
  },
  {
    id: 'd2',
    vehicleId: 'v1',
    date: '2026-02-22',
    startTime: '9:30 AM',
    endTime: '10:05 AM',
    startLocation: 'Home',
    startAddress: '1200 Barton Springs Rd, Austin, TX',
    endLocation: 'Whole Foods HQ',
    endAddress: '550 Bowie St, Austin, TX',
    distanceMiles: 3.8,
    durationMinutes: 35,
    avgSpeedMph: 22,
    maxSpeedMph: 45,
    energyUsedKwh: 1.2,
    startChargeLevel: 95,
    endChargeLevel: 92,
    fsdMiles: 3.2,
    fsdPercentage: 84,
    interventions: 0,
    routePoints: [
      [-97.7631, 30.2622],
      [-97.7590, 30.2640],
      [-97.7540, 30.2660],
      [-97.7500, 30.2650],
      [-97.7480, 30.2640],
      [-97.7450, 30.2630],
    ],
  },
  {
    id: 'd3',
    vehicleId: 'v1',
    date: '2026-02-21',
    startTime: '6:00 PM',
    endTime: '6:45 PM',
    startLocation: 'Whole Foods HQ',
    startAddress: '550 Bowie St, Austin, TX',
    endLocation: 'Home',
    endAddress: '1200 Barton Springs Rd, Austin, TX',
    distanceMiles: 4.1,
    durationMinutes: 45,
    avgSpeedMph: 18,
    maxSpeedMph: 40,
    energyUsedKwh: 1.5,
    startChargeLevel: 88,
    endChargeLevel: 85,
    fsdMiles: 3.8,
    fsdPercentage: 93,
    interventions: 0,
    routePoints: [
      [-97.7450, 30.2630],
      [-97.7480, 30.2640],
      [-97.7520, 30.2650],
      [-97.7560, 30.2640],
      [-97.7600, 30.2630],
      [-97.7631, 30.2622],
    ],
  },
  {
    id: 'd4',
    vehicleId: 'v1',
    date: '2026-02-21',
    startTime: '8:45 AM',
    endTime: '9:20 AM',
    startLocation: 'Home',
    startAddress: '1200 Barton Springs Rd, Austin, TX',
    endLocation: 'Whole Foods HQ',
    endAddress: '550 Bowie St, Austin, TX',
    distanceMiles: 3.9,
    durationMinutes: 35,
    avgSpeedMph: 24,
    maxSpeedMph: 48,
    energyUsedKwh: 1.3,
    startChargeLevel: 91,
    endChargeLevel: 88,
    fsdMiles: 3.6,
    fsdPercentage: 92,
    interventions: 0,
    routePoints: [
      [-97.7631, 30.2622],
      [-97.7590, 30.2640],
      [-97.7540, 30.2660],
      [-97.7500, 30.2650],
      [-97.7480, 30.2640],
      [-97.7450, 30.2630],
    ],
  },
  {
    id: 'd5',
    vehicleId: 'v1',
    date: '2026-02-20',
    startTime: '3:00 PM',
    endTime: '4:15 PM',
    startLocation: 'Home',
    startAddress: '1200 Barton Springs Rd, Austin, TX',
    endLocation: 'Circuit of the Americas',
    endAddress: '9201 Circuit of the Americas Blvd, Austin, TX',
    distanceMiles: 18.6,
    durationMinutes: 75,
    avgSpeedMph: 42,
    maxSpeedMph: 75,
    energyUsedKwh: 6.2,
    startChargeLevel: 96,
    endChargeLevel: 78,
    fsdMiles: 16.2,
    fsdPercentage: 87,
    interventions: 2,
    routePoints: [
      [-97.7631, 30.2622],
      [-97.7550, 30.2550],
      [-97.7450, 30.2480],
      [-97.7350, 30.2400],
      [-97.7250, 30.2300],
      [-97.7100, 30.2200],
      [-97.6950, 30.2100],
      [-97.6850, 30.2000],
      [-97.6500, 30.1350],
    ],
  },
  {
    id: 'd6',
    vehicleId: 'v2',
    date: '2026-02-22',
    startTime: '11:00 AM',
    endTime: '11:25 AM',
    startLocation: 'Downtown Condo',
    startAddress: '300 Bowie St, Austin, TX',
    endLocation: 'Tesla Supercharger',
    endAddress: '1201 Barbara Jordan Blvd, Austin, TX',
    distanceMiles: 5.4,
    durationMinutes: 25,
    avgSpeedMph: 28,
    maxSpeedMph: 55,
    energyUsedKwh: 1.8,
    startChargeLevel: 18,
    endChargeLevel: 15,
    fsdMiles: 4.9,
    fsdPercentage: 91,
    interventions: 0,
    routePoints: [
      [-97.7500, 30.2630],
      [-97.7430, 30.2680],
      [-97.7350, 30.2750],
      [-97.7250, 30.2830],
      [-97.7150, 30.2900],
      [-97.7069, 30.2990],
    ],
  },
];

export const invites: Invite[] = [
  {
    id: 'inv1',
    label: 'Mom',
    email: 'sarah.t@gmail.com',
    status: 'accepted',
    permission: 'live+history',
    sentDate: '2026-01-15',
    acceptedDate: '2026-01-15',
    lastSeen: '2 hours ago',
    isOnline: false,
  },
  {
    id: 'inv2',
    label: 'Alex',
    email: 'alex.chen@outlook.com',
    status: 'accepted',
    permission: 'live',
    sentDate: '2026-02-01',
    acceptedDate: '2026-02-02',
    lastSeen: '5 min ago',
    isOnline: true,
  },
  {
    id: 'inv3',
    label: 'Jamie',
    email: 'jamie.w@proton.me',
    status: 'pending',
    permission: 'live+history',
    sentDate: '2026-02-20',
  },
  {
    id: 'inv4',
    label: 'Dad',
    email: 'robert.t@yahoo.com',
    status: 'pending',
    permission: 'live',
    sentDate: '2026-02-21',
  },
];

// Status configuration
export const statusConfig: Record<VehicleStatus, { color: string; label: string; dotColor: string }> = {
  driving: { color: '#30D158', label: 'Driving', dotColor: 'bg-status-driving' },
  parked: { color: '#3B82F6', label: 'Parked', dotColor: 'bg-status-parked' },
  charging: { color: '#FFD60A', label: 'Charging', dotColor: 'bg-status-charging' },
  offline: { color: '#6B6B6B', label: 'Offline', dotColor: 'bg-status-offline' },
};

export function getStatusMessage(vehicle: Vehicle): string {
  switch (vehicle.status) {
    case 'driving':
      return `Driving — ${vehicle.speed} mph on ${vehicle.locationName}`;
    case 'parked':
      return `Parked at ${vehicle.locationName}`;
    case 'charging':
      return `Charging at ${vehicle.locationName} — ${vehicle.chargeLevel}%`;
    case 'offline':
      return `Offline — Last seen at ${vehicle.locationName}`;
  }
}

export function getBatteryColor(level: number): string {
  if (level > 50) return 'bg-battery-high';
  if (level > 20) return 'bg-battery-mid';
  return 'bg-battery-low';
}

export function getBatteryTextColor(level: number): string {
  if (level > 50) return 'text-battery-high';
  if (level > 20) return 'text-battery-mid';
  return 'text-battery-low';
}

