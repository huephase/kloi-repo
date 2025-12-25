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

### December 25, 2025 @ 21:21 - Custom Menu Editor Implementation: Replaced JSONEditor with Drag-and-Drop Visual Editor

**Type**: 🟠 MAJOR CHANGE

**Summary**: Completely replaced JSONEditor library with a custom-built drag-and-drop menu editor using SortableJS. The new editor provides an intuitive visual interface for non-technical users to edit menu sections with drag-and-drop reordering, interactive section management, and support for all menu HTML types including nested structures (radio groups, popups, checkboxes, addons). The editor maintains the exact JSON structure format required by the application while providing a much better user experience.

**Problem**: 
- JSONEditor library was not user-friendly for regular people
- Complex JSON editing interface was intimidating for non-technical users
- No visual representation of menu structure
- Difficult to understand menu hierarchy and relationships
- Heavy dependency on external library

**Solution**:
- Built custom visual menu editor from scratch
- Implemented drag-and-drop reordering using SortableJS (lightweight, ~15KB)
- Created section cards with visual previews and type badges
- Added interactive add/remove/edit functionality with modals
- Implemented expand/collapse UI for nested structures
- Maintained exact JSON output format matching SAMPLE-MENU-JSONB-NEW.json structure
- Follows DRY principles with reusable rendering functions

#### Major Changes

- **Menu Editor Template** (`src/views/admin/menu-editor.hbs`):
  - **Removed JSONEditor Dependencies**:
    - Removed `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsoneditor@9.10.2/dist/jsoneditor.min.css">`
    - Removed `<script src="https://cdn.jsdelivr.net/npm/jsoneditor@9.10.2/dist/jsoneditor.min.js"></script>`
    - **Impact**: Eliminates dependency on heavy JSONEditor library

  - **Added SortableJS Library**:
    - Added `<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>`
    - **Impact**: Enables lightweight drag-and-drop functionality

  - **Updated HTML Structure**:
    - Replaced `#jsoneditor` div with new `#menu-editor-container` structure
    - Added `#admin-editor-toolbar` with "Add Section" button
    - Added `#sections-list` container for draggable section cards
    - Maintained data attributes pattern (`data-menu-items`, `data-menu-name`, `data-theme`)
    - **Code Changed**:
      ```handlebars
      <div id="menu-editor-container" class="admin-menu-editor-container"
           data-menu-items="..."
           data-menu-name="..."
           data-theme="...">
        <div class="admin-editor-toolbar">
          <button id="add-section-button" class="admin-add-section-button">+ Add Section</button>
        </div>
        <div id="sections-list" class="admin-sections-list"></div>
      </div>
      ```
    - **Impact**: New visual editor structure replaces JSON editor

- **Admin Menu Editor JavaScript** (`public/global/js/admin-menu-editor.js` - Complete Rewrite):
  - **Removed All JSONEditor Code**:
    - Removed `JSONEditor` initialization and usage
    - Removed JSONEditor-specific error handling
    - **Impact**: Clean codebase without JSONEditor dependencies

  - **Data Loading** (Maintained Existing Pattern):
    - Kept DOM data attribute reading pattern (`readMenuDataFromDOM()`)
    - Maintains compatibility with existing server-side data passing
    - **Impact**: No breaking changes to data flow

  - **Section Rendering**:
    - `renderSectionCard()` - Creates visual section cards with previews
    - `getSectionPreview()` - Generates preview text for each section type
    - `renderNestedContent()` - Renders nested structures (radio options, checkboxes, addons)
    - `renderPopupContent()` - Renders popup sections within radio options
    - Sections display: order number, HTML type badge, section key, content preview
    - **Impact**: Visual representation of menu structure

  - **Drag-and-Drop Reordering**:
    - SortableJS integration for section list
    - `updateSectionOrders()` - Updates order values after drag
    - Visual feedback during drag (ghost element, opacity)
    - Drag handle (☰) on each section card
    - **Code Added**:
      ```javascript
      sortableInstance = new Sortable(sectionsList, {
        handle: '.admin-section-drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: function(evt) {
          updateSectionOrders();
        }
      });
      ```
    - **Impact**: Intuitive section reordering by dragging

  - **Section Management**:
    - **Add Section**: `addSection()`, `showAddSectionModal()`, `createNewSection()`
      - Modal to select HTML type (h1, h2, p, image, radio-group, checkbox-group, div-group, unordered-list)
      - Auto-generates next section key (section1, section2, etc.)
      - Sets order to last position + 1
      - Automatically opens edit modal for new section
    - **Edit Section**: `editSection()`, `showEditSectionModal()`, `saveSectionChanges()`
      - Different edit forms based on HTML type
      - Text sections: textarea for content
      - Image sections: inputs for src, alt, caption
      - List sections: textarea (one item per line)
      - Group sections: instructions to use expand/collapse
    - **Delete Section**: `deleteSection()`
      - Confirmation dialog before deletion
      - Updates order values after deletion
    - **Impact**: Complete CRUD operations for sections

  - **Nested Structure Support**:
    - **Radio Groups**: Expand to show radio options
      - Each option shows: label, price, price-basis, description
      - Expand option to view/edit popup content (nested sections)
      - Edit/delete individual radio options
    - **Checkbox Groups**: Expand to show checkbox items
      - Edit/delete individual checkbox items
    - **Div Groups**: Expand to show div items
      - Edit/delete individual div items
    - **Addon Items**: Expand to show addon list
      - Edit/delete individual addon items
    - **Expand/Collapse UI**: `toggleNestedContent()`, `togglePopupContent()`
      - Toggle buttons (▼/▲) on sections with nested content
      - Smooth expand/collapse animations
    - **Impact**: Full support for complex nested menu structures

  - **JSON Output**:
    - `getMenuJSON()` - Converts editor state to JSON
    - Maintains exact structure matching `SAMPLE-MENU-JSONB-NEW.json` format
    - Validates required properties before output
    - Deep copy to avoid mutating state
    - **Impact**: Ensures compatibility with existing menu rendering system

  - **Save/Reset Functionality**:
    - `saveMenu()` - POSTs JSON to `/admin/api/menu/save` endpoint
    - Maintains existing save endpoint compatibility
    - `resetMenu()` - Restores original menu data
    - Success/error message display
    - **Impact**: Seamless integration with existing backend

- **Admin CSS Stylesheet** (`public/global/css/admin.css`):
  - **Removed Old Styles**:
    - Removed `.admin-json-editor` height constraint
    - **Impact**: Cleanup of unused styles

  - **New Editor Container Styles**:
    - `.admin-menu-editor-container` - Main editor container
    - `.admin-editor-toolbar` - Toolbar with add button
    - `.admin-sections-list` - Container for section cards
    - **Impact**: New editor layout

  - **Section Card Styles**:
    - `.admin-section-card` - Individual section card
    - `.admin-section-header` - Card header with controls
    - `.admin-section-drag-handle` - Drag handle styling
    - `.admin-section-type-badge` - HTML type badges with color coding
    - `.admin-section-content` - Section content preview
    - `.sortable-ghost`, `.sortable-drag` - Drag feedback styles
    - **Impact**: Visual section cards with drag-and-drop support

  - **Nested Content Styles**:
    - `.admin-nested-content` - Container for nested items
    - `.admin-nested-item` - Individual nested items (radio, checkbox, etc.)
    - `.admin-popup-content` - Popup content container
    - `.admin-expand-toggle` - Expand/collapse button styling
    - **Impact**: Styled nested structure display

  - **Modal Styles**:
    - `.admin-modal` - Modal overlay
    - `.admin-modal-content` - Modal content container
    - `.admin-modal-header`, `.admin-modal-body`, `.admin-modal-footer` - Modal sections
    - `.admin-form-group`, `.admin-form-input` - Form styling
    - `.admin-button-primary`, `.admin-button-secondary` - Button styles
    - **Impact**: Professional modal dialogs for editing

  - **Responsive Design**:
    - Updated mobile styles for new editor
    - Modal adapts to smaller screens
    - **Impact**: Works on all device sizes

#### Technical Details

**JSON Structure Handling**:
- Supports all HTML types: `h1`, `h2`, `p`, `image`, `radio-group`, `checkbox-group`, `div-group`, `unordered-list`
- Handles nested structures: radio options with popups, checkbox items, div items, addon items
- Maintains exact property structure: `order`, `html-type`, `content`, `src`, `alt`, `caption`, `label`, `price`, `price-basis`, `description`, `popup`

**Section Key Generation**:
- Auto-generates keys: `section1`, `section2`, etc.
- Finds highest section number and increments
- Does not reuse keys when sections are deleted (maintains consistency)

**Order Management**:
- Order determined by visual position in list
- Automatically recalculated on drag-and-drop
- Order starts at 1 and increments by 1

**Validation**:
- Validates JSON structure before save
- Ensures required properties exist for each HTML type
- Shows validation errors to user via message display

**Dependencies**:
- **SortableJS**: Lightweight drag-and-drop library (~15KB minified)
  - CDN: `https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js`
  - No jQuery dependency
  - MIT License

#### Benefits

- **Better UX**: Visual, intuitive interface for non-technical users
- **Drag-and-Drop**: Easy section reordering by dragging
- **Visual Representation**: See menu structure at a glance
- **Lightweight**: SortableJS is much smaller than JSONEditor
- **No Breaking Changes**: Maintains existing data loading and save patterns
- **DRY Principles**: Reusable rendering functions
- **Full Feature Support**: All HTML types and nested structures supported
- **Professional UI**: Modern modals, forms, and visual feedback

#### Breaking Changes

None - This is a complete replacement that maintains API compatibility. The save endpoint (`/admin/api/menu/save`) and data format remain unchanged.

#### Files Affected

**Modified Files**:
- `src/views/admin/menu-editor.hbs` - Removed JSONEditor, added SortableJS, updated HTML structure
- `public/global/js/admin-menu-editor.js` - Complete rewrite with new editor logic
- `public/global/css/admin.css` - Added comprehensive styles for new editor
- `docs/CHANGELOG_ADMIN_BRANCH.md` - Updated changelog entry

**No New Files Created** (all changes are modifications to existing files)

#### Testing Recommendations

1. **Test with Existing Menu Data**:
   - Load menu editor with existing menu from database
   - Verify all sections render correctly
   - Verify nested structures display properly

2. **Test Section Management**:
   - Add new sections of each HTML type
   - Edit sections and verify changes save
   - Delete sections and verify order updates

3. **Test Drag-and-Drop**:
   - Drag sections to reorder
   - Verify order values update correctly
   - Verify visual feedback during drag

4. **Test Nested Structures**:
   - Expand/collapse radio groups, checkboxes, addons
   - Edit nested items (radio options, checkboxes, etc.)
   - Verify popup content displays correctly

5. **Test Save/Reset**:
   - Save menu and verify JSON output matches expected format
   - Reset menu and verify original state restores
   - Verify save endpoint receives correct data

6. **Test Edge Cases**:
   - Empty menu (no existing data)
   - Menu with only one section
   - Menu with deeply nested structures
   - Very long content in sections

7. **Verify JSON Output**:
   - Compare saved JSON with `SAMPLE-MENU-JSONB-NEW.json` format
   - Ensure all required properties are present
   - Verify order values are correct

#### Related Documentation

- See `public/sample_menu/SAMPLE-MENU-JSONB-NEW.json` for expected JSON format
- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin interface conventions

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

