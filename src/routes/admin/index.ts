// src/routes/admin/index.ts
// Admin routes for menu editing and management
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { AdminService } from '../../services/adminService';
import { adminLoginSchema, menuSaveSchema } from '../../schemas/admin.schemas';
import { prisma } from '../../lib/prisma';
import { validateAdminSession } from '../../hooks/adminHooks';
import { generatePageClass } from '../../lib/pageClass';

// 🟡🟡🟡 - [RATE LIMITING] Simple in-memory rate limiter for admin login
// ⚠️⚠️⚠️ - [RATE LIMITING] SECURITY FIX: Prevent brute force attacks on login endpoint
const loginRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5; // 5 failed attempts per 15 minutes per IP

// 🟡🟡🟡 - [RATE LIMITING] Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginRateLimitMap.entries()) {
    if (now > value.resetTime) {
      loginRateLimitMap.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export default async function adminRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  console.log('🟡🟡🟡 - [ADMIN ROUTES] Registering admin routes');

  // 🟡🟡🟡 - [PUBLIC ROUTES] Login and logout routes (no auth required)
  
  // GET /admin/login - Render login page
  app.get('/admin/login', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] GET /admin/login');
    
    const theme = (request as any).theme || 'default';
    const query = (request as any).query || {};
    const error = query.error || null;
    const templatePath = 'admin/login';
    const page_class = generatePageClass(templatePath);

    return reply.view(templatePath, {
      theme,
      error,
      page_class
    });
  });

  // POST /admin/login - Authenticate admin
  app.post('/admin/login', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] POST /admin/login');
    
    const theme = (request as any).theme || 'default';
    
    // 🟡🟡🟡 - [RATE LIMITING] Check rate limit before processing login
    const clientIp = request.ip || 'unknown';
    const now = Date.now();
    const rateLimitKey = `admin-login-${clientIp}`;
    const rateLimit = loginRateLimitMap.get(rateLimitKey);
    
    if (rateLimit) {
      if (now > rateLimit.resetTime) {
        // Reset window
        loginRateLimitMap.set(rateLimitKey, { count: 0, resetTime: now + LOGIN_RATE_LIMIT_WINDOW_MS });
      } else if (rateLimit.count >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
        console.warn(`❗❗❗ - [ADMIN LOGIN ${new Date().toISOString()}] Rate limit exceeded for IP`, clientIp);
        return reply.status(429).send({
          success: false,
          message: 'Too many login attempts. Please wait 15 minutes and try again.',
          retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
        });
      }
    } else {
      loginRateLimitMap.set(rateLimitKey, { count: 0, resetTime: now + LOGIN_RATE_LIMIT_WINDOW_MS });
    }

    try {
      // 🟡🟡🟡 - [VALIDATION] Validate login request
      const body = request.body as any;
      const loginData = {
        username: body.username || '',
        password: body.password || '',
        theme: theme
      };

      const validationResult = adminLoginSchema.safeParse(loginData);
      
      if (!validationResult.success) {
        console.log('❗❗❗ - [ADMIN LOGIN] Validation failed:', validationResult.error.flatten());
        const templatePath = 'admin/login';
        const page_class = generatePageClass(templatePath);
        return reply.view(templatePath, {
          theme,
          error: 'Invalid username or password',
          page_class
        });
      }

      const { username, password } = validationResult.data;

      // 🟡🟡🟡 - [AUTHENTICATION] Authenticate admin
      const admin = await AdminService.authenticateAdmin(username, password, theme);

      if (!admin) {
        // Increment rate limit counter on failed login
        const currentLimit = loginRateLimitMap.get(rateLimitKey);
        if (currentLimit) {
          currentLimit.count++;
        }
        
        console.log('❗❗❗ - [ADMIN LOGIN] Authentication failed for username:', username);
        const templatePath = 'admin/login';
        const page_class = generatePageClass(templatePath);
        return reply.view(templatePath, {
          theme,
          error: 'Invalid username or password',
          page_class
        });
      }

      // ✅✅✅ - [SESSION] Set admin session
      (request.session as any).adminId = admin.id;
      (request.session as any).adminTheme = admin.theme;

      // Reset rate limit on successful login
      loginRateLimitMap.delete(rateLimitKey);

      console.log('✅✅✅ - [ADMIN LOGIN] Admin authenticated successfully:', admin.id.substring(0, 8));
      return reply.redirect(`/admin/menu-editor?theme=${theme}`);
    } catch (error) {
      console.error('❗❗❗ - [ADMIN LOGIN] Error during login:', error);
      const templatePath = 'admin/login';
      const page_class = generatePageClass(templatePath);
      return reply.view(templatePath, {
        theme,
        error: 'Login failed. Please try again.',
        page_class
      });
    }
  });

  // POST /admin/logout - Clear admin session
  app.post('/admin/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] POST /admin/logout');
    
    const theme = (request as any).theme || 'default';
    
    // Clear admin session
    (request.session as any).adminId = undefined;
    (request.session as any).adminTheme = undefined;

    console.log('✅✅✅ - [ADMIN LOGOUT] Admin logged out');
    return reply.redirect(`/admin/login?theme=${theme}`);
  });

  // 🟡🟡🟡 - [PROTECTED ROUTES] Require admin authentication
  app.addHook('preHandler', validateAdminSession);

  // GET /admin/menu-editor - Render menu editor page
  app.get('/admin/menu-editor', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] GET /admin/menu-editor');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;

    try {
      // 🟡🟡🟡 - [DATABASE] Fetch current menu for this theme
      const menu = await prisma.menus.findFirst({
        where: { theme }
      });

      const menuData = menu ? {
        id: menu.id,
        name: menu.name,
        menuItems: menu.menuItems
      } : null;

      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu data loaded for theme:', theme);
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu exists:', menu !== null);
      if (menuData) {
        console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu ID:', menuData.id);
        console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu name:', menuData.name);
        console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu items type:', typeof menuData.menuItems);
      }

      const templatePath = 'admin/menu-editor';
      const page_class = generatePageClass(templatePath);

      return reply.view(templatePath, {
        theme,
        menu: menuData,
        adminUsername: admin.username,
        page_class
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Error loading menu:', error);
      return reply.status(500).send('Error loading menu editor');
    }
  });

  // GET /admin/api/menu - Get current menu JSON (API endpoint)
  app.get('/admin/api/menu', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] GET /admin/api/menu');
    
    const theme = (request as any).theme || 'default';

    try {
      const menu = await prisma.menus.findFirst({
        where: { theme }
      });

      if (!menu) {
        return reply.status(404).send({
          success: false,
          message: 'Menu not found for this theme'
        });
      }

      return reply.send({
        success: true,
        menu: {
          id: menu.id,
          name: menu.name,
          theme: menu.theme,
          menuItems: menu.menuItems
        }
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN API] Error fetching menu:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch menu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /admin/api/menu/save - Save menu JSON to database
  app.post('/admin/api/menu/save', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] POST /admin/api/menu/save');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;

    try {
      // 🟡🟡🟡 - [VALIDATION] Validate menu save request
      const body = request.body as any;
      const validationResult = menuSaveSchema.safeParse({
        name: body.name || '',
        menuItems: body.menuItems || {}
      });

      if (!validationResult.success) {
        console.log('❗❗❗ - [ADMIN MENU SAVE] Validation failed:', validationResult.error.flatten());
        return reply.status(400).send({
          success: false,
          message: 'Invalid menu data',
          errors: validationResult.error.flatten()
        });
      }

      const { name, menuItems } = validationResult.data;

      // 🟡🟡🟡 - [DATABASE] Upsert menu (create if doesn't exist, update if exists)
      // Theme has unique constraint, so we can use upsert
      const menu = await prisma.menus.upsert({
        where: {
          theme: theme
        },
        update: {
          name: name,
          menuItems: menuItems as any
        },
        create: {
          theme: theme,
          name: name,
          menuItems: menuItems as any
        }
      });

      console.log('✅✅✅ - [ADMIN MENU SAVE] Menu saved successfully by admin:', admin.id.substring(0, 8), 'for theme:', theme);

      return reply.send({
        success: true,
        message: 'Menu saved successfully',
        menuId: menu.id
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN MENU SAVE] Error saving menu:', error);
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to save menu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('✅✅✅ - [ADMIN ROUTES] Admin routes registered successfully');
}

