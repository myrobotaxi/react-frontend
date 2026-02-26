# MyRoboTaxi Frontend Architecture

This document defines the frontend architecture for MyRoboTaxi. It covers project structure, component design, state management, map integration, real-time data, testing, and code quality. Every decision is grounded in the specific needs of this application: a map-heavy, real-time vehicle tracking UI with dark theme aesthetics, built on Next.js 14+ with the App Router.

**Tech stack:** Next.js 14+ (App Router), TypeScript (strict), Tailwind CSS v4, Mapbox GL JS, NextAuth.js, Prisma + Supabase (PostgreSQL), WebSockets.

**Screens:** SignIn, SignUp, Home (live map), HomeEmpty, DriveHistory, DriveSummary, Invites, Settings, SharedViewer.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Component Architecture](#2-component-architecture)
3. [Feature Module Pattern](#3-feature-module-pattern)
4. [State Management Strategy](#4-state-management-strategy)
5. [Mapbox Integration Architecture](#5-mapbox-integration-architecture)
6. [Real-time Data Architecture](#6-real-time-data-architecture)
7. [Testing Strategy](#7-testing-strategy)
8. [Code Quality Rules](#8-code-quality-rules)
9. [Accessibility](#9-accessibility)
10. [Performance](#10-performance)

---

## 1. Project Structure

```
src/
  app/                          # Next.js App Router -- routes, layouts, metadata
    (auth)/                     # Route group: auth pages (no layout chrome)
      signin/page.tsx
      signup/page.tsx
    (main)/                     # Route group: authenticated pages (shared layout)
      layout.tsx                # Shell with BottomNav, auth gate
      page.tsx                  # Home / live map (default route)
      empty/page.tsx            # HomeEmpty state
      drives/
        page.tsx                # DriveHistory
        [driveId]/page.tsx      # DriveSummary
      invites/page.tsx          # Invite management
      settings/page.tsx         # User settings
    shared/
      [token]/page.tsx          # SharedViewer (public, no auth)
    api/                        # API route handlers
      auth/[...nextauth]/route.ts
      vehicles/route.ts
      drives/route.ts
      invites/route.ts
      ws/route.ts               # WebSocket upgrade endpoint
    layout.tsx                  # Root layout (html, body, fonts, providers)
    globals.css                 # Tailwind directives, Mapbox overrides

  components/                   # Shared, reusable UI components
    ui/                         # Primitives: Button, Input, Badge, Card, Toggle
    map/                        # Map components: VehicleMap, DriveRouteMap
    layout/                     # App shell: BottomNav, PageHeader, BottomSheet

  features/                     # Feature modules (self-contained domains)
    vehicles/                   # Vehicle tracking and status
    drives/                     # Drive history and summaries
    invites/                    # Invite management and sharing
    settings/                   # User preferences and Tesla account linking
    auth/                       # Authentication forms and flows

  hooks/                        # Shared custom hooks
    use-media-query.ts
    use-debounce.ts
    use-local-storage.ts

  lib/                          # Utilities, API clients, constants
    api-client.ts               # Typed fetch wrapper
    format.ts                   # Date, distance, speed formatters
    constants.ts                # App-wide constants (sheet heights, breakpoints)
    mapbox.ts                   # Mapbox token config, style URLs
    websocket.ts                # WebSocket client singleton

  types/                        # Shared TypeScript types
    vehicle.ts                  # Vehicle, VehicleStatus
    drive.ts                    # Drive, RoutePoint
    invite.ts                   # Invite, Permission
    api.ts                      # API response wrappers

  styles/                       # Global CSS beyond globals.css
    mapbox-overrides.css        # Tailwind v4 / Mapbox compatibility fixes

  __tests__/                    # Test files mirroring src/ structure
    components/
    features/
    hooks/
    lib/
    e2e/                        # Playwright end-to-end tests
```

### Why each directory exists

**`app/`** -- This is the Next.js App Router. Only route definitions, page-level data fetching, and layout composition live here. Pages are thin: they assemble feature components, pass server-fetched data as props, and handle metadata. No business logic, no UI primitives, no hooks. Route groups `(auth)` and `(main)` separate the authenticated shell (with BottomNav) from public/auth pages without affecting URLs.

**`components/`** -- Shared UI components used across multiple features. If a component is used in only one feature, it belongs in that feature's `components/` directory, not here. The `ui/` subdirectory holds design-system primitives (Button, Input, Badge). The `map/` subdirectory holds Mapbox-specific components. The `layout/` subdirectory holds structural components (BottomNav, BottomSheet, PageHeader).

**`features/`** -- Self-contained domain modules. Each feature owns its components, hooks, API calls, and types. This is where business logic lives. Features can import from `components/` (shared UI) and `lib/` (utilities) but never from other features. See [Section 3](#3-feature-module-pattern) for the full pattern.

**`hooks/`** -- Generic, reusable hooks with no business-domain knowledge. A hook that debounces any value belongs here. A hook that manages vehicle WebSocket state belongs in `features/vehicles/hooks/`.

**`lib/`** -- Pure utilities, configuration, and API clients. No React code (no hooks, no components). Everything here should be importable from both server and client contexts.

**`types/`** -- Shared TypeScript interfaces and type aliases used across multiple features. Feature-specific types stay in their feature module.

**`styles/`** -- CSS that cannot live in `globals.css`. Primarily the Mapbox override styles needed for Tailwind v4 compatibility (see [Section 5](#5-mapbox-integration-architecture)).

**`__tests__/`** -- Mirrors the `src/` structure. Test files are named `[module].test.ts` or `[module].test.tsx`. E2E tests live in `__tests__/e2e/` and are Playwright specs.

### What does NOT belong where

| Do not put... | In... | Instead put it in... |
|---|---|---|
| Business logic | `app/` pages | `features/[feature]/` |
| Feature-specific components | `components/` | `features/[feature]/components/` |
| React hooks | `lib/` | `hooks/` or `features/[feature]/hooks/` |
| API route handlers | `features/` | `app/api/` |
| Shared types | `features/[feature]/types.ts` | `types/` (if cross-feature) |
| Global state providers | `components/` | `app/layout.tsx` or `app/(main)/layout.tsx` |

---

## 2. Component Architecture

### Core Principles

**Single Responsibility.** Every component does exactly one thing. If you need a comment like `// === DRIVING HALF STATE ===` to explain a section within a component (as in the current `Home.tsx` mock at line 259), that section should be extracted into its own component. The rule: if a block of JSX has a distinct purpose, it is a distinct component.

**Composition over Inheritance.** React components compose through `children`, render props, and the compound component pattern. Never use class inheritance. Never create a `BaseComponent` that subclasses extend.

**Props as Contract.** Every component's props define its public API. Props should be typed with an explicit interface (not inline). If a component takes more than 5 props, it likely needs decomposition or its props need grouping into a domain object.

**Component Size Rule.** If a component file exceeds approximately 150 lines of code (excluding imports and type definitions), it should be decomposed. The current `Home.tsx` is 406 lines -- it does too much.

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `VehicleMap`, `TripProgressBar` |
| Component files | PascalCase `.tsx` | `VehicleMap.tsx`, `TripProgressBar.tsx` |
| Hooks | camelCase, prefixed `use` | `useVehicleStream`, `useBottomSheet` |
| Hook files | kebab-case `.ts` | `use-vehicle-stream.ts`, `use-bottom-sheet.ts` |
| Utility files | kebab-case `.ts` | `format.ts`, `api-client.ts` |
| Types/interfaces | PascalCase | `Vehicle`, `DriveHistory` |
| Constants | SCREAMING_SNAKE_CASE | `SHEET_PEEK_HEIGHT`, `WS_RECONNECT_MAX_DELAY` |

### Decomposition Example: Home.tsx

The current mock `Home.tsx` (406 lines) handles map rendering, vehicle selection, bottom sheet drag mechanics, driving peek state, parked peek state, driving half state, and parked half state. Here is how it should decompose:

```
app/(main)/page.tsx                    # Thin page: fetches vehicle data, renders HomeScreen
features/vehicles/components/
  HomeScreen.tsx                       # Orchestrator: VehicleMap + BottomSheet
  VehicleMap.tsx                       # Map + markers + route + vehicle dot selector
  VehicleDotSelector.tsx               # The dot indicators for switching vehicles
  BottomSheet.tsx                      # Generic drag + snap shell (peek/half)
  DrivingPeekContent.tsx               # Vehicle name, status, destination, progress bar, stats
  ParkedPeekContent.tsx                # Vehicle name, status, location, battery bar
  DrivingHalfContent.tsx               # Start/dest, stops, vehicle details, odometer, temps
  ParkedHalfContent.tsx                # Location, odometer, range, battery, vehicle details
  TripProgressBar.tsx                  # Glowing gold bar, stop diamonds, origin/dest labels
  StatRow.tsx                          # ETA / Speed / Battery row with dividers
  VehicleDetailsBlock.tsx              # Year, model, color, plate (used in both half states)
```

**Why this decomposition works:**

- `BottomSheet` owns only drag mechanics and snap states. It accepts `children` for content. It knows nothing about vehicles.
- `DrivingPeekContent` receives a `Vehicle` and a `Drive` as props. It renders the trip summary. It does not know about the bottom sheet or the map.
- `TripProgressBar` receives `progress: number`, `stops: Stop[]`, `originLabel: string`, `destinationLabel: string`. It renders the gold bar. It does not know about vehicles.
- `VehicleMap` wraps the Mapbox instance and handles marker/route rendering. It receives `vehicles`, `selectedVehicleId`, and `onSelectVehicle` as props.

Each component is independently testable. Each can be rendered in Storybook or a test harness without the rest of the page.

### Prop Drilling Prevention

Use these strategies in order of preference:

1. **Co-locate state.** Move state to the nearest common ancestor of the components that need it. For the Home screen, `HomeScreen` holds `currentVehicleIndex` and `sheetState`, passing them down to direct children. One level of prop passing is fine.

2. **URL state.** Use `searchParams` for state that should survive page refreshes and be shareable: selected vehicle ID, selected drive ID, filter values. Read with `useSearchParams()` in client components or the `searchParams` prop in server components.

3. **React Context.** Use context when state needs to skip multiple component levels within a single feature boundary. Example: a `VehicleStreamContext` that provides the WebSocket-fed vehicle state to any component in the vehicle feature tree, avoiding prop threading through intermediate layout components.

4. **Never use global state libraries** (Redux, Zustand) for state that belongs to a single feature. If you feel the need for global state, reconsider the component boundaries first.

### Compound Component Pattern

Use compound components for tightly coupled UI elements that share implicit state. The `BottomSheet` is a candidate:

```tsx
// Usage
<BottomSheet defaultState="peek">
  <BottomSheet.Handle />
  <BottomSheet.Content>
    {(state) => state === 'peek' ? <PeekContent /> : <HalfContent />}
  </BottomSheet.Content>
</BottomSheet>

// Implementation sketch
const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

function BottomSheet({ children, defaultState }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>(defaultState);
  // ... drag logic
  return (
    <BottomSheetContext.Provider value={{ state, setState, isDragging, height }}>
      <div className="..." style={{ height }}>{children}</div>
    </BottomSheetContext.Provider>
  );
}

BottomSheet.Handle = function Handle() {
  const { onDragStart, onDragMove, onDragEnd } = useContext(BottomSheetContext);
  return <div className="..." onTouchStart={onDragStart} ... />;
};

BottomSheet.Content = function Content({ children }: { children: (state: SheetState) => ReactNode }) {
  const { state } = useContext(BottomSheetContext);
  return <div className="overflow-y-auto">{children(state)}</div>;
};
```

This separates drag mechanics (BottomSheet), visual handle (BottomSheet.Handle), and content rendering (BottomSheet.Content) while keeping them coordinated through shared context.

---

## 3. Feature Module Pattern

Each business domain gets its own directory under `features/`. A feature module is a self-contained unit that owns everything needed to implement a domain concept.

### Structure

```
features/
  vehicles/
    components/           # Feature-specific components
      HomeScreen.tsx
      VehicleMap.tsx
      BottomSheet.tsx
      DrivingPeekContent.tsx
      ParkedPeekContent.tsx
      TripProgressBar.tsx
      ...
    hooks/                # Feature-specific hooks
      use-vehicle.ts            # Fetch single vehicle data
      use-vehicles.ts           # Fetch vehicle list
      use-vehicle-stream.ts     # WebSocket live vehicle updates
      use-bottom-sheet.ts       # Drag + snap state machine
    api/                  # Server actions or API call functions
      get-vehicles.ts           # Server action: fetch from Prisma
      get-vehicle-by-id.ts
    types.ts              # Feature-specific types (VehicleWithTrip, SheetState)
    index.ts              # Public API barrel file

  drives/
    components/
      DriveHistoryScreen.tsx
      DriveListItem.tsx
      DriveSummaryScreen.tsx
      SpeedSparkline.tsx
      FSDSection.tsx
      DriveRouteMap.tsx
      StatItem.tsx
      LocationTimeline.tsx
    hooks/
      use-drives.ts
      use-drive-by-id.ts
      use-drive-sort.ts
    api/
      get-drives.ts
      get-drive-by-id.ts
    types.ts
    index.ts

  invites/
    components/
      InvitesScreen.tsx
      InviteListItem.tsx
      InviteForm.tsx
      PermissionBadge.tsx
    hooks/
      use-invites.ts
      use-create-invite.ts
      use-revoke-invite.ts
    api/
      get-invites.ts
      create-invite.ts
      revoke-invite.ts
    types.ts
    index.ts

  settings/
    components/
      SettingsScreen.tsx
      TeslaAccountLink.tsx
      NotificationPreferences.tsx
    hooks/
      use-settings.ts
      use-update-settings.ts
    api/
      get-settings.ts
      update-settings.ts
    types.ts
    index.ts

  auth/
    components/
      SignInForm.tsx
      SignUpForm.tsx
    hooks/
      use-auth-form.ts
    types.ts
    index.ts
```

### The Import Rule

This is the single most important architectural constraint:

```
features/vehicles/ CAN import from:
  - components/*         (shared UI primitives)
  - hooks/*              (shared utility hooks)
  - lib/*                (utilities, constants, API client)
  - types/*              (shared types)

features/vehicles/ CANNOT import from:
  - features/drives/     (NEVER -- cross-feature dependency)
  - features/invites/    (NEVER)
  - features/settings/   (NEVER)
  - app/                 (NEVER -- features don't know about routing)
```

**Cross-feature communication** happens exclusively through the app layer. If the Home page needs both vehicle data and the latest drive, the page component (in `app/`) imports from both `features/vehicles` and `features/drives` and composes them:

```tsx
// app/(main)/page.tsx
import { HomeScreen } from '@/features/vehicles';
import { getLatestDrive } from '@/features/drives';
import { getVehicles } from '@/features/vehicles';

export default async function HomePage() {
  const vehicles = await getVehicles();
  const latestDrive = vehicles[0]
    ? await getLatestDrive(vehicles[0].id)
    : null;

  return <HomeScreen vehicles={vehicles} latestDrive={latestDrive} />;
}
```

### The `index.ts` Public API

Each feature's `index.ts` explicitly exports what other parts of the app may use. Internal implementation details are not exported:

```tsx
// features/vehicles/index.ts

// Components (used by app/ pages)
export { HomeScreen } from './components/HomeScreen';

// Server actions (used by app/ pages for data fetching)
export { getVehicles } from './api/get-vehicles';
export { getVehicleById } from './api/get-vehicle-by-id';

// Types (used by other features if needed)
export type { VehicleWithTrip } from './types';

// NOT exported: BottomSheet, TripProgressBar, useBottomSheet
// Those are internal implementation details of the vehicles feature.
```

### Why this pattern matters

The mock codebase has a flat structure where `Home.tsx` directly imports `drives` and `vehicles` from `mockData.ts`. In a real app, this means every page knows about the shape of every data source. The feature module pattern ensures:

- **Isolation:** Changing the vehicle API response shape only requires changes inside `features/vehicles/`.
- **Testability:** Each feature can be tested in complete isolation with mocked dependencies.
- **Onboarding:** A new developer working on invites only needs to understand `features/invites/` and the shared `components/` and `lib/` directories.
- **Parallel development:** Two developers can work on vehicles and drives simultaneously without merge conflicts in shared files.

---

## 4. State Management Strategy

### State Categories

Not all state is created equal. Choosing the wrong storage mechanism for a piece of state is the #1 source of unnecessary complexity in React applications. MyRoboTaxi has five distinct categories of state:

| Category | What | Where | Why |
|---|---|---|---|
| **Server State** | Vehicle data, drives, invites, user profile | React Server Components (RSC) + `fetch` for initial load; SWR or React Query for client-side cache | Data lives in the database. The frontend is a read-through cache. Server Components eliminate the need for client-side loading states on initial page load. |
| **Client State** | Bottom sheet position, selected vehicle index, UI toggles | `useState` / `useReducer` in the nearest common ancestor | Ephemeral UI state that resets on navigation. No need to persist or share across the app. |
| **URL State** | Current vehicle ID, selected drive ID, sort/filter params | `searchParams` via `useSearchParams()` or server component props | Bookmarkable, shareable, survives refresh. The URL is the source of truth for "what am I looking at." |
| **Real-time State** | Live vehicle position, speed, charge level, heading | WebSocket -> custom hook -> React state | Streams from the server. Must update the UI at high frequency without re-rendering the entire page. |
| **Form State** | Invite form inputs, settings form inputs | `react-hook-form` with controlled components | Form libraries handle validation, dirty tracking, and submission state better than manual `useState` per field. |

### Server State: React Server Components + SWR

**Initial page load** uses React Server Components. The page component (`app/(main)/page.tsx`) fetches data on the server using Prisma directly (via server actions) and passes it as props to client components. This eliminates loading spinners for the initial render.

```tsx
// app/(main)/drives/page.tsx -- Server Component
import { DriveHistoryScreen } from '@/features/drives';
import { getDrives } from '@/features/drives';
import { getVehicles } from '@/features/vehicles';

export default async function DrivesPage() {
  const vehicles = await getVehicles();
  const drives = await getDrives(vehicles[0]?.id);
  return <DriveHistoryScreen vehicle={vehicles[0]} drives={drives} />;
}
```

**Client-side revalidation** uses SWR for data that may change while the user is on the page (e.g., invite statuses updating). SWR is preferred over React Query for MyRoboTaxi because the data patterns are simple key-value fetches, not complex paginated or infinite queries.

```tsx
// features/invites/hooks/use-invites.ts
import useSWR from 'swr';
import type { Invite } from '@/types/invite';

export function useInvites(initialData: Invite[]) {
  return useSWR<Invite[]>('/api/invites', {
    fallbackData: initialData,      // Server-rendered data as initial value
    revalidateOnFocus: true,        // Re-fetch when tab regains focus
    revalidateOnReconnect: true,    // Re-fetch after network recovery
  });
}
```

### Client State: Colocated `useState`

Client state stays local. The current `Home.tsx` already does this correctly for sheet state and vehicle index:

```tsx
const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);
const [sheetState, setSheetState] = useState<SheetState>('peek');
```

This state belongs in `HomeScreen` (or in a `useBottomSheet` hook). It does not belong in a global store.

### URL State: searchParams

The selected vehicle and selected drive should be URL state, not component state. This makes deep links work and enables the browser back button to behave correctly:

```tsx
// URL: /drives?sort=distance
// Read in client component:
const searchParams = useSearchParams();
const sortBy = (searchParams.get('sort') as SortBy) ?? 'date';

// Update without full navigation:
const router = useRouter();
function setSortBy(sort: SortBy) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('sort', sort);
  router.replace(`?${params.toString()}`);
}
```

### Real-time State: WebSocket Hook

Real-time vehicle telemetry flows through a dedicated hook that manages the WebSocket connection and exposes a reactive state value. See [Section 6](#6-real-time-data-architecture) for the full architecture.

### Form State: react-hook-form

The invite creation form and settings page use `react-hook-form`:

```tsx
// features/invites/components/InviteForm.tsx
import { useForm } from 'react-hook-form';

interface InviteFormData {
  label: string;
  email: string;
  permission: 'live' | 'live+history';
}

export function InviteForm({ onSubmit }: { onSubmit: (data: InviteFormData) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InviteFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+$/ })} />
      {errors.email && <span className="text-battery-low text-xs">Valid email required</span>}
      {/* ... */}
    </form>
  );
}
```

---

## 5. Mapbox Integration Architecture

The map is the centerpiece of MyRoboTaxi. It is also the largest dependency (~800KB), the most complex to integrate with SSR, and the easiest to get wrong with Tailwind CSS v4. This section defines the architectural patterns for map integration.

### Dynamic Import -- SSR Avoidance

Mapbox GL JS depends on `window`, `document`, and WebGL APIs that do not exist on the server. The map component must be dynamically imported with SSR disabled:

```tsx
// components/map/VehicleMap.tsx (the public API)
'use client';

import dynamic from 'next/dynamic';

const VehicleMapInner = dynamic(
  () => import('./VehicleMapInner').then((mod) => mod.VehicleMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-bg-primary animate-pulse" />
    ),
  }
);

export function VehicleMap(props: VehicleMapProps) {
  return <VehicleMapInner {...props} />;
}
```

The `VehicleMapInner` component is the actual Mapbox implementation. It is never imported directly by any other file. The `VehicleMap` wrapper is the stable public API.

### Map Instance Management

The Mapbox `Map` instance is managed via `useRef`, not `useState`. Storing a Map instance in state would cause infinite re-renders because the Map object is mutable and reference-unstable.

However, the **map loaded state** must be tracked via `useState`, not `useRef`. This is critical because effects that depend on the map being ready (route rendering, marker placement) need to re-run when the map finishes loading. A ref change does not trigger re-renders, so dependent effects would never fire.

The current `MapPlaceholder.tsx` already gets this right:

```tsx
const map = useRef<mapboxgl.Map | null>(null);       // Map instance -- ref
const [mapLoaded, setMapLoaded] = useState(false);    // Load state -- state (triggers effects)
```

### Hook Decomposition

The current `MapPlaceholder.tsx` (268 lines) bundles map creation, vehicle marker management, heading rotation, and route layer management into a single component. In the production app, these concerns should be separated into focused hooks:

```
hooks/
  use-map-instance.ts       # Creates the map, manages lifecycle, tracks mapLoaded state
  use-vehicle-marker.ts     # Creates/updates the gold vehicle marker with heading rotation
  use-route-layer.ts        # Adds/updates/removes route GeoJSON layers (completed + remaining)
  use-map-fit-bounds.ts     # Fit-to-route bounds calculation and animation
```

**`useMapInstance`** -- Takes a container ref and config (center, zoom, interactive). Returns `{ map: MutableRefObject<Map | null>, mapLoaded: boolean }`. Creates the map on mount, cleans up on unmount. Injects the `goldPulse` keyframe animation style element.

**`useVehicleMarker`** -- Takes `{ map, mapLoaded, position, heading, visible }`. Creates the custom HTML marker element (gold circle + heading arrow + pulse ring). Updates position via `marker.setLngLat()` when position changes. Rotates the SVG via direct DOM manipulation when heading changes.

**`useRouteLayer`** -- Takes `{ map, mapLoaded, routeCoordinates, vehiclePosition, visible }`. Calls `splitRoute()` from `lib/mapbox.ts` to divide the route at the vehicle position. Manages the `route-completed` and `route-remaining` GeoJSON sources and layers. Handles cleanup of previous layers before adding new ones.

**`useMapFitBounds`** -- Takes `{ map, routeCoordinates }`. Returns a `fitToRoute()` callback. Computes `LngLatBounds` from route coordinates and calls `map.fitBounds()` with appropriate padding.

### Usage in the Vehicle Map Component

```tsx
// components/map/VehicleMapInner.tsx
'use client';

import { useRef } from 'react';
import { useMapInstance } from './hooks/use-map-instance';
import { useVehicleMarker } from './hooks/use-vehicle-marker';
import { useRouteLayer } from './hooks/use-route-layer';
import { useMapFitBounds } from './hooks/use-map-fit-bounds';

export function VehicleMapInner({
  center, zoom, interactive, showVehicleMarker, showRoute,
  vehiclePosition, heading, routeCoordinates, children,
}: VehicleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { map, mapLoaded } = useMapInstance(containerRef, { center, zoom, interactive });

  useVehicleMarker({ map, mapLoaded, position: vehiclePosition ?? center, heading, visible: showVehicleMarker });
  useRouteLayer({ map, mapLoaded, routeCoordinates, vehiclePosition, visible: showRoute });
  const { fitToRoute } = useMapFitBounds({ map, routeCoordinates });

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      {showRoute && routeCoordinates && <FitRouteButton onClick={fitToRoute} />}
      {children}
    </div>
  );
}
```

Each hook is independently testable. The map component itself is under 40 lines.

### Tailwind v4 CSS Override Strategy

Tailwind CSS v4's preflight layer resets `canvas { display: block }` and `* { border: 0 solid }`, which breaks the Mapbox GL canvas rendering. The fix (already implemented in the mock `index.css`) uses `!important` overrides placed **outside** any `@layer` so they always beat Tailwind's layered resets:

```css
/* styles/mapbox-overrides.css -- imported in globals.css, NOT inside @layer */
.mapboxgl-map {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
}
.mapboxgl-canvas-container {
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
}
.mapboxgl-canvas {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
}
```

This file is imported in `globals.css` at the top, before Tailwind directives.

### Token Management

The Mapbox access token is provided via the `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable (not `VITE_MAPBOX_TOKEN` as in the mock, since we are migrating from Vite to Next.js). It is read once in `lib/mapbox.ts`:

```tsx
// lib/mapbox.ts
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

if (!MAPBOX_TOKEN && typeof window !== 'undefined') {
  console.error('[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN is not set.');
}
```

Map components import the token from `lib/mapbox.ts`. The token is never hardcoded in component files.

---

## 6. Real-time Data Architecture

MyRoboTaxi displays live vehicle telemetry: position, speed, heading, charge level, and trip progress. This data streams from the server via WebSockets and must update the UI at approximately 1-3 second intervals without degrading performance.

### WebSocket Connection Lifecycle

A single WebSocket connection per authenticated user, managed by a singleton hook:

```
features/vehicles/hooks/use-vehicle-stream.ts
```

The hook is instantiated once in the `HomeScreen` component and provides live vehicle state to all descendant components via context.

### Connection Manager (lib/websocket.ts)

The WebSocket client is a class (not a hook) that manages:

- Connection establishment
- Authentication (sends session token on connect)
- Message parsing and type-safe dispatch
- Reconnection with exponential backoff + jitter
- Heartbeat/ping to detect stale connections

```tsx
// lib/websocket.ts

interface WebSocketConfig {
  url: string;
  token: string;
  onMessage: (data: VehicleUpdate) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const BACKOFF_CONFIG = {
  baseDelay: 1_000,      // 1 second initial retry
  maxDelay: 30_000,      // 30 second maximum
  multiplier: 2,         // Double each attempt
  jitterFactor: 0.1,     // +/- 10% random jitter
};

export class VehicleWebSocket {
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private config: WebSocketConfig;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect() {
    this.config.onStatusChange('connecting');
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.ws?.send(JSON.stringify({ type: 'auth', token: this.config.token }));
      this.config.onStatusChange('connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as VehicleUpdate;
      this.config.onMessage(data);
    };

    this.ws.onclose = () => {
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    this.config.onStatusChange('reconnecting');
    const delay = Math.min(
      BACKOFF_CONFIG.baseDelay * Math.pow(BACKOFF_CONFIG.multiplier, this.retryCount),
      BACKOFF_CONFIG.maxDelay
    );
    const jitter = delay * BACKOFF_CONFIG.jitterFactor * (Math.random() * 2 - 1);
    this.retryTimer = setTimeout(() => {
      this.retryCount++;
      this.connect();
    }, delay + jitter);
  }

  disconnect() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.config.onStatusChange('disconnected');
  }
}
```

### React Hook Layer

```tsx
// features/vehicles/hooks/use-vehicle-stream.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VehicleWebSocket, type ConnectionStatus } from '@/lib/websocket';
import type { Vehicle } from '@/types/vehicle';

interface VehicleStreamState {
  vehicles: Map<string, Vehicle>;
  connectionStatus: ConnectionStatus;
}

export function useVehicleStream(
  initialVehicles: Vehicle[],
  sessionToken: string | null,
) {
  const [state, setState] = useState<VehicleStreamState>(() => ({
    vehicles: new Map(initialVehicles.map((v) => [v.id, v])),
    connectionStatus: 'disconnected',
  }));

  const wsRef = useRef<VehicleWebSocket | null>(null);

  const handleMessage = useCallback((update: VehicleUpdate) => {
    setState((prev) => {
      const next = new Map(prev.vehicles);
      const existing = next.get(update.vehicleId);
      if (existing) {
        next.set(update.vehicleId, { ...existing, ...update.fields });
      }
      return { ...prev, vehicles: next };
    });
  }, []);

  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setState((prev) => ({ ...prev, connectionStatus: status }));
  }, []);

  useEffect(() => {
    if (!sessionToken) return;

    const ws = new VehicleWebSocket({
      url: `${process.env.NEXT_PUBLIC_WS_URL}/api/ws`,
      token: sessionToken,
      onMessage: handleMessage,
      onStatusChange: handleStatusChange,
    });

    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [sessionToken, handleMessage, handleStatusChange]);

  return state;
}
```

### Graceful Degradation

When the WebSocket connection fails and cannot reconnect (after exhausting backoff), the app falls back to HTTP polling:

```tsx
// Inside use-vehicle-stream.ts -- after max retries
useEffect(() => {
  if (state.connectionStatus !== 'disconnected' || !sessionToken) return;

  // Fallback: poll every 10 seconds
  const interval = setInterval(async () => {
    const response = await fetch('/api/vehicles');
    const vehicles: Vehicle[] = await response.json();
    setState((prev) => ({
      ...prev,
      vehicles: new Map(vehicles.map((v) => [v.id, v])),
    }));
  }, 10_000);

  return () => clearInterval(interval);
}, [state.connectionStatus, sessionToken]);
```

### Optimistic UI Updates

For user-initiated actions that affect vehicle state (e.g., future remote commands), update the local state immediately and reconcile when the server confirms:

```tsx
function optimisticUpdate(vehicleId: string, fields: Partial<Vehicle>) {
  setState((prev) => {
    const next = new Map(prev.vehicles);
    const existing = next.get(vehicleId);
    if (existing) {
      next.set(vehicleId, { ...existing, ...fields });
    }
    return { ...prev, vehicles: next };
  });
}
```

---

## 7. Testing Strategy

### Testing Pyramid

```
         /  E2E  \          ~10 tests (Playwright)
        / Integra- \        ~30 tests (Vitest)
       /   tion     \
      /  Unit Tests   \     ~100+ tests (Vitest + RTL)
     /_________________ \
```

**Unit tests** are fast, numerous, and cover individual components, hooks, and utility functions. **Integration tests** verify feature modules working together (e.g., a drive history screen rendering a list of drives fetched from a mocked API). **E2E tests** cover critical user flows in a real browser.

### Unit Tests (Vitest + React Testing Library)

**Components:** Render with mock props, assert on output structure and behavior. Never test implementation details (internal state values, ref assignments). Test what the user sees and interacts with.

```tsx
// __tests__/features/vehicles/components/TripProgressBar.test.tsx
import { render, screen } from '@testing-library/react';
import { TripProgressBar } from '@/features/vehicles/components/TripProgressBar';

describe('TripProgressBar', () => {
  it('renders origin and destination labels', () => {
    render(
      <TripProgressBar
        progress={0.5}
        stops={[]}
        originLabel="Thompson Hotel"
        destinationLabel="Domain Northside"
      />
    );

    expect(screen.getByText('Thompson Hotel')).toBeInTheDocument();
    expect(screen.getByText('Domain Northside')).toBeInTheDocument();
  });

  it('renders stop markers for each stop', () => {
    render(
      <TripProgressBar
        progress={0.3}
        stops={[{ name: 'Tesla Supercharger', type: 'charging' }]}
        originLabel="Origin"
        destinationLabel="Destination"
      />
    );

    expect(screen.getByText('Tesla Supercharger')).toBeInTheDocument();
  });

  it('clamps progress between 0 and 1', () => {
    const { container } = render(
      <TripProgressBar progress={1.5} stops={[]} originLabel="" destinationLabel="" />
    );

    const progressBar = container.querySelector('[data-testid="progress-fill"]');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });
});
```

**Hooks:** Test with `renderHook` from `@testing-library/react`. Mock external dependencies (fetch, WebSocket).

```tsx
// __tests__/features/drives/hooks/use-drive-sort.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDriveSort } from '@/features/drives/hooks/use-drive-sort';

describe('useDriveSort', () => {
  const mockDrives = [
    { id: 'd1', date: '2026-02-22', distanceMiles: 14.2, durationMinutes: 47 },
    { id: 'd2', date: '2026-02-22', distanceMiles: 3.8, durationMinutes: 35 },
    { id: 'd3', date: '2026-02-21', distanceMiles: 18.6, durationMinutes: 75 },
  ];

  it('sorts by date descending by default', () => {
    const { result } = renderHook(() => useDriveSort(mockDrives as any));
    expect(result.current.sortedDrives[0].id).toBe('d1');
  });

  it('sorts by distance descending when sort is changed', () => {
    const { result } = renderHook(() => useDriveSort(mockDrives as any));
    act(() => result.current.setSortBy('distance'));
    expect(result.current.sortedDrives[0].id).toBe('d3');
  });
});
```

**Utilities:** Pure function tests.

```tsx
// __tests__/lib/format.test.ts
import { formatDateLabel, formatDuration } from '@/lib/format';

describe('formatDateLabel', () => {
  it('returns "Today" for the current date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatDateLabel(today)).toBe('Today');
  });

  it('returns "Yesterday" for the previous date', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    expect(formatDateLabel(yesterday)).toBe('Yesterday');
  });
});
```

### Integration Tests (Vitest)

Integration tests render a feature screen with mocked API responses and assert on the composed behavior:

```tsx
// __tests__/features/drives/integration/drive-history.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DriveHistoryScreen } from '@/features/drives/components/DriveHistoryScreen';
import { mockVehicle, mockDrives } from '../__fixtures__/drives';

describe('DriveHistoryScreen', () => {
  it('groups drives by date and renders sort controls', async () => {
    render(<DriveHistoryScreen vehicle={mockVehicle} drives={mockDrives} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();

    // Click "Distance" sort
    await userEvent.click(screen.getByRole('button', { name: /distance/i }));

    // First drive should now be the longest
    const driveLinks = screen.getAllByRole('link');
    expect(driveLinks[0]).toHaveTextContent('Circuit of the Americas');
  });
});
```

### E2E Tests (Playwright)

E2E tests run against the full Next.js app with a test database. They cover the critical user flows:

```tsx
// __tests__/e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('sign in and view live map', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Should redirect to home with map
    await expect(page).toHaveURL('/');
    await expect(page.locator('.mapboxgl-map')).toBeVisible();
    await expect(page.getByText('Midnight Runner')).toBeVisible();
  });

  test('navigate to drive history and view a drive summary', async ({ page }) => {
    await page.goto('/');

    // Click Drives tab
    await page.click('text=Drives');
    await expect(page).toHaveURL('/drives');

    // Click first drive
    await page.click('[data-testid="drive-list-item"]');
    await expect(page.getByText('Speed over time')).toBeVisible();
  });

  test('shared viewer loads without authentication', async ({ page }) => {
    await page.goto('/shared/test-token-abc');
    await expect(page.locator('.mapboxgl-map')).toBeVisible();
    // Should NOT show bottom nav
    await expect(page.locator('nav')).not.toBeVisible();
  });
});
```

### Visual Regression

For map-heavy screens where pixel-level layout matters, use Playwright's screenshot comparison:

```tsx
test('home screen matches baseline', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.mapboxgl-canvas');
  await expect(page).toHaveScreenshot('home-screen.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

Store baseline screenshots in `__tests__/e2e/__screenshots__/`. Review diffs in CI pull request checks.

### Test File Organization

```
__tests__/
  components/
    ui/
      Button.test.tsx
      StatusBadge.test.tsx
    map/
      VehicleMap.test.tsx
    layout/
      BottomNav.test.tsx
      BottomSheet.test.tsx
  features/
    vehicles/
      components/
        TripProgressBar.test.tsx
        DrivingPeekContent.test.tsx
      hooks/
        use-vehicle-stream.test.ts
        use-bottom-sheet.test.ts
      __fixtures__/
        vehicles.ts               # Mock vehicle data for tests
    drives/
      components/
        DriveHistoryScreen.test.tsx
        SpeedSparkline.test.tsx
      hooks/
        use-drive-sort.test.ts
      __fixtures__/
        drives.ts
  hooks/
    use-debounce.test.ts
  lib/
    format.test.ts
    websocket.test.ts
  e2e/
    critical-flows.spec.ts
    shared-viewer.spec.ts
    __screenshots__/
```

### Testability Requirements

Every component must be testable in isolation. This means:

- No hard dependencies on global singletons (the Mapbox token, the WebSocket instance, the current session). Inject these as props or read them from context that can be wrapped in tests.
- No direct `fetch` calls in components. Data fetching happens in server actions (tested separately) or hooks (tested with mocked fetch).
- Map components receive a mock container ref in tests. The actual Mapbox GL library is mocked at the module level in Vitest config.
- Asynchronous server components cannot be directly unit tested with Vitest. Use E2E tests for those paths.

---

## 8. Code Quality Rules

These rules are enforced by ESLint, TypeScript strict mode, and code review. They are not suggestions.

### File Size

- **No file over 200 lines** (excluding imports and type definitions). If a file exceeds this, decompose it. The current `Home.tsx` (406 lines) and `MapPlaceholder.tsx` (268 lines) both violate this rule and are decomposed in the production architecture.

### Type Safety

- **No `any` types.** Use `unknown` and narrow with type guards. The single exception is third-party library type incompatibilities, documented with a `// eslint-disable-next-line` and a comment explaining why.
- **All component props have an explicit interface.** Not inline `{ foo: string; bar: number }` in the function signature. Named interfaces enable documentation and reuse.
- **No type assertions (`as`)** unless the value has been validated. Prefer type narrowing with `if` checks or discriminated unions.

### Component Props

- **No component with more than 5 props without a named interface.**
- **Prefer domain objects over flat props.** Instead of `vehicleName, vehicleModel, vehicleYear, vehicleColor`, pass `vehicle: Vehicle`.
- **Boolean props should not require negation to understand.** Use `interactive` not `nonInteractive`. Use `showRoute` not `hideRoute`.

### Exports

- **Prefer named exports over default exports.** Named exports enable consistent import naming across the codebase and better tree-shaking.
- **All public exports must have a JSDoc comment** explaining purpose, expected usage, and any non-obvious behavior.
- **No barrel files deeper than 2 levels.** `features/vehicles/index.ts` is fine. `features/vehicles/components/sheets/index.ts` is too deep -- import directly instead.

### Styling

- **Tailwind classes only.** No inline `style={{}}` except for truly dynamic values that cannot be expressed as Tailwind classes: computed positions (map marker offset), dynamic widths (progress bar `width: ${progress}%`), and animation properties computed at runtime.
- **No CSS-in-JS.** No `styled-components`, no `emotion`, no CSS modules. Tailwind is the single styling system.
- **Class ordering convention:** Layout (display, position, flex) > Sizing (width, height) > Spacing (margin, padding) > Typography (text, font) > Visual (background, border, shadow) > Interactive (hover, focus, transition).

### Imports

- **Use path aliases.** `@/components/ui/Button` not `../../../components/ui/Button`.
- **Group imports:** React/Next.js first, then external libraries, then internal modules with a blank line between groups.

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import mapboxgl from 'mapbox-gl';

import { VehicleMap } from '@/components/map/VehicleMap';
import { useVehicleStream } from '@/features/vehicles/hooks/use-vehicle-stream';
import type { Vehicle } from '@/types/vehicle';
```

### Code Review Checklist

Every PR should be checked against:

- [ ] No file over 200 lines
- [ ] No cross-feature imports (features/X does not import from features/Y)
- [ ] No `any` types
- [ ] All new exports have JSDoc comments
- [ ] Components with 5+ props have a named interface
- [ ] Dynamic values in `style={{}}` cannot be expressed as Tailwind classes
- [ ] Tests exist for new components and hooks
- [ ] Accessibility: interactive elements have keyboard support and ARIA labels

---

## 9. Accessibility

MyRoboTaxi is a map-heavy application. Maps are inherently visual, which creates accessibility challenges. The goal is not perfect map accessibility (screen reader users cannot "see" a route), but rather ensuring that all information available on the map is also available in non-visual form, and that all interactive elements are fully keyboard accessible.

### Map Accessibility

**Accessible fallback for the map.** The map canvas is decorative for screen reader users. The meaningful information (vehicle status, location, trip progress) is rendered in the bottom sheet, which is fully text-based. The map element should have `role="img"` and an `aria-label` describing the current state:

```tsx
<div
  role="img"
  aria-label={`Map showing ${vehicle.name} ${
    isDriving
      ? `driving to ${vehicle.destinationName}, ${vehicle.etaMinutes} minutes away`
      : `parked at ${vehicle.locationName}`
  }`}
>
  <div ref={mapContainer} aria-hidden="true" />
</div>
```

The map canvas itself is `aria-hidden="true"` because it provides no screen reader value. All vehicle data is read from the bottom sheet text content.

**Live region for status updates.** When the vehicle status changes (starts driving, arrives, goes offline), announce it to screen readers via an ARIA live region:

```tsx
<div
  role="status"
  aria-live="polite"
  className="sr-only"
>
  {vehicle.name} is now {vehicle.status}
  {isDriving && `. Heading to ${vehicle.destinationName}, ETA ${vehicle.etaMinutes} minutes.`}
</div>
```

The `sr-only` Tailwind class (visually hidden but screen-reader-accessible) ensures this does not affect the visual layout.

### Keyboard Navigation

**Bottom sheet.** The bottom sheet must be operable without touch. Add keyboard handlers:
- `Enter` or `Space` on the drag handle toggles between peek and half states.
- `Escape` collapses to peek.
- The sheet content is focusable and scrollable with arrow keys when in half state.

```tsx
<div
  role="region"
  aria-label="Vehicle details"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSheet();
    }
    if (e.key === 'Escape') {
      setSheetState('peek');
    }
  }}
>
```

**Vehicle dot selector.** The dots for switching vehicles must be keyboard-focusable buttons (they already are `<button>` elements in the mock -- good). Add `aria-label` for each:

```tsx
<button
  aria-label={`Select ${v.name}`}
  aria-current={idx === currentVehicleIndex ? 'true' : undefined}
  onClick={() => setCurrentVehicleIndex(idx)}
  className={...}
/>
```

**Bottom navigation.** Each tab is a `<NavLink>` (rendered as `<a>`) which is keyboard-accessible by default. Ensure `aria-current="page"` is set on the active tab.

### Sort Controls (DriveHistory)

The sort buttons must communicate the current sort state:

```tsx
<button
  role="tab"
  aria-selected={sortBy === option}
  onClick={() => setSortBy(option)}
>
  {option}
</button>
```

Wrap the sort controls in `role="tablist"` for proper semantics.

### Color Independence

The design system uses color to indicate vehicle status (green for driving, blue for parked, yellow for charging, gray for offline). Every status color is paired with a text label via the `StatusBadge` component (the current implementation already does this correctly). The battery level uses color (green/yellow/red) but also always shows the numeric percentage.

Rule: **Never use color as the sole indicator of state.** Every colored element must have a text or icon companion that conveys the same information.

### Focus Management

When the bottom sheet transitions from peek to half, focus should remain on the sheet content. When navigating from the drive list to a drive summary, focus should move to the page heading. Use `useEffect` with `ref.focus()` for focus management on route changes:

```tsx
const headingRef = useRef<HTMLHeadingElement>(null);

useEffect(() => {
  headingRef.current?.focus();
}, []);

return <h1 ref={headingRef} tabIndex={-1}>{drive.startLocation} to {drive.endLocation}</h1>;
```

### Minimum Requirements

| Element | Requirement |
|---|---|
| All `<button>` elements | Focusable, operable with Enter/Space |
| All `<a>` elements | Focusable, operable with Enter |
| Map canvas | `aria-hidden="true"`, wrapper has `role="img"` with descriptive `aria-label` |
| Vehicle status changes | Announced via `aria-live="polite"` region |
| Bottom sheet drag handle | Keyboard toggle (Enter/Space), Escape to collapse |
| Sort controls | `role="tablist"` / `role="tab"` with `aria-selected` |
| Battery indicators | Always paired with numeric percentage text |
| Status indicators | Always paired with text label (StatusBadge already does this) |
| Page transitions | Focus moves to new page heading |
| Contrast | All text meets WCAG AA minimum (4.5:1 for body text, 3:1 for large text). White on `#0A0A0A` exceeds AAA. |

---

## 10. Performance

### Lazy Loading the Map

Mapbox GL JS is approximately 800KB. It must not block the initial page load. The dynamic import pattern from [Section 5](#5-mapbox-integration-architecture) ensures the map bundle is loaded only when the component renders on the client:

```tsx
const VehicleMapInner = dynamic(() => import('./VehicleMapInner'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg-primary animate-pulse" />,
});
```

The loading skeleton matches the app background color so the transition is seamless when the map loads.

### Image Optimization

Use `next/image` for all static images (vehicle photos, logos). For the map, the Mapbox GL canvas handles its own rendering -- `next/image` is not applicable to it.

```tsx
import Image from 'next/image';

<Image
  src="/images/tesla-model-y.webp"
  alt="Tesla Model Y"
  width={400}
  height={300}
  priority={false}     // Only true for above-the-fold images
  placeholder="blur"
  blurDataURL="..."
/>
```

### Memoization Strategy

Memoize where measured necessary, not preemptively. These specific computations in MyRoboTaxi warrant memoization:

**Route splitting.** `splitRoute()` iterates the full route coordinate array to find the closest point to the vehicle. This runs on every vehicle position update. Memoize by position:

```tsx
const { completed, remaining } = useMemo(
  () => splitRoute(routeCoordinates, vehiclePosition),
  [routeCoordinates, vehiclePosition]
);
```

**Drive grouping by date.** The `DriveHistory` screen groups drives by date label. This computation runs on the full drive array:

```tsx
const groupedDrives = useMemo(() => {
  return groupDrivesByDate(sortedDrives);
}, [sortedDrives]);
```

**Speed sparkline generation.** The `generateSpeedSparkline()` function in `DriveSummary.tsx` generates an array of plot points. This runs once per drive and should be memoized:

```tsx
const speedPoints = useMemo(
  () => generateSpeedSparkline(drive.durationMinutes, drive.avgSpeedMph, drive.maxSpeedMph),
  [drive.durationMinutes, drive.avgSpeedMph, drive.maxSpeedMph]
);
```

### Avoiding Unnecessary Re-renders

**Stable callback references.** Event handlers passed to map components (`onSelectVehicle`, `fitToRoute`) should use `useCallback` to prevent the map component from re-rendering when the parent re-renders:

```tsx
const handleSelectVehicle = useCallback((index: number) => {
  setCurrentVehicleIndex(index);
}, []);
```

**WebSocket state updates.** The `useVehicleStream` hook uses `setState` with a function updater to avoid capturing stale closures. The `onMessage` callback is wrapped in `useCallback` with no dependencies, so it does not cause the WebSocket effect to re-run.

**Bottom sheet drag.** During active dragging, the sheet height changes on every touch move event. The `isDragging` flag disables CSS transitions (`transition: none`) to prevent jank. Only the sheet container re-renders during drag; the sheet content should be wrapped in `React.memo` if profiling shows unnecessary re-renders of child components.

### Bundle Size Management

| Concern | Strategy |
|---|---|
| Mapbox GL JS (~800KB) | Dynamic import, `ssr: false` |
| React Hook Form (~25KB) | Only loaded on pages with forms (Invites, Settings, SignIn, SignUp) |
| Date formatting | Use `Intl.DateTimeFormat` (built into the browser, zero bundle cost) instead of libraries like `date-fns` |
| SVG icons | Inline SVGs (as already done in the mock), not icon libraries |
| Fonts | Inter loaded from Google Fonts with `display: swap` and only weights 300, 400, 500, 600 |

### Server Components for Zero-JS Pages

Pages that do not require interactivity (e.g., a static error page, the loading skeleton) should remain Server Components with zero client-side JavaScript. The `app/(main)/layout.tsx` that renders the BottomNav is a Client Component (it needs `usePathname()`), but individual page components should be Server Components that fetch data and pass it to Client Component children.

### Metrics to Track

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint (map load) | < 3s |
| Time to Interactive | < 2.5s |
| Total JS bundle (initial) | < 200KB gzipped (excluding map) |
| WebSocket reconnection time | < 5s (95th percentile) |

---

## Appendix: Migration from UI Mocks to Production

The `ui-mocks/` directory uses Vite + React Router for rapid prototyping. The production app uses Next.js App Router. Key migration changes:

| Mock Pattern | Production Pattern |
|---|---|
| `react-router-dom` (`<Link>`, `useParams`) | `next/link`, `next/navigation` (`useParams`, `useSearchParams`) |
| `import.meta.env.VITE_MAPBOX_TOKEN` | `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` |
| `mockData.ts` (static arrays) | Server actions with Prisma queries |
| Single `Layout.tsx` with `<Outlet>` | Nested `layout.tsx` files in `app/` route groups |
| All client-side rendering | Server Components for data fetching, Client Components for interactivity |
| No authentication | NextAuth.js sessions, `useSession()`, route protection via middleware |

---

## References

- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) -- Official Next.js docs on file conventions
- [Inside the App Router: Best Practices for File Structure (2025)](https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3) -- Community patterns for directory organization
- [Feature-Sliced Design with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs) -- Feature module architecture adapted for Next.js
- [Compound Components Pattern](https://www.patterns.dev/react/compound-pattern/) -- Pattern for related components that share state
- [Advanced React Component Composition](https://frontendmastery.com/posts/advanced-react-component-composition-guide/) -- Composition patterns over inheritance
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025) -- Modern state management without heavy libraries
- [State Management with Next.js App Router](https://www.pronextjs.dev/tutorials/state-management) -- Server state vs client state patterns
- [Testing: Vitest | Next.js](https://nextjs.org/docs/app/guides/testing/vitest) -- Official Vitest integration guide
- [Robust WebSocket Reconnection Strategies](https://dev.to/hexshift/robust-websocket-reconnection-strategies-in-javascript-with-exponential-backoff-40n1) -- Exponential backoff patterns
- [Making Next.js and Mapbox GL JS Get Along](https://medium.com/@timothyde/making-next-js-and-mapbox-gl-js-get-along-a99608667e67) -- SSR avoidance for Mapbox
- [Accessibility Guide for Interactive Web Maps](https://mn.gov/mnit/assets/Accessibility%20Guide%20for%20Interactive%20Web%20Maps_tcm38-403564.pdf) -- Map accessibility best practices
- [Mapbox GL Accessibility Plugin](https://github.com/mapbox/mapbox-gl-accessibility) -- Mapbox's accessibility control
