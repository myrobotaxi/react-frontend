# Competitor Research -- MyRoboTaxi

## Executive Summary

This document analyzes the UX patterns of four competing or adjacent products -- Tesla Robotaxi, Uber, Lyft, and Waymo One -- across five focus areas: map interactions, vehicle status cards, ride/drive summaries, onboarding, and sharing/social features. The research is specifically framed to inform design decisions for MyRoboTaxi, a personal web app for Tesla owners to share their car's live status, location, and drive history with friends and family.

### Top Takeaways

1. **Transparency builds trust in autonomous contexts.** Waymo's approach of showing a simplified sensor visualization ("yielding to pedestrians") and Tesla Robotaxi's real-time route progress on both app and in-vehicle screen are gold-standard patterns. MyRoboTaxi should show viewers what the car is doing and why -- not just where it is.
2. **The bottom-sheet-over-map pattern is universal.** Every competitor uses a draggable card/sheet anchored to the bottom of the screen, overlaying a full-bleed map. The card has collapsed and expanded states. This is the expected mental model for ride-tracking interfaces.
3. **Smooth vehicle animation is table stakes.** Uber, Lyft, and both autonomous apps use interpolated marker movement (not jumpy GPS updates). For Mapbox GL JS, this means using `requestAnimationFrame` with linear interpolation between coordinate pairs.
4. **Post-trip summaries are underinvested across the industry.** None of the competitors have made trip summaries a social, shareable artifact. This is an opportunity for MyRoboTaxi to differentiate -- making drive summaries visually rich and easy to share.
5. **Onboarding should be minimal, progressive, and trust-building.** Tesla Robotaxi and Waymo both present educational tips during wait time rather than front-loading tutorials. MyRoboTaxi should request permissions and explain the app's value incrementally.
6. **Sharing features are safety-oriented, not social.** Uber and Lyft's trip sharing is framed as a safety tool ("share your trip with a trusted contact"). MyRoboTaxi has an opportunity to reframe sharing as a fun, social experience -- "watch my car drive itself" -- which is a fundamentally different and novel use case.

---

## App-by-App Analysis

### Tesla Robotaxi

**Overview:** Tesla's Robotaxi app launched June 2025 in Austin as a standalone iOS app (separate from the main Tesla app). It uses a familiar ride-hailing paradigm but is tailored for autonomous vehicles. Available in 29 languages.

#### Visual Design and Branding

- The app uses a Cybercab-inspired golden/amber color theme, visible from the login screen onward.
- The login page features a header image of a Tesla Model Y Robotaxi with golden hues.
- The overall aesthetic is clean and minimal, consistent with Tesla's brand language -- lots of white space, thin typography, and selective use of the gold accent color.

#### Map and Ride Tracking

- After booking, the app shows a **full-screen map** with the Robotaxi's position tracked in real-time.
- The vehicle icon moves along the route toward the pickup location, with an **ETA countdown** displayed prominently.
- During the ride, the app renders **updated ride progress on the map** with route visualization.
- Tesla provides **iOS Live Activities** integration, so users can track vehicle approach from the lock screen without opening the app -- a strong pattern for ambient awareness.
- The map shows the service area boundary, helping users understand where they can be picked up and dropped off.

#### In-Vehicle Display

- The standard Tesla driver UI has been **completely reorganized** for Robotaxi mode. The left third of the screen, normally dedicated to driving information, is repurposed.
- The speedometer, gear selector, and turn signal indicators are **shrunk and tucked into the top-left corner** -- present for reference but visually de-emphasized.
- Two massive buttons anchor the bottom corners: **"Pull Over"** (left) and **"Support"** (right). Early iterations used red "Emergency Stop" and orange "Pull Over" buttons; the production version refined these to be less alarming.
- The center screen shows the **current route and traffic surroundings**, including pedestrians and cyclists -- similar to the standard Tesla visualization but optimized for passenger comprehension.
- A **rear-seat screen** mirrors key information for backseat passengers.
- Software lockout prevents passengers from interfering: touching the steering wheel triggers a red exclamation warning: "Do not touch the steering wheel."

#### Ride Summary / History

- The Ride History section lists all previous rides, organized by **date and destination**.
- Tapping into any ride reveals: the **route the Robotaxi took** (rendered on a map), **pickup time, arrival time, distance, and fee**.
- At ride completion, users are prompted to **rate the experience** and can optionally **tip the car** (a novel UX choice for an autonomous vehicle).
- Users can also **open the trunk** or reach support from the end-of-ride screen.

#### Onboarding

- Download the app, sign in with Tesla Account credentials (or create one).
- Select your region (Austin or San Francisco Bay Area).
- Users are added to a **waitlist** with gradual access grants.
- While waiting for their ride, users see **educational tips**: how to use the Model Y's door handles, vehicle light signals, and smart destination suggestions (cafes, restaurants, parks).
- The "Start Ride" action is available both in the app and on the vehicle's touchscreen -- dual confirmation.

#### Sharing / Social

- Currently **minimal social features**. You can only book rides for yourself.
- Invited guests can bring one additional guest, but only the invitee controls the app.
- No in-app trip sharing with friends/family during the ride (a gap compared to Uber/Lyft).

**Key patterns for MyRoboTaxi:**

- The golden accent color theme and clean aesthetic map well to a "premium autonomous" brand.
- Live Activities on iOS for ambient vehicle tracking without opening the app.
- Educational tips shown during idle/wait time, not as a front-loaded tutorial.
- Ride history organized by date with tappable route maps.

**Anti-patterns to avoid:**

- The lack of trip-sharing features is a clear gap -- MyRoboTaxi's core purpose is sharing.
- The waitlist friction is necessary for Tesla but should be avoided for a personal app.

---

### Uber

**Overview:** Uber is the benchmark for ride-hailing UX, with the most mature and heavily iterated interface. Their Base design system unifies patterns across all Uber products.

#### Map Interactions

- The map is **full-bleed, edge-to-edge**, always visible behind the bottom sheet.
- Vehicle icons on the map use **smooth linear interpolation** for movement -- not raw GPS jumps. The animation system calculates the difference between old and new coordinates and divides movement into incremental steps using `requestAnimationFrame`.
- The **route line uses a black polyline** on the base map, chosen for 123% higher contrast than the previous color. During tracking, a **dual-color polyline** pattern is used: one color for the completed portion, another for the remaining route.
- **Night Mode** uses a subdued color palette tested during actual night drives. Map styles, guidance UI, and route colors all shift to reduce eye strain.
- A **compass/re-center button** near the map lets users snap back to their current location after panning.
- The map **auto-zooms** to fit the relevant context: during pickup, it frames the user's location and the approaching vehicle; during transit, it frames the route ahead.
- Route lines are annotated with **symbols for stop signs, traffic lights, and real-time traffic incidents**.

#### Vehicle Status / Bottom Sheet

- Uber uses the **"Sheet" component** from their Base design system -- a draggable bottom sheet with multiple snap points.
- Ride status progresses through defined states: **Requested -> Accepted -> Driver Arriving -> In Progress -> Completed -> Paid -> Rated**.
- The bottom sheet surfaces different information at each state:
  - **Requested:** "Finding your ride" spinner with cancel option.
  - **Driver Arriving:** Driver name, photo, vehicle make/model/color, license plate, real-time ETA.
  - **In Progress:** Route progress, ETA to destination, driver info collapsed.
  - **Completed:** Fare breakdown, route map thumbnail, rate/tip prompt.
- The **collapsed state** shows only the most critical information (ETA, driver name) to preserve map real estate.
- The **expanded state** reveals secondary details (vehicle info, contact driver, share trip, safety tools).
- Information hierarchy was explicitly designed so that "one piece of information flows into the next."

#### Trip Summary / Receipt

- Post-ride, users receive a receipt with: **route map showing the path taken**, fare breakdown (base, distance, time, surge, tip, total), trip duration, distance, and pickup/dropoff addresses.
- The route map in the receipt is a **static thumbnail** -- not interactive -- with the route polyline drawn on it.
- Receipts are also emailed, providing a persistent record outside the app.

#### Onboarding

- Sign-up collects: phone number (primary identifier), email, name, payment method.
- Location permission is requested **in context** when the user first tries to set a pickup location -- not upfront.
- Referral codes can be entered during sign-up or applied automatically via shared links.
- The "Invite and Earn" section lets users share referral links via contacts, SMS, or other channels.

#### Sharing / Social

- **"Share Trip"** is Uber's most-used safety feature. Riders can share their live trip with trusted contacts.
- Recipients see: **live map with the rider's location**, trip status, rider's name, phone number, and license plate.
- The recipient experience was redesigned to let people follow the ride **through push notifications alone** -- they don't need to open a link or install the app.
- The share focuses on **ETA communication** as the primary use case, with driver info secondary (shown last, for emergencies).
- **Family Profiles** allow up to 10 riders to share one account, with the admin receiving notifications and live location tracking for family members' rides.

**Key patterns for MyRoboTaxi:**

- The bottom sheet with collapsed/expanded states is the definitive pattern for map + status UIs.
- Dual-color polyline (completed vs. remaining) is an excellent way to show drive progress.
- Night mode is important for an app that will be used at all hours.
- Share-via-push-notifications is a low-friction way for viewers to follow a trip.
- The route thumbnail in trip summaries is compact and effective.

**Anti-patterns to avoid:**

- Uber's information density is tuned for frequent riders. MyRoboTaxi should be simpler since viewers are occasional users.
- The safety-frame for sharing ("trusted contacts") doesn't match MyRoboTaxi's fun/social vibe.

---

### Lyft

**Overview:** Lyft differentiates through visual warmth (pink/purple brand), accessibility focus, and features like Lyft Silver for seniors. Its UX is similar to Uber but with notable divergences.

#### Map Interactions

- The map shows the user's surroundings with their location auto-populated via GPS.
- **Nearby available vehicles** are rendered on the map with directional car icons (not just dots), making it easy to see which way cars are headed and gauge proximity.
- Car icons were **redesigned with directionality** to improve tracking -- an arrow or car-shaped icon points in the direction of travel, which is more intuitive than a static circle.
- The color palette is: **grey/white background**, **hot pink** accents for the Lyft brand, and **strong purple** for CTAs and important information like ETA.
- Typography is lightweight and minimal, creating a clean visual hierarchy.

#### Vehicle Status / In-Ride Panel

- The In-Ride panel has **two states: collapsed and expanded**.
  - **Collapsed:** Shows only essential pickup information (driver name, ETA, vehicle info). This preserves "functional map real estate" so riders can interact with the map while figuring out where to meet their driver.
  - **Expanded:** Contains all other ride-related content -- contact driver, share ride, cancel, safety tools.
- This collapsed/expanded distinction is explicitly designed to avoid covering the map unnecessarily.
- ETA is displayed using the **purple accent color** for high visibility.
- Pricing and ETA are shown upfront before booking -- Lyft identified that **poor price and ETA transparency** was a major pain point in earlier versions.

#### Trip Summary

- Post-ride features include a **rating screen** with facial expression emojis and description labels (not just stars).
- Cost splitting is available for shared rides.
- The ability to **send an ETA to a friend or family member** is surfaced during the ride.

#### Onboarding

- Standard sign-up with phone, name, payment.
- Lyft identified that **"vague UX for first-time users"** was a problem in earlier versions and has worked to improve clarity.

#### Sharing / Social

- **"Send ETA"** button appears during any ride: sends a text with an in-app link showing the rider's current route and location.
- The shared view shows: **ride on a map**, progress toward destination, **driver photo, license plate, vehicle color/make/model**.
- **Lyft Family:** link up to 10 accounts to track spending, see ride info, and share ride details (including live location) for all family members. Admin receives notifications when family members ride.
- **Safety tools:** "Share ride details" via the safety panel sends a link that opens in a browser -- **no app install required** for the recipient. The shared view shows a map with the ride.

#### Lyft Silver (Accessibility Reference)

- A standalone simplified interface for seniors, launched May 2025.
- **Font inflated by 1.4x** -- the largest possible without text truncation.
- Only **two main buttons** on the home screen: "Call a ride now" and "Schedule one later."
- **"Get Help" button** in the top-right corner connects to a live agent (8am-9pm EST).
- Vehicle matching avoids pickup trucks (seniors are 2x more likely to cancel rides with trucks due to difficulty entering/exiting).
- Lyft Silver demonstrates the value of **radical simplification** for specific user segments.

**Key patterns for MyRoboTaxi:**

- Directional car icons (not dots) for vehicle markers on the map.
- Collapsed/expanded panel explicitly preserving map real estate.
- "Send ETA" as a one-tap share action during rides.
- Browser-based shared view (no app install for recipients) is critical for MyRoboTaxi's invite model.
- Lyft Silver's radical simplification is a useful reference -- MyRoboTaxi's "viewer" role should be similarly stripped down.

**Anti-patterns to avoid:**

- Lyft's hot pink branding doesn't fit MyRoboTaxi's Tesla-aligned aesthetic, but the principle of using accent color for the single most important data point (ETA) is sound.

---

### Waymo One

**Overview:** Waymo One is the most directly comparable product to MyRoboTaxi's autonomous context. It operates fully driverless rides in Phoenix, San Francisco, Los Angeles, and Austin, completing ~200,000 paid rides weekly as of March 2025. Its design is guided by three principles: **transparency, freedom, and consistency**.

#### Map Interactions

- The app uses **blue-shaded regions** on the map to indicate safe pullover zones for pickup. This communicates the vehicle's constraints to the rider visually, rather than through error messages.
- Riders can **drag the pickup pin**, and it **snaps to valid locations** -- smart constraint that prevents invalid selections while maintaining a sense of control.
- Turn-by-turn navigation is built directly into the Waymo app, so riders see both trip info and navigation without switching apps.

#### Vehicle Status / In-Vehicle Screen

- The in-vehicle passenger screen is the crown jewel of Waymo's UX. It displays a **simplified 3D visualization of the surrounding streetscape**: cars, pedestrians, stoplights, lane markings, traffic signs -- all rendered from sensor data.
- This visualization is shown **at all times**, paired with a **status message layer** that displays contextual explanations: "Yielding to pedestrians," "Waiting for traffic light," etc. This is the core trust-building mechanism.
- The design team explicitly chose to show a **simplified** version of sensor data, not the raw feed. "A series of interfaces translate that data into tidy visuals and updates that better match how we process the world."
- Music streaming (via Google Play) is available. When the door opens, **ambient "spa music" plays** to avoid the awkwardness of a silent, empty car -- a subtle but important UX touch.
- In-vehicle controls: **"Start Ride"** button (must be tapped to begin), **"Help"**, **"Lock"**, and **"Pull Over"** buttons.
- Temperature and music are adjustable from both the in-car screen and the mobile app.

#### Pickup Identification

- **Car ID feature:** Riders choose a **unique two-letter code and color scheme** in the app. This is displayed on the vehicle's dashboard (Chrysler Pacifica) or sensor dome (Jaguar I-PACE), visible through the windshield at pickup.
- A **distance-to-car compass** in the app shows direction and distance to the vehicle, guiding riders to the pickup spot.
- Door unlock options: tap "Unlock" in the app, or set doors to **auto-unlock as you approach** (proximity-based).

#### Trip Summary

- Post-ride, users are prompted to **rate the ride** -- the primary post-trip interaction.
- Detailed trip summary screens with statistics are not prominently featured in available documentation. This is an industry-wide gap.

#### Onboarding

- Join the **waitlist** via the website or app.
- Once granted access, a **short setup process** in the app.
- First ride instructions are minimal: download, enter destination, request ride.
- Pickup instructions include: how to identify the car (Car ID), how to unlock doors, and how to start the ride.
- Trust is built gradually through the experience itself, not through lengthy tutorials.

#### Sharing / Social

- Riders can **share trip progress** with friends and family, who see real-time trip status and arrival time.
- Up to **3 adults and a child** can ride together, but the account holder must be present to unlock doors and must ride along.
- Rides cannot be booked for someone else -- the account holder must always be in the vehicle.

**Key patterns for MyRoboTaxi:**

- The **3D sensor visualization with status messages** is the gold standard for autonomous vehicle transparency. MyRoboTaxi should show a simplified version of what the car "sees" or is doing -- even if it's just speed, heading, and road context.
- **Blue-shaded zones** for valid areas is a clean way to communicate constraints on a map.
- **Snap-to-valid-location** for pins is elegant constraint design.
- The **Car ID** concept (personalized visual identifier) could inspire personalization features in MyRoboTaxi.
- **Status messages explaining car behavior** ("Yielding to pedestrians") are enormously trust-building. MyRoboTaxi should show contextual status: "Parked," "Driving on Highway 1," "Charging at 67%."
- Ambient spa music on door open is a lesson in designing for emotional moments, not just functional ones.

**Anti-patterns to avoid:**

- Requiring the account holder to always be present doesn't apply to MyRoboTaxi (the whole point is remote monitoring).
- The waitlist model adds friction that's unnecessary for a personal app.

---

## Pattern Analysis

### Map Interactions

#### Universal Patterns (Used by All or Most Competitors)

1. **Full-bleed map as the primary canvas.** The map occupies the entire screen. All other UI (status cards, controls) overlays the map. None of the apps confine the map to a partial region.
2. **Auto-zoom to context.** The map automatically adjusts its zoom and center to frame the most relevant elements: during pickup, it shows the user and approaching vehicle; during transit, it shows the route ahead.
3. **Re-center / compass button.** A small button (usually top-right or bottom-right of the map) lets users snap back to the default view after manually panning.
4. **Route polyline on the map.** All apps draw the route as a colored line on the map. Uber uses a high-contrast black line; others use brand colors.

#### Differentiated Patterns


| Pattern                   | App            | Description                                                                      |
| ------------------------- | -------------- | -------------------------------------------------------------------------------- |
| Dual-color polyline       | Uber           | Completed portion in one color, remaining in another -- clear progress indicator |
| Blue pickup zones         | Waymo          | Shaded regions showing valid pickup areas                                        |
| Directional vehicle icons | Lyft           | Car-shaped icons pointing in direction of travel                                 |
| Live Activity tracking    | Tesla Robotaxi | iOS lock-screen widget for ambient vehicle tracking                              |
| Route annotations         | Uber           | Stop signs, traffic lights, incidents marked on the route line                   |
| Snap-to-valid pin         | Waymo          | Dragged pins snap to valid pickup spots                                          |


#### Recommendations for MyRoboTaxi

- Use a **full-bleed Mapbox GL JS map** as the primary canvas on the Live Map Dashboard.
- Implement **smooth marker animation** using linear interpolation between GPS coordinate updates (3-5 second update interval). Use Turf.js for distance calculations and `requestAnimationFrame` for smooth rendering.
- Draw the vehicle's route as a **polyline with a dual-color pattern**: a muted color for the path already traveled, a vivid color for the projected route ahead.
- Add a **re-center button** (bottom-right of map) that snaps the view back to the vehicle's current position.
- Implement **auto-zoom**: when the viewer first opens the dashboard, zoom to frame the vehicle; as the vehicle moves, keep it centered unless the viewer has manually panned.
- Use a **directional vehicle icon** (a car shape or arrow, not a dot) that rotates based on the vehicle's heading.
- Consider a **dark map style** by default (matching Tesla's brand aesthetic) with appropriate contrast for route lines and vehicle markers.

---

### Vehicle Status Display

#### Universal Patterns

1. **Bottom sheet / card overlay.** All apps use a card anchored to the bottom of the screen, overlaying the map. It has at least two states: collapsed (minimal info) and expanded (full details).
2. **ETA as the primary metric.** Across all apps, estimated arrival time is the most prominently displayed piece of information -- larger font, accent color, highest visual hierarchy.
3. **Progressive disclosure.** Critical info (ETA, vehicle identity) is shown in the collapsed state. Secondary info (contact, share, safety) is in the expanded state.

#### Competitor Specifics


| Data Point          | Tesla Robotaxi                 | Uber                                 | Lyft                                 | Waymo                              |
| ------------------- | ------------------------------ | ------------------------------------ | ------------------------------------ | ---------------------------------- |
| ETA                 | Prominent, real-time           | Prominent, accent color              | Purple accent color                  | In-app + compass                   |
| Speed               | Top-left corner, de-emphasized | Not shown to rider                   | Not shown to rider                   | Not shown to rider                 |
| Battery/Charge      | Not displayed in Robotaxi app  | N/A                                  | N/A                                  | N/A                                |
| Vehicle identity    | License plate in app           | Name, photo, plate, make/model/color | Name, photo, plate, make/model/color | Car ID (2 letters + color)         |
| Contextual status   | Route + traffic on screen      | State labels (Arriving, In Progress) | State labels                         | "Yielding to pedestrians" messages |
| In-vehicle controls | Pull Over, Support             | N/A (human driver)                   | N/A (human driver)                   | Start Ride, Help, Lock, Pull Over  |


#### Recommendations for MyRoboTaxi

- Use a **draggable bottom sheet** with collapsed and expanded states.
- **Collapsed state** should show: vehicle status icon (parked/driving/charging), current speed (if driving), battery percentage with a thin colored bar, and ETA (if a destination is set).
- **Expanded state** should add: full address/location name, drive duration, distance traveled, temperature, and a "Share" action.
- Battery percentage should use a **color gradient**: green (>50%), yellow (20-50%), red (<20%).
- Show **contextual status messages** inspired by Waymo: "Parked at Home," "Driving on I-35, 72 mph," "Supercharging -- 45 min to full."
- Speed should be displayed but **de-emphasized** (smaller font, secondary position) -- it's useful context but not the primary concern for a remote viewer.

---

### Drive/Ride Summaries

#### Universal Patterns

1. **Route map thumbnail.** All apps show the route taken as a polyline on a small static map.
2. **Key metrics.** Duration, distance, and cost are consistently shown.
3. **Rating prompt.** All apps prompt for a rating immediately after the ride.
4. **List view for history.** Past rides are listed chronologically, usually with destination name and date.

#### Competitor Specifics


| Element              | Tesla Robotaxi                      | Uber                                      | Lyft                    | Waymo         |
| -------------------- | ----------------------------------- | ----------------------------------------- | ----------------------- | ------------- |
| Route visualization  | Map with route polyline             | Static map thumbnail                      | Not detailed            | Not detailed  |
| Metrics shown        | Pickup time, arrival, distance, fee | Distance, duration, fare breakdown, route | Cost, with split option | Rating prompt |
| Tip option           | Yes (tip the car)                   | Yes                                       | Yes                     | N/A           |
| History organization | By date and destination             | Chronological list                        | Chronological list      | Not detailed  |
| Shareability         | Not shareable                       | Receipt emailed                           | Not shareable           | Not shareable |


#### Recommendations for MyRoboTaxi

- The Drive Summary screen is a **major differentiator opportunity** since no competitor makes trip summaries shareable or visually rich.
- Design each drive summary as a **"card" with a hero map** showing the full route polyline on a dark-themed Mapbox static map.
- Display: **total distance, duration, average speed, max speed, energy used (kWh), start/end locations, and start/end times.**
- Include a **speed or elevation graph** beneath the map -- a sparkline chart showing speed over the duration of the drive. This adds visual interest and context.
- Add a prominent **"Share" button** that generates a shareable link or image (screenshot of the summary card). The shared view should work in a browser without login.
- Organize drive history as a **chronological list with route thumbnails** -- each list item shows: date, start/end location names, distance, duration, and a tiny route map preview.
- Consider a **"highlights" feature**: automatically surface interesting drives (longest, fastest, most scenic route) to encourage sharing.

---

### Onboarding Flows

#### Universal Patterns

1. **Minimal upfront friction.** All apps collect only essential information at sign-up (phone/email, name, payment if applicable).
2. **Contextual permission requests.** Location is requested when the user first needs it, not during sign-up.
3. **Progressive education.** Tips and tutorials appear at the point of need (e.g., during wait time), not as a front-loaded walkthrough.
4. **Waitlist for supply-constrained services.** Both Tesla Robotaxi and Waymo use waitlists, but this is a supply constraint, not a UX choice.

#### Competitor Specifics


| Element            | Tesla Robotaxi                                            | Uber                                  | Lyft                 | Waymo                        |
| ------------------ | --------------------------------------------------------- | ------------------------------------- | -------------------- | ---------------------------- |
| Sign-up fields     | Tesla Account (email + password)                          | Phone, email, name, payment           | Phone, name, payment | Google Account or email      |
| Identity linking   | Tesla Account (shared with vehicle ownership)             | Standalone                            | Standalone           | Google Account               |
| Permission timing  | At first ride request                                     | At first pickup location entry        | At first ride        | At first ride request        |
| Education approach | Tips while waiting for ride (door handles, light signals) | Minimal                               | Minimal              | Short setup, first-ride tips |
| Referral system    | Invite-only access initially                              | "Invite and Earn" with referral codes | Referral codes       | Waitlist, referral codes     |


#### Recommendations for MyRoboTaxi

- **Sign-up should be Tesla Account-based** (since users are Tesla owners). This provides identity linking and reduces friction -- no new account to create.
- For **invited viewers** (friends/family), use a **magic-link or code-based invite system** -- no account creation required. The viewer clicks a link, enters a short code, and immediately sees the shared dashboard.
- Request location permission **only if** the viewer's location is needed (e.g., to show distance to the car). Don't request it for the basic "watch the car" use case.
- Use **progressive onboarding tips** shown in context:
  - First visit: "This is [Owner's Name]'s Tesla. You can see where it is and what it's doing in real-time."
  - First drive viewed: "The blue line shows the route. The green dot is the car."
  - First drive summary viewed: "You can share this drive with others using the share button."
- Avoid front-loaded tutorials or permission walls.

---

### Sharing and Social Features

#### Universal Patterns

1. **Trip sharing is safety-framed.** Uber and Lyft position sharing as a safety feature ("share with trusted contacts"). Waymo and Tesla offer minimal sharing.
2. **Recipient view works without app install.** Both Uber and Lyft send links that open in a mobile browser.
3. **Shared data includes: map with live location, ETA, and vehicle identity.**
4. **Family account linking.** Both Uber (Family Profiles, up to 10) and Lyft (Lyft Family, up to 10) support family groups with shared payment and ride visibility.

#### Competitor Specifics


| Feature                 | Tesla Robotaxi     | Uber                                                             | Lyft                                                           | Waymo                             |
| ----------------------- | ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------- |
| Live trip sharing       | Not available      | Yes -- most-used safety feature                                  | Yes -- "Send ETA" button                                       | Share trip progress               |
| Recipient experience    | N/A                | Live map, push notifications only option, no app needed          | Browser-based map, no app needed                               | Real-time status and arrival time |
| What recipients see     | N/A                | Live location, trip status, rider name, phone, plate             | Map with progress, driver photo, plate, vehicle details        | Trip status, arrival time         |
| Family features         | None               | Family Profiles (10 members), admin notifications, live tracking | Lyft Family (10 members), spending tracking, ride info sharing | Ride with up to 3 adults + child  |
| Referral/invite         | Invite-only access | Invite and Earn referral links                                   | Referral codes                                                 | Waitlist referrals                |
| Social sharing of trips | None               | Receipt emailed (not social)                                     | None                                                           | None                              |


#### Recommendations for MyRoboTaxi

- **Reframe sharing from safety to social.** Unlike ride-hailing, MyRoboTaxi's sharing is about fun and novelty -- "watch my Tesla drive itself." The language, design, and framing should reflect excitement, not caution.
- **Invite system:** The car owner sends invites (via link, SMS, or QR code) to friends and family. Recipients tap the link and get immediate access to the live dashboard -- **no app install, no account creation**.
- **Viewer permissions model:**
  - **Live viewers** can see the car's current location, speed, battery, and status in real-time.
  - **History viewers** can also browse past drive summaries.
  - The owner controls who sees what from an Invite Management screen.
- **Shareable drive summaries:** Each drive summary should have a "Share" button that generates a link to a standalone, beautifully designed web page showing the route map, stats, and highlights. This is the single biggest differentiation opportunity.
- **Consider push/notification support:** Following Uber's model, allow viewers to receive push notifications for key events: "Car is on the move," "Car arrived at [destination]," "Charging complete." These should be opt-in and customizable.
- **Do not require app install for viewers.** The shared dashboard should be a responsive web app (PWA-ready). This is consistent with how Uber and Lyft handle shared trip views.

---

## Recommendations for MyRoboTaxi

### Design System Foundations

1. **Color palette:** Use a dark theme as the default (charcoal/near-black backgrounds, inspired by Tesla's in-vehicle aesthetic). Accent colors: Tesla blue for the vehicle marker and route line, a warm amber/gold for CTAs and status highlights (inspired by Tesla Robotaxi's Cybercab theme). Green/yellow/red for battery status.
2. **Typography:** Clean, lightweight sans-serif (Inter or similar). Use size and weight for hierarchy, not color -- keep the palette restrained. ETA and speed values should use a **monospace or tabular-number variant** so digits don't jump when values update.
3. **Layout pattern:** Full-bleed Mapbox map as the background canvas, with a **draggable bottom sheet** for vehicle status. The sheet should have three snap points: **peek** (just the status bar), **half** (key metrics visible), and **full** (all details + actions).

### Live Map Dashboard

1. **Vehicle marker:** A custom car-shaped SVG icon that rotates based on heading. Use a **pulsing glow effect** when the car is moving (a subtle radial gradient animation) to draw the eye. When parked, the glow stops and the marker becomes static.
2. **Route visualization:** Draw the route as a polyline with two layers -- a **faded trail** for the path already driven and a **bright line** for the projected/remaining route. Use Mapbox's line-gradient feature for smooth color transitions.
3. **Smooth animation:** Update vehicle position every 3-5 seconds from the Tesla API. Between updates, use **linear interpolation** (lerp) with `requestAnimationFrame` to animate the marker smoothly along the route. Set marker rotation using the bearing between the last two coordinate pairs.
4. **Map centering:** Default to auto-center on the vehicle. When the viewer pans manually, show a **"Re-center" floating action button** (bottom-right). Auto-center resumes after 10 seconds of inactivity or when the button is tapped.
5. **Contextual status bar:** At the top of the bottom sheet (always visible in peek state), show a single-line status: an icon + text like "Driving -- 65 mph on US-290" or "Parked at 123 Main St" or "Supercharging -- 72%, 23 min remaining." This is inspired by Waymo's contextual status messages.

### Vehicle Status Card (Bottom Sheet)

1. **Peek state (collapsed):** Status icon (car/plug/P), one-line status text, battery bar.
2. **Half state:** Add speed (large, monospace), battery percentage + estimated range, current location (address or road name), and time since last update.
3. **Full state:** Add trip duration, distance driven today, interior/exterior temperature, and action buttons (Share Live View, View Drive History).
4. **Battery visualization:** A horizontal thin bar at the top of the status card. Use CSS gradient: green to yellow to red, filled proportionally. Show the percentage numerically beside it.

### Drive Summary Screen

1. **Hero map:** A Mapbox static image (or embedded interactive map) showing the full route polyline on a dark-themed map. Start point marked with a green dot, end point with a red dot.
2. **Stats grid:** Below the map, a 2x3 or 3x2 grid of metric cards:
  - Total distance (mi/km)
    - Duration (h:mm)
    - Average speed (mph/km/h)
    - Energy used (kWh)
    - Max speed (mph/km/h)
    - Start and end times
3. **Speed sparkline:** A compact line chart showing speed over the duration of the drive. This adds visual texture and tells a story (highway vs. city, stops, etc.).
4. **Share action:** A prominent button that generates either a shareable URL or a downloadable image (screenshot of the summary card). The shared web view should work without authentication.

### Onboarding

1. **Owner onboarding:** Sign in with Tesla Account. Grant Tesla API access. See a brief explanation: "MyRoboTaxi lets your friends and family watch your Tesla in real-time." Proceed to dashboard.
2. **Viewer onboarding:** Tap an invite link. See the owner's name and car photo. Optionally set a display name. Land on the live dashboard with a contextual tooltip: "This is [Name]'s Tesla Model Y. You're seeing its live location."
3. **Permission requests:** Only request notifications permission (for "car is moving" alerts), and only after the viewer has used the app at least once. Location permission should not be requested unless a distance-to-car feature is implemented.

### Invite Management

1. **Invite creation:** The owner taps "Invite" and chooses a method: copy link, send SMS, show QR code. Each invite can have a label ("Mom," "Alex") and a permission level (live only, live + history).
2. **Active viewers list:** Show a list of all invited viewers with their last-seen time and online status. Allow revoking access with a single tap.
3. **Viewer count badge:** On the live dashboard, show a small badge indicating how many viewers are currently watching. This creates a sense of shared experience without being intrusive.

---

## Appendix: Source References

### Tesla Robotaxi

- [First Look at Tesla's Robotaxi App: features, design, and more -- Teslarati](https://www.teslarati.com/first-look-at-teslas-robotaxi-app-features-design-and-more/)
- [A Look at Tesla's Robotaxi UI -- NotATeslaApp](https://www.notateslaapp.com/news/3528/a-look-at-teslas-robotaxi-ui-and-what-happens-if-you-touch-the-steering-wheel)
- [First Look at Tesla's Robotaxi App and Its Features (Photos) -- NotATeslaApp](https://www.notateslaapp.com/news/2853/first-look-at-teslas-robotaxi-app-and-its-features-photos)
- [Get Started With Robotaxi -- Tesla Support](https://www.tesla.com/support/robotaxi/getting-started)
- [How to Use Robotaxi -- Tesla Support](https://www.tesla.com/support/robotaxi/how-to-use)
- [Tesla Launches Robotaxi -- NotATeslaApp](https://www.notateslaapp.com/news/2850/tesla-launches-robotaxi-features-robotaxi-app-command-center-and-first-impressions-video)

### Uber

- [Designing the latest generation of Uber Navigation -- Uber Design (Medium)](https://medium.com/uber-design/designing-the-latest-generation-of-uber-navigation-maps-built-for-ridesharing-de3ede031ce1)
- [Uber UX Design Portfolio -- Simon Pan](https://simonpan.com/work/uber/)
- [Uber's interactive map usage case study -- Bootcamp/UX Design](https://bootcamp.uxdesign.cc/interactive-map-usage-in-ubers-ui-user-emotion-flow-84648ab09940)
- [Uber Share Trip Recipient Experience -- Chloe Fan](https://www.chloefan.com/uber-trip-tracker)
- [Uber Base Design System -- Sheet Component](https://base.uber.com/6d2425e9f/p/033e0d-sheet)
- [ActionCard Design Pattern -- Uber Blog](https://www.uber.com/blog/developing-the-actioncard-design-pattern/)
- [Share Your Trip Status -- Uber](https://www.uber.com/us/en/ride/how-it-works/share-status/)

### Lyft

- [Sharing your ride location with friends and family -- Lyft Help](https://help.lyft.com/hc/en-us/all/articles/360051084234-Sharing-your-ride-details-with-trusted-contacts)
- [Lyft Family -- Lyft Help](https://help.lyft.com/hc/en-us/all/articles/161280850818-lyft-family)
- [How Lyft Revamped Its App (Case Study) -- Medium](https://medium.com/@patelaayushi0213/how-lyft-revamped-its-app-a-case-study-on-ux-redesign-and-innovation-f6d9eee19ad6)
- [Lyft Silver for Older Adults -- Lyft Blog](https://www.lyft.com/blog/posts/lyft-silver-live-phone-support)
- [How Lyft Designed Lyft Silver -- Fast Company](https://www.fastcompany.com/91328470/how-lyft-designed-lyft-silver-for-older-riders)
- [Lyft Design Critique -- IXD@Pratt](https://ixd.prattsi.org/2023/09/design-critique-lyft/)

### Waymo One

- [Driven by Waymo, Designed with Trust -- Waymo Blog](https://waymo.com/blog/2019/08/driven-by-waymo-designed-with-trust/)
- [How Waymo Uses Design to Create Trust -- The Turn Signal Blog](https://www.theturnsignalblog.com/how-waymo-uses-design-to-create-trust-in-driverless-cars/)
- [Taming the Road: How Self-Driving Cars Earn Your Trust -- Google Design](https://design.google/library/trusting-driverless-cars)
- [New Waymo One features (DOT Inclusive Design Challenge) -- Waymo Blog](https://waymo.com/blog/2022/08/new-waymo-one-features-inspired-by-dots)
- [Waymo One Ride-Hailing App -- Waymo](https://waymo.com/waymo-one/)
- [Your First Trip -- Waymo Help](https://support.google.com/waymo/answer/11020106?hl=en)
- [Share Your Trip -- Waymo Help](https://support.google.com/waymo/answer/14550742?hl=en)

### General / Technical

- [Mapbox GL JS: Animate a marker](https://docs.mapbox.com/mapbox-gl-js/example/animate-marker/)
- [Mapbox: Building cinematic route animations](https://www.mapbox.com/blog/building-cinematic-route-animations-with-mapboxgl)
- [Mapbox GL JS: Animate a point along a route](https://docs.mapbox.com/mapbox-gl-js/example/animate-point-along-route/)
- [10 Ways to Design Your App like Uber -- Appinventiv](https://appinventiv.com/blog/uber-ux-principles-to-follow/)
- [GPS Integration in Ride-Sharing Apps -- CQLSYS](https://www.cqlsys.com/gps-tracking-ride-sharing-apps)

