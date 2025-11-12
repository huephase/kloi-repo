# KLOI Application Changelog

⚠️⚠️⚠️ **IMPORTANT**: This document tracks all breaking changes, major changes, and directional changes in the KLOI application. Refer to this document when planning migrations, updates, or when understanding historical changes.

---

## Change Categories

- **🔴 BREAKING CHANGE**: Changes that require immediate attention and may break existing functionality
- **🟠 MAJOR CHANGE**: Significant feature additions or modifications that may require code updates
- **🟢 DIRECTION CHANGE**: Strategic shifts in application architecture, patterns, or business logic
- **🔵 MIGRATION REQUIRED**: Database or schema changes that need migration scripts
- **🟡 DEPRECATED**: Features or APIs that are being phased out

---

### November 12, 2025 - Polygon Boundary Drawing Fixes & Configurable Coordinate Order System

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed polygon boundary drawing timing issues and implemented a configurable coordinate order system to support different coordinate formats (lng-lat vs lat-lng) without requiring database data recreation.

#### Major Changes
- **Polygon Boundary Drawing Fixes**: `public/global/js/maps.js`
  - Fixed polygon disappearing after brief appearance on page load
  - Resolved timing conflict where polygon was drawn before geocoding completed, causing it to disappear when map recentered
  - Polygon now draws after geocoding completes and coordinates are available
  - Improved coordinate normalization logic to correctly handle [lng, lat] format for UAE coordinates
  - Added proper Google Maps LatLng object conversion for polygon paths
  - Implemented delayed bounds fitting to avoid conflicts with geocoding recenter operations
  - Enhanced debugging logs throughout polygon drawing process
  - Polygon now persists correctly and remains visible after map initialization

- **Configurable Coordinate Order System**: Multiple files
  - **Client-Side Configuration**: `public/global/js/maps.js`
    - Added `POLYGON_COORDINATE_ORDER` constant with options: `'lng-lat'`, `'lat-lng'`, or `'auto'` (default)
    - Updated `normalizePolygonPaths()` to respect coordinate order configuration
    - Supports forced interpretation or auto-detection based on value ranges
  - **Server-Side Configuration**: `src/services/areaPolygonService.ts` & `src/services/deliveryLocationsService.ts`
    - Added `POLYGON_COORDINATE_ORDER` constant matching client-side options
    - Updated polygon normalization functions to use configured coordinate order
    - Maintains consistency across client and server-side processing
  - **Import Script Configuration**: `src/scripts/importGeoJsonPolygon.ts`
    - Added `DB_STORAGE_COORDINATE_ORDER` constant for controlling database storage format
    - Updated `normalizePolygonPairs()` to normalize coordinates to configured storage format
    - Ensures imported polygons match the expected database format

#### Direction Changes
- **Flexible Coordinate Handling**: Shift from hardcoded coordinate interpretation to configurable system
  - **Business Benefit**: Eliminates need to recreate database data when switching between coordinate formats
  - **Technical Benefit**: Single configuration change allows support for different external systems requiring different formats
  - **Future-Proofing**: Easy adaptation to new coordinate format requirements without data migration

#### Files Affected
- `public/global/js/maps.js` (MODIFIED) - Fixed polygon drawing timing, improved coordinate normalization, added coordinate order configuration
- `src/services/areaPolygonService.ts` (MODIFIED) - Added coordinate order configuration and updated normalization logic
- `src/services/deliveryLocationsService.ts` (MODIFIED) - Added coordinate order configuration and updated normalization logic
- `src/scripts/importGeoJsonPolygon.ts` (MODIFIED) - Added database storage coordinate order configuration

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- **Coordinate Order Configuration**:
  - `'lng-lat'`: Forces interpretation as [longitude, latitude] (e.g., [54.37, 24.46] for UAE)
  - `'lat-lng'`: Forces interpretation as [latitude, longitude] (e.g., [24.46, 54.37])
  - `'auto'`: Auto-detects based on value ranges (lat: -90 to 90, lng: -180 to 180)
- **Configuration Consistency**: 
  - Client-side variable in `public\global\js\maps.js` named `POLYGON_COORDINATE_ORDER` should match server-side `POLYGON_COORDINATE_ORDER` in services
  - Import script `DB_STORAGE_COORDINATE_ORDER` determines how coordinates are stored in database
  - Current default: `'auto'` for all files (most flexible, handles both formats)
- **Polygon Drawing Flow**:
  1. Map initializes with session data
  2. If coordinates exist immediately → polygon draws after map idle event
  3. If geocoding required → polygon draws after geocoding completes (300ms delay)
  4. Bounds fitting happens after polygon is drawn to ensure visibility
  5. Polygon persists through map center changes
- **Coordinate Normalization**:
  - Handles array format: `[[lng, lat], ...]` or `[[lat, lng], ...]`
  - Handles object format: `[{lat, lng}, ...]` or `[{latitude, longitude}, ...]`
  - Auto-detection uses heuristic: lat is between -90 and 90, lng is between -180 and 180
  - For UAE coordinates (lng ~54, lat ~24), [lng, lat] format is most common
- **No Database Changes Required**: Configuration changes handle coordinate interpretation without modifying existing database data

**Related Documentation**: This builds upon the polygon boundary system implemented in the November 10, 2025 entry

---

### November 10, 2025 - Location Boundary Enforcement & Surcharge Protection System

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented comprehensive geofence validation system to prevent users from selecting locations outside their chosen delivery area, protecting surcharge integrity. Added client-side and server-side validation with automatic marker recentering and user-friendly boundary violation popup.

**Reminder**: The reason why the sublocality selection via `/delivery-location` route must come first prrior to showing the google map on `/location` is that to allow sublocalities to be removed or added subject to service availibility and market requirements. 

#### Major Changes
- **Server-Side Location Validation**: `src/routes/api/index.ts`
  - Created `validateLocationCoordinates()` helper function that reverse geocodes coordinates and validates against selected district/sublocality
  - Integrated validation into `/api/session/location` endpoint - validates coordinates before saving to session
  - Returns 400 error with detailed validation information if coordinates don't match selected area
  - Validation only runs for non-autosave requests to prevent blocking user progress
  - Uses Google Maps Geocoding API to extract district and sublocality from coordinates
- **Client-Side Geofence System**: `public/global/js/maps.js`
  - Stores last valid marker position from initial geocoding of selected area and maintains a canonical `initialSelectedCenter`
  - Initializes selected district/sublocality from session data for boundary validation
  - Validates coordinates on marker drag, map click, and "Detect My Location" button
  - Automatically recenters marker to the selected area's center (fallback to last valid position) when user moves outside boundary
  - Calls `/api/geo/reverse` endpoint to validate coordinates against selected area
  - Handles API failures gracefully - allows action but relies on server-side validation
  - Added `logWarn` function for consistent logging (was missing and causing errors)
- **Visual Boundary Indicator**: `public/global/js/maps.js`
  - Draws delivery area polygons when available, falling back to a semi-transparent circle centered on the selected area
  - Polygon data loads from session (persisted during `/delivery-location` selection) with `/api/geo/area` fallback if missing
  - Circle fallback radius is configurable via `initialLocationData.components.boundaryRadiusMeters` (default: 1000m)
  - Boundary styling toggles to red during violations and reverts to normal after recovery
- **Polygon Boundary Service**: `src/services/areaPolygonService.ts`, `public/global/js/delivery-location.js`
  - Reads polygon coordinates from `deliveryLocations.sublocalities[].polygon` in the database (supports [lng, lat] and [lat, lng] storage)
  - Persists normalized `{ lat, lng }` polygons into session components to avoid redundant API requests on map load
  - Keeps `/api/geo/area` endpoint as a fallback, including logging for missing polygons
- **Polygon Import Utility**: `src/scripts/importGeoJsonPolygon.ts`
  - CLI helper (`npm run polygon:import -- --district="..." --sublocality="..." --file=path`) to normalize GeoJSON polygons and update the `deliveryLocations` table
- **Boundary Violation Popup**: `src/views/wizard/location-finder.hbs` & `public/global/css/kloi_global.css`
  - Created popup UI component that appears when user moves marker outside selected area
  - Displays selected area name (sublocality, district) in popup message
  - "Change My Area" button redirects to `/delivery-location` for area reselection
  - Clicking the "OK" button recenters the pin to the user’s selected area center (canonical initial center; falls back to last valid position) and then dismisses the popup
  - Auto-dismisses after 10 seconds if user doesn't interact
  - Styled with animations and consistent with application design system
  - Popup appears on both client-side validation failures (drag/click) and server-side validation failures (form submit)
- **Form Submission Error Handling**: `public/global/js/maps.js`
  - Enhanced form submission handler to detect boundary validation errors from server
  - Automatically recenters marker to the selected area center and shows popup when server validation fails
  - Provides clear user feedback when location is outside selected delivery area

#### Direction Changes
- **Area Selection Requirement**: Users MUST select their delivery area via `/delivery-location` route before accessing the map page
  - **Business Reason**: Sublocalities can be added or removed from the system based on market demand, operational capacity, and business strategy
  - **Technical Reason**: The selected area determines the surcharge amount, and this must be locked in before map interaction to prevent surcharge manipulation
  - Map page (`/location`) now enforces this workflow - redirects to `/delivery-location` if no area is selected
- **Surcharge Protection**: Prevents users from selecting a lower surcharge area and then moving the marker to a higher surcharge area to avoid paying the correct delivery fee
- **User Experience**: Provides clear guidance when users attempt to move outside their selected area, with option to change their area selection if needed

#### Files Affected
- `src/routes/api/index.ts` (MODIFIED) - Added `validateLocationCoordinates()` function and integrated validation into location step handler
- `public/global/js/maps.js` (MODIFIED) - Added geofence validation, canonical selected area center, polygon/circle boundary rendering, guarded last-valid updates, popup display logic, and form submission error handling
- `public/global/js/delivery-location.js` (MODIFIED) - Persists selected sublocality polygon metadata to session components
- `src/services/areaPolygonService.ts` (NEW/MODIFIED) - Supplies polygons from `deliveryLocations` JSONB with DB fallback and format normalization
- `src/views/wizard/location-finder.hbs` (MODIFIED) - Added boundary violation popup HTML structure
- `public/global/css/kloi_global.css` (MODIFIED) - Added popup styling with animations and responsive design
- `src/services/deliveryLocationsService.ts` (MODIFIED) - Normalizes polygon coordinates when building city/sublocality payloads
- `src/schemas/wizard.schemas.ts` (MODIFIED) - Allows structured component metadata (e.g., polygons) in location session schema
- `src/scripts/importGeoJsonPolygon.ts` (NEW) - Imports GeoJSON polygons into `deliveryLocations` JSONB entries

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- **Validation Flow**:
  1. User selects area on `/delivery-location` → session stores district, sublocality, and surcharge
  2. User navigates to `/location` → map initializes with selected area, stores canonical `initialSelectedCenter`, and sets last valid position to this center
  3. User drags/clicks marker → client validates via `/api/geo/reverse` endpoint
  4. If outside boundary → marker recenters, popup appears
  5. User submits form → server validates coordinates again before saving
  6. If server validation fails → popup appears, marker recenters, error message displayed
- **Validation Strategy**: Dual-layer validation (client + server) ensures surcharge integrity
  - Client-side validation provides immediate feedback and prevents invalid marker positions
  - Server-side validation is the final authority and prevents API manipulation
- **Error Handling**: 
  - If reverse geocoding API fails (e.g., `REQUEST_DENIED`), client allows action but server will validate
  - If reverse geocoding returns null district/sublocality, client allows but server validates
  - Server validation failures trigger popup and marker recentering to the selected area center for better UX
- **Last Valid Position**: Stored when map initializes and only updated when a move is confirmed inside the selected area (district or sublocality match); guarded against updates when reverse geocoding cannot confirm area
- **Recenter Utilities**: Introduced `recenterToSelectedArea()` (prefers canonical center; falls back to last valid) and retained `recenterToLastValidPosition()` for internal uses
- **Visual Boundary**: Uses persisted polygon coordinates when available (with circle fallback); boundary styling switches to red during violations and resets after recenter/dismiss
- **Polygon Persistence**: `/delivery-location` injects `{ lat, lng }` polygon paths into session, avoiding additional area fetches on `/location`
- **Area Polygon Endpoint**: `/api/geo/area` reads polygons from `deliveryLocations` JSONB with tolerant matching (district+sublocality or sublocality-only) and coordinate normalization
- **Popup Display**: Shows selected area name dynamically from session data (sublocality, district)
- **Area Selection Requirement**: 
  - Users cannot access `/location` without first selecting an area on `/delivery-location`
  - This ensures surcharge is always tied to a valid delivery area from the database
  - Sublocalities are managed in the database and can be updated based on market conditions
- **Surcharge Integrity**: The surcharge amount is determined by the area selection on `/delivery-location` and cannot be changed by moving the marker on the map

**Related Documentation**: This builds upon the location finder integration (Nov 8, 2025 entry) and delivery location selector (Nov 7, 2025 entry)

---

### November 8, 2025 - Location Finder Integration with Delivery Locations & Enhanced Database Location Storage

**Type**: 🟠 MAJOR CHANGE

**Summary**: Integrated the location finder page with the delivery locations workflow, removed Google autocomplete functionality, and enhanced database location storage to include all delivery location metadata (country, city, sublocality, surcharge) collected from the delivery-locations page.

#### Major Changes
- **Location Finder Route Integration**: `src/routes/locationFinder.ts`
  - Now reads `locationData` from session (set by delivery-locations page)
  - Redirects to `/delivery-location` if no location data exists in session
  - Passes location data to template as JSON for map initialization
  - Removed query parameter dependency (district/sublocality from URL)
- **Google Maps Autocomplete Removal**: `src/views/wizard/location-finder.hbs` & `public/global/js/maps.js`
  - Removed autocomplete input container and clear button from template
  - Removed all autocomplete-related code from maps.js (input handlers, autocomplete instance, places library)
  - Map now centers on user's selected location from delivery-locations page using session data
  - Removed default center fallback - map always uses session location data
  - Added geocoding functionality to convert session address to coordinates if needed
- **Delivery Location Redirect Update**: `public/global/js/delivery-location.js`
  - Changed redirect from `/location?district=...&sublocality=...` to `/location`
  - Session data is now the single source of truth for location information
- **Route Reference Cleanup**: `src/routes/eventSetup.ts` & `src/hooks/sessionHooks.ts`
  - Updated eventSetup redirect from `/location-finder` to `/delivery-location`
  - Removed `/location-finder` from public routes (route is `/location`)
  - Updated session hook documentation to reflect new entry point
- **CSS Cleanup**: `public/global/css/kloi_global.css`
  - Removed unused autocomplete container and input styles
- **Enhanced Database Location Storage**: `src/routes/api/index.ts`
  - Created `buildLocationObject()` helper function to construct complete location object from session data
  - **Critical Component Preservation Logic**: When map page (`/location`) submits location data, the system preserves the `components` object from delivery-location page
    - Map page only sends: `latitude`, `longitude`, `fullAddress` (from geocoding)
    - Delivery-location `components` (country, city, sublocality, district, surcharge, selectionSource) are preserved in session
    - Merge logic: `{ ...mapData, components: existingComponents }` ensures delivery-location metadata is never lost
  - Location JSONB now includes all delivery location fields:
    - `latitude` and `longitude` (from map selection/geocoding)
    - `fullAddress` (from map geocoding, may differ from delivery-location address)
    - `country` (from delivery-locations selection via `components.country`)
    - `city` (from delivery-locations selection via `components.city`)
    - `sublocality` (from delivery-locations selection via `components.sublocality`)
    - `district` (from delivery-locations selection via `components.district`)
    - `surcharge` (from delivery-locations selection via `components.surcharge`, converted to number)
    - `selectionSource` (metadata about how location was selected, e.g., "manual-dropdown")
  - Updated all order creation points to use enhanced location object:
    - Event-details step order creation
    - Date-picker step order creation (when creating new order)
    - Event-setup step order creation (when creating new order)

#### Direction Changes
- **Workflow Integration**: Location finder is now a continuation of delivery-locations workflow rather than standalone
- **Session-First Architecture**: Session data is the primary source of location information, eliminating URL parameter dependencies
- **Simplified User Flow**: Removed redundant autocomplete search - users select area from delivery-locations page, then fine-tune on map
- **Complete Location Metadata**: Database now stores comprehensive location information including delivery surcharges for accurate pricing

#### Files Affected
- `src/routes/locationFinder.ts` (MODIFIED)
- `src/views/wizard/location-finder.hbs` (MODIFIED)
- `public/global/js/maps.js` (MODIFIED)
- `public/global/js/delivery-location.js` (MODIFIED)
- `src/routes/eventSetup.ts` (MODIFIED)
- `src/hooks/sessionHooks.ts` (MODIFIED)
- `public/global/css/kloi_global.css` (MODIFIED)
- `src/routes/api/index.ts` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Location finder page now requires valid `locationData` in session - redirects to `/delivery-location` if missing
- Google Maps Places library no longer loaded (autocomplete removed)
- Map initialization uses `initialLocationData` parameter from session
- **Component Preservation Flow**:
  1. Delivery-location page saves: `{ fullAddress, components: { city, country, district, sublocality, surcharge, selectionSource } }`
  2. Map page updates: `{ latitude, longitude, fullAddress }` (components NOT included in request)
  3. Server merge logic preserves existing `components` from session: `{ ...mapData, components: existingComponents }`
  4. Final session contains: map coordinates + delivery-location metadata
- Location object in database includes all delivery location metadata for complete order context
- `buildLocationObject()` function prioritizes `components.*` values over top-level fields (ensures delivery-location data takes precedence over map geocoding)
- Surcharge is converted from string to number for proper database storage
- **Critical**: Delivery-location metadata (country, city, sublocality, district, surcharge, selectionSource) MUST come from `/delivery-location` page, NOT from map geocoding

**Related Documentation**: This builds upon the delivery location selector implementation (Nov 7, 2025 entry)

---

### November 7, 2025 - Delivery Location City/Sublocality Selector

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Rebuilt the delivery location intake experience with city-first selection, searchable sublocality dropdown, and session persistence that now carries surcharge metadata pulled from the new `deliveryLocations` schema.

#### Major Changes
- **Delivery Locations Service Aggregation**: `src/services/deliveryLocationsService.ts`
  - Normalizes JSONB sublocalities into typed structures containing `name`, `district`, and `surcharge`
  - Aggregates rows per city so UI can render merged dropdowns even when districts live in separate DB rows
- **Delivery Location Route Payload**: `src/routes/deliveryLocation.ts`
  - Serializes the aggregated city payload safely for client consumption
  - Supplies JSON data for the city/sub-locality workflow
- **New Single-Page UI**: `src/views/delivery-locations.hbs`
  - Guides user through city selection, searchable/touch-friendly sublocality dropdown, and confirmation CTA
  - Hooks into centralized wizard progress utilities for session saves
- **Client Workflow Enhancements**: `public/global/js/delivery-location.js`
  - Implements city tabbing, autocomplete filter, confirm flow, and geolocation auto-select with surcharge persistence
  - Saves selected sublocality + surcharge into `session.locationData` via `/api/session/location`
- **Dedicated Styling**: `public/global/css/delivery_locations.css`
  - Moved inline CSS into standalone stylesheet following app-wide conventions
- **Session Typings**: `src/types/fastify-session.d.ts`
  - Expanded `locationData` shape to allow surcharge, district, and manual selection metadata

#### Migration Notes
- 🔵 `prisma/migrations/20251106120000_add_delivery_locations_table` must be deployed (or corresponding SQL executed) so new `country` and `city` columns exist alongside `sublocalities`
- Seed/update data using the new structure (see `ADD-DISTRICTS.sql` as reference)

#### Files Affected
- `src/services/deliveryLocationsService.ts`
- `src/routes/deliveryLocation.ts`
- `src/views/delivery-locations.hbs`
- `public/global/js/delivery-location.js`
- `public/global/css/delivery_locations.css`
- `src/types/fastify-session.d.ts`
- `prisma/migrations/20251106120000_add_delivery_locations_table`

---

### November 4, 2025 - Wizard Autosave Mode and Partial Session Merge

**Type**: 🟠 MAJOR CHANGE

**Summary**: Improved reliability of progress saving on back/refresh/navigation by introducing an autosave mode in the client module and lenient, partial-merge handling on the server. This prevents data loss when users use the browser back button or close/refresh mid-edit.

#### Major Changes
- **Client Autosave Mode**: `public/global/js/wizard__progress.js`
  - `saveWizardStep(step, payload, { autosave: true })` now appends `?autosave=1` and sends header `X-KLOI-AutoSave: 1`
  - `enableAutoSaveOnChange()` performs debounced autosaves using autosave mode
  - Unload/back-button flush posts with autosave markers and keepalive fallback
- **Server Partial Merge + Lenient Validation**: `POST /api/session/:step`
  - Detects autosave via query `?autosave=1` OR header `X-KLOI-AutoSave: 1`
  - Skips strict Zod validation for autosave requests
  - Merges partial payloads into existing `session[sessionKey]` instead of replacing
  - Skips DB writes in autosave context (e.g., for `event-details`)

#### Direction Changes
- **Resilience-first Persistence**: Treat navigation/back/unload saves as best-effort and non-blocking while still preserving user progress
- **Consistency**: Uniform autosave semantics across wizard steps via centralized module

#### Files Affected
- `public/global/js/wizard__progress.js` (MODIFIED)
- `src/routes/api/index.ts` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Autosave signals: query `?autosave=1` and header `X-KLOI-AutoSave: 1`
- Autosave merges into existing session state and avoids strict validation/DB writes
- Normal submissions retain strict validation and existing redirect behavior

---

### November 3, 2025 - Reusable Wizard Progress Module

**Type**: 🟠 MAJOR CHANGE

**Summary**: Any button or link that forces a page navigation or refresh must save the users progress to the session cookie, therefore a centralized JavaScript module has been introduced for single interception/save implementation across this wizard, ensuring consistent session persistence before any navigation or page refreshes.

#### Major Changes
- **New Module**: `public/global/js/wizard__progress.js`
  - `saveWizardStep(step, payload)`: Generic POST to `/api/session/:step`
  - `attachSaveBeforeNavigate(selector, step, payloadBuilder)`: Intercepts navigation, saves, then proceeds
  - `collectEventSetupFormData(form)`: Standard collector for event-setup page
- **Back Button/Data Loss Protection**: Added continuous auto-save and unload flush
  - `enableAutoSaveOnChange(form, step, payloadBuilder, options)`: Debounced auto-save on input changes
  - Final save attempt on `beforeunload`/`pagehide`/`visibilitychange` using `navigator.sendBeacon` with fetch keepalive fallback
- **Refactor**: `src/views/wizard/event-setup.hbs` now uses the centralized module
  - Removed duplicate local `collectFormData()` and `saveProgressToSession()`
  - Uses `attachSaveBeforeNavigate('.edit-date-btn', 'event', ...)` for the Edit Date link
  - Form submission collector unified via `collectEventSetupFormData()`

#### Direction Changes
- **Consolidation**: Progress saving logic moved from per-page scripts to a single reusable module
- **Consistency**: Unified logging and behavior across all wizard navigation points

#### Files Affected
- `public/global/js/wizard__progress.js` (NEW)
- `src/views/wizard/event-setup.hbs` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Navigation interception shows a warning but still proceeds if the save fails
- Designed to be extended with additional collectors for other steps (e.g., customer details)
- Emoji-prefixed logs included for observability per project standards
- Auto-save reduces risk of data loss when using browser back/forward or refresh

---

### November 3, 2025 - Wizard Progress Saving on Navigation

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented automatic progress saving when users navigate between wizard steps via links or buttons, ensuring user selections are preserved in session cookies before page navigation.

#### Major Changes
- **Progress Saving on Navigation**: Added automatic session save functionality for all navigation actions in the wizard
  - **Edit Event Date Link**: "Edit Event Date" link on `/event-setup` now saves form selections to session before navigating to `/date-picker`
  - **User Experience**: Users can now safely navigate back and forth between wizard steps without losing their progress
  - **Form Data Collection**: Created reusable `collectFormData()` function to gather radio selections, checkbox selections, and product quantities
  - **Session Save Function**: Implemented `saveProgressToSession()` function that saves current selections via `/api/session/event` endpoint

- **Navigation Handler**: Enhanced "Edit Event Date" link with click handler that:
  - Prevents default navigation
  - Collects current form state
  - Saves progress to session cookie via API
  - Navigates only after successful save
  - Provides user feedback if save fails

#### Direction Changes
- **Navigation Philosophy**: Shift from losing progress on navigation to preserving all user selections automatically
- **Session Management**: Centralized progress saving ensures consistent behavior across all navigation points
- **User Experience**: Improved confidence for users to explore and modify their selections throughout the wizard flow

#### Files Affected
- `src/views/wizard/event-setup.hbs` (MODIFIED) - Added progress saving functionality to "Edit Event Date" link

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Progress is saved automatically before any navigation that would cause data loss
- The `collectFormData()` function gathers:
  - `radioSelections`: All selected radio button choices grouped by name
  - `checkboxSelections`: All checked checkbox options
  - `productQuantities`: All product quantity inputs with values > 0
- Progress saving uses the same `/api/session/event` endpoint as form submission, ensuring consistency
- If save fails, user is warned but navigation still proceeds to prevent blocking user workflow
- This pattern should be applied to all navigation links/buttons throughout the wizard to maintain consistency

**Related Documentation**: This complements the back button fix implemented in the previous entry (Nov 2, 2025 - Back Button UX Fix)

---

### November 2, 2025 - Back Button UX Fix: PENDING Orders Don't Lock Dates

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical UX issue where customers hitting browser back button would see their own selected dates locked as "BOOKED", preventing them from modifying their date selection.

#### Major Changes
- **Booked Dates API Logic Update**: Modified `/api/booked-dates` endpoint to exclude `PENDING` orders from locking dates
  - **Before**: Dates from `PENDING` and `IN_PROGRESS` orders were locked
  - **After**: Only dates from `IN_PROGRESS`, `CANCELLED`, and `COMPLETED` orders lock dates
  - **Business Logic**: Dates remain available until checkout is completed (order status progresses beyond PENDING)

- **Session-Aware Query**: Enhanced booked dates endpoint to accept session context for better debugging and future enhancements
  - Extracts `sessionId` from request for logging and potential future optimizations
  - Added status breakdown logging for better monitoring

#### Direction Changes
- **Booking Availability Logic**: Shift from locking dates immediately upon selection to locking only after order confirmation
- **User Experience**: Improved flexibility for customers to modify selections before checkout completion
- **Order Status Integration**: Aligned date locking behavior with order status lifecycle

#### Files Affected
- `src/routes/api/index.ts` (MODIFIED) - Updated `/api/booked-dates` endpoint filtering logic

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Dates are locked only when order status is beyond `PENDING`:
  - `PENDING`: Does NOT lock dates (customer can still modify)
  - `IN_PROGRESS`: Locks dates (order confirmed/in progress)
  - `CANCELLED`: Locks dates (prevents immediate re-booking)
  - `COMPLETED`: Locks dates (event completed)
- This ensures dates remain selectable until checkout is fully completed
- Back button functionality now works correctly - customers can return to date picker and modify their selections if order is still PENDING

**Related Documentation**: Implementation aligns with `docs/ORDER_STATUS_SYSTEM.md` order status definitions

---

### Date Picker System with Booked Dates Integration

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented comprehensive date picker system with real-time booked dates synchronization, multi-day selection, and intelligent date reservation algorithm.

#### Major Changes
- **Date Picker Component**: Complete calendar-based date selection system (`date__picker.js`)
  - **Multi-Month Display**: Shows 7 months ahead (current month + 6 months) with month navigation pills
  - **6-Month Booking Window**: Limits date selection to 6 months from current date
  - **Multi-Day Selection**: Support for selecting multiple dates for extended events
  - **Time Range Selection**: Start and end time pickers (7:00 AM - 11:00 PM, with midnight option)
  - **Time Validation**: Automatic end time adjustment to ensure end time is after start time
  - **Past Date Prevention**: Disables selection of past dates and booked dates
  - **Visual Feedback**: Clear indication of booked dates, selected dates, and unavailable dates

- **Server Time Synchronization**: 
  - **New API Endpoint**: `GET /api/server-time` - Provides server time for accurate date calculations
  - Prevents client-side timezone issues
  - Graceful fallback to client time with warning message

- **Booked Dates Integration**:
  - **New API Endpoint**: `GET /api/booked-dates` - Retrieves booked dates from database
  - Real-time synchronization of booked dates from `KloiOrders` table
  - Filters bookings by status (`IN_PROGRESS`, `CANCELLED`, `COMPLETED`) to show only confirmed bookings
  - ⚠️⚠️⚠️ **UPDATED**: Excludes `PENDING` orders - dates only lock after checkout completion (see Nov 2, 2025 entry)
  - Extracts dates from `eventDateTime` JSONB field
  - Automatic deduplication of dates from multiple orders

- **Reserved Dates "Snake Pick" Algorithm**:
  - Automatically reserves the next N unbooked days from current date (default: 3 days)
  - Prevents double-booking by reserving upcoming days not yet in database
  - Distinguishes between database-booked dates and system-reserved dates
  - Configurable via `defaultBookedDays` property
  - Fallback logic when booked dates API fails

- **Booking Submission**:
  - **API Integration**: `POST /api/session/date` - Submits selected dates and times
  - Maintains booking data in session for wizard flow
  - Loading states and success/error handling
  - Automatic redirect to next wizard step on success

- **User Experience Enhancements**:
  - Auto-hiding warning messages (8-second display)
  - Full month name display (e.g., "January 2025")
  - Formatted date display in booking summary
  - Error handling with user-friendly messages
  - Session validation integration

#### Direction Changes
- **Real-Time Availability**: Shift from static availability to dynamic database-driven booking system
- **Date Management**: Centralized date booking logic with server-side validation
- **User Interface**: Calendar-based booking experience replacing simple form inputs
- **Data Flow**: Integration of frontend calendar with backend order system

#### Files Affected
- `public/global/js/date__picker.js` (NEW/MODIFIED)
- `src/routes/api/index.ts` (MODIFIED) - Added `/api/booked-dates` and `/api/server-time` endpoints
- `src/routes/api/index.ts` (MODIFIED) - Enhanced `/api/session/date` endpoint
- `src/routes/datePicker.ts` (MODIFIED)
- `src/views/wizard/date-picker.hbs` (MODIFIED)

#### Technical Notes
⚠️⚠️⚠️ **Important Implementation Details**:
- Booked dates API filters orders by status: only `IN_PROGRESS`, `CANCELLED`, and `COMPLETED` orders lock dates
- ⚠️⚠️⚠️ **UPDATED (Nov 2, 2025)**: `PENDING` orders are excluded - dates remain available until checkout completion
- Date format: `YYYY-MM-DD` (ISO format)
- Reserved dates are computed client-side to avoid unnecessary API calls
- Server time endpoint ensures accurate date comparisons across timezones
- The "snake pick" algorithm has a 365-day safety window to prevent infinite loops

**Related Documentation**: Implementation comments in `date__picker.js` provide detailed code documentation

---

### October 21, 2025 - Customer Conflict Resolution System

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Implemented email sanitization and customer conflict resolution with composite uniqueness constraint.

#### Breaking Changes
- **Database Schema**: Added composite unique constraint on `(phone, email)` in `Customers` table
  - **Impact**: Existing duplicate phone-email combinations will cause migration failure
  - **Action Required**: Clean duplicate data before migration
  - **Migration**: `20251021192122_add_composite_unique_phone_email`

#### Major Changes
- **New Service**: `conflictResolutionService.ts` - Handles customer conflict detection and resolution
- **New API Endpoint**: `/api/resolve-conflict` - POST endpoint for user-confirmed conflict resolution
- **New UI Component**: `conflict-popup.hbs` - Reusable conflict resolution modal
- **Email Sanitization**: New `sanitizeEmail()` utility function in `src/lib/utils.ts`
  - Normalizes emails to lowercase
  - Trims whitespace
  - Converts empty strings to `null`

#### Direction Changes
- **Customer Data Integrity**: Shifted from allowing duplicates to enforcing composite uniqueness
- **Conflict Handling**: Introduced user-driven conflict resolution flow instead of automatic overwrite
- **Email Normalization**: Standardized email handling across the application

#### Files Affected
- `src/services/conflictResolutionService.ts` (NEW)
- `src/views/partials/conflict-popup.hbs` (NEW)
- `src/lib/utils.ts` (MODIFIED)
- `src/routes/api/index.ts` (MODIFIED)
- `src/views/wizard/event-details.hbs` (MODIFIED)
- `prisma/schema.prisma` (MODIFIED)

#### Migration Notes
⚠️⚠️⚠️ **Pre-Migration Check Required**:
```sql
SELECT phone, email, COUNT(*) 
FROM "Customers" 
GROUP BY phone, email 
HAVING COUNT(*) > 1;
```

**Related Documentation**: `21-OCT-2025_CONFLICT_RESOLUTION_IMPLEMENTATION.md`

---

### October 21, 2025 - Order Status Enum System

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Centralized order status management with enum type and helper functions.

#### Breaking Changes
- **Database Schema**: Added `OrderStatus` enum type
  - **Impact**: Status values must now match enum values exactly
  - **Migration**: `20251021193000_add_order_status_enum`

#### Major Changes
- **Centralized Status System**: Single source of truth for order statuses
  - **Status Values**: `pending`, `confirmed`, `cancelled`, `completed`, `refunded`
  - **Status Groups**: Active, Final, etc.
  - **Helper Functions**: Type-safe status checking and validation

#### Direction Changes
- **Type Safety**: Moved from string-based status to enum-based system
- **Centralization**: Replaced hardcoded status values with centralized constants
- **Standardization**: Enforced consistent status handling across application

#### Migration Notes
⚠️⚠️⚠️ **IMPORTANT**: Any hardcoded status values in the codebase should be replaced with the centralized system.

**Related Documentation**: `docs/ORDER_STATUS_SYSTEM.md`

---

### September 16, 2025 - Email Field Made Nullable

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Email field in Customers table made optional to support phone-only registrations.

#### Breaking Changes
- **Database Schema**: `email` field in `Customers` table changed to nullable
  - **Impact**: Code assuming email is always present may break
  - **Migration**: `20250916110500_make_email_nullable`

#### Major Changes
- **Flexible Registration**: Customers can now register with phone number only
- **Data Validation**: Updated validation logic to handle null emails

#### Direction Changes
- **Customer Data Model**: Shift from email-required to email-optional model
- **Accessibility**: Support for users without email addresses

---

### July 8, 2025 - Customer Name Schema Update

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Separated customer name into first and last name fields.

#### Breaking Changes
- **Database Schema**: Replaced single `name` field with `firstName` and `lastName`
  - **Impact**: All queries using `name` field must be updated
  - **Migration**: `20250707185421_update_customers_schema_for_first_last_name`

#### Major Changes
- **Data Structure**: Improved customer name handling with separate fields
- **Form Updates**: Updated customer information forms to use separate fields

#### Migration Notes
⚠️⚠️⚠️ **Data Migration**: Existing `name` values may need to be split into `firstName` and `lastName`.

---

### July 7, 2025 - Event Time Schema Refactoring

**Type**: 🔴 BREAKING CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Refactored event datetime handling from single field to separate start/end times.

#### Breaking Changes
- **Database Schema**: 
  - Replaced `eventDatetime` with `eventStartTime` and `eventEndTime`
  - **Impact**: All queries and code referencing `eventDatetime` must be updated
  - **Migrations**: 
    - `20250707172119_update_event_time_to_start_end_times`
    - `20250707172807_remove_redundant_event_datetime_column`
    - `20250708171636_merge_event_datetime_columns`

#### Major Changes
- **Time Range Support**: Applications now support events with duration (start and end times)
- **Validation**: Updated validation to handle time ranges

#### Direction Changes
- **Event Model**: Shift from point-in-time events to time-range events
- **Booking System**: Enhanced support for multi-hour events

---

### July 5, 2025 - Session Foreign Key Removal

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Removed foreign key constraint on session references.

#### Breaking Changes
- **Database Schema**: Removed session foreign key relationship
  - **Migration**: `20250705094422_remove_session_foreign_key`

#### Major Changes
- **Session Management**: Decoupled session references from strict database constraints
- **Flexibility**: Allows for more flexible session handling

#### Direction Changes
- **Session Handling**: Move from database-enforced to application-enforced session management

---

### July 4, 2025 - Order Number Sequence Reset

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Order number sequence updated to start from 1000.

#### Major Changes
- **Order Numbering**: Order numbers now start from 1000 instead of 1
  - **Migration**: `20250704124406_update_order_number_start_1000`

#### Direction Changes
- **Order Presentation**: Professional order numbering starting from 1000

---

### July 4, 2025 - Initial Orders Table Creation

**Type**: 🔵 MIGRATION REQUIRED

**Summary**: Created initial KloiOrders table structure.

#### Major Changes
- **New Table**: `KloiOrders` table created with initial schema
  - **Migration**: `20250704123452_create_kloi_orders_table`

---

### June 4, 2025 - Initial Database Schema

**Type**: 🔵 MIGRATION REQUIRED

**Summary**: Initial database migration with core schema.

#### Major Changes
- **Initial Schema**: Complete database structure established
  - **Migration**: `20250604221735_init`

---

## Change Log Guidelines

### How to Add New Entries

When documenting changes, follow this format:

```markdown
### [Date] - [Brief Title]

**Type**: [Category tags]

**Summary**: One-line description of the change.

#### Breaking Changes
- **Component**: Description of breaking change
  - **Impact**: What will break
  - **Action Required**: What needs to be done
  - **Migration**: Migration name if applicable

#### Major Changes
- **Feature/Component**: Description of major change
- Additional changes...

#### Direction Changes
- **Theme**: Description of strategic shift

#### Files Affected
- List of modified/new files

#### Migration Notes
Any special migration instructions
```

### Categories

- **BREAKING CHANGE**: Code changes required, functionality may break
- **MAJOR CHANGE**: Significant feature/modification, may require updates
- **DIRECTION CHANGE**: Strategic shift in architecture or approach
- **MIGRATION REQUIRED**: Database or schema changes
- **DEPRECATED**: Phased-out features

---

## Quick Reference

### Active Migrations (Most Recent First)
1. `20251021193000_add_order_status_enum` - Order status enum system
2. `20251021192122_add_composite_unique_phone_email` - Composite uniqueness constraint
3. `20250916110500_make_email_nullable` - Email field nullable
4. `20250708171636_merge_event_datetime_columns` - Event time refactoring
5. `20250707185421_update_customers_schema_for_first_last_name` - Name field split

### Recent UX Improvements
1. Wizard progress saving on navigation - automatic session save when navigating between steps (Nov 2, 2025)
2. Back button fix - PENDING orders don't lock dates (Nov 2, 2025)

### Active Breaking Changes
1. Customer composite uniqueness constraint (Oct 21, 2025)
2. Order status enum system (Oct 21, 2025)
3. Customer name field split (July 8, 2025)
4. Event time refactoring (July 7, 2025)

### Strategic Direction Changes
1. Automatic progress saving on navigation - preserve user selections across wizard steps (Nov 2, 2025)
2. Calendar-based booking experience with real-time availability
3. Booking availability tied to order status lifecycle - dates unlockable until checkout (Nov 2, 2025)
4. Email-optional customer registration (Sept 16, 2025)
5. User-driven conflict resolution (Oct 21, 2025)
6. Centralized order status management (Oct 21, 2025)
7. Time-range event support (July 7, 2025)

---

## Notes

- ⚠️⚠️⚠️ Always check this document before planning migrations
- 🔵 Review related migration files in `prisma/migrations/`
- 📋 Check for related documentation in `docs/` directory
- 🔍 Search codebase for deprecated patterns before removing features

---