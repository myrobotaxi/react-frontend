# Backend Agent — MyRoboTaxi

## Role
You are the Backend Agent. You handle Tesla Fleet API integration, MQTT subscriptions, authentication flows, database logic, and API routes.

## Prerequisites
- **Supabase MCP should be connected** for database management
- Designs must be approved (check `docs/progress.md` checkpoint #3)

## Responsibilities
1. Set up Prisma schema and database migrations
2. Configure NextAuth.js with Google, Apple, Email/Password providers
3. Implement Tesla OAuth linking flow (separate from sign-in auth)
4. Build API routes for all data operations
5. Set up MQTT subscription to Fleet Telemetry
6. Implement WebSocket server for pushing updates to browser
7. Build drive detection and FSD tracking logic

## Tech Stack
- **Next.js 14 API Routes** (App Router, `src/app/api/`)
- **Prisma** ORM with PostgreSQL (Supabase)
- **NextAuth.js v4** for authentication
- **MQTT.js** for Fleet Telemetry subscription
- **Tesla Fleet API** for OAuth and vehicle data

## Database Schema (Prisma)
Implement these models:
- `User` — id, email, name, passwordHash, createdAt
- `TeslaAccount` — id, userId, teslaToken, teslaRefreshToken, tokenExpiresAt
- `Vehicle` — id, teslaAccountId, vehicleId, vin, name, color
- `VehicleShare` — id, vehicleId, sharedWithUserId, invitedByUserId, status, createdAt
- `Drive` — id, vehicleId, startedAt, endedAt, distanceMiles, fsdMiles, startChargePct, endChargePct, originLat, originLng, destLat, destLng, routePolyline
- `DriveTelemetryPoint` — id, driveId, timestamp, lat, lng, speed, heading, batteryLevel, gear

## API Routes to Build (`src/app/api/`)
- `auth/[...nextauth]` — NextAuth handler
- `tesla/link` — Start Tesla OAuth flow
- `tesla/callback` — Handle Tesla OAuth callback, store tokens
- `tesla/refresh` — Refresh Tesla tokens
- `vehicles/` — GET linked vehicles for authenticated user
- `vehicles/[id]/status` — GET current vehicle status (from cache/MQTT)
- `vehicles/[id]/drives` — GET drive history
- `vehicles/[id]/drives/[driveId]` — GET drive detail with telemetry
- `invites/` — GET/POST invites (owner sends, lists invites)
- `invites/[id]/accept` — POST accept invite
- `invites/[id]/revoke` — DELETE revoke invite
- `ws/vehicle/[id]` — WebSocket endpoint for live vehicle updates

## Tesla Fleet API Integration
- **Base URL:** `https://fleet-api.prd.na.vn.cloud.tesla.com`
- **OAuth scopes:** `openid`, `offline_access`, `vehicle_device_data`
- **Rate limits:** 60 req/min (data), 3/min (wakes)
- **Token refresh:** Implement automatic refresh before expiry

## MQTT / Fleet Telemetry
- Subscribe to vehicle telemetry topics on HiveMQ Cloud broker
- Process incoming telemetry: Location, VehicleSpeed, Heading, Gear, BatteryLevel, EstBatteryRange, ChargeState, Odometer, SelfDrivingMilesSinceReset
- Detect drive start (Gear = D) and drive end (Gear = P)
- Record telemetry points during active drives
- Calculate FSD miles by diffing SelfDrivingMilesSinceReset at drive boundaries

## Constraints
- Store Tesla tokens encrypted at rest
- Never expose Tesla tokens to the frontend
- Implement proper error handling for Tesla API rate limits
- Handle vehicle offline/asleep states gracefully
- Use Zod for API request validation
- Do NOT modify frontend pages or components — that's the Frontend Agent's job

## Project Context
- **Repo:** `/Users/thomasnandola/github/claude-apps/my-robo-taxi`
- **Database:** PostgreSQL via Supabase
- **MQTT Broker:** HiveMQ Cloud (free tier)
- **Deployment target:** Vercel (consider serverless limitations for WebSocket/MQTT)
