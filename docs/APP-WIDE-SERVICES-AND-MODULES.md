## KLOI App-Wide Services, Modules, and Required Conventions

This document captures critical, cross-cutting behaviors that every page, route, and feature must follow. Use this as a checklist before adding new pages/routes to avoid regressions or duplicated logic.

### Theming by Subdomain (Required on All Pages/Routes)

- All requests are themed by subdomain via middleware. The resolved theme is attached to `request` as `request.theme` and should be passed into views.

Code reference – middleware registration and usage:
```132:138:src/app.ts
app.addHook('preHandler', detectThemeFromSubdomain);

app.get('/', async (request, reply) => {
  let theme: string | undefined;
  let isApexDomain = false;
  if (typeof request.hostname === 'string') {
```

Code reference – theme detector:
```1:10:src/lib/themeDetector.ts
// Middleware for subdomain-based theming
import { FastifyRequest, FastifyReply } from 'fastify';

export function getThemeFromHost(hostname: string): string {
  const subdomain = hostname.split('.')[0];
  const theme = subdomain || process.env.THEME_DEFAULT || 'default';
  return theme;
}
```

Required when adding a new route that renders a view:
- Read `const theme = (request as any).theme || 'default'`.
- Pass `theme` into `reply.view(templatePath, { theme, ... })`.

Example usages:
```12:19:src/routes/eventSummary.ts
  // [THEME] Detect theme from request (set by middleware)
  const theme = (request as any).theme || 'default';
  const templatePath = 'wizard/event-summary';
  const page_class = generatePageClass(templatePath);
  console.log('🟡🟡🟡 - [ROUTE] Theme for event-summary:', theme);
```

```7:15:src/routes/datePicker.ts
  app.get('/date-picker', (request: FastifyRequest, reply: FastifyReply) => {
    // [DATE PICKER] Session validation is handled by validateWizardSession preHandler hook
    const theme = (request as any).theme || 'default';
    // console.log('🟡🟡🟡 - [DATE PICKER] Rendering date picker page with theme:', theme);
```

### Wizard Progress Saving (Navigation, Back/Refresh, Autosave)

All wizard pages must save user progress before any navigation that would cause a page unload. This is centralized in `public/global/js/wizard__progress.js`.

Key client behaviors:
- `attachSaveBeforeNavigate(selector, step, payloadBuilder)`: intercept links/buttons, save, then navigate.
- `enableAutoSaveOnChange(formEl, step, payloadBuilder, options)`: debounced autosave on input changes.
- `saveWizardStep(step, payload, { autosave: true })`: marks autosave via `?autosave=1` and `X-KLOI-AutoSave: 1`.
- Unload flush on `beforeunload`, `pagehide`, and `visibilitychange` via `sendBeacon` or fetch keepalive.

Code reference – client module:
```11:22:public/global/js/wizard__progress.js
async function saveWizardStep(step, data, options) {
  // Support autosave mode for lenient server handling
  console.log('🟡🟡🟡 - [WIZARD PROGRESS] Saving step to session:', step, data);
  try {
    var isAutosave = options && options.autosave === true;
    var url = `/api/session/${step}` + (isAutosave ? '?autosave=1' : '');
    var headers = { 'Content-Type': 'application/json' };
    if (isAutosave) {
      headers['X-KLOI-AutoSave'] = '1';
    }
```

Server handling (API):
- Endpoint: `POST /api/session/:step`.
- Detects autosave via query `?autosave=1` OR header `X-KLOI-AutoSave: 1`.
- For autosave: skip strict Zod validation, and merge partial payload into `session[sessionKey]` instead of replacing; skip DB writes where applicable (e.g., for `event-details`).
- For normal submissions: validate strictly and perform DB persistence per step behavior.

Code reference – autosave detection and merge:
```591:599:src/routes/api/index.ts
// Detect autosave mode (query or header)
const q = (request as any).query || {};
const autosaveQuery = q.autosave === '1' || q.autosave === 1 || q.autosave === true;
const autosaveHeader = (request.headers['x-kloi-autosave'] === '1');
const isAutoSave = !!(autosaveQuery || autosaveHeader);
```

```658:666:src/routes/api/index.ts
// Store the data in session. For autosave, merge with existing data.
if (sessionKey) {
  const beforeUpdate = { ...request.session };
  const current = ((request.session as any)[sessionKey]) || {};
  const nextValue = isAutoSave ? { ...current, ...(validatedData as any) } : validatedData;
  (request.session as Record<string, any>)[sessionKey] = nextValue;
  console.log(`🟡🟡🟡 - [API ROUTE] Setting session[${sessionKey}] =`, JSON.stringify(nextValue, null, 2));
}
```

Implementation requirement for any wizard page or interactive form:
- Include `public/global/js/wizard__progress.js`.
- On any link or button that changes page, call `attachSaveBeforeNavigate(...)` with the correct `step` and a payload builder for current form state.
- Enable autosave for forms using `enableAutoSaveOnChange(...)` with a payload builder.

Example usage in `event-setup` page:
```598:605:src/views/wizard/event-setup.hbs
if (window.KloiWizardProgress) {
  window.KloiWizardProgress.attachSaveBeforeNavigate(
      '.edit-date-btn',
      'event',
      function () { return window.KloiWizardProgress.collectEventSetupFormData(form); }
  );
}
```

```642:649:src/views/wizard/event-setup.hbs
// [AUTO-SAVE] Enable continuous auto-save to protect against back button/page refresh
if (window.KloiWizardProgress) {
  window.KloiWizardProgress.enableAutoSaveOnChange(
      form,
      'event',
      function () { return window.KloiWizardProgress.collectEventSetupFormData(form); },
      { debounceMs: 700, inputsSelector: 'input, select, textarea' }
  );
}
```

Changelog source of truth (policies and rationales):
```17:33:docs/CHANGELOG.md
### November 4, 2025 - Wizard Autosave Mode and Partial Session Merge

**Type**: 🟠 MAJOR CHANGE

**Summary**: Improved reliability of progress saving ... autosave mode ... lenient, partial-merge handling on the server.
```

```50:68:docs/CHANGELOG.md
### November 3, 2025 - Reusable Wizard Progress Module
...
- `attachSaveBeforeNavigate(selector, step, payloadBuilder)`
- `enableAutoSaveOnChange(form, step, payloadBuilder, options)`
```

### Session and Cookie Management (Redis-backed)

- Sessions are required by the wizard and are persisted in Redis via a custom store adapter.
- Configuration lives in `src/app.ts` with `@fastify/session`, a secure cookie, and TTL.

Code reference – session setup:
```98:117:src/app.ts
// Configure session
const sessionTTL = parseInt(process.env.REDIS_SESSION_TTL || '86400', 10);
app.register(fastifySession, {
  secret: process.env.REDIS_SESSION_SECRET || 'keyboardcatkeyboardcatkeyboardcatkeyboardcat',
  cookieName: process.env.SESSION_COOKIE_NAME || 'kloi_sessionId',
  cookie: {
    path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: 'lax', maxAge: sessionTTL * 1000
  },
  store: createRedisStore(sessionTTL),
  saveUninitialized: false,
  rolling: true
});
```

Code reference – Redis session store adapter:
```4:13:src/lib/session-store.ts
// Create Redis store for use with @fastify/session
export function createRedisStore(ttl = 86400): SessionStore {
  try {
    // Get Redis client using existing utility function
    const client = getRedisClient();

    // Create a simple session store adapter
    // This wraps the Redis client directly, implementing the SessionStore interface
```

Developer requirements when adding new wizard steps/routes:
- Verify `request.session` exists and read/write via the mapped keys in API `stepConfig`.
- Do not write PII to logs; follow existing patterns for partial IDs or structural hints.

### Admin Interface Authentication and Theme-Scoped Access

- Admin routes are protected by authentication middleware and theme-scoped to match subdomain theming.
- Admin sessions are stored in Redis-backed session store (same as wizard sessions).
- Admin authentication uses bcrypt password hashing (10 salt rounds).
- Each admin account is scoped to a specific theme subdomain.

Code reference – admin authentication hook:
```13:52:src/hooks/adminHooks.ts
export const validateAdminSession = async (request: FastifyRequest, reply: FastifyReply) => {
  // Check for admin session
  // Verify admin exists, is active, and has access to current theme
  // Redirect to /admin/login if not authenticated
```

Code reference – admin service:
```30:75:src/services/adminService.ts
export class AdminService {
  static async hashPassword(password: string): Promise<string>
  static async verifyPassword(password: string, hash: string): Promise<boolean>
  static async authenticateAdmin(username: string, password: string, theme: string): Promise<Admin | null>
  // ... other methods
```

Code reference – admin routes registration:
```18:26:src/routes/index.ts
  // Register admin routes BEFORE wizard session validation hook
  // Admin routes have their own authentication and should bypass wizard session validation
  await _app.register(adminRoutes);
  
  // Register session validation hook as preHandler for wizard routes
  _app.addHook('preHandler', validateWizardSession);
```

Required when adding admin routes:
- Admin routes must be registered BEFORE wizard session validation hook in `src/routes/index.ts`.
- Admin routes use `validateAdminSession` hook for authentication (applied via `app.addHook('preHandler', validateAdminSession)`).
- Public admin routes (`/admin/login`, `/admin/logout`) bypass authentication.
- Protected admin routes require `request.session.adminId` and `request.session.adminTheme` to match `request.theme`.
- Admin session stores: `adminId` and `adminTheme` in session.
- Theme isolation: Admin can only access routes for their assigned theme.

Example admin route implementation:
```106:133:src/routes/admin/index.ts
  // GET /admin/menu-editor - Render menu editor page
  app.get('/admin/menu-editor', async (request: FastifyRequest, reply: FastifyReply) => {
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin; // Set by validateAdminSession hook
    // ... render menu editor
```

Admin authentication flow:
1. Admin accesses `/admin/login` (public route, no auth required).
2. Admin submits credentials via POST `/admin/login`.
3. Server validates credentials using `AdminService.authenticateAdmin()`.
4. On success: Set `session.adminId` and `session.adminTheme`, redirect to `/admin/menu-editor`.
5. On failure: Show error message, increment rate limit counter.
6. Protected routes check `validateAdminSession` hook before processing.

Rate limiting:
- Admin login endpoint has rate limiting: 5 failed attempts per IP per 15 minutes.
- Rate limit is stored in-memory Map (similar to `/api/geo/reverse` pattern).
- Returns HTTP 429 with `retryAfter` header when limit exceeded.

### Wizard Session API (`/api/session/:step`)

Contract:
- URL: `POST /api/session/:step`.
- Steps are configured in `stepConfig` mapping to session keys and next routes.
- On normal submit: strict Zod validation per step, then DB create/update for specific steps (e.g., `event-details`, `date`).
- On autosave: lenient, merge-only session updates; DB writes are skipped for sensitive steps.

Code reference – step configuration:
```15:22:src/routes/api/index.ts
const stepConfig: Record<string, WizardStepConfig> = {
  location: { sessionKey: 'locationData', redirectTo: '/event-details' },
  customer: { sessionKey: 'eventDetails', redirectTo: '/date-picker' },
  'event-details': { sessionKey: 'eventDetails', redirectTo: '/date-picker' },
  date: { sessionKey: 'dateInfo', redirectTo: '/event-setup' },
  event: { sessionKey: 'eventSetup', redirectTo: '/event-summary' },
  summary: { sessionKey: 'finalReview', redirectTo: '/checkout' },
};
```

DB persistence examples (normal submit only):
```669:677:src/routes/api/index.ts
// [DATABASE SAVE] Save to database for event-details step
let savedOrder = null;
if (step === 'event-details' && !isAutoSave) {
  // ... create or link customer, create order with sessionId and status PENDING
```

```801:817:src/routes/api/index.ts
// [DATABASE UPDATE] Update database with date/time info for date step
if (step === 'date') {
  // ... upsert by sessionId, create or update eventDateTime and eventSetup
```

### Booked Dates and Server Time APIs (Date Picker Integration)

- `GET /api/server-time`: use server time to avoid client timezone drift.
- `GET /api/booked-dates`: returns booked dates from DB; excludes `PENDING` orders so users can modify selections on back/refresh.

Code reference – booked dates status filter:
```118:123:src/routes/api/index.ts
// [STATUS FILTER] Only lock dates for confirmed orders (beyond PENDING status)
status: {
  in: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'] as any
}
```

Changelog policy note:
```129:161:docs/CHANGELOG.md
### November 2, 2025 - Back Button UX Fix: PENDING Orders Don't Lock Dates
... Excludes PENDING orders from locking dates ...
```

### Session Data Extraction Utilities

- Centralized utilities for extracting common session data to eliminate DRY violations across route handlers.
- Located in `src/lib/utils.ts` and should be used instead of duplicating extraction logic.

**Available Functions:**

- **`extractGuestCountFromSession(sessionData: any): number | null`**
  - Extracts guest count from `eventSetup.productQuantities['guest-count']` or `eventSetup.calculator.guestCount`
  - Returns `null` if not found or invalid
  - Includes logging: `✅✅✅` for successful extraction, `🟡🟡🟡` for attempts

- **`calculateNumberOfDaysFromDateInfo(dateInfo: any): number`**
  - Calculates number of days from `dateInfo.dates` array length
  - Returns `1` as default if dateInfo invalid or dates array empty
  - Includes logging: `✅✅✅` for successful calculation, `⚠️⚠️⚠️` for warnings

Code reference – session utilities:
```58:88:src/lib/utils.ts
// 🟡🟡🟡 - [SESSION UTILITIES] Extract guest count from session data
export function extractGuestCountFromSession(sessionData: any): number | null {
  // Extracts from productQuantities or calculator.guestCount
}

// 🟡🟡🟡 - [SESSION UTILITIES] Calculate number of days from dateInfo session data
export function calculateNumberOfDaysFromDateInfo(dateInfo: any): number {
  // Calculates from dateInfo.dates array length
}
```

Example usage in route handlers:
```54:78:src/routes/eventSetup.ts
// 🟡🟡🟡 - [GUEST COUNT] Extract guest count from session using centralized utility
const guestCount = extractGuestCountFromSession(sessionData);
const hasGuestCount = guestCount !== null && guestCount > 0;

// 🟡🟡🟡 - [NUMBER OF DAYS] Calculate number of days from dateInfo using centralized utility
const dateInfo = sessionData.dateInfo as any;
let numberOfDays = calculateNumberOfDaysFromDateInfo(dateInfo);
```

**Required when adding new routes that need guest count or numberOfDays:**
- Import utilities: `import { extractGuestCountFromSession, calculateNumberOfDaysFromDateInfo } from '../lib/utils'`
- Use `extractGuestCountFromSession(sessionData)` instead of duplicating extraction logic
- Use `calculateNumberOfDaysFromDateInfo(dateInfo)` instead of duplicating calculation logic

Changelog source of truth:
```17:32:docs/CHANGELOG.md
### December 20, 2025 - DRY Refactoring: Session Utilities and Coordinate Helpers
... Centralized session data extraction utilities to eliminate DRY violations ...
```

### Coordinate Normalization Utilities

- Centralized utilities for coordinate normalization shared across services and scripts.
- Located in `src/lib/coordinateUtils.ts` and respects `MAP_POLYGON` environment variable for coordinate order.

**Available Functions:**

- **`normalizeCoordinatePair(pair, coordinateOrder?): CoordinatePair | null`**
  - Normalizes coordinate pairs from various formats (array, object with lat/lng, object with latitude/longitude)
  - Respects `coordinateOrder` parameter (from `MAP_POLYGON` env variable)
  - Returns `null` if input invalid

- **`normalizePolygonCoordinates(raw, coordinateOrder?): CoordinatePair[] | null`**
  - Normalizes entire polygon coordinate arrays
  - Returns `null` if insufficient points (< 3) or invalid format
  - Uses `normalizeCoordinatePair()` internally

- **`normalizeCoordinatePairWithAutoDetect(pair, targetStorageOrder): [number, number] | null`**
  - Auto-detects coordinate format based on value ranges (used by import scripts)
  - Converts to target storage format
  - **Note:** Only used by import scripts, not by services (security requirement)

Code reference – coordinate utilities:
```1:50:src/lib/coordinateUtils.ts
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [coordinateUtils] Centralized coordinate normalization utilities
export function normalizeCoordinatePair(...) { ... }
export function normalizePolygonCoordinates(...) { ... }
```

Example usage in services:
```69:73:src/services/deliveryLocationsService.ts
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [DRY REFACTOR] Using normalizePolygonCoordinates() from coordinateUtils
function normalizePolygon(raw: unknown): DeliveryLocationPolygonPoint[] | undefined {
  const normalized = normalizePolygonCoordinates(raw);
  return normalized || undefined;
}
```

**Required when adding new coordinate operations:**
- Import utilities: `import { normalizeCoordinatePair, normalizePolygonCoordinates } from '../lib/coordinateUtils'`
- Use utilities instead of duplicating coordinate normalization logic
- Respect `MAP_POLYGON` environment variable (must be `'lng-lat'` or `'lat-lng'`)

**Environment Variable:**
- `MAP_POLYGON`: Must be set to `'lng-lat'` or `'lat-lng'` to match database coordinate format
- All coordinate utilities read from this environment variable for consistency
- Defaults to `'lng-lat'` if not set or invalid

Changelog source of truth:
```3761:3884:docs/CHANGELOG.md
### November 13, 2025 - Security Hardening & Robustness Improvements
... Centralized coordinate order configuration via MAP_POLYGON environment variable ...
```

### Calculator State Management (Client-Side)

- Centralized module for calculator state restoration shared across templates.
- Located in `public/global/js/calculator-state.js` and should be used instead of duplicating restoration logic.

**Available Functions:**

- **`restoreCalculatorState(calculator, eventSetupData, options)`**
  - Main restoration function with fallback logic
  - Restores radio selections, checkbox selections, product quantities, and guest count
  - Handles both `calculator.getState()` format and form data format (fallback)
  - Options: `{ skipGuestCount: boolean, skipProducts: boolean }` for flexibility

- **`restoreFromCalculatorState(calculator, calcState)`**
  - Restores from `calculator.getState()` format (radios, checkboxes, products)

- **`restoreFromFormData(calculator, eventSetup)`**
  - Restores from form data format (radioSelections, checkboxSelections, productQuantities)

Code reference – calculator state module:
```1:50:public/global/js/calculator-state.js
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [calculator-state] Centralized calculator state restoration utilities
window.KloiCalculatorState = {
  restoreCalculatorState: restoreCalculatorState,
  restoreFromCalculatorState: restoreFromCalculatorState,
  restoreFromFormData: restoreFromFormData
};
```

Example usage in templates:
```130:220:src/views/wizard/event-summary.hbs
// 🟡🟡🟡 - [CALCULATOR STATE] Restore calculator state from session using centralized module
if (window.KloiCalculatorState && window.KloiCalculatorState.restoreCalculatorState) {
  window.KloiCalculatorState.restoreCalculatorState(calc, eventSetup, { skipGuestCount: false, skipProducts: false });
}
```

**Required when adding calculator state restoration:**
- Include script: `<script src="/public/global/js/calculator-state.js"></script>`
- Use `window.KloiCalculatorState.restoreCalculatorState()` instead of duplicating restoration logic
- Use individual functions (`restoreFromCalculatorState`, `restoreFromFormData`) for specific use cases

**When to use which function:**
- `restoreCalculatorState()`: Use when you have `eventSetup` data and want automatic fallback handling
- `restoreFromCalculatorState()`: Use when you only have calculator state format
- `restoreFromFormData()`: Use when you only have form data format

Changelog source of truth:
```1896:1911:docs/CHANGELOG.md
### December 10, 2025 - Calculator Requirements Fix, Live Calculator on Event-Summary
... Calculator state restoration with dual source (calculator state and form data) ...
```

### Handlebars Views: Helpers and Partials

- Helpers `eq`, `ne`, `gt`, `lt` are registered in app startup and are available to all views.
- Partials under `src/views/partials` are auto-registered on startup.

Code reference – helpers and partials:
```34:43:src/app.ts
handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});
...
handlebars.registerHelper('ne', function(a: any, b: any) {
  return a !== b;
});
```

```66:77:src/app.ts
// [HANDLEBARS PARTIALS] Register Handlebars partials manually
const partialsDir = path.join(__dirname, 'views', 'partials');
...
handlebars.registerPartial(partialName, partialContent);
```

### Logging and Commenting Conventions

- Use emoji-prefixed logs for observability, per project standard (see existing modules for examples).
- Keep PII out of logs; when referencing IDs, prefer short prefixes (`sessionId?.substring(0, 8)`).
- Comments should be concise, with timestamps when they convey operational context.

Examples across the codebase show the expected prefixes:
- Success: `✅✅✅`
- Errors/Warnings: `❗❗❗`
- Helpful info: `🟡🟡🟡`
- Session/state: `⚪⚪⚪`
- Temporary: `🟤🟤🟤`
- Can improve: `🔵🔵🔵`
- Very serious: `❌❌❌`
- Important/breaking: `⚠️⚠️⚠️`

### Checklist for New Pages/Routes

- Theming
  - Read `request.theme` and pass `theme` to `reply.view(...)`.
- Wizard Progress (for wizard pages only)
  - Include `public/global/js/wizard__progress.js` in the view.
  - For any link/button that navigates: call `attachSaveBeforeNavigate(...)` with correct `step` and payload builder.
  - For forms: enable `enableAutoSaveOnChange(...)` with a payload builder.
- Session
  - Ensure step data maps to the right session key, consistent with `stepConfig` on the server.
  - Do not rely on autosave for DB writes; DB persistence happens on normal submits per server rules.
- Admin Routes (for admin pages only)
  - Register admin routes BEFORE wizard session validation hook in `src/routes/index.ts`.
  - Use `validateAdminSession` hook for protected admin routes.
  - Public admin routes (`/admin/login`, `/admin/logout`) bypass authentication.
  - Ensure admin theme matches `request.theme` before allowing access.
  - Use `AdminService` for all admin-related database operations.
- Logging
  - Use emoji-prefixed logs; avoid PII; include short timestamps where meaningful.
- Views
  - Use registered helpers where applicable and consider partials for reusable blocks.

### Admin Sign-Up and Invitation Workflow

- Admin sign-up is invitation-only. Super admins create invitations that send email links to new users.
- Sign-up flow: Invitation link → Sign-up form → Email verification → Manual approval → Activation.
- Email verification is required before approval. Verification tokens expire after 7 days.
- Backend team manually approves admins and assigns roles (SUPER_ADMIN, EDITOR, READ_ONLY).
- Admin status flow: PENDING → EMAIL_VERIFIED → APPROVED → ACTIVE (or INACTIVE for deactivation).

Code reference – invitation creation:
```typescript
// src/services/adminService.ts
static async createInvitation(inviterId: string, email: string, theme: string)
```

Code reference – sign-up processing:
```typescript
// src/services/adminService.ts
static async signUpAdmin(invitationToken: string, firstName: string, lastName: string, phone: string, password: string)
```

Code reference – email verification:
```typescript
// src/services/adminService.ts
static async verifyEmail(token: string)
```

Code reference – approval and activation:
```typescript
// src/services/adminService.ts
static async approveAdmin(adminId: string, approverId: string, role: AdminRole)
static async activateAdmin(adminId: string)
```

### Role-Based Access Control

- Three admin roles: SUPER_ADMIN (full access), EDITOR (can edit menus), READ_ONLY (view only).
- Role checks are enforced server-side via hooks before route handlers.
- Menu editor routes require EDITOR or SUPER_ADMIN role.
- Invitation and approval management routes require SUPER_ADMIN role only.
- All roles can view menus, but only EDITOR+ can edit.

Code reference – role-based hooks:
```typescript
// src/hooks/adminHooks.ts
export function requireRole(allowedRoles: AdminRole[])
export function requireSuperAdmin()
export function requireEditorOrAbove()
export function canEditMenu(admin: Admin): boolean
export function canViewMenu(admin: Admin): boolean
```

Code reference – role enforcement in routes:
```typescript
// src/routes/admin/index.ts
app.post('/admin/api/menu/save', {
  preHandler: [requireEditorOrAbove()]
}, async (request, reply) => { ... });
```

Required when adding new admin routes:
- Apply role checks using `requireRole()`, `requireSuperAdmin()`, or `requireEditorOrAbove()` hooks.
- Check `canEditMenu()` or `canViewMenu()` helper functions for conditional logic.
- Never trust client-side role information; always verify server-side.

### Where to Extend and Reuse

- Client wizard utilities: `public/global/js/wizard__progress.js` (extend with new collectors per step).
- Server API: `src/routes/api/index.ts` (extend `stepConfig`, validation schemas, and per-step DB logic as needed).
- Admin authentication: `src/services/adminService.ts` (extend with additional admin management methods as needed).
- Admin routes: `src/routes/admin/index.ts` (extend with additional admin endpoints as needed).
- Admin hooks: `src/hooks/adminHooks.ts` (extend with additional admin validation logic as needed).
- Theming: `src/lib/themeDetector.ts` (extend for special cases or theme aliases if required).
- Sessions: `src/lib/session-store.ts` and `src/lib/redis.ts` for backend storage adjustments.
- **Session utilities: `src/lib/utils.ts`** (extend with new extraction helpers as needed, e.g., `extractGuestCountFromSession`, `calculateNumberOfDaysFromDateInfo`).
- **Coordinate utilities: `src/lib/coordinateUtils.ts`** (extend for new coordinate operations, e.g., `normalizeCoordinatePair`, `normalizePolygonCoordinates`).
- **Calculator state: `public/global/js/calculator-state.js`** (extend for new restoration patterns, e.g., `restoreCalculatorState`, `restoreFromCalculatorState`).

Keeping these conventions centralized prevents duplication and ensures consistent UX across the wizard and beyond.


