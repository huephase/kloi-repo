// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN HOOKS] Admin authentication hooks for admin route protection
import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService, Admin } from '../services/adminService';

console.log('🟡🟡🟡 - [ADMIN HOOKS] Loading admin authentication hooks');

// 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Admin level types - replaced AdminRole enum with level system
export type AdminLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type BackendAdminLevel = 1 | 2 | 3 | 4;
export type ThemeAdminLevel = 5 | 6 | 7 | 8;

/**
 * 🟡🟡🟡 Admin session validation hook for admin routes
 * This hook ensures admins are authenticated and have access to the current theme
 * Hook Logic: IF !request.session.adminId OR admin.theme !== request.theme → redirect to /admin/login
 * Applied to all admin routes EXCEPT /admin/login and /admin/logout
 */
export const validateAdminSession = async (request: FastifyRequest, reply: FastifyReply) => {
  console.log('🔵🔵🔵 - [ADMIN HOOK] Validating admin session for path:', request.url);

  // 🟡🟡🟡 - [PUBLIC ROUTES] Allow public admin routes without authentication
  // 2025-12-29T00:00:00Z - Added sign-up and verification routes
  const publicAdminRoutes = [
    '/admin/login', 
    '/admin/logout', 
    '/admin/signup', 
    '/admin/verify-email', 
    '/admin/verification-sent',
    '/admin/resend-verification',
    '/admin/verification-error'
  ];
  const isPublicAdminRoute = publicAdminRoutes.some(route => 
    request.url === route || request.url.startsWith(`${route}?`)
  );

  if (isPublicAdminRoute) {
    console.log('🟡🟡🟡 - [ADMIN HOOK] Public admin route, skipping authentication:', request.url);
    return;
  }

  // 🟡🟡🟡 - [SESSION CHECK] Check if admin session exists
  if (!request.session || !(request.session as any).adminId) {
    const theme = (request as any).theme || 'default';
    console.log('❗❗❗ - [ADMIN HOOK] No admin session detected, redirecting to login');
    return reply.redirect(`/admin/login?theme=${theme}`);
  }

  const adminId = (request.session as any).adminId;
  const adminTheme = (request.session as any).adminTheme;
  const currentTheme = (request as any).theme || 'default';

  // 🟡🟡🟡 - [THEME VALIDATION] Verify admin has access to current theme
  if (adminTheme !== currentTheme) {
    console.log('❗❗❗ - [ADMIN HOOK] Admin theme mismatch. Admin theme:', adminTheme, 'Current theme:', currentTheme);
    (request.session as any).adminId = undefined;
    (request.session as any).adminTheme = undefined;
    return reply.redirect(`/admin/login?theme=${currentTheme}&error=access_denied`);
  }

  // 🟡🟡🟡 - [ADMIN VERIFICATION] Verify admin still exists and is active
  try {
    const admin = await AdminService.getAdminById(adminId);

    if (!admin || !admin.isActive) {
      console.log('❗❗❗ - [ADMIN HOOK] Admin not found or inactive:', adminId.substring(0, 8));
      (request.session as any).adminId = undefined;
      (request.session as any).adminTheme = undefined;
      return reply.redirect(`/admin/login?theme=${currentTheme}&error=access_denied`);
    }

    // 🟡🟡🟡 - [THEME VERIFICATION] Double-check theme match
    if (admin.theme !== currentTheme) {
      console.log('❗❗❗ - [ADMIN HOOK] Admin theme does not match current theme. Admin theme:', admin.theme, 'Current theme:', currentTheme);
      (request.session as any).adminId = undefined;
      (request.session as any).adminTheme = undefined;
      return reply.redirect(`/admin/login?theme=${currentTheme}&error=access_denied`);
    }

    // 🟡🟡🟡 - [STATUS CHECK] Check admin status is ACTIVE
    if (admin.status !== 'ACTIVE') {
      console.log('❗❗❗ - [ADMIN HOOK] Admin status is not ACTIVE:', admin.status);
      (request.session as any).adminId = undefined;
      (request.session as any).adminTheme = undefined;
      return reply.redirect(`/admin/login?theme=${currentTheme}&error=account_not_active`);
    }

    // ✅✅✅ - [ATTACH ADMIN] Attach admin object to request for use in routes
    (request as any).admin = admin;
    (request as any).adminLevel = admin.level; // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Attach level for easy access
    console.log('✅✅✅ - [ADMIN HOOK] Admin authenticated:', adminId.substring(0, 8), 'for theme:', currentTheme, 'level:', admin.level);
  } catch (error) {
    console.error('❗❗❗ - [ADMIN HOOK] Error validating admin:', error);
    (request.session as any).adminId = undefined;
    (request.session as any).adminTheme = undefined;
    return reply.status(500).send({ error: 'Authentication error' });
  }
};

// 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Level checking helper functions
export function isBackendAdmin(level: AdminLevel): boolean {
  return level >= 1 && level <= 4;
}

export function isThemeAdmin(level: AdminLevel): boolean {
  return level >= 5 && level <= 8;
}

export function canAccessAdminSubdomain(level: AdminLevel): boolean {
  return isBackendAdmin(level); // Only Levels 1-4 can access admin subdomain
}

// 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Permission checking functions based on permission matrix
// Permission matrix source: docs/ADMIN_LEVELS_AND_ROLES.md

// Backend Admin Management Permissions
export function canCreateBackendAdminInvitations(level: AdminLevel): boolean {
  return level === 1; // Only Level 1 can create backend admin invitations
}

export function canCreateThemeAdminInvitations(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Level 1 can create for any theme, Level 5 can create for assigned theme only
  if (level === 1) return true;
  if (level === 5 && adminTheme === targetTheme) return true;
  return false;
}

export function canApproveBackendAdmins(level: AdminLevel): boolean {
  return level === 1; // Only Level 1 can approve backend admins
}

export function canApproveThemeAdmins(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Level 1 can approve for any theme, Level 5 can approve for assigned theme only
  if (level === 1) return true;
  if (level === 5 && adminTheme === targetTheme) return true;
  return false;
}

export function canViewAllAdminAccounts(level: AdminLevel): boolean {
  return level === 1 || level === 2; // Levels 1-2 can view all admin accounts
}

export function canViewThemeAdminAccounts(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Levels 1-2 can view all, Level 3-4 can view assigned themes, Level 5 can view assigned theme
  if (level === 1 || level === 2) return true;
  if ((level === 3 || level === 4 || level === 5) && adminTheme === targetTheme) return true;
  return false;
}

export function canDeleteAdminAccounts(level: AdminLevel): boolean {
  return level === 1; // Only Level 1 can delete admin accounts
}

// System Management Permissions
export function canAccessAdminDashboard(level: AdminLevel): boolean {
  return isBackendAdmin(level); // Levels 1-4 can access admin dashboard
}

export function canViewSystemHealthCheck(level: AdminLevel): boolean {
  return level === 1 || level === 2; // Levels 1-2 can view system health check (Levels 3-4 have limited access)
}

export function canViewAuditLogs(level: AdminLevel): boolean {
  return level === 1; // Only Level 1 can view audit logs
}

export function canModifySecuritySettings(level: AdminLevel): boolean {
  return level === 1; // Only Level 1 can modify security settings
}

// Theme Management Permissions
export function canCreateModifyThemes(level: AdminLevel): boolean {
  return level === 1; // Only Level 1 can create/modify themes
}

export function canViewAllThemes(level: AdminLevel): boolean {
  return level === 1 || level === 2; // Levels 1-2 can view all themes
}

export function canAssignThemeAdmins(level: AdminLevel): boolean {
  return level === 1; // Only Level 1 can assign theme admins
}

// Menu Management Permissions
export function canViewMenusAllThemes(level: AdminLevel): boolean {
  return level === 1 || level === 2; // Levels 1-2 can view menus for all themes
}

export function canViewMenuAssignedTheme(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // All levels can view menu for assigned theme, but Levels 1-2 can view all themes
  if (level === 1 || level === 2) return true;
  return adminTheme === targetTheme;
}

export function canEditMenusAllThemes(level: AdminLevel): boolean {
  return level === 1 || level === 2; // Levels 1-2 can edit menus for all themes
}

export function canEditMenuAssignedTheme(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Levels 1-3 can edit assigned theme, Level 5-6 can edit assigned theme, Level 7 has limited edit
  if (level === 1 || level === 2 || level === 3) {
    return adminTheme === targetTheme || adminTheme === 'admin'; // Backend admins can edit assigned themes
  }
  if (level === 5 || level === 6) {
    return adminTheme === targetTheme; // Theme admins can edit their assigned theme
  }
  if (level === 7) {
    return adminTheme === targetTheme; // Level 7 has limited edit (limited fields)
  }
  return false; // Level 4 and 8 cannot edit
}

export function canCreateMenuItems(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Levels 1-3 can create, Level 5-6 can create for assigned theme
  if (level === 1 || level === 2 || level === 3) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 5 || level === 6) {
    return adminTheme === targetTheme;
  }
  return false;
}

export function canDeleteMenuItems(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Only Levels 1-2 and Level 5 can delete menu items
  if (level === 1 || level === 2) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 5) {
    return adminTheme === targetTheme;
  }
  return false;
}

export function canUploadImagesAllThemes(level: AdminLevel): boolean {
  return level === 1 || level === 2; // Levels 1-2 can upload images for all themes
}

export function canUploadImagesAssignedTheme(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Levels 1-3 can upload for assigned themes, Level 5-6 can upload for assigned theme, Level 7 has limited upload
  if (level === 1 || level === 2 || level === 3) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 5 || level === 6) {
    return adminTheme === targetTheme;
  }
  if (level === 7) {
    return adminTheme === targetTheme; // Level 7 has limited upload (requires approval)
  }
  return false;
}

// Order Management Permissions
export function canViewOrdersAllThemes(level: AdminLevel): boolean {
  return level === 1 || level === 2; // Levels 1-2 can view orders for all themes
}

export function canViewOrdersAssignedTheme(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // All backend admins can view assigned themes, all theme admins can view assigned theme
  if (isBackendAdmin(level)) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (isThemeAdmin(level)) {
    return adminTheme === targetTheme;
  }
  return false;
}

export function canModifyOrderStatuses(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Only Level 1 and Level 5 can modify order statuses
  if (level === 1) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 5) {
    return adminTheme === targetTheme;
  }
  return false;
}

export function canViewOrderAnalytics(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Levels 1-2 can view analytics for all themes, Level 3 can view for assigned themes (limited), Level 5-6 can view for assigned theme
  if (level === 1 || level === 2) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 3) {
    return adminTheme === targetTheme; // Limited analytics
  }
  if (level === 5 || level === 6) {
    return adminTheme === targetTheme; // Level 6 has limited analytics
  }
  return false;
}

export function canExportOrderData(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Only Level 1 and Level 5 can export order data
  if (level === 1) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 5) {
    return adminTheme === targetTheme;
  }
  return false;
}

// Content Management Permissions
export function canManageThemeContent(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Levels 1-3 can manage content, Level 5-7 can manage content for assigned theme (with restrictions)
  if (level === 1 || level === 2 || level === 3) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 5 || level === 6 || level === 7) {
    return adminTheme === targetTheme; // Level 6-7 have limited management
  }
  return false;
}

export function canDeleteContent(level: AdminLevel, adminTheme: string, targetTheme: string): boolean {
  // Only Levels 1-2 and Level 5 can delete content
  if (level === 1 || level === 2) {
    return adminTheme === targetTheme || adminTheme === 'admin';
  }
  if (level === 5) {
    return adminTheme === targetTheme;
  }
  return false;
}

// 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Hook factories for route protection
export function requireLevel(minLevel: AdminLevel) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).admin as Admin | undefined;
    
    if (!admin) {
      const theme = (request as any).theme || 'default';
      return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
    }

    if (admin.level < minLevel) {
      console.log('❗❗❗ - [LEVEL CHECK] Admin level insufficient. Required:', minLevel, 'Current:', admin.level);
      return reply.status(403).send({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }

    console.log('✅✅✅ - [LEVEL CHECK] Level check passed for level:', admin.level);
  };
}

export function requireBackendAdmin() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).admin as Admin | undefined;
    
    if (!admin) {
      const theme = (request as any).theme || 'default';
      return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
    }

    if (!isBackendAdmin(admin.level)) {
      console.log('❗❗❗ - [BACKEND ADMIN CHECK] Admin is not a backend admin. Level:', admin.level);
      return reply.status(403).send({
        success: false,
        message: 'This resource is only accessible to backend admins (Levels 1-4).'
      });
    }

    console.log('✅✅✅ - [BACKEND ADMIN CHECK] Backend admin check passed for level:', admin.level);
  };
}

export function requireThemeAdmin() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).admin as Admin | undefined;
    
    if (!admin) {
      const theme = (request as any).theme || 'default';
      return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
    }

    if (!isThemeAdmin(admin.level)) {
      console.log('❗❗❗ - [THEME ADMIN CHECK] Admin is not a theme admin. Level:', admin.level);
      return reply.status(403).send({
        success: false,
        message: 'This resource is only accessible to theme admins (Levels 5-8).'
      });
    }

    console.log('✅✅✅ - [THEME ADMIN CHECK] Theme admin check passed for level:', admin.level);
  };
}

export function requireLevel1() {
  return requireLevel(1); // Super Admin only
}

export function requireLevel1Or2() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).admin as Admin | undefined;
    
    if (!admin) {
      const theme = (request as any).theme || 'default';
      return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
    }

    if (admin.level !== 1 && admin.level !== 2) {
      console.log('❗❗❗ - [LEVEL 1-2 CHECK] Admin level insufficient. Required: 1 or 2, Current:', admin.level);
      return reply.status(403).send({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }

    console.log('✅✅✅ - [LEVEL 1-2 CHECK] Level check passed for level:', admin.level);
  };
}

// Legacy compatibility functions (for backward compatibility during migration)
export function requireSuperAdmin() {
  return requireLevel1(); // Map SUPER_ADMIN to Level 1
}

export function requireEditorOrAbove() {
  // Map EDITOR/SUPER_ADMIN to appropriate levels based on theme
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).admin as Admin | undefined;
    const theme = (request as any).theme || 'default';
    
    if (!admin) {
      return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
    }

    // For backend admins: Levels 1-3 can edit, for theme admins: Levels 5-6 can edit
    const canEdit = (isBackendAdmin(admin.level) && admin.level <= 3) || 
                    (isThemeAdmin(admin.level) && admin.level <= 6);
    
    if (!canEdit) {
      console.log('❗❗❗ - [EDITOR CHECK] Admin level insufficient for editing. Level:', admin.level);
      return reply.status(403).send({
        success: false,
        message: 'You do not have permission to edit this resource.'
      });
    }

    console.log('✅✅✅ - [EDITOR CHECK] Editor check passed for level:', admin.level);
  };
}

// Updated menu permission functions
export function canEditMenu(admin: Admin, targetTheme: string): boolean {
  return canEditMenuAssignedTheme(admin.level, admin.theme, targetTheme);
}

export function canViewMenu(admin: Admin, targetTheme: string): boolean {
  return canViewMenuAssignedTheme(admin.level, admin.theme, targetTheme);
}

// 2025-12-30T17:40:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Middleware factory for admin subdomain access control
// This hook ensures routes are only accessible when accessed via the 'admin' subdomain
// Returns 404 Not Found for all other subdomains to hide route existence
export function requireAdminSubdomain() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN SUBDOMAIN] Checking admin subdomain access for path:', request.url);
    
    // 2025-12-30T20:00:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Get theme from request (set by detectThemeFromSubdomain middleware)
    const theme = (request as any).theme || 'default';
    
    // 2025-12-30T20:00:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Log hostname sources for debugging
    // Note: Headers can be string or string[], so we need to handle both cases
    const xForwardedHost = request.headers['x-forwarded-host'];
    const forwardedHost = Array.isArray(xForwardedHost) ? xForwardedHost[0] : xForwardedHost;
    const hostHeader = request.headers.host;
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    const hostname = request.hostname || forwardedHost || host || '';
    
    console.log('🟡🟡🟡 - [ADMIN SUBDOMAIN] Theme check details:');
    console.log('  - Detected theme:', theme);
    console.log('  - Required theme: admin');
    console.log('  - request.hostname:', request.hostname);
    console.log('  - X-Forwarded-Host (raw):', request.headers['x-forwarded-host']);
    console.log('  - X-Forwarded-Host (parsed):', forwardedHost);
    console.log('  - Host header (raw):', request.headers.host);
    console.log('  - Host header (parsed):', host);
    console.log('  - Selected hostname:', hostname);
    
    if (theme !== 'admin') {
      console.log('❗❗❗ - [ADMIN SUBDOMAIN] Access denied - route requires admin subdomain, got theme:', theme, 'for path:', request.url);
      console.log('❗❗❗ - [ADMIN SUBDOMAIN] Expected theme: "admin", but received:', theme);
      return reply.status(404).send('Not Found');
    }
    
    console.log('✅✅✅ - [ADMIN SUBDOMAIN] Admin subdomain access granted for path:', request.url);
  };
}

console.log('✅✅✅ - [ADMIN HOOKS] Admin authentication hooks loaded successfully');

