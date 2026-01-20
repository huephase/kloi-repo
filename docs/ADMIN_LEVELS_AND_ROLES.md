# ADMIN LEVELS AND ROLES

## Overview

This document defines the comprehensive 8-level role-based access control (RBAC) system for the KLOI application. The system distinguishes between **Backend Admins** (Levels 1-4) and **Theme Admins** (Levels 5-8), with each level having progressively more limited permissions.

### Role Hierarchy

- **Backend Admins** (Levels 1-4): Access admin subdomain routes, manage system-wide operations
- **Theme Admins** (Levels 5-8): Scoped to specific theme subdomains, manage theme-specific content

### Permission Philosophy

- **Level 1**: Super Admin with full system access
- **Levels 2-4**: Decreasing permissions for backend operations
- **Level 5**: Highest permissions for theme-specific operations
- **Levels 6-8**: Decreasing permissions for theme operations

---

## Backend Admin Levels (1-4)

### Level 1: Super Admin
**Theme**: `admin`  
**Access**: Admin subdomain (`admin.yourdomain.com`)

#### Permissions
- ✅ **Full System Access**
  - Create, read, update, and delete all admin accounts
  - Manage admin invitations and approvals
  - Assign roles to other admins
  - Deactivate/reactivate admin accounts
  - View all admin accounts across all themes
- ✅ **System Management**
  - Access admin dashboard (`/admin/dashboard`)
  - View system health check (`/admin/kloiserverhealthcheck`)
  - Manage system-wide configurations
  - Access all theme menus (read-only across themes)
- ✅ **Theme Management**
  - Create and manage themes
  - Assign theme admins
  - Override theme-specific settings
- ✅ **Menu Management** (All Themes)
  - View menus for all themes
  - Edit menus for all themes
  - Upload images for all themes
  - Delete menus for any theme
- ✅ **Order Management**
  - View all orders across all themes
  - Manage order statuses
  - Access order analytics and reports
- ✅ **Security & Audit**
  - View audit logs for all admins
  - Manage security settings
  - Configure rate limiting and CSRF protection

#### Use Cases
- Backend team leads
- System administrators
- Initial bootstrap accounts

---

### Level 2: Backend Admin
**Theme**: `admin`  
**Access**: Admin subdomain (`admin.yourdomain.com`)

#### Permissions
- ✅ **Admin Account Management** (Limited)
  - View all admin accounts
  - View admin invitations and pending approvals
  - Cannot create invitations
  - Cannot approve/activate admins
  - Cannot delete admin accounts
- ✅ **System Monitoring**
  - Access admin dashboard (`/admin/dashboard`)
  - View system health check (`/admin/kloiserverhealthcheck`)
  - View system metrics and logs
- ✅ **Theme Management** (Read-Only)
  - View all themes and their configurations
  - View theme admin assignments
  - Cannot create or modify themes
- ✅ **Menu Management** (All Themes)
  - View menus for all themes
  - Edit menus for all themes
  - Upload images for all themes
  - Cannot delete menus
- ✅ **Order Management** (Read-Only)
  - View all orders across all themes
  - View order analytics
  - Cannot modify order statuses
- ❌ **Security & Audit**
  - Cannot access audit logs
  - Cannot modify security settings

#### Use Cases
- Backend developers
- Support team leads
- Operations staff

---

### Level 3: Backend Support
**Theme**: `admin`  
**Access**: Admin subdomain (`admin.yourdomain.com`)

#### Permissions
- ✅ **Admin Account Viewing** (Limited)
  - View admin accounts for assigned themes only
  - View admin invitations (read-only)
  - Cannot view pending approvals
  - Cannot manage admin accounts
- ✅ **System Monitoring** (Limited)
  - Access admin dashboard (`/admin/dashboard`)
  - View basic system health check
  - Cannot access detailed metrics
- ✅ **Theme Management** (Read-Only)
  - View assigned themes only
  - Cannot view all themes
- ✅ **Menu Management** (Assigned Themes Only)
  - View menus for assigned themes
  - Edit menus for assigned themes
  - Upload images for assigned themes
  - Cannot delete menus
- ✅ **Order Management** (Assigned Themes Only)
  - View orders for assigned themes
  - View basic order analytics
  - Cannot modify order statuses
- ❌ **Security & Audit**
  - No access to audit logs or security settings

#### Use Cases
- Support staff
- Junior backend developers
- Customer service managers

---

### Level 4: Backend Viewer
**Theme**: `admin`  
**Access**: Admin subdomain (`admin.yourdomain.com`)

#### Permissions
- ✅ **Admin Account Viewing** (Read-Only)
  - View admin accounts for assigned themes only
  - Cannot view invitations or approvals
- ✅ **System Monitoring** (Read-Only)
  - Access admin dashboard (`/admin/dashboard`)
  - View basic system health check (limited information)
- ✅ **Theme Management** (Read-Only)
  - View assigned themes only
- ✅ **Menu Management** (Read-Only, Assigned Themes)
  - View menus for assigned themes
  - Cannot edit menus
  - Cannot upload images
- ✅ **Order Management** (Read-Only, Assigned Themes)
  - View orders for assigned themes
  - Cannot view analytics or modify orders
- ❌ **Security & Audit**
  - No access to any security features

#### Use Cases
- Read-only support staff
- Auditors
- Temporary access accounts

---

## Theme Admin Levels (5-8)

### Level 5: Theme Super Admin
**Theme**: Specific theme (e.g., `starbucks`, `wedding`, `halloween`)  
**Access**: Theme subdomain (`theme.yourdomain.com`)

#### Permissions
- ✅ **Theme Menu Management** (Full Control)
  - View menu for assigned theme
  - Create, edit, and delete menu items
  - Upload and manage images
  - Reorder menu sections
  - Preview menu changes
- ✅ **Theme Configuration**
  - Modify theme-specific settings
  - Manage theme assets
  - Configure theme display options
- ✅ **Order Management** (Theme-Specific)
  - View all orders for assigned theme
  - Modify order statuses
  - Access order analytics for theme
  - Export order data
- ✅ **Theme Admin Management** (Limited)
  - View other admins for assigned theme only
  - Create and invite Level 5-8 admins for assigned theme only (cannot create admins for other themes)
  - Approve and activate Level 5-8 admins for assigned theme only
  - Cannot create or approve Level 1-4 admins (requires Level 1-2)
  - Cannot delete theme admins
- ✅ **Content Management**
  - Manage all theme content
  - Upload and organize media files
  - Configure theme-specific features
- ❌ **System Access**
  - Cannot access admin subdomain routes
  - Cannot view other themes
  - Cannot access system health checks

#### Use Cases
- Theme owners
- Senior theme managers
- Primary content administrators

---

### Level 6: Theme Editor
**Theme**: Specific theme (e.g., `starbucks`, `wedding`, `halloween`)  
**Access**: Theme subdomain (`theme.yourdomain.com`)

#### Permissions
- ✅ **Theme Menu Management** (Edit Only)
  - View menu for assigned theme
  - Create and edit menu items
  - Upload images
  - Reorder menu sections
  - Preview menu changes
  - Cannot delete menu items or sections
- ✅ **Theme Configuration** (Limited)
  - View theme settings
  - Modify non-critical theme settings
  - Cannot modify core theme configurations
- ✅ **Order Management** (Theme-Specific, Limited)
  - View orders for assigned theme
  - View basic order analytics
  - Cannot modify order statuses
  - Cannot export order data
- ❌ **Theme Admin Management**
  - Cannot view or manage other theme admins
- ✅ **Content Management** (Limited)
  - Upload and manage media files
  - Cannot delete content
  - Cannot configure advanced features
- ❌ **System Access**
  - Cannot access admin subdomain routes
  - Cannot view other themes

#### Use Cases
- Content editors
- Menu managers
- Marketing staff

---

### Level 7: Theme Contributor
**Theme**: Specific theme (e.g., `starbucks`, `wedding`, `halloween`)  
**Access**: Theme subdomain (`theme.yourdomain.com`)

#### Permissions
- ✅ **Theme Menu Management** (Limited Edit)
  - View menu for assigned theme
  - Edit existing menu items (limited fields)
  - Upload images (with approval workflow)
  - Cannot create new menu items
  - Cannot delete or reorder items
  - Can preview menu changes
- ✅ **Theme Configuration** (Read-Only)
  - View theme settings
  - Cannot modify any settings
- ✅ **Order Management** (Read-Only)
  - View orders for assigned theme
  - Cannot view analytics
  - Cannot modify orders
- ❌ **Theme Admin Management**
  - No access
- ✅ **Content Management** (Limited)
  - Upload media files (requires approval)
  - Cannot delete content
- ❌ **System Access**
  - Cannot access admin subdomain routes
  - Cannot view other themes

#### Use Cases
- Junior content creators
- Guest contributors
- Temporary staff

---

### Level 8: Theme Viewer
**Theme**: Specific theme (e.g., `starbucks`, `wedding`, `halloween`)  
**Access**: Theme subdomain (`theme.yourdomain.com`)

#### Permissions
- ✅ **Theme Menu Management** (Read-Only)
  - View menu for assigned theme
  - Preview menu
  - Cannot edit, create, or delete any menu items
  - Cannot upload images
- ✅ **Theme Configuration** (Read-Only)
  - View theme settings
  - Cannot modify any settings
- ✅ **Order Management** (Read-Only, Limited)
  - View basic order information for assigned theme
  - Cannot view analytics or detailed order data
  - Cannot modify orders
- ❌ **Theme Admin Management**
  - No access
- ❌ **Content Management**
  - Cannot upload or manage content
- ❌ **System Access**
  - Cannot access admin subdomain routes
  - Cannot view other themes

#### Use Cases
- Read-only reviewers
- Auditors
- Client preview accounts
- Temporary access

---

## Permission Matrix

| Permission | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 |
|------------|----|----|----|----|----|----|----|----|
| **Theme Assignment** |
| Assigned Theme | `admin` | `admin` | `admin` | `admin` | Specific theme | Specific theme | Specific theme | Specific theme |
| **Backend Admin Management** |
| Create admin invitations (Levels 1-4) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create theme admin invitations (Levels 5-8, assigned theme only) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve/activate admins (Levels 1-4) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve/activate theme admins (Levels 5-8, assigned theme only) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View all admin accounts | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| View theme admin accounts (assigned theme) | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ❌ |
| Delete admin accounts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **System Management** |
| Access admin dashboard | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System health check | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modify security settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Theme Management** |
| Create/modify themes | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all themes | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Assign theme admins | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Menu Management** |
| View menus (all themes) | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| View menu (assigned theme) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit menus (all themes) | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit menu (assigned theme) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ⚠️ | ❌ |
| Create menu items | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Delete menu items | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Upload images (all themes) | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upload images (assigned theme) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ⚠️ | ❌ |
| **Order Management** |
| View orders (all themes) | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| View orders (assigned theme) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Modify order statuses | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View order analytics | ✅ | ✅ | ⚠️ | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Export order data | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Content Management** |
| Manage theme content | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ | ⚠️ | ❌ |
| Delete content | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Full permission
- ⚠️ = Limited permission (restricted scope or requires approval)
- ❌ = No permission

---

## Implementation Notes

### Role Assignment

1. **Level 1 (Super Admin)**:
   - Only Level 1 admins can create Level 1 accounts
   - Created via seed script or by existing Level 1 admin
   - Requires `theme: 'admin'`

2. **Levels 2-4 (Backend Admins)**:
   - Assigned by Level 1 admins only
   - Require `theme: 'admin'`
   - Can be assigned to specific themes for limited operations

3. **Levels 5-8 (Theme Admins)**:
   - Level 5 admins can create and invite Level 5-8 admins for their assigned theme
   - Level 1-2 admins can create and assign any level (1-8) admins
   - Require `theme: <specific-theme-name>`
   - Scoped to their assigned theme only

### Access Control

- **Backend Admins (Levels 1-4)**:
  - Access via `admin.yourdomain.com` subdomain
  - Routes protected by `requireAdminSubdomain()` hook
  - Can access admin dashboard and system health checks

- **Theme Admins (Levels 5-8)**:
  - Access via theme-specific subdomain (e.g., `default.yourdomain.com`)
  - Cannot access admin subdomain routes
  - Scoped to their assigned theme

### Security Considerations

1. **Principle of Least Privilege**: Each level has only the minimum permissions necessary
2. **Separation of Concerns**: Backend and theme admins are clearly separated
3. **Audit Trail**: All admin actions should be logged (especially for Levels 1-3)
4. **Role Escalation Prevention**: Lower-level admins cannot promote themselves
5. **Theme Isolation**: Theme admins cannot access other themes' data

### Migration Path

When migrating from current 3-role system:
- `SUPER_ADMIN` → Level 1 (if theme: 'admin') or Level 5 (if theme: specific theme)
- `EDITOR` → Level 2 (if theme: 'admin') or Level 6 (if theme: specific theme)
- `READ_ONLY` → Level 4 (if theme: 'admin') or Level 8 (if theme: specific theme)

---

## Best Practices

1. **Role Assignment**:
   - Start with minimal permissions and escalate as needed
   - Regularly review admin access and remove unnecessary permissions
   - Use Level 8 for client preview accounts

2. **Security**:
   - Level 1 accounts should use strong passwords and 2FA
   - Regularly audit Level 1-3 admin actions
   - Monitor failed login attempts

3. **Theme Management**:
   - Assign Level 5 to trusted theme owners
   - Use Level 6-7 for content teams
   - Use Level 8 for read-only access

4. **Documentation**:
   - Document role assignments and reasons
   - Maintain a record of permission changes
   - Review and update permissions quarterly

---

## Future Enhancements

Potential additions to consider:
- **Granular Permissions**: Fine-grained control over specific actions
- **Time-Limited Access**: Temporary role assignments with expiration
- **Approval Workflows**: Multi-step approval for sensitive operations
- **Role Templates**: Pre-configured permission sets for common use cases
- **Permission Inheritance**: Hierarchical permission structures

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-14  
**Maintained By**: Backend Team
