# Tesla Robotaxi App -- Design System & Visual Language Reference

> Research compiled February 2026. Based on the Tesla Robotaxi iOS app (launched June 2025, public release September 2025) and in-vehicle Robotaxi UI. Service areas: Austin, TX (unsupervised) and SF Bay Area (supervised).

---

## 1. Color Scheme

### Primary Brand Colors

Tesla's Robotaxi program has established **gold/champagne** as its signature identity color, distinct from the standard Tesla red (#E82127) brand. The gold is inspired by the Cybercab's physical body color, which Tesla Design Chief Franz von Holzhausen described as "a future version of the idea of a New York City yellow cab."

#### App Color Palette (Estimated from Screenshots and Descriptions)

| Role | Color Description | Estimated Hex | Notes |
|------|------------------|---------------|-------|
| **Primary Accent (Gold)** | Champagne / Metallic Gold | `#D4AF37` to `#C9A84C` | The signature Robotaxi/Cybercab gold. Used on login page, route lines, vehicle glow, and throughout the app as the primary accent. |
| **Secondary Gold (Lighter)** | Brushed Gold / Light Champagne | `#CCBA78` to `#D4C88A` | Used for lighter gold elements, hover states, and secondary highlights. |
| **Background (Dark Mode)** | Near-Black / Very Dark Gray | `#0A0A0A` to `#1A1A1A` | Tesla's dark theme uses very deep blacks, consistent with their vehicle UI. Not pure `#000000` -- slightly warmer. |
| **Background (Light Mode)** | White / Off-White | `#FFFFFF` to `#F5F5F5` | Clean white background. The app supports both light and dark modes. |
| **Surface / Card (Dark)** | Dark Gray | `#1E1E1E` to `#2A2A2A` | Card and panel backgrounds in dark mode. |
| **Surface / Card (Light)** | White | `#FFFFFF` | Card surfaces in light mode. |
| **Text Primary** | White (dark mode) / Black (light mode) | `#FFFFFF` / `#000000` | High contrast text. |
| **Text Secondary** | Medium Gray | `#8E8E93` to `#A0A0A0` | Subtitles, labels, secondary information. |
| **Map Geofence** | Semi-transparent Gold/Amber | `#D4AF37` at ~20% opacity | The service area boundary shown on the map. |
| **Route Line (In-Vehicle)** | Gold / Amber | `#D4AF37` to `#C9A84C` | Replaces the standard blue FSD path with gold for Robotaxi mode. |
| **Standard Blue (Legacy)** | Tesla Blue | `#148CE8` | Used in the standard Tesla app, NOT the Robotaxi app. Included for contrast. |
| **Status - Active/Success** | Green | `#30D158` (est.) | For active ride status, confirmations. |
| **Status - Warning** | Amber/Yellow | `#FFD60A` (est.) | Wait times, warnings. |
| **Status - Error** | Red | `#FF3B30` (est.) | Cancellations, errors, alerts. |

#### Gold Underglow Animation (In-Vehicle Display)

The in-vehicle visualization features a **dynamic gold underglow effect** beneath the Robotaxi vehicle rendering:
- **When stopped**: Full gold illumination beneath the vehicle
- **When accelerating**: Gold glow gradually fades and contracts
- **Route path ("noodle")**: The driving path tentacle is rendered in gold instead of the standard blue, extending ahead of the vehicle

This is a key differentiator from the standard FSD visualization and reinforces the Robotaxi brand identity.

### Theme Modes

- **Light Mode**: White backgrounds, dark text, gold accents
- **Dark Mode**: Near-black backgrounds, white text, gold accents
- **System Auto**: The app adapts to the iOS system setting (light/dark), though the toggle in the app itself offers explicit Light/Dark options without an "Auto" setting
- The standard Tesla owner app uses dark-only; the Robotaxi app supports both

---

## 2. Typography

### Font Family: Universal Sans Display

Tesla has standardized on **Universal Sans Display** across all digital platforms -- website, mobile app, and in-vehicle software. This replaced the previously used **Gotham** font.

#### About Universal Sans

- **Type**: Variable sans-serif typeface by Family Type
- **Characteristics**: Geometric, clean, modern. Sits between grotesque and geometric sans-serif styles
- **Customizability**: Variable font with adjustable weight, width, x-height, proportions, terminals, and ink traps
- **Style**: Clean, minimal, highly legible at all sizes -- fits Tesla's engineering-forward aesthetic

#### Closest Web-Safe / System Alternatives

For development purposes when Universal Sans is unavailable:
- **Primary Fallback**: `SF Pro Display` / `SF Pro Text` (Apple system font -- already used on iOS)
- **Web Fallback**: `Inter` (closest open-source match for geometric sans-serif)
- **Generic Fallback**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

#### Estimated Typography Scale

| Element | Weight | Size (est.) | Line Height | Use |
|---------|--------|-------------|-------------|-----|
| **Hero / Price** | Bold (700) | 34-40px | 1.1 | Ride fare display ("$4.20"), large numbers |
| **Screen Title** | Semibold (600) | 28-32px | 1.2 | "Where to?", screen headers |
| **Section Header** | Semibold (600) | 20-22px | 1.3 | Card titles, section labels |
| **Body / Primary** | Regular (400) | 16-17px | 1.4 | Standard body text, descriptions |
| **Body Small** | Regular (400) | 14-15px | 1.4 | Secondary info, timestamps, details |
| **Caption / Label** | Medium (500) | 12-13px | 1.3 | Labels, badges, small metadata |
| **Button Text** | Semibold (600) | 16-17px | 1.0 | CTA buttons, action labels |
| **Tab Bar** | Medium (500) | 10-11px | 1.0 | Bottom navigation labels |

---

## 3. Map Style

### App Map (Mobile)

The Tesla Robotaxi app map appears to use a customized **Google Maps** base layer (Tesla leverages Google APIs for mapping and 3D building data):

#### Dark Mode Map
- **Background**: Very dark gray/charcoal (`~#1C1C1E`)
- **Roads**: Slightly lighter gray (`~#3A3A3C`) for local streets, lighter still for major roads (`~#4A4A4E`)
- **Highway/Freeways**: Subtly highlighted, slightly brighter
- **Water**: Dark navy/teal (`~#0A1929`)
- **Parks/Green Space**: Very dark muted green (`~#1A2E1A`)
- **Buildings**: Slightly raised dark shapes, minimal contrast
- **Labels**: Light gray text, minimal -- clean and uncluttered
- Overall feel: **subdued, low-contrast, premium dark aesthetic**

#### Light Mode Map
- Likely a standard light map style with muted colors
- White/light gray roads on cream/off-white background
- Standard Google Maps aesthetic with reduced visual noise

#### Map Overlays
- **Geofence Boundary**: The service area is shown as a semi-transparent tinted overlay on the map. The boundary clearly delineates where Robotaxi service is available
- **Pickup Pin**: Custom pin marker at pickup location
- **Destination Pin**: Custom marker at destination
- **Vehicle Marker**: A colored vehicle icon that matches the actual vehicle's paint color (e.g., white Model Y shown as a white car icon), with real-time position updates
- **Route Line**: Drawn between pickup and destination once a ride is confirmed
- **Walking Directions**: Pedestrian route shown from user's current location to the pickup point
- **Vehicle Finder Arrow**: A directional arrow overlay guiding the user toward the approaching/parked Robotaxi -- especially useful in crowded areas

#### 3D Features (In-Vehicle Display)
- 3D terrain with road elevation
- 3D building rendering near the vehicle
- Gold-colored route path ("noodle") extending ahead
- Real-time visualization of surrounding traffic, pedestrians, and cyclists
- Gold underglow effect beneath the vehicle that reacts to speed

---

## 4. UI Components

### Login / Sign-In Screen
- Header image featuring a Tesla Model Y Robotaxi
- Gold/champagne color theme evident from the splash
- Standard sign-in fields (Tesla account credentials)
- Option to create a new account
- Tesla auto-pulls profile photo and payment info from existing accounts

### Search / Destination Input
- **Search Bar**: Positioned below the map, prominent placement
- "Where to?" prompt (or similar)
- Quick-filter pills/chips for categories: "Food", "Shopping", etc.
- Previously searched destinations shown below the search bar
- **Wait time displayed immediately** before any destination is entered (e.g., "~16 min wait")
- **Flat fare displayed** before destination selection (currently $4.20)
- Smart suggestions for nearby places (cafes, restaurants, parks, shopping centers)
- Venue status indicators (open/closed)

### Ride Confirmation Card
- Estimated fare prominently displayed
- ETA for vehicle arrival
- Confirm/Book ride button (gold accent)
- Route preview on map

### Vehicle Tracking / Waiting Screen
- Real-time map with vehicle position updating live
- Vehicle visualization matching the actual car color
- License plate number displayed (for vehicle identification)
- ETA countdown
- Cancel button
- Report issue option
- **iOS Live Activity**: Auto-updating Lock Screen and Dynamic Island widget showing vehicle location and ETA without opening the app

### Vehicle Arrival Screen
- Vehicle controls appear:
  - Horn (honk to locate)
  - Flash lights
  - Lock/Unlock
  - Open trunk
- License plate confirmation prompt
- "Start Ride" button

### Active Ride Screen (In-App)
- Route progress visualization
- ETA to destination
- Vehicle controls:
  - Temperature adjustment
  - Music/media controls
  - Volume
- Pull Over button
- Support button (connects to Tesla remote operations center)

### Ride Complete Screen
- "Finish Ride" prompt
- Exit instructions
- Trunk access button
- Support contact
- **Ride rating** interface
- **Tipping option** (currently shows tipping as not accepted -- with a humorous note)
- Route summary with:
  - Pickup time
  - Arrival time at destination
  - Distance traveled
  - Fee charged

### Ride History Screen
- List of previous rides
- Tap into any ride for detailed view:
  - Map showing the route taken
  - Pickup time, arrival time
  - Distance
  - Fee

### Settings / Profile
- Data Sharing preferences
- Ride History access
- Support section
- Appearance toggle (Light / Dark mode)
- Profile information (pulled from Tesla account)

### Buttons
- **Primary CTA**: Large, prominent, likely gold/champagne-filled with white text. Full-width or near-full-width. Rounded corners (estimated `12-16px` radius)
- **Pull Over (In-Vehicle)**: Massive button anchored to bottom-left corner of touchscreen. Likely red or safety-colored for urgency
- **Support (In-Vehicle)**: Massive button anchored to bottom-right corner of touchscreen
- **Secondary Actions**: Outlined or text-only buttons
- **Icon Buttons**: Circular or rounded-square for vehicle controls (horn, lights, lock, trunk)
- Touch targets follow iOS 44pt minimum, likely larger given ride-hailing context

### Status Indicators
- Wait time badge (shown before booking)
- ETA countdown (during vehicle approach)
- Ride progress bar or route visualization (during ride)
- Vehicle status (approaching, arrived, in transit, completing)

---

## 5. Layout Patterns

### Overall Design Philosophy
- **Minimalist**: Extremely clean, uncluttered interface
- **Familiar**: Intentionally similar to existing ride-hailing apps (Uber, Lyft) so users feel immediately comfortable
- **Map-Centric**: Map dominates the screen; UI cards/panels overlay from the bottom
- **Progressive Disclosure**: Information revealed step by step through the ride flow
- **Premium Feel**: Generous whitespace, restrained use of color, gold accent used sparingly for impact

### Screen Structure

```
+---------------------------+
|     Status Bar            |
+---------------------------+
|                           |
|                           |
|      MAP AREA             |
|   (60-70% of screen)     |
|                           |
|                           |
+---------------------------+
|   Bottom Sheet / Card     |
|   - Search bar            |
|   - Quick filters         |
|   - Recent destinations   |
|   - Ride info             |
+---------------------------+
```

### Bottom Sheet Pattern
- Standard iOS-style bottom sheet that overlays the map
- Can be expanded/collapsed
- Contains all interaction elements (search, booking, ride controls)
- Rounded top corners (estimated `16-20px` radius)
- Background: White (light mode) or dark gray (dark mode)

### Information Density
- **Low to Medium**: Tesla favors spacious layouts with clear hierarchy
- Generous padding within cards (estimated `16-20px`)
- Clear separation between elements
- One primary action visible at a time
- Secondary options accessible but not competing for attention

### Spacing System
- Likely based on an **8px grid** (standard for iOS/modern apps)
- Common spacing values: `8px`, `16px`, `24px`, `32px`
- Card padding: ~`16-20px`
- Element spacing within cards: ~`8-12px`
- Section spacing: ~`24-32px`

### Navigation
- No visible bottom tab bar on the main ride screen -- the map and bottom sheet dominate
- Menu/profile likely accessed via a hamburger or avatar icon
- Back navigation for sub-screens
- Minimal chrome -- the focus is always on the ride experience

---

## 6. Screenshot Descriptions

Based on detailed reporting from multiple sources, here are descriptions of the key screens:

### Screenshot 1: Login / Splash Screen
A sign-in page featuring a **Tesla Model Y Robotaxi as the hero/header image**. The page is bathed in the **golden/champagne Cybercab color theme**. Sign-in fields for Tesla account credentials are present, along with options to create a new account. The gold hue is immediately apparent, setting the tone for the entire app experience.

### Screenshot 2: Home / Map Screen
After login, the user sees a **full-screen map** of their current location. The **Robotaxi geofence** (service area boundary) is visible as a shaded overlay. Below the map is a **search/destination bar** with category filter pills (Food, Shopping, etc.). The **current wait time** for a Robotaxi at the user's location is displayed proactively, along with the **flat fare** ($4.20). Previously searched destinations appear below the search bar for quick re-booking.

### Screenshot 3: Vehicle Tracking Screen
After booking, the map shows the **Robotaxi's real-time position** moving toward the pickup point. The vehicle is rendered as a **colored icon matching the actual car's paint color** (e.g., a white Model Y is shown as a white car). The **ETA** is prominently displayed, along with the vehicle's **license plate number**. Options to **cancel** or **report an issue** are available.

### Screenshot 4: Vehicle Arrival / Controls Screen
When the Robotaxi arrives, the screen transitions to show **vehicle control buttons**: horn, flash lights, lock/unlock, and open trunk. The **license plate** is shown for confirmation. A prominent **"Start Ride"** button appears for the passenger to begin the trip.

### Screenshot 5: Active Ride Screen (In-App)
During the ride, the app shows **route progress** on the map with an **ETA to destination**. Controls for **temperature**, **music/media**, and **volume** are accessible. Two key action buttons are present: **Pull Over** and **Support**.

### Screenshot 6: In-Vehicle Display (Robotaxi Mode)
The 15.4-inch center touchscreen shows a **completely redesigned layout**:
- **Top-left corner**: Miniaturized speedometer, gear selector, and turn signal indicators (shrunk from the standard full-panel display)
- **Center**: Full-screen driving visualization with **3D buildings**, surrounding traffic, pedestrians, and cyclists
- **Route path**: Rendered as a **gold-colored "noodle"** (replacing the standard blue FSD path) extending ahead of the vehicle
- **Gold underglow**: A golden glow effect beneath the vehicle that **expands when stopped** and **contracts as speed increases**
- **Bottom dock**: Revamped with app icons (Apple Music, Tesla Arcade, Spotify, All Apps), media controls, and buttons
- **Bottom-left**: Large **"Pull Over"** button
- **Bottom-right**: Large **"Support"** button

### Screenshot 7: Ride Complete / Rating Screen
After arriving at the destination, a **"Finish Ride"** prompt appears. Instructions for exiting the vehicle are shown. A **ride rating** interface allows the passenger to rate the experience. A **tipping option** is present (currently not accepted). The ride summary shows pickup time, arrival time, distance, and fee.

### Screenshot 8: Ride History Detail
Tapping into a past ride shows a **map with the route** the Robotaxi took, along with detailed metadata: pickup time, destination arrival time, distance traveled, and fee charged.

### Screenshot 9: Outside Service Area View
When the app is opened **outside the geofenced service area**, the map is replaced with **informational tiles** about the Robotaxi service, letting users learn about the service even if they cannot currently book a ride.

---

## 7. Animations & Motion

### In-Vehicle Visualization
- **Gold underglow pulse**: The gold glow beneath the vehicle dynamically responds to speed -- fully illuminated when stationary, gradually fading as the vehicle accelerates
- **Route path extension**: The gold "noodle" (path plan visualization) extends and contracts fluidly as the vehicle moves
- **3D environment**: Smooth real-time rendering of surrounding traffic, pedestrians, cyclists, and 3D buildings

### App Animations
- **Vehicle tracking**: Smooth, real-time position updates as the Robotaxi approaches the pickup location
- **Live Activity**: iOS Lock Screen and Dynamic Island provide auto-updating ride status without opening the app
- **Bottom sheet transitions**: Standard iOS spring animations for expanding/collapsing the bottom panel
- **Screen transitions**: Clean, minimal transitions between ride states (searching, waiting, in-ride, completed)
- **Map animations**: Smooth pan/zoom as the map follows the vehicle or adjusts to show the route

### Interaction Feedback
- Standard iOS haptic feedback on button presses (assumed)
- Smooth state transitions between ride phases
- No reported flashy or excessive animations -- everything serves function over form

---

## 8. Key Design Principles Observed

1. **Gold is the brand**: The Cybercab champagne/gold is THE differentiating visual element. It appears in the app theme, route visualization, underglow effects, and overall aesthetic. It signals "this is Robotaxi, not regular Tesla."

2. **Familiar but elevated**: The ride-hailing flow mirrors Uber/Lyft patterns intentionally. Tesla does not try to reinvent the interaction model -- they elevate it with premium visual treatment.

3. **Map-first, action-second**: The map dominates the experience. All controls live in an overlay bottom sheet. The map is the hero.

4. **Progressive disclosure**: Information is revealed as needed through the ride journey. The app starts minimal (just a search bar and wait time) and progressively shows more detail as the ride progresses.

5. **Safety-forward in-vehicle UI**: The two massive Pull Over and Support buttons are always visible and accessible, prioritizing rider safety in an autonomous vehicle.

6. **Restrained color use**: Gold accent is used sparingly against neutral backgrounds (black/white/gray). This creates a luxury/premium feel rather than a colorful consumer app.

7. **Proactive information**: Wait times and fares are shown BEFORE the user even selects a destination, reducing friction and setting expectations immediately.

8. **Vehicle identity**: The app shows the actual vehicle color and license plate, creating a tangible connection between the digital and physical experience.

---

## 9. Design Specifications Summary (For Implementation)

### CSS/Tailwind Quick Reference

```
/* Colors */
--color-gold-primary: #C9A84C;          /* Primary Cybercab gold */
--color-gold-light: #D4C88A;            /* Lighter gold for highlights */
--color-gold-dark: #A0862E;             /* Darker gold for pressed states */
--color-bg-dark: #0A0A0A;              /* Dark mode background */
--color-surface-dark: #1A1A1A;          /* Dark mode card/surface */
--color-surface-elevated-dark: #2A2A2A; /* Dark mode elevated surface */
--color-bg-light: #FFFFFF;              /* Light mode background */
--color-text-primary-dark: #FFFFFF;     /* White text on dark */
--color-text-primary-light: #000000;    /* Black text on light */
--color-text-secondary: #8E8E93;        /* Secondary/muted text */
--color-map-dark-bg: #1C1C1E;          /* Dark map background */

/* Typography */
--font-family: "Universal Sans Display", "SF Pro Display", "Inter", system-ui, sans-serif;

/* Spacing (8px grid) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;

/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;

/* Shadows (minimal -- Tesla style) */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.15);
```

### Component Patterns

```
/* Bottom Sheet */
border-radius: var(--radius-xl) var(--radius-xl) 0 0;
padding: var(--space-5);
background: var(--color-surface-dark); /* or light equivalent */

/* Primary Button (Gold CTA) */
background: var(--color-gold-primary);
color: #000000;
border-radius: var(--radius-md);
padding: var(--space-4) var(--space-6);
font-weight: 600;
font-size: 17px;

/* Card */
background: var(--color-surface-dark);
border-radius: var(--radius-lg);
padding: var(--space-4);

/* Search Input */
background: var(--color-surface-elevated-dark);
border-radius: var(--radius-full);
padding: var(--space-3) var(--space-4);
font-size: 16px;
```

---

## 10. Sources

- [First Look at Tesla's Robotaxi App and Its Features (Not a Tesla App)](https://www.notateslaapp.com/news/2853/first-look-at-teslas-robotaxi-app-and-its-features-photos)
- [First Look at Tesla's Robotaxi App: features, design, and more (Teslarati)](https://www.teslarati.com/first-look-at-teslas-robotaxi-app-features-design-and-more/)
- [A Look at Tesla's Robotaxi UI (Not a Tesla App)](https://www.notateslaapp.com/news/3528/a-look-at-teslas-robotaxi-ui-and-what-happens-if-you-touch-the-steering-wheel)
- [Tesla Robotaxis Get Updated Gold Visuals That React to Speed (TeslaNorth)](https://teslanorth.com/2025/10/20/tesla-robotaxis-get-updated-gold-visuals-that-react-to-speed/)
- [Tesla Robotaxis Get Gold Route Visuals in Update (TeslaNorth)](https://teslanorth.com/2025/10/05/tesla-robotaxis-get-gold-route-visuals-in-update-is-this-unsupervised-fsd/)
- [Tesla Reveals Design Inspiration Behind Cybercab's Gold Color (Teslarati)](https://www.teslarati.com/tesla-design-inspiration-cybercab-gold/)
- [Inside Tesla's Robotaxi App: Features, Design, and First Impressions (iLoveTesla)](https://ilovetesla.com/inside-teslas-robotaxi-app-features-design-and-first-impressions/)
- [Tesla Brand Color Palette (Mobbin)](https://mobbin.com/colors/brand/tesla)
- [Tesla Robotaxi App - App Store](https://apps.apple.com/us/app/tesla-robotaxi/id6744257048)
- [Tesla Updates Robotaxi App: Walking Directions (Not a Tesla App)](https://www.notateslaapp.com/news/2912/tesla-updates-robotaxi-app-again-walking-directions-destination-editing-and-more)
- [Tesla Updates Robotaxi App: Smarter Pickups (Shop4Tesla)](https://www.shop4tesla.com/en/blogs/news/tesla-robotaxi-app-update-smarter-pickups-pfeil)
- [Get Started With Robotaxi (Tesla Support)](https://www.tesla.com/support/robotaxi/getting-started)
- [How to Use Robotaxi (Tesla Support)](https://www.tesla.com/support/robotaxi/how-to-use)
- [Tesla Updated Font: Gotham to Universal Sans Display (X/@dkrasniy)](https://x.com/dkrasniy/status/1798934572866166816)
- [Universal Sans (Official Site)](https://universalsans.com/)
- [Tesla Robotaxi First Ride Experience (A Girls Guide to Cars)](https://agirlsguidetocars.com/tesla-robotaxi-first-ride)
- [Tesla Launches Unsupervised Robotaxi Rides in Austin (Not a Tesla App)](https://www.notateslaapp.com/news/3527/tesla-launches-unsupervised-robotaxi-rides-in-austin)
