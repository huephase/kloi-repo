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

### January 3, 2025 @ 11:59 - Backend Routes Consolidation: Move All Admin Routes Under /admin/ Prefix

**Type**: 🟠 MAJOR CHANGE

**Summary**: Consolidated all backend admin routes under the `/admin/` prefix for consistency and better organization. Moved `/dashboard` to `/admin/dashboard` and added `/admin/kloiserverhealthcheck` route. The original `/kloiserverhealthcheck` route remains accessible for Render's internal monitoring (lightweight check without admin requirements). All backend admin routes now follow a consistent naming pattern under the `/admin/` prefix, improving discoverability and maintainability.

**Problem**: 
- Backend admin routes were scattered across different path patterns (`/dashboard`, `/kloiserverhealthcheck`, `/admin/*`)
- Inconsistent route organization made it difficult to identify all backend admin routes
- Dashboard route was registered directly in `app.ts` instead of with other admin routes
- Health check route lacked an admin-prefixed version for consistency

**Solution**:
- Moved `/dashboard` route from `app.ts` to `src/routes/admin/index.ts` as `/admin/dashboard`
- Added new `/admin/kloiserverhealthcheck` route with admin protection hooks
- Extracted shared health check logic into `performHealthCheck()` function for DRY principle
- Kept original `/kloiserverhealthcheck` route for Render's internal monitoring
- Updated dashboard template to reference new admin-prefixed routes
- Updated all documentation to reflect new route paths

#### Major Changes

- **App Routes** (`src/app.ts`):
  - **Removed Route**:
    - Removed `GET /dashboard` route registration (lines 227-251)
    - Removed unused imports: `requireAdminSubdomain`, `validateAdminSession` (no longer needed in app.ts)
    - Updated comment for health check route to clarify it serves Render's monitoring
  - **Code Removed**:
    ```typescript
    // 2025-12-30T20:00:00Z 🟡🟡🟡 - [ADMIN DASHBOARD] Register admin dashboard route directly
    app.get('/dashboard', {
      preHandler: [requireAdminSubdomain(), validateAdminSession]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      // ... dashboard route handler
    });
    ```
  - **Impact**: Dashboard route now properly organized with other admin routes under `/admin/` prefix

- **Admin Routes** (`src/routes/admin/index.ts`):
  - **New Route Added**:
    - `GET /admin/dashboard` - Admin dashboard with links to all superadmin routes
    - Route applies both `requireAdminSubdomain()` and `validateAdminSession` hooks
    - Registered at end of adminRoutes function before final console.log
  - **New Route Added**:
    - `GET /admin/kloiserverhealthcheck` - System health check dashboard (admin subdomain only, requires authentication)
    - Route applies both `requireAdminSubdomain()` and `validateAdminSession` hooks
    - Uses shared `performHealthCheck()` function from healthCheck.ts for DRY principle
  - **Imports Added**:
    - Added import for `performHealthCheck` from `../healthCheck`
  - **Code Added**:
    ```typescript
    // 2025-01-03T11:59:00Z 🟡🟡🟡 - [ADMIN DASHBOARD] Register admin dashboard route under /admin/ prefix
    app.get('/admin/dashboard', {
      preHandler: [requireAdminSubdomain(), validateAdminSession]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      // ... dashboard handler
    });

    // 2025-01-03T11:59:00Z 🟡🟡🟡 - [ADMIN HEALTH CHECK] Register admin health check route under /admin/ prefix
    app.get('/admin/kloiserverhealthcheck', {
      preHandler: [requireAdminSubdomain(), validateAdminSession]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const htmlContent = await performHealthCheck();
      return reply.header('Content-Type', 'text/html').send(htmlContent);
    });
    ```
  - **Impact**: All backend admin routes now consistently organized under `/admin/` prefix

- **Health Check Routes** (`src/routes/healthCheck.ts`):
  - **Shared Function Extracted**:
    - Extracted comprehensive health check logic into `export async function performHealthCheck(): Promise<string>`
    - Function performs all health checks (server time, database, Redis, environment variables, system resources)
    - Returns HTML content for health check dashboard
    - Follows DRY principle - shared by both `/kloiserverhealthcheck` and `/admin/kloiserverhealthcheck`
  - **Route Updated**:
    - `/kloiserverhealthcheck` route now calls `performHealthCheck()` function
    - Route remains accessible for Render's internal monitoring (no admin requirements for Render checks)
    - For custom domain requests, still requires admin subdomain access
  - **Code Changed**:
    ```typescript
    // 2025-01-03T11:59:00Z 🟡🟡🟡 - [HEALTH CHECK] Shared function to perform comprehensive health check
    export async function performHealthCheck(): Promise<string> {
      // ... comprehensive health check logic
      return htmlContent;
    }

    // Route handler now calls shared function
    const htmlContent = await performHealthCheck();
    return reply.header('Content-Type', 'text/html').send(htmlContent);
    ```
  - **Impact**: Health check logic is now reusable and follows DRY principles

- **Dashboard Template** (`src/views/admin/dashboard.hbs`):
  - **Link Updated**:
    - Changed health check link from `/kloiserverhealthcheck` to `/admin/kloiserverhealthcheck` (line 42)
  - **Code Changed**:
    ```handlebars
    <a href="/admin/kloiserverhealthcheck" class="admin-button-primary" target="_blank">Open Health Check</a>
    ```
  - **Impact**: Dashboard now links to admin-prefixed health check route

- **Documentation Updates**:
  - **APP-WIDE-SERVICES-AND-MODULES.md**:
    - Updated protected routes list to include `/admin/kloiserverhealthcheck` and `/admin/dashboard`
    - Clarified that `/kloiserverhealthcheck` remains for Render's monitoring
    - Updated code reference comments
  - **routes/index.ts**:
    - Updated console log messages to reflect new admin health check path
    - Added separate log for admin health check dashboard
  - **Impact**: Documentation now accurately reflects route organization

#### Technical Details

**Route Access Control**:
- `/admin/dashboard` - Requires admin subdomain + authentication
- `/admin/kloiserverhealthcheck` - Requires admin subdomain + authentication
- `/kloiserverhealthcheck` - Remains accessible for Render's monitoring (lightweight check), requires admin subdomain for custom domain requests

**Route Organization**:
- All backend admin routes now consistently use `/admin/` prefix
- Routes registered in `src/routes/admin/index.ts` follow same pattern
- Health check logic extracted to shared function for DRY principle

**Access Patterns**:
- **Backend Team Access**:
  - Dashboard: `https://admin.mydomain.com/admin/dashboard` (requires login)
  - Health Check: `https://admin.mydomain.com/admin/kloiserverhealthcheck` (requires login)
  - All routes accessible via admin.mydomain.com subdomain
- **Render Monitoring**:
  - Health Check: `https://kloi-repo.onrender.com:3000/kloiserverhealthcheck` (no admin requirements, lightweight check)

#### Security Considerations

- **Admin Subdomain Protection**: All `/admin/*` routes require admin subdomain access via `requireAdminSubdomain()` hook
- **Authentication Required**: All `/admin/*` routes require active admin session via `validateAdminSession` hook
- **404 Response**: Routes return 404 Not Found (not 403 Forbidden) to hide route existence from non-admin subdomains
- **Render Health Check**: Original `/kloiserverhealthcheck` remains accessible for Render's monitoring without admin requirements
- **No Breaking Changes**: Existing functionality continues to work, routes just moved to new paths

#### Benefits

- **Consistent Organization**: All backend admin routes now under `/admin/` prefix
- **Better Discoverability**: Easy to identify all admin routes by prefix
- **DRY Principle**: Health check logic extracted to shared function
- **Maintainability**: Routes organized in single location (`src/routes/admin/index.ts`)
- **Clear Separation**: Render monitoring route separate from admin routes

#### Breaking Changes

⚠️⚠️⚠️ **Route Path Changes**:
- `/dashboard` → `/admin/dashboard` (old path no longer works)
- Health check dashboard moved to `/admin/kloiserverhealthcheck` (original `/kloiserverhealthcheck` still works for Render monitoring)

**Migration Required**:
- Update bookmarks and links to use new `/admin/dashboard` path
- Update any scripts or tools that reference `/dashboard` to use `/admin/dashboard`
- Dashboard template already updated to use new health check path

#### Files Affected

**Modified Files**:
- `src/app.ts` - Removed `/dashboard` route registration and unused imports
- `src/routes/admin/index.ts` - Added `/admin/dashboard` and `/admin/kloiserverhealthcheck` routes, added import for `performHealthCheck`
- `src/routes/healthCheck.ts` - Extracted `performHealthCheck()` function, exported for reuse
- `src/views/admin/dashboard.hbs` - Updated health check link to `/admin/kloiserverhealthcheck`
- `src/routes/index.ts` - Updated console log messages for new route paths
- `docs/APP-WIDE-SERVICES-AND-MODULES.md` - Updated protected routes list and code references
- `docs/CHANGELOG_ADMIN_BRANCH.md` - Added this changelog entry

#### Testing Recommendations

1. **Test Route Access**:
   - Verify `/admin/dashboard` is accessible from admin.mydomain.com/admin/dashboard (with login)
   - Verify `/admin/kloiserverhealthcheck` is accessible from admin.mydomain.com/admin/kloiserverhealthcheck (with login)
   - Verify `/dashboard` returns 404 (old path no longer works)
   - Verify `/admin/dashboard` returns 404 from non-admin subdomains
   - Verify `/admin/kloiserverhealthcheck` returns 404 from non-admin subdomains

2. **Test Render Health Check**:
   - Verify `/kloiserverhealthcheck` still works for Render's monitoring (lightweight check)
   - Verify Render can access health check without admin requirements

3. **Test Dashboard Links**:
   - Verify health check link in dashboard points to `/admin/kloiserverhealthcheck`
   - Verify all dashboard links are correct and functional
   - Verify invitation management link works (requires SUPER_ADMIN)
   - Verify pending approvals link works (requires SUPER_ADMIN)

4. **Test Security**:
   - Verify all `/admin/*` routes require admin subdomain access
   - Verify all `/admin/*` routes require authentication
   - Test with different admin roles (SUPER_ADMIN, EDITOR, READ_ONLY)

#### Related Documentation

- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin interface conventions and route organization
- See `src/routes/admin/index.ts` for all admin route registrations
- See `src/routes/healthCheck.ts` for shared health check function implementation
- See `src/hooks/adminHooks.ts` for admin authentication and subdomain protection hooks

---

### January 2, 2025 @ 19:20 - Backend Superadmin Setup: Enhanced Seed Script for Immediate Access

**Type**: 🟠 MAJOR CHANGE

**Summary**: Enhanced the admin seed script (`seedAdmin.ts`) to support creating backend superadmin accounts with full role, status, and email verification control. This enables backend team members to create SUPER_ADMIN accounts that can immediately log in and access invitation management routes without going through the invitation/approval workflow. The seed script now supports all admin fields including role assignment, status management, and email verification flags, making it possible to bootstrap the first superadmin account for invitation management.

**Problem**: 
- No way to create backend superadmin accounts that could immediately access invitation management
- Seed script only created basic admin accounts with default READ_ONLY role and PENDING status
- Created admins could not log in immediately (required email verification and approval workflow)
- No way to bypass invitation workflow for initial backend team setup
- Backend team had no accessible username/password to control invitations
- Seed script lacked support for role, status, and email verification parameters

**Solution**:
- Enhanced `AdminService.createAdmin()` to accept `emailVerified` parameter
- Extended seed script CLI to support `--role`, `--status`, `--emailVerified` flags
- Added support for `--firstName`, `--lastName`, `--phone` parameters
- Implemented automatic email verification when status is ACTIVE
- Added comprehensive help text with usage examples
- Created setup documentation guide for backend superadmin creation
- Enhanced output to display login instructions after account creation

#### Major Changes

- **Admin Service** (`src/services/adminService.ts`):
  - **Updated `createAdmin()` Method**:
    - Added `emailVerified: boolean = false` parameter to method signature
    - Allows direct creation of admins with verified email status
    - Enables immediate login access for seed-created accounts
    - **Code Changed**:
      ```typescript
      // 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN SERVICE] Create admin with hashed password
      static async createAdmin(
        username: string,
        password: string,
        theme: string,
        email?: string,
        firstName?: string,
        lastName?: string,
        phone?: string,
        role: 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY' = 'READ_ONLY',
        status: 'PENDING' | 'EMAIL_VERIFIED' | 'APPROVED' | 'ACTIVE' | 'INACTIVE' = 'PENDING',
        emailVerified: boolean = false  // 🟡🟡🟡 - [NEW PARAMETER] Email verification flag
      ): Promise<Admin> {
        // ... existing validation logic ...
        
        // Create admin
        const admin = await prisma.admins.create({
          data: {
            username: username || null,
            password: hashedPassword,
            theme,
            email: email || null,
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || '',
            role,
            status,
            emailVerified,  // 🟡🟡🟡 - [NEW FIELD] Set email verification status
            isActive: status === 'ACTIVE'
          }
        });
      }
      ```
    - **Impact**: Enables creation of admins with verified email, allowing immediate login access

- **Admin Seed Script** (`src/scripts/seedAdmin.ts`):
  - **Extended CLI Options Type**:
    - Added `role?: 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY'` to `CLIOptions` type
    - Added `status?: 'PENDING' | 'EMAIL_VERIFIED' | 'APPROVED' | 'ACTIVE' | 'INACTIVE'` to `CLIOptions` type
    - Added `emailVerified?: boolean` to `CLIOptions` type
    - Added `firstName?: string`, `lastName?: string`, `phone?: string` to `CLIOptions` type
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [CLI OPTIONS] Parse command-line arguments
      type CLIOptions = {
        username: string;
        password: string;
        theme: string;
        email?: string;
        firstName?: string;      // 🟡🟡🟡 - [NEW] First name support
        lastName?: string;        // 🟡🟡🟡 - [NEW] Last name support
        phone?: string;           // 🟡🟡🟡 - [NEW] Phone number support
        role?: 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY';  // 🟡🟡🟡 - [NEW] Role support
        status?: 'PENDING' | 'EMAIL_VERIFIED' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';  // 🟡🟡🟡 - [NEW] Status support
        emailVerified?: boolean;  // 🟡🟡🟡 - [NEW] Email verification flag
      };
      ```
    - **Impact**: Seed script now supports all admin fields for complete account configuration

  - **Enhanced Argument Parsing**:
    - Added validation for `--role` parameter (must be SUPER_ADMIN, EDITOR, or READ_ONLY)
    - Added validation for `--status` parameter (must be valid status enum value)
    - Added parsing for `--emailVerified` flag (accepts 'true'/'1' or 'false'/'0')
    - Added parsing for `--firstName`, `--lastName`, `--phone` parameters
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [PARSE ARGS] Enhanced argument parsing
      if (key === 'username' || key === 'password' || key === 'theme' || key === 'email' || 
          key === 'firstName' || key === 'lastName' || key === 'phone') {
        (options as any)[key] = value;
      } else if (key === 'role') {
        if (value === 'SUPER_ADMIN' || value === 'EDITOR' || value === 'READ_ONLY') {
          (options as any)[key] = value;
        } else {
          logError(`Invalid role: ${value}. Must be SUPER_ADMIN, EDITOR, or READ_ONLY`);
          return null;
        }
      } else if (key === 'status') {
        if (value === 'PENDING' || value === 'EMAIL_VERIFIED' || value === 'APPROVED' || 
            value === 'ACTIVE' || value === 'INACTIVE') {
          (options as any)[key] = value;
        } else {
          logError(`Invalid status: ${value}. Must be PENDING, EMAIL_VERIFIED, APPROVED, ACTIVE, or INACTIVE`);
          return null;
        }
      } else if (key === 'emailVerified') {
        (options as any)[key] = value === 'true' || value === '1';
      }
      ```
    - **Impact**: Comprehensive parameter validation ensures correct account creation

  - **Improved Help Text**:
    - Added detailed usage instructions with all available parameters
    - Added examples for creating backend superadmin and regular theme admin
    - Clear parameter descriptions and defaults
    - **Code Added**:
      ```typescript
      console.log('\nUsage: npm run admin:seed -- --username <username> --password <password> --theme <theme> [options]');
      console.log('\nRequired:');
      console.log('  --username <username>     Admin username');
      console.log('  --password <password>     Admin password');
      console.log('  --theme <theme>           Theme subdomain (e.g., "admin" for backend superadmin)');
      console.log('\nOptional:');
      console.log('  --email <email>          Admin email address');
      console.log('  --firstName <name>       First name');
      console.log('  --lastName <name>         Last name');
      console.log('  --phone <phone>          Phone number');
      console.log('  --role <role>            Role: SUPER_ADMIN, EDITOR, or READ_ONLY (default: READ_ONLY)');
      console.log('  --status <status>        Status: PENDING, EMAIL_VERIFIED, APPROVED, ACTIVE, or INACTIVE (default: PENDING)');
      console.log('  --emailVerified <true|false>  Email verified flag (default: false)');
      console.log('\nExamples:');
      console.log('  # Create backend superadmin (for invitation management):');
      console.log('  npm run admin:seed -- --username superadmin --password SecurePass123 --theme admin --role SUPER_ADMIN --status ACTIVE --emailVerified true --email superadmin@example.com --firstName "Backend" --lastName "Admin"');
      console.log('\n  # Create regular theme admin:');
      console.log('  npm run admin:seed -- --username admin --password SecurePass123 --theme default --email admin@example.com');
      ```
    - **Impact**: Users can easily understand how to create different types of admin accounts

  - **Smart Defaults and Auto-Configuration**:
    - Automatically sets `emailVerified=true` when status is ACTIVE (required for login)
    - Defaults role to READ_ONLY if not specified
    - Defaults status to PENDING if not specified
    - Warns if creating ACTIVE admin without email verification
    - **Code Added**:
      ```typescript
      // 🟡🟡🟡 - [DEFAULTS] Set defaults for optional parameters
      const role = options.role || 'READ_ONLY';
      const status = options.status || 'PENDING';
      // If status is ACTIVE, automatically set emailVerified to true (required for login)
      const emailVerified = options.emailVerified !== undefined 
        ? options.emailVerified 
        : (status === 'ACTIVE' ? true : false);

      // ⚠️⚠️⚠️ - [WARNING] Warn if creating ACTIVE admin without email verification
      if (status === 'ACTIVE' && !emailVerified) {
        logError('WARNING: Creating ACTIVE admin without email verification. Admin will not be able to log in.');
        console.log('⚠️⚠️⚠️ - [seedAdmin] Authentication requires emailVerified=true for ACTIVE admins');
      }
      ```
    - **Impact**: Prevents common mistakes and ensures admins can log in when status is ACTIVE

  - **Enhanced Account Creation**:
    - Passes all parameters to `AdminService.createAdmin()` including new fields
    - **Code Changed**:
      ```typescript
      // 🟡🟡🟡 - [CREATE ADMIN] Create admin using AdminService
      const admin = await AdminService.createAdmin(
        options.username,
        options.password,
        options.theme,
        options.email,
        options.firstName,      // 🟡🟡🟡 - [NEW] Pass first name
        options.lastName,       // 🟡🟡🟡 - [NEW] Pass last name
        options.phone,          // 🟡🟡🟡 - [NEW] Pass phone
        role,                   // 🟡🟡🟡 - [NEW] Pass role
        status,                 // 🟡🟡🟡 - [NEW] Pass status
        emailVerified           // 🟡🟡🟡 - [NEW] Pass email verified flag
      );
      ```
    - **Impact**: Complete admin account creation with all fields

  - **Improved Output and Login Instructions**:
    - Displays all account details including role, status, and email verification status
    - Shows login URL, username, and password reminder
    - Provides warnings for accounts that cannot log in
    - **Code Added**:
      ```typescript
      console.log('\n✅✅✅ Admin account created successfully!');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Theme: ${admin.theme}`);
      console.log(`   Role: ${admin.role}`);              // 🟡🟡🟡 - [NEW] Display role
      console.log(`   Status: ${admin.status}`);          // 🟡🟡🟡 - [NEW] Display status
      console.log(`   Email Verified: ${admin.emailVerified ? 'Yes' : 'No'}`);  // 🟡🟡🟡 - [NEW] Display email verification
      if (admin.email) {
        console.log(`   Email: ${admin.email}`);
      }
      if (admin.firstName || admin.lastName) {
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`.trim());  // 🟡🟡🟡 - [NEW] Display name
      }
      console.log(`   Created at: ${admin.createdAt.toISOString()}`);
      
      // ⚠️⚠️⚠️ - [LOGIN INFO] Display login instructions for ACTIVE admins
      if (admin.status === 'ACTIVE' && admin.emailVerified) {
        console.log('\n⚠️⚠️⚠️ Login Information:');
        console.log(`   URL: https://${admin.theme}.yourdomain.com/admin/login`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password: [the password you provided]`);
        console.log(`   ⚠️⚠️⚠️ Make sure to change the default password after first login!`);
      } else if (admin.status === 'ACTIVE' && !admin.emailVerified) {
        console.log('\n❗❗❗ WARNING: Admin is ACTIVE but email is not verified.');
        console.log('   Admin will NOT be able to log in until email is verified.');
      } else {
        console.log('\n⚠️⚠️⚠️ Note: Admin status is not ACTIVE. Admin cannot log in yet.');
        console.log('   To activate: Update status to ACTIVE and set emailVerified=true');
      }
      ```
    - **Impact**: Clear feedback and instructions for using created accounts

- **Setup Documentation** (`docs/SETUP_BACKEND_SUPERADMIN.md` - New File):
  - **Complete Setup Guide**:
    - Quick start command for creating backend superadmin
    - Detailed parameter explanations
    - Access instructions for admin interface
    - Important notes about theme subdomain requirements
    - Authentication requirements documentation
    - Role-based access control explanation
    - Security best practices
    - Troubleshooting section
    - Alternative commands for regular theme admins
    - **Code Structure**:
      - Quick start section with ready-to-use command
      - Command breakdown with parameter explanations
      - Access patterns and URL examples
      - Security considerations
      - Troubleshooting guide
    - **Impact**: Comprehensive guide for backend team to set up superadmin accounts

#### Technical Details

**Command Syntax**:
```bash
npm run admin:seed -- --username <username> --password <password> --theme <theme> [options]
```

**Backend Superadmin Creation Example**:
```bash
npm run admin:seed -- \
  --username superadmin \
  --password YourSecurePassword123 \
  --theme admin \
  --role SUPER_ADMIN \
  --status ACTIVE \
  --emailVerified true \
  --email superadmin@yourdomain.com \
  --firstName "Backend" \
  --lastName "Admin"
```

**Parameter Defaults**:
- `role`: Defaults to `READ_ONLY` if not specified
- `status`: Defaults to `PENDING` if not specified
- `emailVerified`: Defaults to `false`, but automatically set to `true` if status is `ACTIVE`

**Authentication Requirements**:
For an admin to be able to log in immediately, they must have:
- `status: 'ACTIVE'`
- `emailVerified: true`
- `isActive: true` (automatically set when status is ACTIVE)
- Valid username and password

**Theme Subdomain Requirement**:
- Backend superadmin must use `--theme admin` to access admin subdomain routes
- Admin subdomain routes (`/admin/invitations`, `/admin/pending-approvals`, etc.) require `theme === 'admin'`
- Routes are protected by `requireAdminSubdomain()` hook
- Access via `https://admin.yourdomain.com/admin/login`

**Role-Based Access**:
- **SUPER_ADMIN**: Full access including invitation creation and approval management
- **EDITOR**: Can edit menus and upload images, cannot manage invitations/approvals
- **READ_ONLY**: Can view menus only, cannot edit or upload

#### Security Considerations

1. **Password Security**:
   - All passwords are hashed with bcrypt (10 salt rounds) before storage
   - Seed script does not store or log passwords
   - Users should change default passwords after first login

2. **Email Verification**:
   - Email verification is required for ACTIVE admins to log in
   - Seed script can bypass email verification for initial setup
   - Production admins should go through normal invitation/verification workflow

3. **Theme Isolation**:
   - Backend superadmin must use `theme: 'admin'` for admin subdomain access
   - Theme admins are scoped to their specific theme subdomain
   - Admin subdomain routes are hidden from non-admin subdomains (404 response)

4. **Role Enforcement**:
   - Role is set during account creation
   - Server-side role checks enforce access control
   - SUPER_ADMIN role required for invitation management routes

#### Benefits

- **Immediate Access**: Backend team can create superadmin accounts that can log in immediately
- **Bypass Workflow**: Initial setup can bypass invitation/approval workflow for bootstrap accounts
- **Complete Control**: Seed script supports all admin fields for full account configuration
- **Clear Instructions**: Comprehensive help text and output guide users through account creation
- **Smart Defaults**: Automatic email verification when status is ACTIVE prevents login issues
- **Documentation**: Complete setup guide for backend team reference
- **Flexibility**: Can create different types of admin accounts (superadmin, editor, read-only)

#### Breaking Changes

None - This is an enhancement to existing functionality. The seed script maintains backward compatibility with existing usage patterns.

#### Files Affected

**New Files**:
- `docs/SETUP_BACKEND_SUPERADMIN.md` - Complete setup guide for backend superadmin creation

**Modified Files**:
- `src/services/adminService.ts` - Added `emailVerified` parameter to `createAdmin()` method
  - **Lines Changed**: Method signature (line 74-84), admin creation data (line 115)
  - **Impact**: Enables direct creation of admins with verified email status

- `src/scripts/seedAdmin.ts` - Enhanced CLI with role, status, and email verification support
  - **Lines Changed**: 
    - Type definition (lines 5-17): Added optional fields for role, status, emailVerified, firstName, lastName, phone
    - Argument parsing (lines 48-68): Added validation and parsing for new parameters
    - Help text (lines 77-94): Added comprehensive usage instructions and examples
    - Main function (lines 112-187): Added defaults, warnings, enhanced output, and login instructions
  - **Impact**: Complete admin account creation with all fields and clear user feedback

- `docs/CHANGELOG_ADMIN_BRANCH.md` - Added changelog entry documenting all changes

#### Testing Recommendations

1. **Test Backend Superadmin Creation**:
   ```bash
   npm run admin:seed -- --username superadmin --password TestPass123 --theme admin --role SUPER_ADMIN --status ACTIVE --emailVerified true --email superadmin@test.com --firstName "Test" --lastName "Admin"
   ```
   - Verify account is created with correct role, status, and email verification
   - Verify login instructions are displayed
   - Test login at `https://admin.yourdomain.com/admin/login`
   - Verify access to `/admin/invitations` route
   - Verify access to `/admin/dashboard` route

2. **Test Regular Theme Admin Creation**:
   ```bash
   npm run admin:seed -- --username admin --password TestPass123 --theme default --email admin@test.com
   ```
   - Verify account is created with default READ_ONLY role and PENDING status
   - Verify warning is displayed about non-ACTIVE status
   - Verify account cannot log in (status is PENDING)

3. **Test Parameter Validation**:
   - Test with invalid role (should show error)
   - Test with invalid status (should show error)
   - Test with missing required parameters (should show help text)
   - Test with emailVerified=false and status=ACTIVE (should show warning)

4. **Test Auto-Configuration**:
   - Create admin with status=ACTIVE but no emailVerified flag
   - Verify emailVerified is automatically set to true
   - Verify admin can log in successfully

5. **Test Output and Instructions**:
   - Verify all account details are displayed correctly
   - Verify login instructions are shown for ACTIVE admins
   - Verify warnings are shown for accounts that cannot log in

6. **Test Security**:
   - Verify passwords are not logged or displayed
   - Verify email verification requirement for ACTIVE admins
   - Verify theme subdomain requirement for admin routes

#### Related Documentation

- See `docs/SETUP_BACKEND_SUPERADMIN.md` for complete setup guide
- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin interface conventions
- See `src/services/adminService.ts` for admin service implementation
- See `src/hooks/adminHooks.ts` for admin authentication and role-based access control
- See `src/routes/admin/index.ts` for admin routes and invitation management

---

### December 30, 2025 @ 19:30 - Admin Dashboard: Centralized Superadmin Route Index

**Type**: 🟠 MAJOR CHANGE

**Summary**: Created a centralized admin dashboard route (`/dashboard`) that provides an index of links to all backend superadmin routes. The dashboard is accessible only via the admin subdomain (admin.mydomain.com/dashboard) and requires admin authentication. This centralizes access to all backend team tools and routes in one convenient location. The route follows the same pattern as `/kloiserverhealthcheck` and is registered directly in `app.ts`.

**Problem**: 
- Backend superadmin routes were scattered across different paths
- No centralized location to discover and access all admin subdomain-protected routes
- Backend team had to remember or bookmark individual routes
- No overview of available superadmin tools and their access requirements

**Solution**:
- Created new `/dashboard` route accessible via admin subdomain (similar to `/kloiserverhealthcheck`)
- Route registered directly in `app.ts` to avoid session validation hooks
- Built user-friendly dashboard page with cards for each superadmin route
- Listed all backend superadmin routes with descriptions and access requirements
- Applied admin subdomain protection and authentication requirements
- Added navigation links to menu editor and logout functionality

#### Major Changes

- **App Routes** (`src/app.ts`):
  - **New Protected Route** (require admin subdomain + authentication):
    - `GET /dashboard` - Render admin dashboard page
    - Route registered directly in `app.ts` (similar to `/kloiserverhealthcheck` pattern)
    - Route applies both `requireAdminSubdomain()` and `validateAdminSession()` hooks
    - Passes theme, adminUsername, and admin context to template
    - **Code Added**:
      ```typescript
      // 2025-12-30T20:00:00Z 🟡🟡🟡 - [ADMIN DASHBOARD] Register admin dashboard route directly
      app.get('/dashboard', {
        preHandler: [requireAdminSubdomain(), validateAdminSession]
      }, async (request: FastifyRequest, reply: FastifyReply) => {
        const theme = (request as any).theme || 'default';
        const admin = (request as any).admin;
        return reply.view('admin/dashboard', {
          theme,
          adminUsername: admin.username,
          admin,
          page_class: generatePageClass('admin/dashboard')
        });
      });
      ```
    - **Impact**: Backend team can now access centralized dashboard at admin.mydomain.com/dashboard

- **View Template** (`src/views/admin/dashboard.hbs` - New File):
  - **Dashboard Layout**:
    - Admin header with theme badge and username display
    - Navigation links to menu editor and logout button
    - Welcome message and description
  - **Route Cards**:
    - System Health Check card with link to `/kloiserverhealthcheck`
    - Invitation Management card with link to `/admin/invitations`
    - Pending Admin Approvals card with link to `/admin/pending-approvals`
    - Each card displays route description, access requirements, and direct link
  - **Footer Note**:
    - Information about admin subdomain access requirements
    - Note about SUPER_ADMIN role requirements for certain routes
  - **Code Structure**:
    - Follows existing admin template patterns (header, container, styling)
    - Uses admin CSS classes for consistent styling
    - Responsive design for mobile devices
  - **Impact**: User-friendly centralized access point for all superadmin routes

- **CSS Styles** (`public/global/css/admin.css`):
  - **Dashboard Container Styles**:
    - `.admin-dashboard-wrapper` - Main dashboard container with max-width
    - `.admin-dashboard-info` - Info section container
    - `.admin-section-description` - Description text styling
  - **Route Card Styles**:
    - `.admin-dashboard-routes` - Grid layout for route cards
    - `.admin-dashboard-section-title` - Section title styling
    - `.admin-route-card` - Individual route card with hover effects
    - `.admin-route-card-header` - Card header with title and badge
    - `.admin-route-title` - Route title styling
    - `.admin-route-badge` - Access requirement badge styling
    - `.admin-route-description` - Route description text
    - `.admin-route-actions` - Action button container
  - **Footer Styles**:
    - `.admin-dashboard-footer` - Footer container with note styling
    - `.admin-dashboard-note` - Note text styling
  - **Responsive Design**:
    - Mobile-friendly card layout
    - Stacked layout on small screens
    - Responsive header actions
  - **Code Added** (at end of file):
    ```css
    .admin-dashboard-wrapper { ... }
    .admin-dashboard-routes { ... }
    .admin-route-card { ... }
    /* Responsive styles */
    ```
  - **Impact**: Professional, consistent styling matching existing admin interface

#### Technical Details

**Route Access Control**:
- Route protected by `requireAdminSubdomain()` hook (checks `request.theme === 'admin'`)
- Route automatically protected by `validateAdminSession` hook (requires active admin session)
- Returns 404 Not Found when accessed from non-admin subdomains
- Redirects to `/admin/login` if not authenticated

**Routes Listed in Dashboard**:
- `/kloiserverhealthcheck` - System health check dashboard (admin subdomain only)
- `/admin/invitations` - Invitation management page (SUPER_ADMIN + admin subdomain)
- `/admin/pending-approvals` - List admins awaiting approval (SUPER_ADMIN + admin subdomain)

**Access Patterns**:
- **Backend Team Access**:
  - Access dashboard: `https://admin.mydomain.com/dashboard` (requires login)
  - Dashboard provides links to all other superadmin routes
  - All routes accessible via admin.mydomain.com subdomain

- **Theme Admin Access**:
  - Cannot access dashboard from theme subdomains (returns 404)
  - Dashboard only accessible from admin subdomain

#### Security Considerations

- **Admin Subdomain Protection**: Route requires admin subdomain access via `requireAdminSubdomain()` hook
- **Authentication Required**: Route requires active admin session via `validateAdminSession` hook
- **404 Response**: Returns 404 Not Found (not 403 Forbidden) to hide route existence from non-admin subdomains
- **Security Through Obscurity**: Non-admin subdomains cannot discover that dashboard route exists
- **No Breaking Changes**: Existing admin functionality continues to work as before

#### Benefits

- **Centralized Access**: Single location to access all backend superadmin routes
- **User-Friendly**: Visual cards with descriptions make it easy to find and access routes
- **Clear Access Requirements**: Each route card shows access requirements (admin subdomain, SUPER_ADMIN role)
- **Consistent UX**: Follows existing admin interface patterns and styling
- **Mobile Responsive**: Works on all device sizes
- **Easy Discovery**: Backend team can easily discover available superadmin tools

#### Breaking Changes

None - This is a new feature addition that does not affect existing functionality.

#### Files Affected

**New Files**:
- `src/views/admin/dashboard.hbs` - Admin dashboard page template

**Modified Files**:
- `src/app.ts` - Added GET /dashboard route (registered directly, similar to health check)
- `public/global/css/admin.css` - Added dashboard page styles
- `docs/CHANGELOG_ADMIN_BRANCH.md` - Added changelog entry

#### Testing Recommendations

1. **Test Route Access**:
   - Verify dashboard is accessible from admin.mydomain.com/dashboard (with login)
   - Verify dashboard returns 404 from non-admin subdomains
   - Verify dashboard redirects to login if not authenticated

2. **Test Dashboard Links**:
   - Verify all links in dashboard are correct and functional
   - Verify health check link opens in new tab
   - Verify invitation management link works (requires SUPER_ADMIN)
   - Verify pending approvals link works (requires SUPER_ADMIN)

3. **Test Responsive Design**:
   - Test on mobile devices
   - Test on tablets
   - Verify card layout adapts to screen size
   - Verify buttons are accessible on small screens

4. **Test Security**:
   - Verify dashboard requires admin subdomain access
   - Verify dashboard requires authentication
   - Test with different admin roles (SUPER_ADMIN, EDITOR, READ_ONLY)

#### Related Documentation

- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin interface conventions
- See `src/app.ts` for dashboard route registration (similar to health check route)
- See `src/hooks/adminHooks.ts` for admin authentication and subdomain protection hooks

---

### December 30, 2025 @ 17:40 - Backend Admin Subdomain Route Protection

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented subdomain-based route protection to restrict backend team routes to only be accessible via the 'admin' subdomain (admin.mydomain.com). Routes accessed from other subdomains return 404 Not Found, providing security through obscurity by hiding route existence from non-admin subdomains.

**Problem**: 
- Health check route (`/kloiserverhealthcheck`) was accessible from any subdomain
- Invitation management routes (`/admin/invitations`, etc.) were accessible from any theme subdomain
- Backend team needed dedicated access to specific routes that should not be available to theme-specific admins
- No mechanism to restrict routes to specific subdomains
- Routes were discoverable from any subdomain, potentially exposing backend infrastructure

**Solution**:
- Created reusable `requireAdminSubdomain()` hook for subdomain-based access control
- Applied hook to health check route (`/kloiserverhealthcheck`)
- Applied hook to all invitation management routes (combined with existing `requireSuperAdmin()` hook)
- Routes return 404 Not Found when accessed from non-admin subdomains
- Backend team can access protected routes via admin.mydomain.com

#### Major Changes

- **Admin Hooks** (`src/hooks/adminHooks.ts`):
  - **New Hook Function**:
    - `requireAdminSubdomain()` - Middleware factory for admin subdomain access control
    - Checks if `request.theme === 'admin'` (theme extracted from subdomain by existing middleware)
    - Returns 404 Not Found if accessed from any other subdomain
    - Includes logging with emoji prefixes following project conventions
    - **Code Added**:
      ```typescript
      // 2025-12-30T17:40:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Middleware factory for admin subdomain access control
      export function requireAdminSubdomain() {
        return async (request: FastifyRequest, reply: FastifyReply) => {
          const theme = (request as any).theme || 'default';
          
          if (theme !== 'admin') {
            console.log('❗❗❗ - [ADMIN SUBDOMAIN] Access denied - route requires admin subdomain, got theme:', theme, 'for path:', request.url);
            return reply.status(404).send('Not Found');
          }
          
          console.log('✅✅✅ - [ADMIN SUBDOMAIN] Admin subdomain access granted for path:', request.url);
        };
      }
      ```
    - **Impact**: Provides reusable pattern for subdomain-based route protection

- **Health Check Route** (`src/routes/healthCheck.ts`):
  - **Updated Route**:
    - `GET /kloiserverhealthcheck` - Now requires admin subdomain access
    - Route applies `requireAdminSubdomain()` hook as preHandler
    - Returns 404 Not Found when accessed from non-admin subdomains
    - **Code Changed**:
      ```typescript
      // 2025-12-30T17:40:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Health check route requires admin subdomain access
      app.get('/kloiserverhealthcheck', {
        preHandler: [requireAdminSubdomain()]
      }, async (_request: FastifyRequest, reply: FastifyReply) => {
        // ... existing health check logic
      });
      ```
    - **Impact**: Health check dashboard now only accessible to backend team via admin.mydomain.com

- **Admin Routes** (`src/routes/admin/index.ts`):
  - **Updated Protected Routes** (require admin subdomain + SUPER_ADMIN):
    - `GET /admin/invitations` - Invitation management page
    - `GET /admin/pending-approvals` - List admins awaiting approval
    - `POST /admin/invitations/create` - Create new invitation
    - `POST /admin/approve` - Approve and activate admin
  - Routes now apply both `requireAdminSubdomain()` and `requireSuperAdmin()` hooks
  - Hooks are combined using array syntax: `preHandler: [requireAdminSubdomain(), requireSuperAdmin()]`
  - **Code Changed**:
    ```typescript
    // GET /admin/invitations - Render invitation management page (SUPER_ADMIN only, admin subdomain only)
    app.get('/admin/invitations', {
      preHandler: [requireAdminSubdomain(), requireSuperAdmin()]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      // ... existing route logic
    });
    ```
  - **Impact**: Invitation management routes now only accessible from admin subdomain, providing additional security layer

#### Security Considerations

- **404 Response**: Routes return 404 Not Found (not 403 Forbidden) to hide route existence from non-admin subdomains
- **Security Through Obscurity**: Non-admin subdomains cannot discover that these routes exist
- **Early Validation**: Theme detection happens early in request lifecycle via `detectThemeFromSubdomain` hook
- **Lightweight Check**: Hook performs simple string comparison (`theme === 'admin'`)
- **Layered Security**: Protected routes maintain existing authentication/authorization checks (e.g., `requireSuperAdmin()`)
- **No Breaking Changes**: Existing admin functionality (menu editor, etc.) continues to work from theme subdomains

#### Access Patterns

- **Backend Team Access**:
  - Access health check: `https://admin.mydomain.com/kloiserverhealthcheck`
  - Access invitations: `https://admin.mydomain.com/admin/invitations` (requires SUPER_ADMIN login)
  - All protected routes accessible via admin.mydomain.com subdomain

- **Theme Admin Access**:
  - Cannot access health check from theme subdomains (returns 404)
  - Cannot access invitation routes from theme subdomains (returns 404)
  - Can still access menu editor and other theme-scoped admin features from their theme subdomains

#### Documentation Updates

- **APP-WIDE-SERVICES-AND-MODULES.md**:
  - Added new section "Admin Subdomain Route Protection"
  - Documented `requireAdminSubdomain()` hook usage
  - Included code examples for protected routes
  - Listed all protected routes
  - Added requirements for adding new admin subdomain-protected routes

#### Testing Considerations

- Verify `/kloiserverhealthcheck` returns 404 from non-admin subdomains
- Verify `/kloiserverhealthcheck` works correctly from admin.mydomain.com
- Verify invitation routes return 404 from non-admin subdomains
- Verify invitation routes work correctly from admin.mydomain.com (with proper SUPER_ADMIN auth)
- Ensure existing admin functionality (menu editor, etc.) still works from theme subdomains
- Verify hook order: `requireAdminSubdomain()` should run before other hooks

---

### December 30, 2025 @ 17:30 - Super Admin Invitation Link Management UI

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented user-friendly UI for super admins to generate invitation links with tokens. The new interface allows super admins to create invitation links via a web form, view the generated link, and copy it to clipboard for distribution. This complements the existing invitation API endpoint with a visual interface that makes invitation management more accessible.

**Problem**: 
- Super admins could only create invitations via API endpoint (`POST /admin/invitations/create`)
- No visual interface for creating invitation links
- Required technical knowledge to use API directly
- No easy way to copy invitation links for distribution
- Manual process for generating and sharing invitation links

**Solution**:
- Created dedicated invitation management page (`GET /admin/invitations`)
- Built user-friendly form interface for email and theme input
- Implemented real-time invitation link generation and display
- Added copy-to-clipboard functionality for easy link sharing
- Integrated with existing invitation API endpoint
- Added navigation between menu editor and invitation management

#### Major Changes

- **Admin Routes** (`src/routes/admin/index.ts`):
  - **New Protected Route** (require SUPER_ADMIN):
    - `GET /admin/invitations` - Render invitation management page
    - Route applies `requireSuperAdmin()` hook for access control
    - Passes theme, adminUsername, and admin context to template
    - **Code Added**:
      ```typescript
      app.get('/admin/invitations', {
        preHandler: [requireSuperAdmin()]
      }, async (request: FastifyRequest, reply: FastifyReply) => {
        const theme = (request as any).theme || 'default';
        const admin = (request as any).admin;
        return reply.view('admin/invitations', {
          theme,
          adminUsername: admin.username,
          admin,
          page_class: generatePageClass('admin/invitations')
        });
      });
      ```
    - **Impact**: Super admins can now access invitation management via web interface

- **View Template** (`src/views/admin/invitations.hbs` - New File):
  - **Invitation Form**:
    - Email input field with validation (required, email format)
    - Theme input field with validation (required, alphanumeric with underscores/hyphens)
    - Theme field pre-filled with current theme from request
    - Submit button to create invitation
    - Form help text for each field
  - **Invitation Link Display**:
    - Success message area showing invitation creation confirmation
    - Read-only input field displaying full invitation link URL
    - Copy button with visual feedback
    - Help text explaining how to use the link
  - **Navigation**:
    - Link to menu editor for easy navigation
    - Logout button in header
    - Theme badge and admin username display
  - **Code Structure**:
    - Follows existing admin template patterns (header, container, styling)
    - Uses admin CSS classes for consistent styling
    - Includes client-side JavaScript for form handling
  - **Impact**: User-friendly interface for invitation management

- **Client-Side JavaScript** (`public/global/js/admin-invitations.js` - New File):
  - **Form Handling**:
    - Intercepts form submission to prevent page reload
    - Validates email format and theme format client-side
    - Sends AJAX POST request to `/admin/invitations/create`
    - Handles loading states (disables button, shows "Creating..." text)
  - **API Integration**:
    - Sends JSON payload with email and theme
    - Parses JSON response from invitation API
    - Displays success/error messages to user
    - Shows invitation link in result area on success
  - **Copy Functionality**:
    - Uses modern Clipboard API (`navigator.clipboard.writeText`)
    - Falls back to `document.execCommand('copy')` for older browsers
    - Provides visual feedback when link is copied
    - Shows success message after copy
  - **Error Handling**:
    - Displays user-friendly error messages
    - Handles network errors gracefully
    - Validates input before submission
    - Shows appropriate messages for validation failures
  - **Code Features**:
    - Comprehensive logging with emoji prefixes
    - Auto-hide success messages after 5 seconds
    - Smooth scrolling to result area
    - Proper error state management
  - **Impact**: Seamless user experience for invitation creation and link copying

- **CSS Styles** (`public/global/css/admin.css`):
  - **Invitation Form Styles**:
    - `.admin-invitations-wrapper` - Main container with max-width
    - `.admin-invitations-form-container` - Form container with card styling
    - `.admin-invitation-form` - Form layout with flexbox
    - `.admin-form-group` - Form field grouping
    - `.admin-form-label` - Label styling with required indicator
    - `.admin-form-input` - Input field styling with focus states
    - `.admin-form-help-text` - Help text styling
  - **Invitation Result Styles**:
    - `.admin-invitation-result` - Result container with top border
    - `.admin-invitation-success` - Success message styling
    - `.admin-invitation-link-container` - Link display container
    - `.admin-invitation-link-wrapper` - Link input and button wrapper
    - `.admin-invitation-link-input` - Read-only link input with monospace font
    - `.admin-button-copy` - Copy button with green theme
  - **Navigation Styles**:
    - `.admin-header-actions` - Header action container
    - `.admin-nav-link` - Navigation link styling
  - **Responsive Design**:
    - Mobile-friendly form layout
    - Stacked button layout on small screens
    - Full-width inputs on mobile
    - Responsive header actions
  - **Code Added** (at end of file):
    ```css
    .admin-invitations-wrapper { ... }
    .admin-invitation-form { ... }
    .admin-invitation-link-wrapper { ... }
    .admin-button-copy { ... }
    /* Responsive styles */
    ```
  - **Impact**: Professional, consistent styling matching existing admin interface

#### Technical Details

**Route Access Control**:
- Route protected by `requireSuperAdmin()` hook
- Only SUPER_ADMIN role can access invitation management page
- Theme context passed from request to template
- Admin information included in template context

**Form Submission Flow**:
1. User fills email and theme fields
2. Client-side validation checks format
3. Form submits via AJAX to `/admin/invitations/create`
4. Server validates using `invitationCreateSchema`
5. Server creates invitation via `AdminService.createInvitation()`
6. Server sends invitation email via SendGrid
7. Server returns invitation link in JSON response
8. Client displays link in result area
9. User can copy link to clipboard

**Copy-to-Clipboard Implementation**:
- Primary: Uses `navigator.clipboard.writeText()` (modern browsers)
- Fallback: Uses `document.execCommand('copy')` (older browsers)
- Visual feedback: Button text changes to "Copied!" with green background
- Success message displayed after successful copy
- Error handling for clipboard API failures

**Integration with Existing System**:
- Uses existing `POST /admin/invitations/create` API endpoint
- Leverages existing `invitationCreateSchema` for validation
- Integrates with `AdminService.createInvitation()` method
- Follows existing admin authentication and role-based access patterns
- Uses existing admin CSS classes and styling patterns

#### Security Features

1. **Role-Based Access**:
   - SUPER_ADMIN role required to access page
   - Server-side role check via `requireSuperAdmin()` hook
   - Client-side validation does not bypass server-side checks

2. **Input Validation**:
   - Client-side validation for immediate feedback
   - Server-side validation via existing `invitationCreateSchema`
   - Email format validation (regex and Zod schema)
   - Theme format validation (alphanumeric with underscores/hyphens)

3. **API Security**:
   - Existing invitation API endpoint already protected
   - Rate limiting already implemented on API endpoint
   - Token-based invitation system with expiry

#### Benefits

- **User-Friendly Interface**: Visual form makes invitation creation accessible to non-technical users
- **Easy Link Sharing**: Copy-to-clipboard functionality simplifies link distribution
- **Consistent UX**: Follows existing admin interface patterns and styling
- **Real-Time Feedback**: Immediate success/error messages guide user actions
- **Mobile Responsive**: Works on all device sizes
- **No Breaking Changes**: Complements existing API without modifying it

#### Breaking Changes

None - This is a new feature addition that does not affect existing functionality. The existing API endpoint remains unchanged.

#### Files Affected

**New Files**:
- `src/views/admin/invitations.hbs` - Invitation management page template
- `public/global/js/admin-invitations.js` - Client-side JavaScript for invitation form

**Modified Files**:
- `src/routes/admin/index.ts` - Added GET /admin/invitations route
- `public/global/css/admin.css` - Added invitation form and result styles
- `docs/CHANGELOG_ADMIN_BRANCH.md` - Added changelog entry

#### Testing Recommendations

1. **Test Route Access**:
   - Verify SUPER_ADMIN can access `/admin/invitations`
   - Verify non-SUPER_ADMIN roles are denied access
   - Verify redirect to login if not authenticated

2. **Test Form Submission**:
   - Submit form with valid email and theme - should succeed
   - Submit form with invalid email format - should show error
   - Submit form with invalid theme format - should show error
   - Submit form with empty fields - should show validation error
   - Verify invitation link is displayed after successful creation

3. **Test Copy Functionality**:
   - Click copy button - should copy link to clipboard
   - Verify visual feedback (button text changes)
   - Verify success message appears
   - Test on different browsers (Chrome, Firefox, Safari)

4. **Test Integration**:
   - Verify invitation email is sent when link is created
   - Verify invitation link works when clicked
   - Verify theme validation matches subdomain
   - Test with different themes

5. **Test Responsive Design**:
   - Test on mobile devices
   - Test on tablets
   - Verify form layout adapts to screen size
   - Verify buttons are accessible on small screens

6. **Test Error Handling**:
   - Test with network errors (disconnect network)
   - Test with server errors (500 response)
   - Test with validation errors (400 response)
   - Verify error messages are user-friendly

#### Related Documentation

- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin interface conventions
- See `src/routes/admin/index.ts` for invitation API endpoint
- See `src/services/adminService.ts` for invitation creation logic
- See `src/schemas/admin.schemas.ts` for invitation validation schema

---

### December 29, 2025 @ 19:00 - Admin Sign-Up with Invitations and Email Verification

**Type**: 🟠 MAJOR CHANGE | 🔵 MIGRATION REQUIRED

**Summary**: Implemented invitation-only admin sign-up system with email verification, manual approval workflow, and role-based access control. New admins sign up via invitation links, verify their email, await manual approval/activation by backend team, and are assigned roles (Super Admin, Editor, Read-Only). The system includes comprehensive security features including rate limiting, token-based verification, and role-based route protection.

**Problem**: 
- No way for new admins to sign up - all accounts had to be created manually via seed script
- No email verification process for admin accounts
- No role-based access control - all admins had full access
- No invitation system for controlled admin onboarding
- Manual approval workflow not supported

**Solution**:
- Implemented invitation-only sign-up with secure token-based invitation links
- Added email verification with 7-day expiry tokens
- Created manual approval workflow with status tracking (PENDING → EMAIL_VERIFIED → APPROVED → ACTIVE)
- Implemented role-based access control (SUPER_ADMIN, EDITOR, READ_ONLY)
- Added rate limiting for sign-up and verification resend endpoints
- Integrated SendGrid email service for invitation, verification, and notification emails

#### Major Changes

- **Database Schema** (`prisma/schema.prisma`):
  - **New Enums**:
    - `AdminRole` enum: SUPER_ADMIN, EDITOR, READ_ONLY
    - `AdminStatus` enum: PENDING, EMAIL_VERIFIED, APPROVED, ACTIVE, INACTIVE
  - **Admins Model Updates**:
    - Added `firstName` (String, required)
    - Added `lastName` (String, required)
    - Added `phone` (String, required)
    - Added `role` (AdminRole, default: READ_ONLY)
    - Added `emailVerified` (Boolean, default: false)
    - Added `emailVerificationToken` (String, nullable, unique)
    - Added `emailVerificationExpiry` (DateTime, nullable)
    - Added `invitationToken` (String, nullable, unique, indexed)
    - Added `invitationExpiry` (DateTime, nullable)
    - Added `invitedBy` (String, nullable, foreign key to Admins.id)
    - Added `approvedAt` (DateTime, nullable)
    - Added `approvedBy` (String, nullable, foreign key to Admins.id)
    - Added `status` (AdminStatus, default: PENDING)
    - Made `username` and `password` nullable (for future OAuth support)
  - **Indexes Added**:
    - Index on `invitationToken` for fast lookups
    - Index on `emailVerificationToken` for fast lookups
    - Index on `email` for email-based queries
    - Index on `status` for filtering by status
  - **Relations Added**:
    - `inviter` relation (Admins invited by this admin)
    - `approver` relation (Admins approved by this admin)
  - **Migration**: `YYYYMMDDHHMMSS_add_admin_signup_fields`

- **Email Service** (`src/services/emailService.ts` - Complete Implementation):
  - **Core Functions**:
    - `sendEmail()` - Core SendGrid email sending with HTML and text fallback
    - `sendInvitationEmail()` - Invitation email with secure link
    - `sendEmailVerificationEmail()` - Email verification with token link
    - `sendApprovalNotificationEmail()` - Notify backend team of pending approvals
    - `sendAccountActivatedEmail()` - Notify admin when account is activated
  - **Features**:
    - HTML email templates with professional styling
    - Plain text fallbacks for all emails
    - Expiration notices in email content
    - Theme-aware email styling

- **SendGrid Configuration** (`src/config/sendgrid.ts` - New File):
  - SendGrid API initialization
  - Environment variable configuration (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME)
  - Error handling and logging

- **Admin Service Extensions** (`src/services/adminService.ts`):
  - **New Methods**:
    - `createInvitation()` - Generate invitation token and send invitation email
    - `validateInvitationToken()` - Validate invitation token and expiry
    - `signUpAdmin()` - Process sign-up with invitation token
    - `generateEmailVerificationToken()` - Generate secure verification token
    - `verifyEmail()` - Verify email using token, update status to EMAIL_VERIFIED
    - `resendVerificationEmail()` - Resend verification email with new token
    - `approveAdmin()` - Backend team approves and assigns role
    - `activateAdmin()` - Activate admin account (set status to ACTIVE)
    - `getPendingAdmins()` - Get list of admins awaiting approval
    - `getAdminByEmail()` - Find admin by email address
  - **Updated Methods**:
    - `createAdmin()` - Now supports firstName, lastName, phone, role, status fields
    - `authenticateAdmin()` - Now checks emailVerified, status=ACTIVE, rejects INACTIVE status
  - **Token Management**:
    - Secure token generation using crypto.randomBytes
    - 7-day expiry for invitation and verification tokens
    - Single-use tokens (cleared after use)

- **Validation Schemas** (`src/schemas/admin.schemas.ts`):
  - **New Schemas**:
    - `adminSignUpSchema` - Validates sign-up form (firstName, lastName, phone, password, invitationToken)
    - `emailVerificationSchema` - Validates email verification token
    - `invitationCreateSchema` - Validates invitation creation (email, theme)
    - `adminApprovalSchema` - Validates admin approval (adminId, role)
    - `resendVerificationSchema` - Validates resend verification request (email)
  - **Updated Schemas**:
    - `adminCreateSchema` - Added firstName, lastName, phone, role fields

- **Admin Routes** (`src/routes/admin/index.ts`):
  - **New Public Routes** (before validateAdminSession hook):
    - `GET /admin/signup` - Render sign-up page with invitation token validation
    - `POST /admin/signup` - Process sign-up (rate limited: 3 per IP per hour)
    - `GET /admin/verify-email` - Email verification endpoint
    - `POST /admin/resend-verification` - Resend verification email (rate limited: 3 per email per hour)
  - **New Protected Routes** (require SUPER_ADMIN):
    - `GET /admin/pending-approvals` - List admins awaiting approval
    - `POST /admin/invitations/create` - Create new invitation
    - `POST /admin/approve` - Approve and activate admin with role assignment
  - **Updated Routes** (role-based access):
    - `POST /admin/api/menu/save` - Now requires EDITOR or SUPER_ADMIN role
    - `POST /admin/api/upload-image` - Now requires EDITOR or SUPER_ADMIN role
  - **Rate Limiting**:
    - Sign-up: 3 attempts per IP per hour
    - Resend verification: 3 requests per email per hour
    - Uses in-memory Map storage (same pattern as login rate limiting)

- **Role-Based Access Control** (`src/hooks/adminHooks.ts`):
  - **New Functions**:
    - `requireRole(allowedRoles)` - Middleware factory for role-based access
    - `requireSuperAdmin()` - Require SUPER_ADMIN role
    - `requireEditorOrAbove()` - Require EDITOR or SUPER_ADMIN
    - `canEditMenu(admin)` - Check if admin can edit menu
    - `canViewMenu(admin)` - Check if admin can view menu (all roles)
  - **Updated `validateAdminSession`**:
    - Now checks admin status is ACTIVE (rejects INACTIVE)
    - Attaches admin.role to request for easy access
    - Updated public routes list to include sign-up and verification routes

- **View Templates** (New Files):
  - `src/views/admin/signup.hbs` - Sign-up form with invitation token validation
  - `src/views/admin/verify-email.hbs` - Email verification success page
  - `src/views/admin/verification-sent.hbs` - Verification email sent confirmation
  - `src/views/admin/verification-error.hbs` - Verification error page
  - **Updated**: `src/views/admin/login.hbs` - Added invitation-only message

- **Utility Functions** (`src/lib/utils.ts`):
  - **New Functions**:
    - `generateSecureToken(length)` - Generate cryptographically secure random tokens
    - `validatePhoneNumber(phone)` - Validate phone number format
    - `sanitizePhoneNumber(phone)` - Sanitize phone number input

- **CSS Styles** (`public/global/css/admin.css`):
  - Added `.admin-disabled-input` styles for disabled form fields
  - Added `.form-help-text` styles for form help text
  - Added `.admin-success-message` styles for success messages

#### Technical Details

**Sign-Up Flow**:
1. Super admin creates invitation via `POST /admin/invitations/create`
2. System generates secure invitation token and sends email with link
3. User clicks invitation link → `GET /admin/signup?token=...`
4. User fills sign-up form (firstName, lastName, phone, password)
5. System creates admin record with status=PENDING
6. System generates email verification token and sends verification email
7. User clicks verification link → `GET /admin/verify-email?token=...`
8. System updates status to EMAIL_VERIFIED and notifies backend team
9. Backend team approves via `POST /admin/approve` (assigns role)
10. System activates account (status=ACTIVE) and notifies user
11. User can now log in

**Role-Based Access**:
- **SUPER_ADMIN**: Full access including invitation creation and approval management
- **EDITOR**: Can edit menus and upload images, cannot manage invitations/approvals
- **READ_ONLY**: Can view menus only, cannot edit or upload

**Token Security**:
- Invitation tokens: 32-byte hex tokens, 7-day expiry, single-use
- Verification tokens: 32-byte hex tokens, 7-day expiry, single-use
- Tokens generated using `crypto.randomBytes()` for cryptographic security

**Status Flow**:
- PENDING: Initial state after sign-up, before email verification
- EMAIL_VERIFIED: After email verification, awaiting approval
- APPROVED: After backend team approval, before activation
- ACTIVE: Account is active and can log in
- INACTIVE: Account deactivated (cannot log in)

#### Security Features

1. **Rate Limiting**:
   - Sign-up: 3 attempts per IP per hour
   - Resend verification: 3 requests per email per hour
   - Prevents abuse and brute force attacks

2. **Token Security**:
   - Cryptographically secure random tokens
   - 7-day expiry for all tokens
   - Single-use tokens (invalidated after use)
   - Tokens stored in database with expiry timestamps

3. **Email Verification**:
   - Required before approval
   - Prevents email enumeration (doesn't reveal if email exists)
   - Resend functionality with rate limiting

4. **Role Enforcement**:
   - Server-side role checks in hooks
   - Never trust client-side role information
   - Role checks applied before route handlers execute

5. **Invitation Security**:
   - Invitation tokens expire after 7 days
   - One-time use (cleared after sign-up)
   - Theme validation (invitation must match subdomain theme)

#### Environment Variables

**New Variables**:
- `ADMIN_INVITATION_EXPIRY_HOURS=168` (7 days default)
- `ADMIN_EMAIL_VERIFICATION_EXPIRY_HOURS=168` (7 days default)
- `ADMIN_APPROVAL_NOTIFICATION_EMAIL=<backend-team-email>` (for approval notifications)
- `SENDGRID_FROM_EMAIL=<noreply@yourdomain.com>` (email sender address)
- `SENDGRID_FROM_NAME=KLOI Admin` (email sender name)
- `APP_URL=<your-domain>` (for generating invitation/verification links)

#### Migration Instructions

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Run Database Migration**:
   ```bash
   npx prisma migrate dev --name add_admin_signup_fields
   # or for production
   npx prisma migrate deploy
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Set Environment Variables**:
   - Configure SendGrid API key and email settings
   - Set admin approval notification email
   - Configure token expiry hours (optional, defaults to 7 days)
   - Set APP_URL for invitation/verification links

5. **Create First Super Admin** (if needed):
   - Use existing seed script or manually create via database
   - Ensure first admin has SUPER_ADMIN role for invitation creation

#### Breaking Changes

- **Admins Table Schema**: Major schema changes requiring migration
  - **Impact**: Existing admin accounts will need to be updated with new required fields (firstName, lastName, phone)
  - **Action Required**: 
    - Run migration script
    - Update existing admin records with required fields
    - Assign roles to existing admins (defaults to READ_ONLY)
    - Set status to ACTIVE for existing active admins

- **Authentication Changes**: `authenticateAdmin()` now requires emailVerified=true and status=ACTIVE
  - **Impact**: Existing admins without email verification will not be able to log in
  - **Action Required**: Set emailVerified=true and status=ACTIVE for existing admins

- **Username/Password Nullable**: Username and password are now nullable
  - **Impact**: Existing code expecting non-null values may need updates
  - **Action Required**: Update code to handle nullable username/password (for future OAuth support)

#### Benefits

- **Controlled Onboarding**: Invitation-only sign-up ensures only authorized users can create accounts
- **Email Verification**: Ensures admin email addresses are valid and owned by the user
- **Role-Based Access**: Granular permissions prevent unauthorized access to sensitive operations
- **Audit Trail**: Invitation and approval tracking provides accountability
- **Security**: Rate limiting, token expiry, and role enforcement protect against abuse
- **User Experience**: Clear status flow and email notifications keep users informed
- **Scalability**: Backend team can efficiently manage admin approvals and role assignments

#### Files Affected

**New Files**:
- `src/config/sendgrid.ts` - SendGrid email service configuration
- `src/views/admin/signup.hbs` - Sign-up page template
- `src/views/admin/verify-email.hbs` - Email verification success page
- `src/views/admin/verification-sent.hbs` - Verification sent confirmation page
- `src/views/admin/verification-error.hbs` - Verification error page

**Modified Files**:
- `prisma/schema.prisma` - Added AdminRole and AdminStatus enums, extended Admins model
- `src/services/adminService.ts` - Added invitation, sign-up, verification, and approval methods
- `src/services/emailService.ts` - Complete implementation of SendGrid email service
- `src/schemas/admin.schemas.ts` - Added sign-up, verification, invitation, and approval schemas
- `src/routes/admin/index.ts` - Added sign-up, verification, invitation, and approval routes
- `src/hooks/adminHooks.ts` - Added role-based access control functions
- `src/lib/utils.ts` - Added token generation and phone validation utilities
- `src/views/admin/login.hbs` - Added invitation-only message
- `public/global/css/admin.css` - Added sign-up form styles
- `docs/APP-WIDE-SERVICES-AND-MODULES.md` - Added admin sign-up and role-based access documentation

**Migration File**:
- `prisma/migrations/YYYYMMDDHHMMSS_add_admin_signup_fields/migration.sql`

#### Testing Recommendations

1. **Test Sign-Up Flow**:
   - Create invitation as super admin
   - Click invitation link and verify email is pre-filled
   - Complete sign-up form with valid data
   - Verify email verification is sent
   - Click verification link and verify status updates
   - Test with invalid/expired invitation tokens

2. **Test Email Verification**:
   - Verify email with valid token
   - Test with expired token (should fail)
   - Test with invalid token (should fail)
   - Test resend verification email functionality
   - Verify rate limiting on resend

3. **Test Approval Workflow**:
   - Approve admin with different roles (SUPER_ADMIN, EDITOR, READ_ONLY)
   - Verify account activation email is sent
   - Verify admin can log in after activation
   - Test approval of non-verified admin (should fail)

4. **Test Role-Based Access**:
   - Test menu editor access with different roles
   - Verify EDITOR can edit menus
   - Verify READ_ONLY cannot edit menus
   - Verify SUPER_ADMIN can create invitations
   - Verify non-SUPER_ADMIN cannot create invitations

5. **Test Rate Limiting**:
   - Test sign-up rate limiting (3 per hour)
   - Test resend verification rate limiting (3 per email per hour)
   - Verify rate limit resets after window expires

6. **Test Security**:
   - Verify tokens expire after 7 days
   - Verify tokens are single-use
   - Verify email enumeration prevention
   - Test with INACTIVE status (should not be able to log in)

#### Related Documentation

- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin sign-up workflow and role-based access documentation
- See `src/services/adminService.ts` for all admin service methods
- See `src/hooks/adminHooks.ts` for role-based access control functions

---

### December 25, 2025 @ 22:57 - Image Upload Implementation: Secure Image Uploads for Menu Editor

**Type**: 🟠 MAJOR CHANGE

**Summary**: Implemented secure image upload functionality for the admin menu editor, allowing admins to upload JPG, PNG, and SVG images (max 5MB) directly from the menu editor interface. Uploaded images are stored in theme-scoped directories (`public/menus/{theme}/`) with UUID-based filenames for security. The feature includes comprehensive client-side and server-side validation, automatic integration with image sections in the menu JSON structure, and a user-friendly upload interface with preview functionality.

**Problem**: 
- Admins had to manually upload images to the server and then manually enter file paths in the menu editor
- No way to upload images directly from the menu editor interface
- Risk of typos in file paths leading to broken images
- No validation of image file types or sizes
- Manual file management was error-prone and time-consuming

**Solution**:
- Added secure image upload endpoint with multipart form data support
- Implemented comprehensive file validation (type, size, MIME type matching)
- Created theme-scoped storage directories for menu images
- Integrated upload functionality directly into image section edit modal
- Added client-side validation for better UX
- Implemented image preview functionality
- Automatic path insertion into image section src field

#### Major Changes

- **Dependencies** (`package.json`):
  - **Added @fastify/multipart** (^9.0.1): Fastify plugin for handling multipart/form-data file uploads
  - **Code Added**:
    ```json
    "@fastify/multipart": "^9.0.1"
    ```
  - **Impact**: Enables secure file upload handling in Fastify

- **Fastify Configuration** (`src/config/fastify.ts`):
  - **Increased Body Limit**:
    - Changed `bodyLimit` from 1MB to 5MB (5 * 1024 * 1024 bytes)
    - Added comment explaining the limit is for image uploads
    - **Code Changed**:
      ```typescript
      bodyLimit: 5242880, // 5MB - Increased for image uploads (JPG, PNG, SVG max 5MB)
      ```
    - **Impact**: Allows larger file uploads for images

- **App Registration** (`src/app.ts`):
  - **Registered Multipart Plugin**:
    - Added `@fastify/multipart` plugin registration after formbody
    - Configured with 5MB file size limit, single file per request
    - **Code Added**:
      ```typescript
      app.register(fastifyMultipart, {
        limits: {
          fileSize: 5242880, // 5MB - Maximum file size for image uploads
          files: 1, // Allow single file upload per request
          fields: 10, // Reasonable limit for form fields
        }
      });
      ```
    - **Impact**: Enables multipart form data parsing for file uploads

- **Image Upload Service** (`src/services/imageUploadService.ts` - New File):
  - **File Validation**:
    - `validateImageFile()` - Validates file type (MIME type + extension), size (5MB max)
    - Validates both MIME type and file extension for security
    - Ensures MIME type matches file extension
    - Returns validation result with error messages
  - **File Management**:
    - `generateUniqueFilename()` - Generates UUID-based filenames to prevent conflicts
    - `ensureThemeDirectory()` - Creates theme directory structure if needed
    - `saveImageFile()` - Saves validated image file to theme directory
    - `deleteImageFile()` - Deletes image file (for future cleanup)
  - **Security Features**:
    - File type validation (JPG, PNG, SVG only)
    - File size validation (5MB maximum)
    - MIME type and extension matching
    - UUID-based filenames prevent path traversal
    - Theme-scoped storage
  - **Code Added**:
    ```typescript
    export async function validateImageFile(file: MultipartFile, maxSize: number = MAX_FILE_SIZE)
    export function generateUniqueFilename(originalName: string, theme: string): string
    export function ensureThemeDirectory(theme: string): string
    export async function saveImageFile(file: MultipartFile, theme: string)
    export function deleteImageFile(filePath: string): void
    ```
  - **Impact**: Centralized, secure image upload handling with comprehensive validation

- **Validation Schema** (`src/schemas/admin.schemas.ts`):
  - **Added Image Upload Schema**:
    - `imageUploadSchema` - Zod schema for image upload request validation
    - Note: Actual file validation handled in imageUploadService
    - **Code Added**:
      ```typescript
      export const imageUploadSchema = z.object({
        // File validation is handled server-side via multipart parser
      });
      ```
    - **Impact**: Type-safe validation structure for upload endpoint

- **Admin Routes** (`src/routes/admin/index.ts`):
  - **Added Image Upload Endpoint**:
    - `POST /admin/api/upload-image` - Handles image file uploads
    - Protected by `validateAdminSession` hook (theme-scoped)
    - Parses multipart form data
    - Validates file using `imageUploadService`
    - Saves file to theme directory
    - Returns JSON response with file path
    - **Code Added**:
      ```typescript
      app.post('/admin/api/upload-image', async (request, reply) => {
        const data = await request.file();
        const validation = await validateImageFile(data);
        const result = await saveImageFile(data, theme);
        return reply.send({ success: true, filePath: result.relativePath });
      });
      ```
    - **Impact**: Secure image upload endpoint with admin authentication

- **Menu Editor JavaScript** (`public/global/js/admin-menu-editor.js`):
  - **Updated Image Section Edit Modal**:
    - Added file input element (hidden, triggered by upload button)
    - Added "Choose Image" button for file selection
    - Added image preview container
    - Added upload status indicator
    - **Code Changed** (around line 566):
      ```javascript
      <div class="admin-image-upload-container">
        <input type="file" id="edit-section-image-upload" accept="image/jpeg,image/png,image/svg+xml">
        <button class="admin-upload-button">Choose Image</button>
        <span class="admin-upload-status"></span>
      </div>
      <div class="admin-image-preview-container">
        <img src="..." class="admin-image-preview">
      </div>
      ```
    - **Impact**: User-friendly image upload interface in edit modal

  - **Added Image Upload Handler**:
    - `handleImageUpload()` - Handles file upload process
    - Client-side validation (file type, size)
    - Creates FormData and POSTs to `/admin/api/upload-image`
    - Updates image section `src` field with returned path
    - Shows image preview
    - Displays upload status (uploading, success, error)
    - **Code Added** (around line 1145):
      ```javascript
      async function handleImageUpload(sectionKey, file, statusSpan, previewContainer, srcInput) {
        // Client-side validation
        // Upload via FormData
        // Update src field and show preview
      }
      ```
    - **Impact**: Seamless image upload integration with menu editor

  - **Event Listeners**:
    - Added file input change listener
    - Added upload button click handler
    - Integrated with existing modal event handlers
    - **Impact**: Complete upload workflow in edit modal

- **Admin CSS Stylesheet** (`public/global/css/admin.css`):
  - **Image Upload Styles**:
    - `.admin-image-upload-container` - Container for upload controls
    - `.admin-file-input` - Hidden file input styling
    - `.admin-upload-button` - Upload button styling (green, matches success theme)
    - `.admin-upload-status` - Status message styling (uploading, success, error states)
    - `.admin-image-preview-container` - Preview container with border and padding
    - `.admin-image-preview` - Image preview styling (max-width, max-height, centered)
    - **Code Added** (at end of file):
      ```css
      .admin-image-upload-container { ... }
      .admin-upload-button { ... }
      .admin-upload-status { ... }
      .admin-image-preview-container { ... }
      .admin-image-preview { ... }
      ```
    - **Impact**: Professional, user-friendly upload interface styling

#### Technical Details

**File Storage Structure**:
- Images stored in `public/menus/{theme}/` directory
- Files renamed with UUIDs: `{uuid}.{ext}` (e.g., `550e8400-e29b-41d4-a716-446655440000.jpg`)
- Theme-scoped directories ensure theme isolation
- Directory structure created automatically if missing

**File Type Validation**:
- Accepts MIME types: `image/jpeg`, `image/png`, `image/svg+xml`
- Accepts file extensions: `.jpg`, `.jpeg`, `.png`, `.svg`
- Validates both MIME type and extension for security
- Ensures MIME type matches file extension (prevents spoofing)

**File Size Limit**:
- Maximum: 5MB (5 * 1024 * 1024 bytes)
- Enforced on both client (for UX) and server (for security)
- Fastify bodyLimit and multipart plugin limits configured

**API Response Format**:
```json
{
  "success": true,
  "filePath": "/public/menus/default/550e8400-e29b-41d4-a716-446655440000.jpg",
  "message": "Image uploaded successfully"
}
```

**Error Response Format**:
```json
{
  "success": false,
  "message": "File size exceeds 5MB limit"
}
```

**Security Features**:
- Admin authentication required (via `validateAdminSession` hook)
- Theme-scoped uploads (admins can only upload to their theme directory)
- File type validation (MIME type + extension)
- File size limits enforced
- UUID-based filenames prevent path traversal
- Directory creation with proper permissions

#### Benefits

- **User-Friendly**: Direct image upload from menu editor interface
- **Secure**: Comprehensive validation on both client and server
- **Theme-Scoped**: Images stored per theme, ensuring isolation
- **Automatic Integration**: Uploaded image path automatically inserted into menu JSON
- **Preview Functionality**: See uploaded image before saving menu
- **Error Handling**: Clear error messages for validation failures
- **Professional UI**: Modern upload interface with status indicators

#### Breaking Changes

None - This is a new feature addition that does not affect existing functionality.

#### Files Affected

**New Files**:
- `src/services/imageUploadService.ts` - Image upload service with validation and file management

**Modified Files**:
- `package.json` - Added `@fastify/multipart` dependency
- `src/config/fastify.ts` - Increased bodyLimit to 5MB
- `src/app.ts` - Registered multipart plugin
- `src/schemas/admin.schemas.ts` - Added image upload validation schema
- `src/routes/admin/index.ts` - Added image upload endpoint
- `public/global/js/admin-menu-editor.js` - Added upload functionality to image edit modal
- `public/global/css/admin.css` - Added upload UI styles
- `docs/CHANGELOG_ADMIN_BRANCH.md` - Updated changelog entry

#### Testing Recommendations

1. **Test Valid Uploads**:
   - Upload valid JPG image (< 5MB) - should succeed
   - Upload valid PNG image (< 5MB) - should succeed
   - Upload valid SVG image (< 5MB) - should succeed
   - Verify file is saved to correct theme directory
   - Verify file path is returned correctly
   - Verify image section src is updated in editor
   - Verify image preview displays correctly

2. **Test Validation**:
   - Upload file > 5MB - should fail with error
   - Upload invalid file type (e.g., PDF) - should fail with error
   - Upload file with mismatched MIME type and extension - should fail
   - Verify error messages are user-friendly

3. **Test Security**:
   - Upload without admin authentication - should fail (redirect to login)
   - Upload to wrong theme - should be prevented by theme validation
   - Verify UUID-based filenames prevent path traversal
   - Test with multiple themes (theme isolation)

4. **Test Integration**:
   - Upload image and save menu - verify image path persists
   - Upload image, edit section, verify preview updates
   - Upload multiple images for different sections
   - Verify uploaded images are accessible via returned paths

#### Related Documentation

- See `public/sample_menu/SAMPLE-MENU-JSONB-NEW.json` for menu JSON structure with image sections
- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin interface conventions

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

