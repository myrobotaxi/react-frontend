# MyRoboTaxi Design System (v2)

This document defines the design tokens, typography, spacing, and component patterns for the MyRoboTaxi UI. The system is built on Tailwind CSS v4 with custom tokens defined in `ui-mocks/src/index.css` via the `@theme` directive.

The design language is modeled after the Tesla Robotaxi app: near-black backgrounds, champagne/metallic gold accent, minimalist layout, generous whitespace, and a premium feel inspired by Apple and Tesla aesthetics.

---

## Color Tokens

### Backgrounds

| Token | CSS Variable | Value | Tailwind Class | Usage |
|---|---|---|---|---|
| Background Primary | `--color-bg-primary` | `#0A0A0A` | `bg-bg-primary` | Page backgrounds, app shell |
| Background Secondary | `--color-bg-secondary` | `#111111` | `bg-bg-secondary` | Bottom sheet, bottom nav backdrop |
| Background Surface | `--color-bg-surface` | `#1A1A1A` | `bg-bg-surface` | Cards, input fields |
| Background Surface Hover | `--color-bg-surface-hover` | `#222222` | `bg-bg-surface-hover` | Hover state for surface elements |
| Background Elevated | `--color-bg-elevated` | `#2A2A2A` | `bg-bg-elevated` | Toggle tracks (off), scrollbar thumb |

### Text

| Token | CSS Variable | Value | Tailwind Class | Usage |
|---|---|---|---|---|
| Text Primary | `--color-text-primary` | `#FFFFFF` | `text-text-primary` | Headings, primary content |
| Text Secondary | `--color-text-secondary` | `#A0A0A0` | `text-text-secondary` | Supporting text, descriptions |
| Text Muted | `--color-text-muted` | `#6B6B6B` | `text-text-muted` | Labels, timestamps, placeholders |

### Brand -- Cybercab Gold

| Token | CSS Variable | Value | Tailwind Class | Usage |
|---|---|---|---|---|
| Gold | `--color-gold` | `#C9A84C` | `text-gold`, `bg-gold` | Primary accent: CTAs, active nav, route lines, vehicle marker |
| Gold Light | `--color-gold-light` | `#D4C88A` | `bg-gold-light` | Hover state for gold buttons |
| Gold Dark | `--color-gold-dark` | `#A0862E` | `bg-gold-dark` | Pressed state |

### Status Colors

| Status | CSS Variable | Value | Tailwind Class | When Used |
|---|---|---|---|---|
| Driving | `--color-status-driving` | `#30D158` | `bg-status-driving` | Vehicle is in motion |
| Parked | `--color-status-parked` | `#3B82F6` | `bg-status-parked` | Vehicle is stationary |
| Charging | `--color-status-charging` | `#FFD60A` | `bg-status-charging` | Vehicle is plugged in |
| Offline | `--color-status-offline` | `#6B6B6B` | `bg-status-offline` | Vehicle is unreachable |

### Battery Colors

| Level | CSS Variable | Value | Range |
|---|---|---|---|
| High | `--color-battery-high` | `#30D158` | > 50% |
| Mid | `--color-battery-mid` | `#FFD60A` | 20% -- 50% |
| Low | `--color-battery-low` | `#FF3B30` | < 20% |

### Borders

| Token | CSS Variable | Value | Usage |
|---|---|---|---|
| Border Default | `--color-border-default` | `#1F1F1F` | Card borders, inputs, subtle dividers |
| Border Subtle | `--color-border-subtle` | `#181818` | Inner dividers within sections |

---

## Typography

### Font Family

**Inter** is used as the primary font (closest open-source equivalent to Tesla's Universal Sans Display). Loaded from Google Fonts with weights 300, 400, 500, 600, 700.

```
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Type Scale

| Element | Size | Weight | Tailwind Classes | Usage |
|---|---|---|---|---|
| Screen Title | 24px | Semibold (600) | `text-2xl font-semibold tracking-tight` | Page headings |
| Section Title | 18px | Semibold (600) | `text-lg font-semibold` | Vehicle name, card headings |
| Body | 14-15px | Light-Regular (300-400) | `text-sm font-light` | Descriptions, addresses, status |
| Label | 12px | Medium (500) | `text-xs font-medium uppercase tracking-wider` | Section labels, stat headers |
| Micro | 10px | Medium (500) | `text-[10px] font-medium` | Tab labels, permission badges |
| Hero Number | 36-40px | Light (300) | `text-4xl font-light tabular-nums` | Speed display |

### Key Principles

- **Large, confident headings** with tight tracking (`tracking-tight`)
- **Light weights for body text** (`font-light`) -- creates the spacious, premium feel
- **Uppercase tracking for labels** (`uppercase tracking-wider`) -- small section headers
- **Tabular numbers** for all numeric values that update (`tabular-nums`)

---

## Spacing

The spacing system uses Tailwind's default 4px base. The design is deliberately spacious with generous padding.

| Scale | Value | Common Usage |
|---|---|---|
| `1` | 4px | Micro gaps |
| `2` | 8px | Small internal gaps |
| `3` | 12px | Small padding |
| `4` | 16px | Standard padding |
| `5` | 20px | Card padding |
| `6` | 24px | Page horizontal padding (`px-6`) |
| `8` | 32px | Section vertical spacing |
| `10` | 40px | Large section gaps |
| `12` | 48px | Between major sections |
| `16` | 64px | Top safe area (`pt-16`) |
| `28` | 112px | Bottom padding for nav (`pb-28`) |

### Layout Constants

| Element | Value | Notes |
|---|---|---|
| Page horizontal padding | 24px (`px-6`) | Consistent across all screens |
| Card border radius | 16px (`rounded-2xl`) | All surface cards |
| Input / button radius | 12px (`rounded-xl`) | All form inputs, buttons |
| Bottom sheet radius | 24px (`rounded-t-[24px]`) | Top corners of bottom sheet |
| Bottom nav safe area | `env(safe-area-inset-bottom)` | For notched devices |

---

## Components

### StatusBadge

Minimal status indicator: a colored dot + status label text.

```tsx
<StatusBadge status="driving" />
```

Renders a 2px dot and the status label, both colored to match the vehicle state. No background fill -- just clean text.

### BatteryBar

Thin horizontal progress bar showing charge level.

```tsx
<BatteryBar level={78} />
```

- 1px height, rounded full
- Color: green > 50%, yellow 20-50%, red < 20%
- Optional percentage label

### MapPlaceholder

Full-bleed interactive Mapbox GL JS map with gold vehicle marker and two-tone route rendering.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | `''` | CSS classes for the wrapper div |
| `showVehicleMarker` | `boolean` | `true` | Show the gold vehicle marker on the map |
| `showRoute` | `boolean` | `false` | Render the route line and start/end markers |
| `routeCoordinates` | `[number, number][]` | `undefined` | Array of `[lng, lat]` points defining the route |
| `vehiclePosition` | `[number, number]` | `undefined` | Current vehicle `[lng, lat]` for route splitting |
| `heading` | `number` | `0` | Vehicle heading in degrees (rotates the marker arrow) |
| `center` | `[number, number]` | `[-97.7431, 30.2672]` | Map center `[lng, lat]` |
| `zoom` | `number` | `12` | Initial map zoom level |
| `children` | `React.ReactNode` | `undefined` | Overlay elements (compass labels, vehicle dots, etc.) |
| `interactive` | `boolean` | `true` | Allow map pan/zoom gestures |

```tsx
<MapPlaceholder
  showVehicleMarker={true}
  showRoute={isDriving}
  routeCoordinates={currentRoutePoints}
  vehiclePosition={isDriving ? [vehicle.longitude, vehicle.latitude] : undefined}
  heading={vehicle.heading}
  center={[vehicle.longitude, vehicle.latitude]}
  zoom={12}
  className="absolute inset-0"
/>
```

- **Vehicle marker:** Gold circle (`#C9A84C`) with heading arrow SVG + animated pulse div. The SVG rotates to match the `heading` prop. The pulse is a `goldPulse` keyframe animation injected at map creation time.
- **Route rendering:** Uses the `splitRoute()` helper function to divide the route at the vehicle's current position into completed and remaining segments:
  - `route-completed` layer: dim gold (`#C9A84C` at 0.3 opacity) -- already-traveled portion
  - `route-remaining` layer: bright gold (`#C9A84C` at 0.9 opacity) -- ahead portion
  - Both are GeoJSON LineString sources with `line-join: round` and `line-cap: round`, width 4px
- **Route markers:** Green start marker (`#30D158`) and gold end marker (`#C9A84C`), both 10px circles with white border and glow shadow
- **Auto-fit bounds:** On route render, the map calls `fitBounds()` with padding `{ top: 80, bottom: 300, left: 60, right: 60 }` and `maxZoom: 15`
- **Fit-to-route button:** When a route is active, a floating button (bottom-right) re-fits the map to the route bounds

### Trip Progress Bar

Robinhood-style glowing progress bar used in the driving peek state of the bottom sheet. Rendered inline in `Home.tsx` (not a standalone component file).

```
[ ===gold filled===*----track---◆------- ]
  Origin            Stop        Destination
```

- **Track:** `h-1.5 bg-bg-elevated rounded-full` (the unfilled background)
- **Filled portion:** Absolute-positioned gold bar (`#C9A84C`) with a glowing box-shadow: `0 0 8px rgba(201,168,76,0.6), 0 0 20px rgba(201,168,76,0.3)`. Width is `tripProgress * 100%`.
- **Pulsing leading-edge dot:** 8px gold circle at the right edge of the filled bar, using the `animate-gold-glow` animation class (`goldGlow` keyframes). Creates a breathing glow effect at the current position.
- **Diamond stop markers:** Unicode diamond `◆` (`&#9670;`) positioned along the track at evenly-distributed stop positions. Styled as `text-[8px] text-text-muted`.
- **Labels below:** Origin label (left-aligned) and destination label (right-aligned) in `text-[10px] text-text-muted font-light`. Stop names are absolutely positioned below their corresponding diamond markers.

### BottomNav

Fixed bottom tab navigation with 4 tabs.

| Tab | Icon | Route |
|---|---|---|
| Map | Home | `/home` |
| Drives | Clock | `/drives` |
| Share | People | `/invites` |
| Settings | Gear | `/settings` |

- **Active state:** Gold (`text-gold`)
- **Inactive state:** Muted gray (`text-text-muted`)
- **Backdrop:** Heavy blur (`backdrop-blur-2xl`) over 90% primary background
- **Hidden on:** Sign In, Sign Up, Empty State, Shared Viewer routes

### Bottom Sheet (Home / Live Map)

Overlay panel with two snap states, using touch-drag with snap logic. The sheet computes a midpoint between peek and half heights; on touch end, if the dragged height exceeds the midpoint, it snaps to half, otherwise to peek.

| State | Height | Description |
|---|---|---|
| Peek | 260px | Compact summary, always visible |
| Half | 50vh (`window.innerHeight * 0.5`) | Extended details, scrollable |

Content varies depending on whether the vehicle is **driving** or **non-driving** (parked/charging/offline):

**Driving -- Peek state:**
1. Vehicle name + `StatusBadge` + "Heading to {destination}" in gold
2. Trip Progress Bar (glowing gold bar with stop diamonds, origin/destination labels)
3. Key stats row: ETA (minutes), Speed (mph), Battery (%) -- separated by vertical dividers

**Driving -- Half state (additional content below divider):**
- Start location and address
- Destination location and address
- Stops list (with charging bolt icon for charging stops)
- Vehicle details: year, model, color, license plate
- Odometer, FSD miles today
- Interior/exterior temperature
- Last updated timestamp

**Non-driving -- Peek state:**
1. Vehicle name + status message + `StatusBadge`
2. Location name + battery percentage with thin battery bar

**Non-driving -- Half state (additional content below divider):**
- Full location address
- Odometer, FSD miles today, heading
- Vehicle details: year, model, color, license plate
- Interior/exterior temperature
- Estimated range
- Full battery bar with percentage
- Last updated timestamp

Sheet has a drag handle (`w-9 h-1 rounded-full bg-bg-elevated`) and rounded top corners (`rounded-t-[24px]`). Backdrop uses `bg-bg-secondary/95 backdrop-blur-2xl` with a `border-t border-border-default`. Height transition is `0.3s ease-out` (disabled during active drag for smooth tracking).

---

## Map Styling

The map uses a **real interactive Mapbox GL JS** instance (not a static image) with the `dark-v11` style:

```
mapbox://styles/mapbox/dark-v11
```

The Mapbox access token is provided via the `VITE_MAPBOX_TOKEN` environment variable and read using `import.meta.env.VITE_MAPBOX_TOKEN`.

### Tailwind v4 CSS Override Requirements

Tailwind CSS v4's preflight/base layer can override critical Mapbox GL styles (especially `canvas { display: block }` and `* { border: 0 solid }`), causing the map to render as a black/empty rectangle. To prevent this, `index.css` includes `!important` overrides for `.mapboxgl-map`, `.mapboxgl-canvas-container`, and `.mapboxgl-canvas` -- placed **outside** any `@layer` so they always beat Tailwind's layered resets:

```css
.mapboxgl-map { width: 100% !important; height: 100% !important; position: relative !important; }
.mapboxgl-canvas-container { width: 100% !important; height: 100% !important; position: absolute !important; top: 0 !important; left: 0 !important; }
.mapboxgl-canvas { position: absolute !important; top: 0 !important; left: 0 !important; }
```

### Vehicle Marker

The vehicle marker is a custom HTML element with three layers:
1. **Pulse animation div:** 40px gold circle (`rgba(201,168,76,0.2)`) with `goldPulse` keyframe animation (scale 1 to 1.5, opacity 0.2 to 0.4, 2s infinite)
2. **Heading arrow SVG:** 32px viewBox, gold polygon arrow (`points="16,2 12,11 16,8 20,11"`) pointing in the direction of travel, rotated via `transform: rotate({heading}deg)`
3. **Gold circle body:** `<circle cx="16" cy="18" r="8" fill="#C9A84C"/>` with a darker inner circle (`r="4"`, `fill="rgba(10,10,10,0.3)"`)

### Route Layers

Routes are rendered as two GeoJSON LineString sources, split at the vehicle's current position using the `splitRoute()` function:

| Layer ID | Segment | Color | Opacity | Description |
|---|---|---|---|---|
| `route-completed` | Origin to vehicle | `#C9A84C` | 0.3 | Dim gold, already-traveled portion |
| `route-remaining` | Vehicle to destination | `#C9A84C` | 0.9 | Bright gold, upcoming portion |

Both layers use `line-join: round`, `line-cap: round`, `line-width: 4`.

Route endpoint markers: green start (`#30D158`), gold end (`#C9A84C`) -- both 10px circles with white border and glow box-shadow.

---

## Motion and Animation

| Element | Animation | Implementation | Details |
|---|---|---|---|
| Vehicle marker glow | Gold pulse (scale + fade) | `animate-gold-pulse` / `gold-pulse` keyframes | Scale 1 to 1.8, opacity 0.6 to 0, 2s ease-in-out infinite. Used for the map marker's ambient pulse ring. |
| Progress bar pulse dot | Gold glow (scale + opacity) | `animate-gold-glow` / `goldGlow` keyframes | Scale 1 to 1.3 with `translate(50%, -50%)`, opacity 0.8 to 1, 2s ease-in-out infinite. The breathing dot at the leading edge of the trip progress bar. |
| Bottom sheet transitions | Height change | `transition: height 0.3s ease-out` | Inline style; disabled (`transition: none`) during active touch drag for smooth tracking. |
| Content reveal | Fade in + slide up | `animate-fade-in` / `fade-in` keyframes | Opacity 0 to 1, translateY 8px to 0, 0.4s ease-out. Applied to the half-state extended details. |
| Button hover | Color transition | `transition-colors` | |
| Toggle switch | Position | `transition-transform` | |

---

## Dark Theme

The entire app uses a dark theme exclusively, inspired by the Tesla Robotaxi app and in-vehicle UI:

- Background: Near-black (`#0A0A0A`) -- not pure black, slightly warm
- Surfaces: Dark grays (`#1A1A1A` to `#2A2A2A`)
- Text: White primary, medium gray secondary, dark gray muted
- Accent: Gold (`#C9A84C`) used sparingly for maximum impact

Gold appears only on:
- Primary CTA buttons
- Active navigation tab
- Vehicle marker
- Route lines
- FSD stat highlights
- Brand wordmark accent

Everything else is neutral grays on near-black.

---

## Iconography

All icons are inline SVG with:
- 22px canvas for nav icons, 16-20px for inline
- `stroke="currentColor"` with `strokeWidth="1.5"` (active: `2`)
- Round line caps and joins
- No fill by default (outline style)

---

## Accessibility

- Color contrast: White (`#FFFFFF`) on near-black (`#0A0A0A`) exceeds WCAG AAA
- Touch targets: Minimum 44px via generous padding
- Focus states: `focus:border-gold/40` on inputs
- Font smoothing: `-webkit-font-smoothing: antialiased`
- Safe areas: `env(safe-area-inset-bottom)` for notched devices
- Viewport: `maximum-scale=1.0, user-scalable=no` for app-like behavior
