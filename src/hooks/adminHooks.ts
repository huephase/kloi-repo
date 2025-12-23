// src/hooks/adminHooks.ts
// Admin authentication hooks for admin route protection
import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from '../services/adminService';

console.log('🟡🟡🟡 - [ADMIN HOOKS] Loading admin authentication hooks');

/**
 * 🟡🟡🟡 Admin session validation hook for admin routes
 * This hook ensures admins are authenticated and have access to the current theme
 * Hook Logic: IF !request.session.adminId OR admin.theme !== request.theme → redirect to /admin/login
 * Applied to all admin routes EXCEPT /admin/login and /admin/logout
 */
export const validateAdminSession = async (request: FastifyRequest, reply: FastifyReply) => {
  console.log('🔵🔵🔵 - [ADMIN HOOK] Validating admin session for path:', request.url);

  // 🟡🟡🟡 - [PUBLIC ROUTES] Allow public admin routes without authentication
  const publicAdminRoutes = ['/admin/login', '/admin/logout'];
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

    // ✅✅✅ - [ATTACH ADMIN] Attach admin object to request for use in routes
    (request as any).admin = admin;
    console.log('✅✅✅ - [ADMIN HOOK] Admin authenticated:', adminId.substring(0, 8), 'for theme:', currentTheme);
  } catch (error) {
    console.error('❗❗❗ - [ADMIN HOOK] Error validating admin:', error);
    (request.session as any).adminId = undefined;
    (request.session as any).adminTheme = undefined;
    return reply.status(500).send({ error: 'Authentication error' });
  }
};

console.log('✅✅✅ - [ADMIN HOOKS] Admin authentication hooks loaded successfully');

