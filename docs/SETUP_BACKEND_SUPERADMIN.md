# Backend Superadmin Setup Guide

⚠️⚠️⚠️ **IMPORTANT**: This guide explains how to create a backend superadmin account that can access invitation management and other superadmin-only routes.

## Prerequisites

⚠️⚠️⚠️ **Database Migration Required**: The `firstName` and `lastName` fields were added to the Admins table in the December 29, 2025 migration (`add_admin_signup_fields`). If you haven't run this migration yet, you must do so before creating admin accounts:

```bash
npx prisma migrate deploy
# or for development
npx prisma migrate dev
```

**Note**: The `firstName` and `lastName` fields are **required** in the database schema (added in December 29, 2025). The seed script makes them optional (defaults to empty strings), but they are stored in the database.

## Quick Start

To create a backend superadmin account that can immediately log in and manage invitations, run the compiled script directly:

```bash
node dist/scripts/seedAdmin.js --username superadmin --password YourSecurePassword123 --theme admin --role SUPER_ADMIN --status ACTIVE --emailVerified true --email superadmin@yourdomain.com --firstName "Backend" --lastName "Admin"
```

## Command Breakdown

- `--username superadmin` - The login username
- `--password YourSecurePassword123` - The login password (choose a strong password!)
- `--theme admin` - **CRITICAL**: Must be "admin" to access admin subdomain routes
- `--role SUPER_ADMIN` - Required for invitation management access
- `--status ACTIVE` - Required for immediate login access
- `--emailVerified true` - Required for authentication (ACTIVE admins must have verified email)
- `--email superadmin@yourdomain.com` - Admin email address
- `--firstName "Backend"` - First name (optional in seed script, but required in database - defaults to empty string if not provided)
- `--lastName "Admin"` - Last name (optional in seed script, but required in database - defaults to empty string if not provided)

## Accessing the Admin Interface

After creating the superadmin account:

1. **Navigate to admin subdomain**: `https://admin.yourdomain.com/admin/login`
2. **Login with credentials**:
   - Username: `superadmin` (or whatever you set)
   - Password: The password you provided
3. **Access invitation management**: `https://admin.yourdomain.com/admin/invitations`
4. **Access dashboard**: `https://admin.yourdomain.com/admin/dashboard`

## Important Notes

### Theme Subdomain Requirement

⚠️⚠️⚠️ **CRITICAL**: The `--theme admin` parameter is required for backend superadmin access. This ensures:
- Access to admin subdomain-protected routes (`/admin/invitations`, `/admin/pending-approvals`, etc.)
- Route protection via `requireAdminSubdomain()` hook
- Security through obscurity (routes return 404 from non-admin subdomains)

### Authentication Requirements

For an admin to be able to log in, they must have:
- `status: 'ACTIVE'`
- `emailVerified: true`
- `isActive: true` (automatically set when status is ACTIVE)

### Role-Based Access

- **SUPER_ADMIN**: Full access including invitation creation and approval management
- **EDITOR**: Can edit menus and upload images, cannot manage invitations/approvals
- **READ_ONLY**: Can view menus only, cannot edit or upload

### Security Best Practices

1. **Change Default Password**: After first login, change the password immediately
2. **Use Strong Passwords**: Minimum 8 characters, include numbers and special characters
3. **Secure Email**: Use a secure email address for the superadmin account
4. **Limit Access**: Only create superadmin accounts for trusted backend team members

## Troubleshooting

### Cannot Log In

If you cannot log in after creating the account, check:

1. **Status is ACTIVE**: `--status ACTIVE`
2. **Email is verified**: `--emailVerified true`
3. **Theme matches subdomain**: `--theme admin` (must match the subdomain you're accessing)
4. **Username is correct**: Double-check the username you provided

### Cannot Access Invitation Routes

If you can access login but not invitation routes:

1. **Check role**: Must be `SUPER_ADMIN` (`--role SUPER_ADMIN`)
2. **Check subdomain**: Must access via `admin.yourdomain.com` (not other subdomains)
3. **Check theme**: Account must have `theme: 'admin'`

### Route Returns 404

If routes return 404:

1. **Verify admin subdomain**: Routes are only accessible from `admin.yourdomain.com`
2. **Check authentication**: Must be logged in as SUPER_ADMIN
3. **Check theme**: Account theme must be 'admin'

## Alternative: Create Regular Theme Admin

To create a regular admin for a specific theme (not backend superadmin):

```bash
npm run admin:seed -- --username admin --password SecurePass123 --theme default --email admin@example.com
```

This creates a READ_ONLY admin with PENDING status (will need to go through invitation/approval workflow).

## Related Documentation

- See `docs/APP-WIDE-SERVICES-AND-MODULES.md` for admin interface conventions
- See `docs/CHANGELOG_ADMIN_BRANCH.md` for admin feature changelog
- See `src/services/adminService.ts` for admin service implementation
- See `src/hooks/adminHooks.ts` for admin authentication hooks

