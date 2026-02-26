# User Flows -- MyRoboTaxi v1

## v1 Review Feedback -- Flow Changes

The following changes were identified during the first mockup review and supersede the original flow designs below where they conflict:

1. **Dashboard removed as separate screen.** The live map is now the home/default view. There is no intermediate dashboard screen. When the owner logs in or opens the app, they land directly on the live map with their vehicle visible.
2. **Car switching is via swipe on the map, not navigation to a dashboard.** If the owner has multiple vehicles, they swipe left/right on the map view to switch between them. There is no separate vehicle picker or dashboard screen.
3. **Empty state flow for new users.** When a new user has no vehicles linked and no shared vehicles, the home screen shows two options:
   - **"Add Your Tesla"** -- begins the Tesla OAuth linking flow (owner path)
   - **"Enter Invite Code"** -- allows the user to enter a code to view a family/friend's car (viewer path)
   - After either action completes successfully, the user lands on the live map.

> **Note:** The flows below were written before this feedback. References to a `/dashboard` route or "dashboard" screen should be read as the live map home screen instead.

---

This document maps every v1 user journey as a detailed flow diagram. Each flow includes happy paths, branching logic, error states, and edge cases. Flows are rendered in Mermaid syntax for GitHub-native rendering.

**User roles:**
- **Owner** -- A Tesla owner who links their vehicle and manages sharing
- **Viewer** -- A friend or family member invited to watch the owner's vehicle

**Auth strategy:** NextAuth with Google, Apple, and Email/Password. Tesla linking is a separate OAuth step for owners only.

**Key design principle (from competitor research):** Viewer access should ideally work without requiring an account. The viewer flow supports both anonymous (link-only) access and optional account creation for persistent features.

---

## Flow 1: Owner Onboarding

Sign up, link a Tesla account, grant vehicle data access, view linked vehicles, and optionally invite a friend.

```mermaid
flowchart TD
    START([Owner opens MyRoboTaxi]) --> HAS_ACCOUNT{Has existing account?}

    HAS_ACCOUNT -->|Yes| LOGIN_SCREEN[Show login screen]
    HAS_ACCOUNT -->|No| SIGNUP_SCREEN[Show sign-up screen]

    %% --- Sign Up Branch ---
    SIGNUP_SCREEN --> AUTH_METHOD{Choose auth method}
    AUTH_METHOD -->|Google| GOOGLE_OAUTH[Redirect to Google OAuth]
    AUTH_METHOD -->|Apple| APPLE_OAUTH[Redirect to Apple OAuth]
    AUTH_METHOD -->|Email + Password| EMAIL_FORM[Show email + password form]

    GOOGLE_OAUTH --> GOOGLE_SUCCESS{Google auth successful?}
    GOOGLE_SUCCESS -->|Yes| CREATE_ACCOUNT[Create MyRoboTaxi account]
    GOOGLE_SUCCESS -->|No - user cancelled| SIGNUP_SCREEN
    GOOGLE_SUCCESS -->|No - error| OAUTH_ERROR[Show error: 'Sign-in failed. Try again.']
    OAUTH_ERROR --> SIGNUP_SCREEN

    APPLE_OAUTH --> APPLE_SUCCESS{Apple auth successful?}
    APPLE_SUCCESS -->|Yes| CREATE_ACCOUNT
    APPLE_SUCCESS -->|No - user cancelled| SIGNUP_SCREEN
    APPLE_SUCCESS -->|No - error| OAUTH_ERROR

    EMAIL_FORM --> VALIDATE_EMAIL{Valid email format?}
    VALIDATE_EMAIL -->|No| EMAIL_ERROR[Show inline error: 'Enter a valid email']
    EMAIL_ERROR --> EMAIL_FORM
    VALIDATE_EMAIL -->|Yes| CHECK_EMAIL_EXISTS{Email already registered?}
    CHECK_EMAIL_EXISTS -->|Yes| EXISTING_EMAIL[Show error: 'Account exists. Log in instead.' + link]
    EXISTING_EMAIL --> LOGIN_SCREEN
    CHECK_EMAIL_EXISTS -->|No| VALIDATE_PASSWORD{Password meets requirements?}
    VALIDATE_PASSWORD -->|No| PASSWORD_ERROR[Show inline error: 'Password must be 8+ chars']
    PASSWORD_ERROR --> EMAIL_FORM
    VALIDATE_PASSWORD -->|Yes| CREATE_ACCOUNT

    %% --- Login Branch ---
    LOGIN_SCREEN --> LOGIN_METHOD{Choose auth method}
    LOGIN_METHOD -->|Google| GOOGLE_OAUTH_LOGIN[Redirect to Google OAuth]
    LOGIN_METHOD -->|Apple| APPLE_OAUTH_LOGIN[Redirect to Apple OAuth]
    LOGIN_METHOD -->|Email + Password| LOGIN_FORM[Show email + password form]

    GOOGLE_OAUTH_LOGIN --> GOOGLE_LOGIN_OK{Auth successful?}
    GOOGLE_LOGIN_OK -->|Yes| CHECK_TESLA_LINKED
    GOOGLE_LOGIN_OK -->|No| LOGIN_ERROR[Show error: 'Login failed. Try again.']
    LOGIN_ERROR --> LOGIN_SCREEN

    APPLE_OAUTH_LOGIN --> APPLE_LOGIN_OK{Auth successful?}
    APPLE_LOGIN_OK -->|Yes| CHECK_TESLA_LINKED
    APPLE_LOGIN_OK -->|No| LOGIN_ERROR

    LOGIN_FORM --> LOGIN_VALIDATE{Credentials valid?}
    LOGIN_VALIDATE -->|No| INVALID_CREDS[Show error: 'Invalid email or password']
    INVALID_CREDS --> LOGIN_SCREEN
    LOGIN_VALIDATE -->|Yes| CHECK_TESLA_LINKED

    %% --- Post-Auth: Tesla Linking ---
    CREATE_ACCOUNT --> WELCOME[Show welcome screen: 'Link your Tesla to get started']
    WELCOME --> LINK_TESLA_CTA[Tap 'Link Tesla Account']
    LINK_TESLA_CTA --> TESLA_OAUTH[Redirect to Tesla OAuth consent screen]

    CHECK_TESLA_LINKED{Tesla account linked?}
    CHECK_TESLA_LINKED -->|Yes, token valid| DASHBOARD
    CHECK_TESLA_LINKED -->|Yes, token expired| TOKEN_EXPIRED[Show notice: 'Tesla connection expired. Re-link to continue.']
    TOKEN_EXPIRED --> LINK_TESLA_CTA
    CHECK_TESLA_LINKED -->|No| WELCOME

    TESLA_OAUTH --> TESLA_CONSENT{Owner grants access?}
    TESLA_CONSENT -->|Yes| FETCH_VEHICLES[Fetch vehicles from Tesla API]
    TESLA_CONSENT -->|No - denied| OAUTH_DENIED[Show message: 'Tesla access is required to use MyRoboTaxi.' + Retry button]
    OAUTH_DENIED --> LINK_TESLA_CTA
    TESLA_CONSENT -->|Error - network/timeout| TESLA_ERROR[Show error: 'Could not connect to Tesla. Try again.']
    TESLA_ERROR --> LINK_TESLA_CTA

    FETCH_VEHICLES --> VEHICLES_FOUND{Vehicles found?}
    VEHICLES_FOUND -->|Yes, 1 vehicle| AUTO_SELECT[Auto-select vehicle]
    AUTO_SELECT --> DASHBOARD
    VEHICLES_FOUND -->|Yes, multiple| VEHICLE_PICKER[Show vehicle picker list]
    VEHICLE_PICKER --> SELECT_VEHICLE[Owner selects a vehicle]
    SELECT_VEHICLE --> DASHBOARD
    VEHICLES_FOUND -->|No vehicles| NO_VEHICLES[Show message: 'No vehicles found on this Tesla account.' + Re-link / Help]
    NO_VEHICLES --> LINK_TESLA_CTA

    %% --- Dashboard + Invite Prompt ---
    DASHBOARD[Show Owner Dashboard with live vehicle map]
    DASHBOARD --> FIRST_VISIT{First visit?}
    FIRST_VISIT -->|Yes| ONBOARDING_TIP[Show contextual tip: 'Invite friends to watch your Tesla in real-time']
    ONBOARDING_TIP --> INVITE_CTA{Tap invite CTA?}
    INVITE_CTA -->|Yes| INVITE_FLOW([Go to Flow 5: Invite Management])
    INVITE_CTA -->|Dismiss| OWNER_USING_APP([Owner explores dashboard -- Go to Flow 3: Live Tracking])
    FIRST_VISIT -->|No| OWNER_USING_APP
```

### Key decisions

1. **Three auth methods** (Google, Apple, Email+Password) via NextAuth. Google and Apple minimize friction; email+password is the fallback.
2. **Tesla linking is mandatory but separate.** The owner cannot use the app without linking a Tesla account. This is enforced after sign-up/login via a gating check.
3. **Token expiry is handled gracefully.** If the Tesla OAuth token has expired on return visit, the owner sees a clear re-link prompt rather than a broken dashboard.
4. **No vehicles found** is a real edge case (e.g., wrong Tesla account, new account with no car delivered). We surface a clear message and allow re-linking a different account.
5. **Single vehicle auto-select.** Most owners have one car. We skip the picker and go straight to the dashboard.
6. **First-visit invite nudge.** Per competitor research, onboarding should be progressive. We show a single invite CTA contextually, not a tutorial.

---

## Flow 2: Viewer Onboarding

Receive an invite, optionally create an account, and view the shared vehicle.

```mermaid
flowchart TD
    START([Viewer receives invite]) --> INVITE_MEDIUM{How was invite received?}
    INVITE_MEDIUM -->|Email link| CLICK_LINK[Tap link in email]
    INVITE_MEDIUM -->|SMS link| CLICK_LINK
    INVITE_MEDIUM -->|QR code| SCAN_QR[Scan QR code]
    SCAN_QR --> CLICK_LINK

    CLICK_LINK --> VALIDATE_INVITE{Invite valid?}
    VALIDATE_INVITE -->|No - expired| EXPIRED[Show message: 'This invite has expired. Ask the owner for a new one.']
    EXPIRED --> DEAD_END([End])
    VALIDATE_INVITE -->|No - revoked| REVOKED[Show message: 'This invite is no longer active.']
    REVOKED --> DEAD_END
    VALIDATE_INVITE -->|No - malformed URL| INVALID[Show 404: 'Invite not found.']
    INVALID --> DEAD_END

    VALIDATE_INVITE -->|Yes| LANDING[Show invite landing page: Owner name, car photo, 'Watch this Tesla live']

    LANDING --> VIEWER_CHOICE{Viewer chooses}
    VIEWER_CHOICE -->|'Watch Now' - no account| ANON_SESSION[Create anonymous session tied to invite token]
    VIEWER_CHOICE -->|'Create Account' - optional| VIEWER_SIGNUP[Show sign-up screen]

    %% --- Anonymous Viewer Path ---
    ANON_SESSION --> ANON_DASHBOARD[Show shared vehicle dashboard - read only]
    ANON_DASHBOARD --> ANON_LIMITS[Anonymous viewer can see: live map, vehicle status, current drive]
    ANON_LIMITS --> WANT_MORE{Viewer wants drive history or notifications?}
    WANT_MORE -->|Yes| PROMPT_SIGNUP[Show soft prompt: 'Create an account to see drive history and get notifications']
    PROMPT_SIGNUP --> VIEWER_SIGNUP
    WANT_MORE -->|No| ANON_CONTINUES([Viewer continues watching - Go to Flow 3])

    %% --- Account Creation Path ---
    VIEWER_SIGNUP --> VIEWER_AUTH_METHOD{Choose auth method}
    VIEWER_AUTH_METHOD -->|Google| V_GOOGLE[Google OAuth]
    VIEWER_AUTH_METHOD -->|Apple| V_APPLE[Apple OAuth]
    VIEWER_AUTH_METHOD -->|Email + Password| V_EMAIL[Email + password form]

    V_GOOGLE --> V_AUTH_OK{Auth successful?}
    V_APPLE --> V_AUTH_OK
    V_EMAIL --> V_VALIDATE{Valid credentials?}
    V_VALIDATE -->|No| V_ERROR[Show validation errors]
    V_ERROR --> VIEWER_SIGNUP
    V_VALIDATE -->|Yes| V_AUTH_OK

    V_AUTH_OK -->|No| V_AUTH_FAIL[Show error: 'Sign-up failed. Try again.']
    V_AUTH_FAIL --> VIEWER_SIGNUP
    V_AUTH_OK -->|Yes| CHECK_EXISTING_VIEWER{Already has an account?}

    CHECK_EXISTING_VIEWER -->|Yes, already linked to this invite| VIEWER_DASHBOARD
    CHECK_EXISTING_VIEWER -->|Yes, new invite| LINK_INVITE[Link invite to existing account]
    LINK_INVITE --> VIEWER_DASHBOARD
    CHECK_EXISTING_VIEWER -->|No| CREATE_VIEWER_ACCOUNT[Create viewer account + link invite]
    CREATE_VIEWER_ACCOUNT --> VIEWER_DASHBOARD

    %% --- Viewer Dashboard ---
    VIEWER_DASHBOARD[Show shared vehicle dashboard - full access]
    VIEWER_DASHBOARD --> FIRST_VIEWER_VISIT{First visit?}
    FIRST_VIEWER_VISIT -->|Yes| VIEWER_TIP[Show contextual tip: 'This is Owner Name''s Tesla Model Y. You''re seeing its live location.']
    VIEWER_TIP --> VIEWER_EXPLORING
    FIRST_VIEWER_VISIT -->|No| VIEWER_EXPLORING

    VIEWER_EXPLORING([Viewer explores dashboard])
    VIEWER_EXPLORING --> VIEWER_ACTIONS{Viewer navigates to}
    VIEWER_ACTIONS -->|Live map| LIVE_TRACKING([Go to Flow 3: Live Vehicle Tracking])
    VIEWER_ACTIONS -->|Drive history| DRIVE_HISTORY([Go to Flow 4: Drive Summary])
```

### Key decisions

1. **Anonymous access is the default path.** Per competitor research recommendation #6 and Lyft/Uber's pattern of browser-based shared views, viewers can watch the live vehicle immediately without creating an account. This is the lowest-friction path.
2. **Account creation is optional but incentivized.** Anonymous viewers can see live status but not drive history or notifications. This provides a natural reason to upgrade without being a gate.
3. **Invite validation happens server-side before showing any UI.** Expired, revoked, and malformed invites fail fast with clear messaging.
4. **Existing accounts are handled.** If a viewer already has a MyRoboTaxi account (e.g., from a different owner's invite), the new invite is linked to their existing account seamlessly.
5. **The invite landing page builds trust.** Showing the owner's name and car photo before asking for any action follows Waymo's trust-building principle.

---

## Flow 3: Live Vehicle Tracking

View the vehicle on a real-time map with status, speed, charge, and contextual information.

```mermaid
flowchart TD
    START([User opens Live Map Dashboard]) --> CHECK_ROLE{User role?}
    CHECK_ROLE -->|Owner| OWNER_DASH[Load owner dashboard - full controls]
    CHECK_ROLE -->|Viewer - authenticated| VIEWER_DASH[Load viewer dashboard - read only]
    CHECK_ROLE -->|Viewer - anonymous| ANON_DASH[Load anonymous dashboard - limited]

    OWNER_DASH --> FETCH_STATUS
    VIEWER_DASH --> FETCH_STATUS
    ANON_DASH --> FETCH_STATUS

    FETCH_STATUS[Fetch vehicle status from API] --> API_RESPONSE{API response?}

    API_RESPONSE -->|Success| DETERMINE_STATE
    API_RESPONSE -->|Vehicle offline / asleep| OFFLINE_STATE
    API_RESPONSE -->|Network error| NETWORK_ERROR[Show banner: 'Connection lost. Retrying...']
    NETWORK_ERROR --> RETRY_LOGIC[Retry with exponential backoff: 3s, 6s, 12s, 30s]
    RETRY_LOGIC --> RETRY_RESULT{Retry successful?}
    RETRY_RESULT -->|Yes| DETERMINE_STATE
    RETRY_RESULT -->|No, max retries| STALE_DATA[Show last known data + banner: 'Unable to reach vehicle. Showing last known status.']
    STALE_DATA --> MANUAL_REFRESH[Show 'Tap to retry' button]
    MANUAL_REFRESH --> FETCH_STATUS

    %% --- Vehicle State Handling ---
    DETERMINE_STATE{Vehicle state?}

    DETERMINE_STATE -->|Driving| DRIVING_STATE[Show driving UI]
    DETERMINE_STATE -->|Parked| PARKED_STATE[Show parked UI]
    DETERMINE_STATE -->|Charging| CHARGING_STATE[Show charging UI]
    DETERMINE_STATE -->|Offline / Asleep| OFFLINE_STATE[Show offline UI]

    %% --- Driving State ---
    DRIVING_STATE --> DRIVING_MAP[Full-bleed map with vehicle marker moving along route]
    DRIVING_MAP --> DRIVING_SHEET[Bottom sheet - collapsed: speed, status icon, battery bar]
    DRIVING_SHEET --> DRIVING_DETAIL[Expanded: address, heading, drive duration, distance, temp]
    DRIVING_DETAIL --> DRIVING_UPDATES[Real-time updates every 3-5 seconds]
    DRIVING_UPDATES --> STREAM_CHECK{Data stream healthy?}
    STREAM_CHECK -->|Yes| DRIVING_UPDATES
    STREAM_CHECK -->|Stale > 30s| STALE_WARN[Show subtle indicator: 'Last updated Xs ago']
    STALE_WARN --> STREAM_CHECK
    STREAM_CHECK -->|Disconnected| NETWORK_ERROR

    %% --- Parked State ---
    PARKED_STATE --> PARKED_MAP[Map centered on parked location - static marker, no animation]
    PARKED_MAP --> PARKED_SHEET[Bottom sheet - collapsed: 'Parked' icon, address, battery bar]
    PARKED_SHEET --> PARKED_DETAIL[Expanded: full address, parked duration, battery %, range, temp]
    PARKED_DETAIL --> PARKED_POLL[Poll for state change every 60 seconds]
    PARKED_POLL --> STATE_CHANGED{State changed?}
    STATE_CHANGED -->|Yes| DETERMINE_STATE
    STATE_CHANGED -->|No| PARKED_POLL

    %% --- Charging State ---
    CHARGING_STATE --> CHARGING_MAP[Map centered on charging location - charging icon overlay]
    CHARGING_MAP --> CHARGING_SHEET[Bottom sheet - collapsed: plug icon, battery %, 'Xmin to full']
    CHARGING_SHEET --> CHARGING_DETAIL[Expanded: charge rate, energy added, cost estimate, full address]
    CHARGING_DETAIL --> CHARGING_POLL[Poll battery updates every 30 seconds]
    CHARGING_POLL --> CHARGE_DONE{Charging complete?}
    CHARGE_DONE -->|Yes| DETERMINE_STATE
    CHARGE_DONE -->|No| CHARGING_POLL

    %% --- Offline / Asleep State ---
    OFFLINE_STATE --> OFFLINE_MAP[Map shows last known location - dimmed/greyed marker]
    OFFLINE_MAP --> OFFLINE_SHEET[Bottom sheet: 'Vehicle offline' or 'Asleep', last seen timestamp]
    OFFLINE_SHEET --> OFFLINE_POLL[Poll for wake-up every 120 seconds]
    OFFLINE_POLL --> WOKE_UP{Vehicle online?}
    WOKE_UP -->|Yes| DETERMINE_STATE
    WOKE_UP -->|No| OFFLINE_POLL

    %% --- Map Interactions ---
    DRIVING_MAP --> MAP_PAN{User pans map manually?}
    MAP_PAN -->|Yes| SHOW_RECENTER[Show 'Re-center' floating button]
    SHOW_RECENTER --> RECENTER_ACTION{User taps re-center OR 10s inactivity?}
    RECENTER_ACTION -->|Yes| AUTO_CENTER[Snap map back to vehicle]
    AUTO_CENTER --> DRIVING_MAP
    RECENTER_ACTION -->|No| SHOW_RECENTER

    %% --- Owner-Specific Actions ---
    DRIVING_DETAIL --> IS_OWNER{Is owner?}
    IS_OWNER -->|Yes| OWNER_ACTIONS[Show actions: 'Share Live View', 'View Drive History', 'Manage Viewers']
    OWNER_ACTIONS --> SHARE_LIVE{Tap 'Share Live View'?}
    SHARE_LIVE -->|Yes| INVITE_FLOW([Go to Flow 5: Invite Management])
    IS_OWNER -->|No| VIEWER_ACTIONS_LIMITED[Show action: 'View Drive History']
    VIEWER_ACTIONS_LIMITED --> HISTORY_NAV([Go to Flow 4: Drive Summary])
```

### Key decisions

1. **Four distinct vehicle states** (driving, parked, charging, offline) each with tailored UI. The bottom sheet content, map behavior, and polling interval all change based on state.
2. **Polling intervals vary by state.** Driving: 3-5s real-time updates. Charging: 30s. Parked: 60s. Offline: 120s. This balances freshness with API rate limits.
3. **Graceful degradation.** On network failure, the app shows last known data with a clear "stale" indicator and retry options. It never shows a blank screen.
4. **Exponential backoff** for retries prevents hammering the API during outages.
5. **Staleness indicator** appears after 30 seconds without an update during active driving. Users always know how fresh the data is.
6. **Map re-center pattern** follows the universal pattern from Uber/Lyft/Waymo: auto-center by default, show a re-center button when the user pans away, auto-resume after inactivity.
7. **Owner vs. Viewer actions** are distinguished in the expanded bottom sheet. Owners get management controls; viewers get read-only navigation.

---

## Flow 4: Drive Summary

View completed drives, browse history, inspect route details and FSD stats, and share summaries.

```mermaid
flowchart TD
    START([User navigates to Drive History]) --> CHECK_ROLE{User role?}
    CHECK_ROLE -->|Owner| OWNER_HISTORY[Fetch all drives for owned vehicles]
    CHECK_ROLE -->|Viewer - authenticated| VIEWER_HISTORY[Fetch drives for shared vehicle - if permitted]
    CHECK_ROLE -->|Viewer - anonymous| ANON_BLOCKED[Show prompt: 'Create an account to see drive history']
    ANON_BLOCKED --> SIGNUP_REDIRECT([Go to Flow 2: Viewer sign-up])

    OWNER_HISTORY --> LOAD_DRIVES
    VIEWER_HISTORY --> CHECK_PERMISSION{Owner granted history access?}
    CHECK_PERMISSION -->|Yes| LOAD_DRIVES
    CHECK_PERMISSION -->|No| NO_PERMISSION[Show message: 'Drive history is not available for this vehicle.']
    NO_PERMISSION --> BACK_TO_LIVE([Return to Live Map - Flow 3])

    LOAD_DRIVES[Fetch drive history from API] --> DRIVES_RESULT{Drives found?}
    DRIVES_RESULT -->|Yes| DRIVE_LIST
    DRIVES_RESULT -->|No drives yet| EMPTY_STATE[Show empty state: 'No drives recorded yet. Drives will appear here automatically.']
    EMPTY_STATE --> BACK_TO_LIVE
    DRIVES_RESULT -->|API error| FETCH_ERROR[Show error: 'Could not load drive history. Tap to retry.']
    FETCH_ERROR --> LOAD_DRIVES

    %% --- Drive List ---
    DRIVE_LIST[Show chronological drive list]
    DRIVE_LIST --> LIST_ITEM[Each item shows: date, start/end location, distance, duration, route thumbnail]

    LIST_ITEM --> FILTER_SORT{User filters or sorts?}
    FILTER_SORT -->|Filter by date range| DATE_FILTER[Apply date filter]
    DATE_FILTER --> FILTER_RESULTS{Results found?}
    FILTER_RESULTS -->|Yes| DRIVE_LIST
    FILTER_RESULTS -->|No| NO_FILTER_RESULTS[Show: 'No drives match this filter.']
    NO_FILTER_RESULTS --> DRIVE_LIST
    FILTER_SORT -->|Sort by distance / duration| SORT_LIST[Re-sort list]
    SORT_LIST --> DRIVE_LIST
    FILTER_SORT -->|No filter - select a drive| SELECT_DRIVE

    %% --- Drive Detail ---
    SELECT_DRIVE[Tap a drive in the list] --> LOAD_DETAIL[Fetch drive detail from API]
    LOAD_DETAIL --> DETAIL_RESULT{Detail loaded?}
    DETAIL_RESULT -->|Yes| DRIVE_DETAIL
    DETAIL_RESULT -->|Error| DETAIL_ERROR[Show error: 'Could not load this drive. Tap to retry.']
    DETAIL_ERROR --> LOAD_DETAIL

    DRIVE_DETAIL[Show Drive Detail Screen]
    DRIVE_DETAIL --> HERO_MAP[Hero map: full route polyline, green start dot, red end dot]
    HERO_MAP --> STATS_GRID[Stats grid: distance, duration, avg speed, max speed, energy used, start/end times]
    STATS_GRID --> SPEED_CHART[Speed sparkline chart: speed over time]
    SPEED_CHART --> FSD_SECTION{FSD data available?}

    FSD_SECTION -->|Yes| FSD_STATS[Show FSD section: FSD-active segments highlighted on route, % of drive on FSD, interventions count]
    FSD_SECTION -->|No| SKIP_FSD[Omit FSD section - no placeholder]

    FSD_STATS --> DRIVE_ACTIONS
    SKIP_FSD --> DRIVE_ACTIONS

    %% --- Drive Actions ---
    DRIVE_ACTIONS{User action?}
    DRIVE_ACTIONS -->|Share drive| SHARE_DRIVE
    DRIVE_ACTIONS -->|Navigate back| DRIVE_LIST
    DRIVE_ACTIONS -->|Swipe to next/prev drive| ADJACENT_DRIVE[Load adjacent drive detail]
    ADJACENT_DRIVE --> DRIVE_DETAIL

    %% --- Share Drive ---
    SHARE_DRIVE[Tap 'Share' button] --> SHARE_METHOD{Share method?}
    SHARE_METHOD -->|Copy link| COPY_LINK[Generate shareable URL + copy to clipboard]
    COPY_LINK --> LINK_TOAST[Show toast: 'Link copied!']
    LINK_TOAST --> DRIVE_DETAIL
    SHARE_METHOD -->|Share via OS sheet| OS_SHARE[Open native share sheet with URL + preview]
    OS_SHARE --> DRIVE_DETAIL
    SHARE_METHOD -->|Download image| GENERATE_IMAGE[Generate summary card image]
    GENERATE_IMAGE --> DOWNLOAD[Download image to device]
    DOWNLOAD --> DRIVE_DETAIL

    %% --- Shared Drive View (recipient) ---
    COPY_LINK --> RECIPIENT_OPENS{Recipient opens shared link}
    RECIPIENT_OPENS --> PUBLIC_SUMMARY[Show public drive summary page - no auth required]
    PUBLIC_SUMMARY --> PUBLIC_MAP[Static route map + stats + speed chart]
    PUBLIC_MAP --> RECIPIENT_CTA[Show CTA: 'Want to see this car live? Ask Owner Name for an invite.']

    %% --- Drive In Progress Edge Case ---
    DRIVE_LIST --> ACTIVE_DRIVE{Drive currently in progress?}
    ACTIVE_DRIVE -->|Yes| ACTIVE_BANNER[Show banner at top of list: 'Drive in progress' with live indicator]
    ACTIVE_BANNER --> TAP_ACTIVE{Tap active drive banner?}
    TAP_ACTIVE -->|Yes| LIVE_VIEW([Go to Flow 3: Live Vehicle Tracking])
    TAP_ACTIVE -->|No| LIST_ITEM
    ACTIVE_DRIVE -->|No| LIST_ITEM
```

### Key decisions

1. **Anonymous viewers cannot access drive history.** This is the primary incentive for account creation. Live status is free; history requires sign-up.
2. **Permission gating for viewers.** Owners control whether each viewer can see drive history (live-only vs. live+history permission levels from the invite system).
3. **Empty state is encouraging, not alarming.** "No drives yet" with an explanation that they appear automatically.
4. **FSD section is conditional.** If the drive has no FSD data (e.g., manual driving, FSD not enabled), the section is omitted entirely rather than showing zeros.
5. **Shareable drive summaries are public.** The shared URL works without authentication, as a standalone web page. This is the key differentiation opportunity identified in competitor research.
6. **Active drive appears as a banner**, not a list item, since it is still in progress. Tapping it goes to the live tracking flow, not the summary flow.
7. **Swipe navigation** between drives allows browsing without returning to the list each time.

---

## Flow 5: Invite Management

Owner sends invites, manages pending/accepted invites, and revokes viewer access.

```mermaid
flowchart TD
    START([Owner opens Invite Management]) --> LOAD_INVITES[Fetch all invites from API]
    LOAD_INVITES --> LOAD_RESULT{Load successful?}
    LOAD_RESULT -->|Yes| INVITE_DASHBOARD
    LOAD_RESULT -->|Error| LOAD_ERROR[Show error: 'Could not load invites. Tap to retry.']
    LOAD_ERROR --> LOAD_INVITES

    %% --- Invite Dashboard ---
    INVITE_DASHBOARD[Show Invite Management screen]
    INVITE_DASHBOARD --> INVITE_SECTIONS[Three sections: Active Viewers, Pending Invites, Send New Invite]

    %% --- Send New Invite ---
    INVITE_SECTIONS --> SEND_NEW[Tap 'Invite Someone']
    SEND_NEW --> ENTER_DETAILS[Show invite form: email or name label]
    ENTER_DETAILS --> SET_LABEL[Optional: set label e.g. 'Mom', 'Alex']
    SET_LABEL --> SET_PERMISSION{Set permission level}
    SET_PERMISSION -->|Live only| PERM_LIVE[Viewer sees: live map, status, current drive]
    SET_PERMISSION -->|Live + History| PERM_FULL[Viewer sees: live map, status, current drive, drive history]
    PERM_LIVE --> SEND_METHOD
    PERM_FULL --> SEND_METHOD

    SEND_METHOD{Choose delivery method}
    SEND_METHOD -->|Enter email + send| VALIDATE_EMAIL{Valid email?}
    SEND_METHOD -->|Copy link| GEN_LINK[Generate invite link]
    SEND_METHOD -->|Show QR code| GEN_QR[Generate QR code on screen]
    SEND_METHOD -->|Share via OS sheet| GEN_LINK_OS[Generate link + open OS share sheet]

    VALIDATE_EMAIL -->|No| EMAIL_ERROR[Show inline error: 'Enter a valid email address']
    EMAIL_ERROR --> ENTER_DETAILS
    VALIDATE_EMAIL -->|Yes| CHECK_DUPLICATES

    CHECK_DUPLICATES{Duplicate check}
    CHECK_DUPLICATES -->|Email already invited - pending| ALREADY_PENDING[Show message: 'Invite already sent to this email. Resend?']
    ALREADY_PENDING --> RESEND_CHOICE{Resend?}
    RESEND_CHOICE -->|Yes| SEND_EMAIL
    RESEND_CHOICE -->|No| ENTER_DETAILS
    CHECK_DUPLICATES -->|Email already has active access| ALREADY_ACTIVE[Show message: 'This person already has access.']
    ALREADY_ACTIVE --> INVITE_DASHBOARD
    CHECK_DUPLICATES -->|New email| SEND_EMAIL

    SEND_EMAIL[Send invite email via API] --> EMAIL_SENT{Sent successfully?}
    EMAIL_SENT -->|Yes| INVITE_CREATED
    EMAIL_SENT -->|No - delivery failed| SEND_FAIL[Show error: 'Could not send invite. Check the email and try again.']
    SEND_FAIL --> ENTER_DETAILS

    GEN_LINK --> COPY_SUCCESS[Copy link to clipboard + show toast: 'Link copied!']
    COPY_SUCCESS --> INVITE_CREATED
    GEN_QR --> QR_DISPLAYED[Show QR code modal with 'Done' button]
    QR_DISPLAYED --> INVITE_CREATED
    GEN_LINK_OS --> OS_SHARED[Link shared via OS sheet]
    OS_SHARED --> INVITE_CREATED

    INVITE_CREATED[Invite created - added to Pending list] --> INVITE_DASHBOARD

    %% --- Manage Pending Invites ---
    INVITE_SECTIONS --> VIEW_PENDING[View Pending Invites section]
    VIEW_PENDING --> PENDING_LIST[Show list: email/label, date sent, permission level]
    PENDING_LIST --> PENDING_ACTION{Action on pending invite?}
    PENDING_ACTION -->|Resend| RESEND_INVITE[Resend invite email/regenerate link]
    RESEND_INVITE --> RESEND_OK{Resent successfully?}
    RESEND_OK -->|Yes| RESEND_TOAST[Show toast: 'Invite resent']
    RESEND_TOAST --> INVITE_DASHBOARD
    RESEND_OK -->|No| RESEND_ERROR[Show error: 'Could not resend. Try again.']
    RESEND_ERROR --> PENDING_LIST
    PENDING_ACTION -->|Cancel invite| CONFIRM_CANCEL[Show confirmation: 'Cancel this invite?']
    CONFIRM_CANCEL -->|Confirm| CANCEL_INVITE[Delete invite from API]
    CANCEL_INVITE --> INVITE_DASHBOARD
    CONFIRM_CANCEL -->|Dismiss| PENDING_LIST
    PENDING_ACTION -->|No action| INVITE_DASHBOARD

    %% --- Manage Active Viewers ---
    INVITE_SECTIONS --> VIEW_ACTIVE[View Active Viewers section]
    VIEW_ACTIVE --> ACTIVE_LIST[Show list: name/label, last seen, online status, permission level]
    ACTIVE_LIST --> ACTIVE_ACTION{Action on active viewer?}
    ACTIVE_ACTION -->|Change permission| CHANGE_PERM[Toggle Live Only <-> Live + History]
    CHANGE_PERM --> PERM_SAVED[Save updated permission]
    PERM_SAVED --> INVITE_DASHBOARD
    ACTIVE_ACTION -->|Revoke access| CONFIRM_REVOKE[Show confirmation: 'Remove this viewer? They will lose all access.']
    CONFIRM_REVOKE -->|Confirm| REVOKE_ACCESS[Revoke access via API]
    REVOKE_ACCESS --> VIEWER_KICKED[Viewer's session invalidated in real-time]
    VIEWER_KICKED --> INVITE_DASHBOARD
    CONFIRM_REVOKE -->|Cancel| ACTIVE_LIST
    ACTIVE_ACTION -->|No action| INVITE_DASHBOARD

    %% --- Viewer Limit Edge Case ---
    SEND_NEW --> CHECK_LIMIT{Max viewers reached?}
    CHECK_LIMIT -->|Yes| LIMIT_MSG[Show message: 'You have reached the maximum number of viewers. Remove a viewer to invite someone new.']
    LIMIT_MSG --> VIEW_ACTIVE
    CHECK_LIMIT -->|No| ENTER_DETAILS
```

### Key decisions

1. **Three invite delivery methods.** Email (sends directly), copy link (for messaging apps), QR code (for in-person sharing). All create the same invite record on the backend.
2. **Two permission levels.** "Live only" (real-time map and status) and "Live + History" (adds drive history access). This gives owners granular control without overwhelming complexity.
3. **Duplicate detection.** If the owner tries to invite someone who already has a pending invite or active access, they get a clear message with the option to resend or manage.
4. **Revocation is immediate.** When an owner revokes access, the viewer's session is invalidated in real-time. The viewer sees a "Your access has been removed" message on their next interaction.
5. **Confirmation dialogs for destructive actions.** Both canceling a pending invite and revoking active access require confirmation.
6. **Max viewer limit** is enforced at invite creation time, not at acceptance time. This prevents the owner from having more outstanding invites than the system supports.
7. **Labels are optional but encouraged.** Labels like "Mom" or "Alex" make the invite list human-readable, especially when managing multiple viewers.

---

## Flow 6: Settings and Account

View/edit profile, manage linked Tesla account, and sign out.

```mermaid
flowchart TD
    START([User opens Settings]) --> CHECK_ROLE{User role?}
    CHECK_ROLE -->|Owner| OWNER_SETTINGS[Show Owner Settings]
    CHECK_ROLE -->|Viewer| VIEWER_SETTINGS[Show Viewer Settings]

    %% === OWNER SETTINGS ===
    OWNER_SETTINGS --> OWNER_SECTIONS[Sections: Profile, Tesla Account, Notifications, About, Sign Out]

    %% --- Profile ---
    OWNER_SECTIONS --> EDIT_PROFILE[Tap 'Profile']
    EDIT_PROFILE --> PROFILE_SCREEN[Show profile: display name, email, auth provider, avatar]
    PROFILE_SCREEN --> EDIT_NAME{Edit display name?}
    EDIT_NAME -->|Yes| NAME_INPUT[Show name input field]
    NAME_INPUT --> SAVE_NAME[Save updated name]
    SAVE_NAME --> SAVE_RESULT{Save successful?}
    SAVE_RESULT -->|Yes| NAME_TOAST[Show toast: 'Name updated']
    NAME_TOAST --> PROFILE_SCREEN
    SAVE_RESULT -->|No| SAVE_ERROR[Show error: 'Could not save. Try again.']
    SAVE_ERROR --> PROFILE_SCREEN

    %% --- Tesla Account ---
    OWNER_SECTIONS --> TESLA_SETTINGS[Tap 'Tesla Account']
    TESLA_SETTINGS --> TESLA_STATUS{Tesla link status?}

    TESLA_STATUS -->|Linked, token valid| LINKED_VIEW[Show: Tesla account email, linked vehicles, last sync time]
    TESLA_STATUS -->|Linked, token expired| EXPIRED_VIEW[Show: 'Connection expired' warning + 'Re-link' button]
    TESLA_STATUS -->|Not linked| NOT_LINKED[Show: 'No Tesla account linked' + 'Link Tesla' button]

    LINKED_VIEW --> TESLA_ACTIONS{Action?}
    TESLA_ACTIONS -->|Re-link / refresh| RELINK[Redirect to Tesla OAuth]
    RELINK --> TESLA_OAUTH_RESULT{OAuth successful?}
    TESLA_OAUTH_RESULT -->|Yes| RELINKED_SUCCESS[Show toast: 'Tesla account re-linked']
    RELINKED_SUCCESS --> TESLA_SETTINGS
    TESLA_OAUTH_RESULT -->|No| RELINK_FAIL[Show error: 'Could not re-link. Try again.']
    RELINK_FAIL --> TESLA_SETTINGS

    TESLA_ACTIONS -->|Unlink Tesla| CONFIRM_UNLINK{Has active viewers?}
    CONFIRM_UNLINK -->|Yes| UNLINK_WARNING[Show warning: 'Unlinking will stop all viewers from seeing your vehicle. X active viewers will lose access. Continue?']
    CONFIRM_UNLINK -->|No| SIMPLE_UNLINK[Show confirmation: 'Unlink your Tesla account?']

    UNLINK_WARNING --> UNLINK_CONFIRM{Confirm unlink?}
    SIMPLE_UNLINK --> UNLINK_CONFIRM
    UNLINK_CONFIRM -->|Yes| DO_UNLINK[Remove Tesla tokens, revoke all viewer sessions, clear vehicle data]
    DO_UNLINK --> UNLINKED[Show: 'Tesla account unlinked.' + 'Link Tesla' button]
    UNLINKED --> WELCOME_BACK([Redirect to Link Tesla step - Flow 1])
    UNLINK_CONFIRM -->|No| TESLA_SETTINGS

    EXPIRED_VIEW --> RELINK
    NOT_LINKED --> LINK_CTA[Tap 'Link Tesla']
    LINK_CTA --> RELINK

    %% --- Notifications (Owner) ---
    OWNER_SECTIONS --> NOTIFICATIONS[Tap 'Notifications']
    NOTIFICATIONS --> NOTIF_SCREEN[Show notification preferences]
    NOTIF_SCREEN --> NOTIF_OPTIONS[Toggles: Drive started, Drive completed, Charging complete, Viewer joined]
    NOTIF_OPTIONS --> SAVE_NOTIF[Save preferences]
    SAVE_NOTIF --> OWNER_SETTINGS

    %% --- Sign Out (Owner) ---
    OWNER_SECTIONS --> SIGN_OUT_OWNER[Tap 'Sign Out']
    SIGN_OUT_OWNER --> CONFIRM_SIGNOUT[Show confirmation: 'Sign out of MyRoboTaxi?']
    CONFIRM_SIGNOUT -->|Yes| DO_SIGNOUT[Clear session, redirect to login]
    DO_SIGNOUT --> LOGGED_OUT([Show login screen - Flow 1])
    CONFIRM_SIGNOUT -->|No| OWNER_SETTINGS

    %% === VIEWER SETTINGS ===
    VIEWER_SETTINGS --> VIEWER_SECTIONS[Sections: Profile, Notifications, Shared Vehicles, About, Sign Out]

    %% --- Viewer Profile ---
    VIEWER_SECTIONS --> V_PROFILE[Tap 'Profile']
    V_PROFILE --> V_PROFILE_SCREEN[Show: display name, email, auth provider]
    V_PROFILE_SCREEN --> V_EDIT_NAME{Edit display name?}
    V_EDIT_NAME -->|Yes| V_NAME_INPUT[Show name input]
    V_NAME_INPUT --> V_SAVE_NAME[Save name]
    V_SAVE_NAME --> V_PROFILE_SCREEN
    V_EDIT_NAME -->|No| VIEWER_SETTINGS

    %% --- Shared Vehicles ---
    VIEWER_SECTIONS --> SHARED_VEHICLES[Tap 'Shared Vehicles']
    SHARED_VEHICLES --> VEHICLE_LIST[Show list of vehicles shared with this viewer]
    VEHICLE_LIST --> VEHICLE_ITEM[Each item: Owner name, vehicle name, permission level]
    VEHICLE_ITEM --> LEAVE_ACCESS{Tap 'Leave'?}
    LEAVE_ACCESS -->|Yes| CONFIRM_LEAVE[Show confirmation: 'Stop viewing Owner Name''s vehicle?']
    CONFIRM_LEAVE -->|Yes| REMOVE_SELF[Remove viewer access]
    REMOVE_SELF --> VEHICLE_LIST
    CONFIRM_LEAVE -->|No| VEHICLE_LIST
    LEAVE_ACCESS -->|No| VIEWER_SETTINGS

    %% --- Notifications (Viewer) ---
    VIEWER_SECTIONS --> V_NOTIFICATIONS[Tap 'Notifications']
    V_NOTIFICATIONS --> V_NOTIF_SCREEN[Show notification preferences per vehicle]
    V_NOTIF_SCREEN --> V_NOTIF_OPTIONS[Toggles per vehicle: Car started driving, Car arrived, Charging complete]
    V_NOTIF_OPTIONS --> V_SAVE_NOTIF[Save preferences]
    V_SAVE_NOTIF --> VIEWER_SETTINGS

    %% --- Sign Out (Viewer) ---
    VIEWER_SECTIONS --> SIGN_OUT_VIEWER[Tap 'Sign Out']
    SIGN_OUT_VIEWER --> V_CONFIRM_SIGNOUT[Show confirmation: 'Sign out? You will need your invite link to return.']
    CONFIRM_SIGNOUT_V{Confirm?}
    V_CONFIRM_SIGNOUT --> CONFIRM_SIGNOUT_V
    CONFIRM_SIGNOUT_V -->|Yes| V_DO_SIGNOUT[Clear session, redirect to landing page]
    V_DO_SIGNOUT --> V_LOGGED_OUT([Show home / login screen])
    CONFIRM_SIGNOUT_V -->|No| VIEWER_SETTINGS

    %% --- Delete Account ---
    OWNER_SECTIONS --> DELETE_ACCOUNT[Tap 'Delete Account']
    DELETE_ACCOUNT --> DELETE_WARNING[Show warning: 'This will permanently delete your account, unlink your Tesla, and remove all viewer access. This cannot be undone.']
    DELETE_WARNING --> DELETE_CONFIRM{Type 'DELETE' to confirm}
    DELETE_CONFIRM -->|Confirmed| DO_DELETE[Delete account, unlink Tesla, revoke all invites, purge data]
    DO_DELETE --> DELETED([Show confirmation page: 'Account deleted.' + redirect to home])
    DELETE_CONFIRM -->|Cancel| OWNER_SETTINGS
```

### Key decisions

1. **Owner and Viewer settings are distinct.** Owners have Tesla account management; viewers have shared vehicle management. Both have profile, notifications, and sign-out.
2. **Unlink Tesla is a high-impact action.** If the owner has active viewers, they see an explicit warning about the impact before proceeding. Unlinking revokes all viewer sessions.
3. **Tesla token expiry is surfaced here.** The Settings screen always shows the current link status, making it easy for owners to re-link when tokens expire.
4. **Viewer sign-out warning** reminds them they will need their invite link to return, since viewers may not remember how they got access.
5. **Viewers can leave voluntarily.** The "Leave" action lets viewers remove their own access to a shared vehicle, useful if they no longer want notifications or visibility.
6. **Account deletion** requires typing "DELETE" as a confirmation pattern to prevent accidental data loss. This is a hard delete -- all data is purged.
7. **Notification preferences are per-vehicle for viewers** since a viewer might follow multiple owners' vehicles and want different notification settings for each.

---

## Cross-Flow Notes

### Navigation Architecture

The app has a simple top-level navigation structure:

```mermaid
flowchart LR
    NAV[Bottom Navigation Bar] --> MAP[Live Map]
    NAV --> HISTORY[Drive History]
    NAV --> INVITES[Invites - Owner only]
    NAV --> SETTINGS[Settings]
```

- **Owners** see four tabs: Live Map, Drive History, Invites, Settings.
- **Authenticated Viewers** see three tabs: Live Map, Drive History (if permitted), Settings.
- **Anonymous Viewers** see only the Live Map with a persistent "Create Account" banner.

### Flow Interconnections

| From Flow | To Flow | Trigger |
|---|---|---|
| Flow 1: Owner Onboarding | Flow 3: Live Tracking | Owner completes onboarding, lands on dashboard |
| Flow 1: Owner Onboarding | Flow 5: Invite Management | Owner taps invite CTA on first visit |
| Flow 2: Viewer Onboarding | Flow 3: Live Tracking | Viewer completes onboarding or enters anonymously |
| Flow 2: Viewer Onboarding | Flow 4: Drive Summary | Authenticated viewer navigates to history |
| Flow 3: Live Tracking | Flow 4: Drive Summary | User taps "View Drive History" in bottom sheet |
| Flow 3: Live Tracking | Flow 5: Invite Management | Owner taps "Share Live View" in bottom sheet |
| Flow 4: Drive Summary | Flow 3: Live Tracking | User taps "Drive in progress" banner |
| Flow 4: Drive Summary | Flow 2: Viewer Onboarding | Anonymous viewer prompted to sign up for history |
| Flow 5: Invite Management | Flow 2: Viewer Onboarding | Invite recipient begins the viewer flow |
| Flow 6: Settings | Flow 1: Owner Onboarding | Owner unlinks Tesla and needs to re-link |

### Global Error Handling

These error patterns apply across all flows:

1. **Network errors** -- Show a non-blocking banner at the top of the screen: "No internet connection. Some features may be unavailable." Retry automatically when connectivity returns.
2. **API errors (5xx)** -- Show a contextual error with a "Try again" action. Never show raw error codes or technical messages.
3. **Session expiry** -- If the user's auth session expires mid-use, show a modal: "Your session has expired. Please sign in again." Redirect to login after acknowledgment. Preserve the user's current location so they return to the same screen after re-auth.
4. **Tesla API rate limiting** -- Silently extend polling intervals. Show a subtle "Updates may be delayed" indicator if the delay exceeds 30 seconds during active driving.
5. **Viewer access revoked mid-session** -- If a viewer is actively watching and the owner revokes their access, show a modal: "The owner has removed your access to this vehicle." Redirect to home.

### Shared UI States

These states appear across multiple flows and should be designed consistently:

1. **Loading** -- A skeleton screen matching the layout of the expected content. Never a full-screen spinner.
2. **Empty** -- Friendly illustration + message + primary action (e.g., "No drives yet" with a link back to the live map).
3. **Error** -- Inline error message near the failed element + "Try again" action. Never a full-page error.
4. **Stale data** -- A subtle timestamp indicator ("Last updated 2 min ago") with muted styling. Appears on live tracking and vehicle status.
5. **Offline** -- Grey/dimmed visual treatment for the vehicle marker and status card. Clear "Vehicle offline" label.

### Progressive Onboarding Tooltips

Contextual tips appear once per user at these moments:

| Moment | Tooltip | Flow |
|---|---|---|
| Owner first lands on dashboard | "Invite friends to watch your Tesla in real-time" | Flow 1 |
| Viewer first sees the live map | "This is [Owner]'s [Car Model]. You're seeing its live location." | Flow 2 |
| First time viewing a drive summary | "The blue line shows the route. Tap anywhere on it for details." | Flow 4 |
| First time in drive history (owner) | "Share any drive summary with the Share button." | Flow 4 |
| Owner opens Invite Management first time | "Invite by email, link, or QR code. You control who sees what." | Flow 5 |

These tips are dismissible and never shown again once acknowledged.

### Authentication State Machine

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticated_Owner : Sign up/in + Link Tesla
    Unauthenticated --> Authenticated_Viewer : Sign up/in via invite
    Unauthenticated --> Anonymous_Viewer : Open invite link without signing up

    Authenticated_Owner --> Tesla_Expired : Tesla token expires
    Tesla_Expired --> Authenticated_Owner : Re-link Tesla
    Tesla_Expired --> Tesla_Unlinked : Owner unlinks

    Authenticated_Owner --> Tesla_Unlinked : Owner unlinks Tesla
    Tesla_Unlinked --> Authenticated_Owner : Re-link Tesla

    Anonymous_Viewer --> Authenticated_Viewer : Creates account
    Anonymous_Viewer --> Unauthenticated : Invite revoked

    Authenticated_Viewer --> Unauthenticated : Signs out
    Authenticated_Viewer --> Unauthenticated : Access revoked by owner

    Authenticated_Owner --> Unauthenticated : Signs out
    Authenticated_Owner --> [*] : Deletes account
```

### Role-Based Access Summary

| Feature | Owner | Authenticated Viewer | Anonymous Viewer |
|---|---|---|---|
| Live map + vehicle status | Yes | Yes | Yes |
| Bottom sheet - expanded details | Yes | Yes | Partial (no actions) |
| Drive history list | Yes | If permitted by owner | No (sign-up prompt) |
| Drive detail + summary | Yes | If permitted by owner | No |
| Share drive summary | Yes | Yes (if has access) | No |
| Invite management | Yes | No | No |
| Tesla account settings | Yes | No | No |
| Notifications | Yes | Yes | No |
| Profile editing | Yes | Yes | No |
