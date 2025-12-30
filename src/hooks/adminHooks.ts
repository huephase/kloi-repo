// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN HOOKS] Admin authentication hooks for admin route protection
import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService, Admin } from '../services/adminService';

console.log('🟡🟡🟡 - [ADMIN HOOKS] Loading admin authentication hooks');

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN HOOKS] Admin role type
export type AdminRole = 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY';

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
    (request as any).adminRole = admin.role; // Attach role for easy access
    console.log('✅✅✅ - [ADMIN HOOK] Admin authenticated:', adminId.substring(0, 8), 'for theme:', currentTheme, 'role:', admin.role);
  } catch (error) {
    console.error('❗❗❗ - [ADMIN HOOK] Error validating admin:', error);
    (request.session as any).adminId = undefined;
    (request.session as any).adminTheme = undefined;
    return reply.status(500).send({ error: 'Authentication error' });
  }
};

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ROLE-BASED ACCESS] Middleware factory for role-based access control
export function requireRole(allowedRoles: AdminRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).admin as Admin | undefined;
    
    if (!admin) {
      const theme = (request as any).theme || 'default';
      return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
    }

    if (!allowedRoles.includes(admin.role)) {
      console.log('❗❗❗ - [ROLE CHECK] Admin role not allowed. Required:', allowedRoles, 'Current:', admin.role);
      return reply.status(403).send({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }

    console.log('✅✅✅ - [ROLE CHECK] Role check passed for:', admin.role);
  };
}

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ROLE-BASED ACCESS] Require SUPER_ADMIN role
export function requireSuperAdmin() {
  return requireRole(['SUPER_ADMIN']);
}

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ROLE-BASED ACCESS] Require EDITOR or SUPER_ADMIN role
export function requireEditorOrAbove() {
  return requireRole(['EDITOR', 'SUPER_ADMIN']);
}

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ROLE-BASED ACCESS] Check if admin can edit menu
export function canEditMenu(admin: Admin): boolean {
  return admin.role === 'EDITOR' || admin.role === 'SUPER_ADMIN';
}

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ROLE-BASED ACCESS] Check if admin can view menu (all roles can view)
export function canViewMenu(_admin: Admin): boolean {
  return true; // All roles can view
}

// 2025-12-30T17:40:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Middleware factory for admin subdomain access control
// This hook ensures routes are only accessible when accessed via the 'admin' subdomain
// Returns 404 Not Found for all other subdomains to hide route existence
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

console.log('✅✅✅ - [ADMIN HOOKS] Admin authentication hooks loaded successfully');

