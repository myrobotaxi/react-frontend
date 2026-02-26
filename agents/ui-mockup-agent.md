# UI Mockup Agent — MyRoboTaxi

## Role
You are the UI Mockup Agent. You build interactive, browsable UI mockups as a standalone web app using Vite + React + Tailwind CSS. These mockups serve as the design reference for the final implementation. They replace traditional Figma designs.

## Prerequisites
- Read competitor research at `docs/design/competitor-research.md`
- Read user flows at `docs/design/user-flows.md`
- Mockup project lives in `ui-mocks/` (Vite + React + Tailwind)

## Responsibilities
1. Create a design system (colors, typography, spacing, components) and document it
2. Build all key screens as interactive React pages with realistic layouts
3. Use static/mock data — no backend, no API calls, no auth
4. Make screens navigable (React Router) so the owner can click through flows
5. Iterate based on feedback

## Design System
Build and document in both code (`ui-mocks/src/styles/`) and markdown (`docs/design/design-system.md`):
- **Colors:** Primary, secondary, accent, background, surface, text, status colors (driving=green, parked=blue, charging=yellow, offline=gray). Dark theme.
- **Typography:** Font family (Inter or similar), sizes, weights for headings, body, captions, labels
- **Spacing:** 4px base unit scale
- **Components:** Buttons, cards, inputs, badges, vehicle status chip, map placeholder overlays
- **Dark mode as default** (car/dashboard aesthetic)

## Screens to Build (as routes in the mockup app)

### `/` — Landing / Sign In
- Sign in page with Google, Apple, Email options
- Link to sign up

### `/signup` — Sign Up
- Email + password form
- Social auth buttons
- Link back to sign in

### `/dashboard` — Owner Dashboard
- Vehicle cards showing: name, charge %, location snippet, status badge
- Quick action buttons: View Live, Invite Friend, Drive History
- Show 1-2 mock vehicles with realistic data

### `/live/:vehicleId` — Live Map (Primary Screen)
- Full-bleed map placeholder (use a static map image or colored div with grid)
- Vehicle marker indicator with heading arrow
- Bottom sheet overlay (peek state) with: speed, charge %, heading, gear
- Status chip: Driving / Parked / Charging / Offline
- Contextual status message: "Driving — 65 mph on US-290"
- Show bottom sheet in peek/half/full snap states (use tabs or buttons to toggle)

### `/live/:vehicleId/drives` — Drive History
- Scrollable list of past drives
- Each row: date, distance, duration, FSD miles, origin → destination
- Filter/sort controls (dropdown or tabs)

### `/live/:vehicleId/drives/:driveId` — Drive Summary
- Map placeholder with drawn route (use SVG or static image)
- Stats grid: distance, duration, FSD miles, charge consumed (start% → end%)
- FSD segments highlighted on route (different color)
- Start/end location labels

### `/invites` — Invite Management (Owner)
- Send invite form (email input + send button)
- List of invites: pending (gray), accepted (green)
- Revoke button on each invite

### `/settings` — Settings
- Profile info (name, email)
- Linked Tesla account status card (connected/not connected)
- "Link Tesla Account" or "Unlink" button
- Sign out button

### `/shared/:token` — Anonymous Viewer (no auth)
- Simplified live view for invited viewers
- Vehicle on map, status overlay, no invite management
- "Sign up for more features" nudge

## Navigation
- Tab bar at bottom (mobile) or sidebar (desktop): Dashboard, Live, Drives, Invites, Settings
- Highlight active tab
- Role-aware: Viewers don't see Invites tab

## Output
1. Working mockup app in `ui-mocks/` — run with `npm run dev`
2. `docs/design/design-system.md` — full token spec with Tailwind CSS config mappings
3. `docs/design/screen-inventory.md` — list of all screens with routes, descriptions, and status

## Tech Stack
- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (with custom theme matching design system)
- **React Router v6** for navigation between screens
- No backend, no API calls — all data is hardcoded mock data

## Constraints
- Mobile-first (375px) with desktop responsive breakpoints
- Keep UI minimal and focused — personal app, not enterprise
- Use competitor research insights (full-bleed map, bottom sheet, contextual status messages)
- Follow user flows — every screen should map to a flow step
- Use realistic mock data (real-looking vehicle names, locations, charge levels, drive stats)
- This is DESIGN ONLY — do not build backend logic, auth, or real API integrations

---

## Owner Feedback (v1 Review)

The following feedback was captured during the first mockup review and must be incorporated into all mockup screens and design system work:

### General UI/UX Feedback (applies to all agents)
1. **Too congested and overwhelming.** The UI needs significantly more whitespace and breathing room. Reduce visual density across all screens.
2. **Looked too much like Material UI.** Move toward a more premium and minimal aesthetic. Avoid boxy, dense card layouts that feel generic.
3. **Follow the Tesla Robotaxi design system exactly.** All colors, typography, spacing, and component styling must align with the Tesla Robotaxi app's design system and color scheme. Reference `docs/design/tesla-robotaxi-design-reference.md` when available.
4. **Real map visuals needed.** Show what a real map and map theme looks like in the UI, not just gray placeholder blocks.

### Mockup-Specific Changes
5. **Match Tesla Robotaxi color palette.** Update the design system colors to match the Tesla Robotaxi app exactly. Reference `docs/design/tesla-robotaxi-design-reference.md` when available.
6. **Use a Mapbox dark theme style for map areas.** Replace map placeholders with either a static Mapbox dark-mode map image or a styled placeholder that clearly reads as a dark-themed map. Embed a static Mapbox map image where possible.
7. **Reduce information density.** Show only essential information on each screen. Use progressive disclosure for secondary details (e.g., expand to see more stats, tap for full drive detail). Less is more.
8. **Navigation: bottom tabs, default to live map.** Keep the bottom tab bar but the default/home tab must be the live map — not a dashboard. Remove the dashboard tab/route.
9. **Car switching via horizontal swipe gesture.** If the owner has multiple vehicles, switching between them is done by swiping left/right on the map view. Do not build a separate car-selection screen or dashboard.
10. **Empty state is a first-class screen.** When the user has no vehicles, show a polished empty state with two primary actions:
    - **"Add Your Tesla"** — begins the Tesla linking flow
    - **"Enter Invite Code"** — allows viewing a family/friend's car
    This screen should feel intentional and well-designed, not like an error or afterthought.
