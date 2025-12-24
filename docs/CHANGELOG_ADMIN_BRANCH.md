# KLOI Admin Interface Changelog

⚠️⚠️⚠️ **IMPORTANT**: This document tracks all changes related to the admin interface implementation for menu JSON editing. This is a theme-scoped admin system that allows authorized personnel to edit menu structures per theme subdomain.

---

## Change Categories

- **🔴 BREAKING CHANGE**: Changes that require immediate attention and may break existing functionality
- **🟠 MAJOR CHANGE**: Significant feature additions or modifications that may require code updates
- **🟢 DIRECTION CHANGE**: Strategic shifts in application architecture, patterns, or business logic
- **🔵 MIGRATION REQUIRED**: Database or schema changes that need migration scripts
- **🟡 DEPRECATED**: Features or APIs that are being phased out

---

### December 24, 2025 @ 21:38 - Admin Menu Editor Data Loading Fix: Migration from Window Variables to DOM Data Attributes

**Type**: 🟠 MAJOR CHANGE

**Summary**: Fixed critical issue where admin menu editor failed to load menu data from server. The problem was caused by unreliable script execution order when using window variables for data passing. Migrated to DOM data attributes pattern (consistent with app-wide conventions) for more reliable data transfer from server to client JavaScript. This ensures menu data is always available when JavaScript initializes, regardless of script loading order or timing issues.

**Problem**: 
- Admin menu editor JavaScript was unable to access menu data because `window.__adminMenuData` was undefined
- Inline script that set window variable was not executing reliably or was executing after the external script
- Script execution order dependencies caused race conditions
- Error: "Menu data not found. window.__adminMenuData is undefined"

**Solution**:
- Migrated from window variable approach to DOM data attributes pattern
- Data attributes are set by Handlebars during template rendering (always available)
- JavaScript reads data from DOM attributes when DOM is ready
- Follows same pattern used in `event-setup.hbs` and other templates throughout codebase
- Eliminates script execution order dependencies

#### Major Changes

- **Menu Editor Template** (`src/views/admin/menu-editor.hbs`):
  - **Removed Inline Script**:
    - Removed entire inline `<script>` block that attempted to set `window.__adminMenuData`
    - Removed script execution order dependency
    - **Code Removed**:
      ```handlebars
      <script>
        (function() {
          window.__adminMenuData = {
            menu: {{#if menu}}{{json menu.menuItems}}{{else}}null{{/if}},
            menuName: {{#if menu}}"{{menu.name}}"{{else}}null{{/if}},
            theme: "{{theme}}"
          };
        })();
      </script>
      ```
    - **Impact**: Eliminates unreliable window variable initialization

  - **Added Data Attributes to JSON Editor Container**:
    - Added `data-menu-items` attribute containing menu JSON
    - Added `data-menu-name` attribute containing menu name
    - Added `data-theme` attribute containing theme
    - **Code Added**:
      ```handlebars
      <div id="jsoneditor" 
           class="admin-json-editor"
           data-menu-items="{{#if menu}}{{json menu.menuItems}}{{else}}null{{/if}}"
           data-menu-name="{{#if menu}}{{menu.name}}{{else}}null{{/if}}"
           data-theme="{{theme}}"></div>
      ```
    - **Impact**: Menu data is embedded in DOM during template rendering, always available to JavaScript

  - **Simplified Script Loading**:
    - Removed script order comments and complexity
    - Scripts now load in natural order without dependencies
    - **Code Changed**:
      ```handlebars
      {{! Before: Complex inline script with error handling }}
      {{! After: Simple script tags, no order dependency }}
      <script src="https://cdn.jsdelivr.net/npm/jsoneditor@9.10.2/dist/jsoneditor.min.js"></script>
      <script src="/public/global/js/admin-menu-editor.js"></script>
      ```
    - **Impact**: Cleaner template, no script execution order issues

- **Admin Menu Editor JavaScript** (`public/global/js/admin-menu-editor.js`):
  - **Removed Window Variable Check**:
    - Removed `waitForMenuData()` function that checked for `window.__adminMenuData`
    - Removed retry mechanism and timing-dependent checks
    - **Code Removed**:
      ```javascript
      function waitForMenuData() {
        const menuData = window.__adminMenuData;
        if (menuData !== undefined) {
          initializeEditor(menuData);
          return;
        }
        // Error handling...
      }
      ```
    - **Impact**: Eliminates unreliable window variable dependency

  - **Added DOM Data Attribute Reader**:
    - New `readMenuDataFromDOM()` function reads data from DOM attributes
    - Reads `data-menu-items`, `data-menu-name`, and `data-theme` attributes
    - Parses JSON with proper error handling
    - Handles null/empty values correctly
    - **Code Added**:
      ```javascript
      function readMenuDataFromDOM() {
        const container = document.getElementById('jsoneditor');
        if (!container) {
          console.error('❗❗❗ - [ADMIN MENU EDITOR] JSON editor container not found');
          return null;
        }

        try {
          const menuItemsAttr = container.getAttribute('data-menu-items');
          const menuNameAttr = container.getAttribute('data-menu-name');
          const themeAttr = container.getAttribute('data-theme');

          let menuItems = null;
          if (menuItemsAttr && menuItemsAttr !== 'null' && menuItemsAttr !== '') {
            try {
              menuItems = JSON.parse(menuItemsAttr);
            } catch (parseErr) {
              console.error('❗❗❗ - [ADMIN MENU EDITOR] Error parsing menu items JSON:', parseErr);
            }
          }

          return {
            menu: menuItems,
            menuName: menuNameAttr && menuNameAttr !== 'null' ? menuNameAttr : null,
            theme: themeAttr || 'default'
          };
        } catch (err) {
          console.error('❗❗❗ - [ADMIN MENU EDITOR] Error reading menu data from DOM:', err);
          return null;
        }
      }
      ```
    - **Impact**: Reliable data access from DOM, no timing dependencies

  - **Updated Initialization Flow**:
    - Changed from checking window variable to reading DOM attributes
    - Initialization now happens after DOM is ready
    - **Code Changed**:
      ```javascript
      // Before: waitForMenuData() checked window.__adminMenuData
      // After: readMenuDataFromDOM() reads from DOM attributes
      function startInitialization() {
        const menuData = readMenuDataFromDOM();
        if (menuData) {
          initializeEditor(menuData);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startInitialization);
      } else {
        startInitialization();
      }
      ```
    - **Impact**: More reliable initialization, data always available when DOM is ready

  - **Enhanced Error Handling**:
    - Added error messages displayed to user via `admin-message` element
    - Added detailed console logging for debugging
    - Handles JSON parsing errors gracefully
    - **Code Added**:
      ```javascript
      if (!container) {
        const messageEl = document.getElementById('admin-message');
        if (messageEl) {
          messageEl.textContent = 'JSON editor container not found. Please refresh the page.';
          messageEl.className = 'admin-message error';
          messageEl.style.display = 'block';
        }
        return null;
      }
      ```
    - **Impact**: Better user experience with clear error messages

  - **Enhanced Logging**:
    - Added detailed console logs for data reading process
    - Logs attribute presence, menu name, theme
    - Logs parsed data structure for debugging
    - **Code Added**:
      ```javascript
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Reading menu data from DOM attributes');
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu items attr:', menuItemsAttr ? 'present' : 'missing');
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu name attr:', menuNameAttr);
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Theme attr:', themeAttr);
      ```
    - **Impact**: Easier debugging and monitoring of data flow

- **Admin Routes** (`src/routes/admin/index.ts`):
  - **Enhanced Logging**:
    - Added detailed logging for menu data loading
    - Logs menu existence, ID, name, and menuItems type
    - **Code Added**:
      ```typescript
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu data loaded for theme:', theme);
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu exists:', menu !== null);
      if (menuData) {
        console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu ID:', menuData.id);
        console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu name:', menuData.name);
        console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu items type:', typeof menuData.menuItems);
      }
      ```
    - **Impact**: Better server-side debugging and monitoring

#### Technical Details

**Data Flow (Before)**:
1. Server renders template with inline script
2. Inline script attempts to set `window.__adminMenuData`
3. External script loads and immediately checks `window.__adminMenuData`
4. **Problem**: Race condition - external script may execute before inline script
5. Result: `window.__adminMenuData` is undefined

**Data Flow (After)**:
1. Server renders template with data attributes on DOM element
2. Data attributes are set during Handlebars rendering (synchronous)
3. External script loads and waits for DOM to be ready
4. JavaScript reads data from DOM attributes when DOM is ready
5. **Solution**: Data is always in DOM, no timing dependencies
6. Result: Menu data successfully loaded and parsed

**Pattern Consistency**:
- Follows same pattern used in `src/views/wizard/event-setup.hbs`:
  - Uses `data-menu-sections`, `data-event-setup`, `data-taxes-fees` attributes
  - JavaScript reads from `serverData` div data attributes
- Follows app-wide convention for server-to-client data transfer
- Eliminates script execution order dependencies

#### Benefits

- **Reliability**: Data attributes are set during template rendering, always available
- **Consistency**: Follows established codebase patterns
- **No Timing Issues**: No script execution order dependencies
- **Better Error Handling**: Clear error messages for users
- **Enhanced Debugging**: Detailed logging for troubleshooting
- **Maintainability**: Simpler code without complex retry mechanisms

#### Breaking Changes

None - This is a bug fix that maintains the same API and functionality.

#### Files Affected

**Modified Files**:
- `src/views/admin/menu-editor.hbs` - Removed inline script, added data attributes to jsoneditor div
- `public/global/js/admin-menu-editor.js` - Replaced window variable check with DOM data attribute reading
- `src/routes/admin/index.ts` - Added enhanced logging for menu data loading

**No New Files Created**

#### Testing Recommendations

1. **Verify Menu Loading**:
   - Login to admin interface
   - Navigate to `/admin/menu-editor`
   - Verify menu data loads correctly in JSON editor
   - Check browser console for successful data loading logs

2. **Test Edge Cases**:
   - Test with no menu in database (should show empty editor)
   - Test with null menuItems (should handle gracefully)
   - Test with invalid JSON in menuItems (should show error message)

3. **Verify Error Handling**:
   - Check that error messages display correctly
   - Verify console logs provide useful debugging information

#### Related Documentation

- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for data attribute pattern usage
- See `src/views/wizard/event-setup.hbs` for similar data attribute implementation

---

### December 23, 2025 @ 19:06 - Admin Interface Implementation: Theme-Scoped Menu Editor

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Implemented comprehensive admin interface for editing menu JSON structures with theme-scoped authentication. Admin system allows authorized personnel to edit menus per theme subdomain using a secure password-based authentication system. Each admin account is scoped to a specific theme, ensuring theme isolation and security. The admin interface includes a modern JSON editor for menu structure editing, rate-limited login protection, and follows all app-wide conventions including theming, session management, and logging standards.

**Features implemented**:
Theme-scoped admin authentication
Password hashing with bcrypt (10 salt rounds)
Rate-limited login (5 attempts per 15 minutes)
JSON editor for menu editing
Session-based authentication
Theme isolation (admins can only access their theme)
Follows app-wide conventions (theming, logging, session management)

#### Major Changes

- **Database Migration** (`prisma/schema.prisma`):
  - **New Admins Table**:
    - Created `Admins` model with theme-scoped authentication fields
    - Fields: `id` (UUID primary key), `username` (VARCHAR(100), unique), `password` (VARCHAR(255), bcrypt hashed), `theme` (VARCHAR(50)), `email` (VARCHAR(100), nullable), `isActive` (Boolean, default true), `createdAt` (DateTime), `updatedAt` (DateTime)
    - Indexes on `theme` and `username` for efficient lookups
    - **Code Added**:
      ```prisma
      model Admins {
        id        String   @id @default(uuid())
        username  String   @unique @db.VarChar(100)
        password  String   @db.VarChar(255)
        theme     String   @db.VarChar(50)
        email     String?  @db.VarChar(100)
        isActive  Boolean  @default(true)
        createdAt DateTime @default(now())
        updatedAt DateTime @updatedAt

        @@index([theme])
        @@index([username])
        @@map("Admins")
      }
      ```
    - **Impact**: Provides secure storage for admin accounts with theme-scoped access control

  - **Menus Table Enhancement**:
    - Added unique constraint on `theme` field to ensure one menu per theme
    - **Code Changed**:
      ```prisma
      model Menus {
        id        String @id @default(uuid())
        name      String
        theme     String @unique
        menuItems Json
      }
      ```
    - **Impact**: Ensures data integrity - one menu per theme, enables upsert operations

- **Dependencies** (`package.json`):
  - **Added bcrypt** (^5.1.1): Password hashing library
  - **Added @types/bcrypt** (^5.0.2): TypeScript types for bcrypt
  - **Added admin:seed script**: CLI command for creating admin accounts
  - **Code Added**:
    ```json
    "bcrypt": "^5.1.1",
    "@types/bcrypt": "^5.0.2",
    "admin:seed": "ts-node src/scripts/seedAdmin.ts"
    ```
  - **Impact**: Enables secure password hashing and admin account creation

- **Admin Service** (`src/services/adminService.ts` - New File):
  - **Password Hashing Functions**:
    - `hashPassword(password: string): Promise<string>` - Hashes passwords with bcrypt (10 salt rounds)
    - `verifyPassword(password: string, hash: string): Promise<boolean>` - Verifies password against hash
    - **Code Added**:
      ```typescript
      static async hashPassword(password: string): Promise<string> {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
      }
      static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
      }
      ```
    - **Impact**: Secure password storage and verification

  - **Admin CRUD Operations**:
    - `createAdmin()` - Creates admin with hashed password
    - `authenticateAdmin()` - Authenticates admin for specific theme
    - `getAdminById()` - Gets admin by ID
    - `getAdminsByTheme()` - Gets all admins for a theme
    - **Code Added**:
      ```typescript
      static async authenticateAdmin(
        username: string,
        password: string,
        theme: string
      ): Promise<Admin | null> {
        const admin = await prisma.admins.findFirst({
          where: { username, theme, isActive: true }
        });
        if (!admin) return null;
        const isValidPassword = await this.verifyPassword(password, admin.password);
        return isValidPassword ? admin : null;
      }
      ```
    - **Impact**: Centralized admin management following DRY principles

- **Admin Authentication Hook** (`src/hooks/adminHooks.ts` - New File):
  - **Session Validation**:
    - `validateAdminSession` hook validates admin authentication and theme access
    - Checks for `request.session.adminId` and `request.session.adminTheme`
    - Verifies admin exists, is active, and has access to current theme
    - Redirects to `/admin/login` if not authenticated
    - **Code Added**:
      ```typescript
      export const validateAdminSession = async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.session || !(request.session as any).adminId) {
          const theme = (request as any).theme || 'default';
          return reply.redirect(`/admin/login?theme=${theme}`);
        }
        // Verify admin and theme match
        const admin = await AdminService.getAdminById(adminId);
        if (!admin || !admin.isActive || admin.theme !== currentTheme) {
          return reply.redirect(`/admin/login?theme=${currentTheme}&error=access_denied`);
        }
        (request as any).admin = admin;
      }
      ```
    - **Impact**: Protects admin routes with theme-scoped authentication

- **Admin Routes Module** (`src/routes/admin/index.ts` - New File):
  - **Public Routes** (no auth required):
    - `GET /admin/login` - Render login page with theme context
    - `POST /admin/login` - Authenticate admin, set session, redirect to menu editor
    - `POST /admin/logout` - Clear admin session, redirect to login
    - **Code Added**:
      ```typescript
      app.get('/admin/login', async (request, reply) => {
        const theme = (request as any).theme || 'default';
        return reply.view('admin/login', { theme, error: query.error });
      });
      app.post('/admin/login', async (request, reply) => {
        const admin = await AdminService.authenticateAdmin(username, password, theme);
        if (admin) {
          (request.session as any).adminId = admin.id;
          (request.session as any).adminTheme = admin.theme;
          return reply.redirect(`/admin/menu-editor?theme=${theme}`);
        }
      });
      ```
    - **Impact**: Admin authentication flow with theme context

  - **Protected Routes** (require `validateAdminSession` hook):
    - `GET /admin/menu-editor` - Render menu editor page with current menu JSON
    - `POST /admin/api/menu/save` - Save menu JSON to database
    - `GET /admin/api/menu` - Get current menu JSON (API endpoint)
    - **Code Added**:
      ```typescript
      app.addHook('preHandler', validateAdminSession);
      app.get('/admin/menu-editor', async (request, reply) => {
        const theme = (request as any).theme || 'default';
        const menu = await prisma.menus.findFirst({ where: { theme } });
        return reply.view('admin/menu-editor', { theme, menu, adminUsername: admin.username });
      });
      app.post('/admin/api/menu/save', async (request, reply) => {
        const menu = await prisma.menus.upsert({
          where: { theme },
          update: { name, menuItems },
          create: { theme, name, menuItems }
        });
      });
      ```
    - **Impact**: Secure menu editing with theme-scoped access

  - **Rate Limiting**:
    - Login endpoint rate limiting: 5 failed attempts per IP per 15 minutes
    - In-memory Map storage (similar to `/api/geo/reverse` pattern)
    - Returns HTTP 429 with `retryAfter` header when limit exceeded
    - **Code Added**:
      ```typescript
      const loginRateLimitMap = new Map<string, { count: number; resetTime: number }>();
      const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
      const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
      ```
    - **Impact**: Prevents brute force attacks on admin login

- **Route Registration** (`src/routes/index.ts`):
  - **Admin Routes Registered Before Wizard Routes**:
    - Admin routes registered before wizard session validation hook
    - Allows admin routes to bypass wizard session validation
    - **Code Added**:
      ```typescript
      // Register admin routes BEFORE wizard session validation hook
      await _app.register(adminRoutes);
      
      // Register session validation hook as preHandler for wizard routes
      _app.addHook('preHandler', validateWizardSession);
      ```
    - **Impact**: Admin routes have independent authentication flow

- **Admin Login View** (`src/views/admin/login.hbs` - New File):
  - **Login Form**:
    - Username and password input fields
    - Theme badge display
    - Error message display
    - Follows existing view patterns (uses layout, includes theme)
    - **Code Added**:
      ```handlebars
      <form method="POST" action="/admin/login" class="admin-login-form">
        <input type="text" name="username" required />
        <input type="password" name="password" required />
        <input type="hidden" name="theme" value="{{theme}}" />
        <button type="submit">Sign In</button>
      </form>
      ```
    - **Impact**: User-friendly admin login interface

- **Menu Editor View** (`src/views/admin/menu-editor.hbs` - New File):
  - **JSON Editor Integration**:
    - Uses JSONEditor library (CDN) for menu JSON editing
    - Displays current menu name and ID
    - Save and reset buttons
    - Success/error message display
    - Logout button
    - **Code Added**:
      ```handlebars
      <div id="jsoneditor" class="admin-json-editor"></div>
      <button id="save-menu-button">Save Menu</button>
      <button id="reset-menu-button">Reset to Original</button>
      <script src="https://cdn.jsdelivr.net/npm/jsoneditor@9.10.2/dist/jsoneditor.min.js"></script>
      ```
    - **Impact**: Modern, user-friendly menu editing interface

- **Admin CSS Stylesheet** (`public/global/css/admin.css` - New File):
  - **Styling**:
    - Admin login card layout
    - Menu editor layout
    - Button styles
    - Error/success message styles
    - Responsive design for mobile/tablet
    - **Impact**: Consistent, modern admin interface styling

- **Admin JavaScript Module** (`public/global/js/admin-menu-editor.js` - New File):
  - **Menu Editor Functionality**:
    - Initializes JSONEditor component
    - Handles save button click
    - POSTs menu JSON to `/admin/api/menu/save`
    - Displays success/error messages
    - Handles form validation
    - Reset functionality
    - **Code Added**:
      ```javascript
      function initializeJsonEditor() {
        jsonEditor = new JSONEditor(container, options);
        jsonEditor.set(menu || {});
      }
      async function saveMenu() {
        const menuItems = jsonEditor.get();
        const response = await fetch('/admin/api/menu/save', {
          method: 'POST',
          body: JSON.stringify({ name: menuName, menuItems })
        });
      }
      ```
    - **Impact**: Interactive menu editing with real-time validation

- **Admin Seed Script** (`src/scripts/seedAdmin.ts` - New File):
  - **CLI Utility**:
    - Accepts command-line arguments: `--username`, `--password`, `--theme`, `--email`
    - Hashes password using `AdminService.hashPassword()`
    - Creates admin using `AdminService.createAdmin()`
    - Logs success with partial admin ID
    - **Code Added**:
      ```typescript
      async function main() {
        const options = parseArgs();
        const admin = await AdminService.createAdmin(
          options.username,
          options.password,
          options.theme,
          options.email
        );
      }
      ```
    - **Impact**: Easy admin account creation for initial setup

- **Admin Validation Schemas** (`src/schemas/admin.schemas.ts` - New File):
  - **Zod Schemas**:
    - `adminLoginSchema` - Validates login request (username, password, theme)
    - `menuSaveSchema` - Validates menu JSON structure (menuItems, name)
    - `adminCreateSchema` - Validates admin creation (username, password, theme, email optional)
    - **Code Added**:
      ```typescript
      export const adminLoginSchema = z.object({
        username: z.string().min(1).max(100).trim(),
        password: z.string().min(1).min(8),
        theme: z.string().min(1).max(50).trim()
      });
      ```
    - **Impact**: Type-safe validation for admin API endpoints

- **Documentation Updates** (`docs/APP-WIDE-SERVICES-AND-MODULES.md`):
  - **Admin Interface Conventions Section**:
    - Admin authentication pattern
    - Theme-scoped admin access
    - Admin route registration order
    - Admin session management
    - Code references to admin hooks and services
    - Checklist items for admin routes
    - **Impact**: Centralized documentation for admin interface conventions

#### Migration Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Database Migration**:
   ```bash
   npx prisma migrate dev --name add_admins_table_and_unique_theme_constraint
   # or
   npx prisma migrate deploy
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Seed Initial Admin Account**:
   ```bash
   npm run admin:seed -- --username admin --password SecurePass123 --theme default --email admin@example.com
   ```

5. **Test Admin Login**:
   - Navigate to `http://{theme}.yourdomain.com/admin/login`
   - Login with seeded admin credentials
   - Access menu editor at `/admin/menu-editor`

#### Breaking Changes

- **Menus Table Schema**: Added unique constraint on `theme` field
  - **Impact**: Existing databases with multiple menus per theme will fail migration
  - **Action Required**: Review existing menus and consolidate to one menu per theme before migration
  - **Migration**: `YYYYMMDDHHMMSS_add_admins_table_and_unique_theme_constraint`

#### Security Considerations

- **Password Hashing**: All passwords are hashed with bcrypt (10 salt rounds) before storage
- **Theme Isolation**: Admins can only access routes for their assigned theme
- **Rate Limiting**: Login endpoint protected with 5 attempts per 15 minutes per IP
- **Session Security**: Admin sessions use same Redis-backed secure session store as wizard sessions
- **Input Validation**: All inputs validated with Zod schemas before processing
- **Error Messages**: Login errors don't leak information about existing usernames

#### Benefits

- **Theme-Scoped Access**: Each admin can only manage menus for their assigned theme
- **Secure Authentication**: Password-based authentication with bcrypt hashing
- **Modern UI**: JSON editor provides intuitive menu editing experience
- **Rate Limiting**: Prevents brute force attacks on login endpoint
- **DRY Principles**: Centralized admin service and hooks for reuse
- **Follows Conventions**: Adheres to all app-wide conventions (theming, logging, session management)
- **Easy Setup**: Seed script simplifies initial admin account creation

#### Files Affected

**New Files**:
- `src/services/adminService.ts` - Admin authentication and CRUD operations
- `src/hooks/adminHooks.ts` - Admin session validation hook
- `src/routes/admin/index.ts` - Admin routes module
- `src/schemas/admin.schemas.ts` - Admin API validation schemas
- `src/views/admin/login.hbs` - Admin login template
- `src/views/admin/menu-editor.hbs` - Menu editor template
- `public/global/css/admin.css` - Admin interface stylesheet
- `public/global/js/admin-menu-editor.js` - Menu editor JavaScript module
- `src/scripts/seedAdmin.ts` - Admin seed script

**Modified Files**:
- `prisma/schema.prisma` - Added Admins model, added unique constraint to Menus.theme
- `package.json` - Added bcrypt dependencies and admin:seed script
- `src/routes/index.ts` - Registered admin routes before wizard routes
- `docs/APP-WIDE-SERVICES-AND-MODULES.md` - Added admin interface conventions section

#### Technical Notes

⚠️⚠️⚠️ **Critical Implementation Details**:

- **Admin Route Registration Order**: Admin routes MUST be registered before wizard session validation hook to bypass wizard session checks
- **Theme Scoping**: Admin theme is validated at multiple levels (session, database, route) for security
- **Password Requirements**: Minimum 8 characters recommended (enforced in adminCreateSchema)
- **Session Storage**: Admin sessions stored in same Redis store as wizard sessions with same TTL
- **JSON Editor**: Uses JSONEditor library from CDN (can be moved to local assets if needed)
- **Rate Limiting**: In-memory Map storage (consider Redis for distributed deployments)

#### Future Enhancements (Out of Scope)

- Admin management UI (create/edit/delete admins)
- Role-based permissions (super admin vs theme admin)
- Menu versioning/history
- Menu preview before saving
- Bulk menu import/export
- Menu templates
- CSRF token implementation
- Two-factor authentication

---

## Notes

- ⚠️⚠️⚠️ Always check this document before planning admin-related changes
- 🔵 Review related migration files in `prisma/migrations/`
- 📋 Check for related documentation in `docs/` directory
- 🔍 Follow admin interface conventions in `docs/APP-WIDE-SERVICES-AND-MODULES.md`

---

