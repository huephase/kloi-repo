// src/routes/admin/index.ts
// Admin routes for menu editing and management
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { AdminService } from '../../services/adminService';
import { 
  adminLoginSchema, 
  menuSaveSchema, 
  adminSignUpSchema, 
  emailVerificationSchema, 
  invitationCreateSchema, 
  adminApprovalSchema,
  resendVerificationSchema 
} from '../../schemas/admin.schemas';
import { prisma } from '../../lib/prisma';
import { validateAdminSession, requireEditorOrAbove, requireSuperAdmin, requireAdminSubdomain } from '../../hooks/adminHooks';
import { generatePageClass } from '../../lib/pageClass';
import { saveImageFile, validateImageFile } from '../../services/imageUploadService';

// 🟡🟡🟡 - [RATE LIMITING] Simple in-memory rate limiter for admin login
// ⚠️⚠️⚠️ - [RATE LIMITING] SECURITY FIX: Prevent brute force attacks on login endpoint
const loginRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5; // 5 failed attempts per 15 minutes per IP

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [RATE LIMITING] Rate limiter for sign-up endpoint
const signUpRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const SIGNUP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SIGNUP_RATE_LIMIT_MAX_ATTEMPTS = 3; // 3 sign-ups per hour per IP

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [RATE LIMITING] Rate limiter for resend verification
const resendVerificationRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RESEND_VERIFICATION_RATE_LIMIT_MAX_ATTEMPTS = 3; // 3 requests per hour per email

// 🟡🟡🟡 - [RATE LIMITING] Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginRateLimitMap.entries()) {
    if (now > value.resetTime) {
      loginRateLimitMap.delete(key);
    }
  }
  for (const [key, value] of signUpRateLimitMap.entries()) {
    if (now > value.resetTime) {
      signUpRateLimitMap.delete(key);
    }
  }
  for (const [key, value] of resendVerificationRateLimitMap.entries()) {
    if (now > value.resetTime) {
      resendVerificationRateLimitMap.delete(key);
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

  // 2025-12-29T00:00:00Z 🟡🟡🟡 - [PUBLIC ROUTES] Sign-up and verification routes (no auth required)

  // GET /admin/signup - Render sign-up page
  app.get('/admin/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] GET /admin/signup');
    
    const theme = (request as any).theme || 'default';
    const query = (request as any).query || {};
    const token = query.token as string | undefined;
    const error = query.error || null;
    const templatePath = 'admin/signup';
    const page_class = generatePageClass(templatePath);

    // Validate invitation token if provided
    let invitationData = null;
    if (token) {
      const admin = await AdminService.validateInvitationToken(token);
      if (admin) {
        invitationData = {
          email: admin.email,
          token: token
        };
      } else {
        return reply.view(templatePath, {
          theme,
          error: 'Invalid or expired invitation link. Please contact your administrator for a new invitation.',
          page_class
        });
      }
    } else {
      return reply.view(templatePath, {
        theme,
        error: 'Invitation token is required. Please use the invitation link sent to your email.',
        page_class
      });
    }

    return reply.view(templatePath, {
      theme,
      error,
      invitationData,
      page_class
    });
  });

  // POST /admin/signup - Process sign-up
  app.post('/admin/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] POST /admin/signup');
    
    const theme = (request as any).theme || 'default';
    const clientIp = request.ip || 'unknown';
    
    // 🟡🟡🟡 - [RATE LIMITING] Check rate limit for sign-up
    const now = Date.now();
    const rateLimitKey = `admin-signup-${clientIp}`;
    const rateLimit = signUpRateLimitMap.get(rateLimitKey);
    
    if (rateLimit) {
      if (now > rateLimit.resetTime) {
        signUpRateLimitMap.set(rateLimitKey, { count: 0, resetTime: now + SIGNUP_RATE_LIMIT_WINDOW_MS });
      } else if (rateLimit.count >= SIGNUP_RATE_LIMIT_MAX_ATTEMPTS) {
        console.warn(`❗❗❗ - [ADMIN SIGNUP ${new Date().toISOString()}] Rate limit exceeded for IP`, clientIp);
        return reply.status(429).send({
          success: false,
          message: 'Too many sign-up attempts. Please wait 1 hour and try again.',
          retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
        });
      }
    } else {
      signUpRateLimitMap.set(rateLimitKey, { count: 0, resetTime: now + SIGNUP_RATE_LIMIT_WINDOW_MS });
    }

    try {
      const body = request.body as any;
      const signUpData = {
        invitationToken: body.invitationToken || '',
        firstName: body.firstName || '',
        lastName: body.lastName || '',
        phone: body.phone || '',
        password: body.password || '',
        passwordConfirm: body.passwordConfirm || ''
      };

      // Validate sign-up data
      const validationResult = adminSignUpSchema.safeParse(signUpData);
      
      if (!validationResult.success) {
        console.log('❗❗❗ - [ADMIN SIGNUP] Validation failed:', validationResult.error.flatten());
        const templatePath = 'admin/signup';
        const page_class = generatePageClass(templatePath);
        
        // Get invitation data for re-rendering
        let invitationData = null;
        if (signUpData.invitationToken) {
          const admin = await AdminService.validateInvitationToken(signUpData.invitationToken);
          if (admin) {
            invitationData = {
              email: admin.email,
              token: signUpData.invitationToken
            };
          }
        }
        
        return reply.view(templatePath, {
          theme,
          error: 'Please check your input and try again.',
          invitationData,
          page_class
        });
      }

      const { invitationToken, firstName, lastName, phone, password } = validationResult.data;

      // Process sign-up
      const result = await AdminService.signUpAdmin(invitationToken, firstName, lastName, phone, password);

      // Reset rate limit on successful sign-up
      signUpRateLimitMap.delete(rateLimitKey);

      console.log('✅✅✅ - [ADMIN SIGNUP] Sign-up completed successfully for:', result.admin.id.substring(0, 8));
      
      // Redirect to verification sent page
      return reply.redirect(`/admin/verification-sent?theme=${theme}&email=${encodeURIComponent(result.admin.email || '')}`);
    } catch (error: any) {
      // Increment rate limit counter on failed sign-up
      const currentLimit = signUpRateLimitMap.get(rateLimitKey);
      if (currentLimit) {
        currentLimit.count++;
      }
      
      console.error('❗❗❗ - [ADMIN SIGNUP] Error during sign-up:', error);
      const templatePath = 'admin/signup';
      const page_class = generatePageClass(templatePath);
      
      // Get invitation data for re-rendering
      let invitationData = null;
      const body = request.body as any;
      if (body.invitationToken) {
        const admin = await AdminService.validateInvitationToken(body.invitationToken);
        if (admin) {
          invitationData = {
            email: admin.email,
            token: body.invitationToken
          };
        }
      }
      
      return reply.view(templatePath, {
        theme,
        error: error.message || 'Sign-up failed. Please try again.',
        invitationData,
        page_class
      });
    }
  });

  // GET /admin/verification-sent - Verification email sent confirmation page
  app.get('/admin/verification-sent', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] GET /admin/verification-sent');
    
    const theme = (request as any).theme || 'default';
    const query = (request as any).query || {};
    const email = query.email as string | undefined;
    const templatePath = 'admin/verification-sent';
    const page_class = generatePageClass(templatePath);

    return reply.view(templatePath, {
      theme,
      email: email || '',
      page_class
    });
  });

  // GET /admin/verify-email - Email verification endpoint
  app.get('/admin/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] GET /admin/verify-email');
    
    const theme = (request as any).theme || 'default';
    const query = (request as any).query || {};
    const token = query.token as string | undefined;
    const templatePath = 'admin/verify-email';
    const page_class = generatePageClass(templatePath);

    if (!token) {
      return reply.view('admin/verification-error', {
        theme,
        error: 'Verification token is required.',
        page_class: generatePageClass('admin/verification-error')
      });
    }

    // Validate token format
    const tokenValidation = emailVerificationSchema.safeParse({ token });
    if (!tokenValidation.success) {
      return reply.view('admin/verification-error', {
        theme,
        error: 'Invalid verification token format.',
        page_class: generatePageClass('admin/verification-error')
      });
    }

    // Verify email
    const admin = await AdminService.verifyEmail(token);
    
    if (!admin) {
      return reply.view('admin/verification-error', {
        theme,
        error: 'Invalid or expired verification token. Please request a new verification email.',
        page_class: generatePageClass('admin/verification-error')
      });
    }

    return reply.view(templatePath, {
      theme,
      adminName: `${admin.firstName} ${admin.lastName}`,
      page_class
    });
  });

  // POST /admin/resend-verification - Resend verification email
  app.post('/admin/resend-verification', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] POST /admin/resend-verification');
    
    try {
      const body = request.body as any;
      const validationResult = resendVerificationSchema.safeParse({
        email: body.email || ''
      });

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid email address'
        });
      }

      const { email } = validationResult.data;

      // 🟡🟡🟡 - [RATE LIMITING] Check rate limit for resend verification
      const now = Date.now();
      const rateLimitKey = `admin-resend-verification-${email}`;
      const rateLimit = resendVerificationRateLimitMap.get(rateLimitKey);
      
      if (rateLimit) {
        if (now > rateLimit.resetTime) {
          resendVerificationRateLimitMap.set(rateLimitKey, { count: 0, resetTime: now + RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS });
        } else if (rateLimit.count >= RESEND_VERIFICATION_RATE_LIMIT_MAX_ATTEMPTS) {
          console.warn(`❗❗❗ - [ADMIN RESEND VERIFICATION ${new Date().toISOString()}] Rate limit exceeded for email`, email);
          return reply.status(429).send({
            success: false,
            message: 'Too many verification email requests. Please wait 1 hour and try again.',
            retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
          });
        }
      } else {
        resendVerificationRateLimitMap.set(rateLimitKey, { count: 0, resetTime: now + RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS });
      }

      // Find admin by email
      const admin = await AdminService.getAdminByEmail(email);
      if (!admin) {
        // Don't reveal if email exists (security)
        return reply.send({
          success: true,
          message: 'If an account exists with this email, a verification email has been sent.'
        });
      }

      if (admin.emailVerified) {
        return reply.send({
          success: false,
          message: 'Email is already verified.'
        });
      }

      // Resend verification email
      const result = await AdminService.resendVerificationEmail(admin.id);
      
      if (result.success) {
        // Increment rate limit counter
        const currentLimit = resendVerificationRateLimitMap.get(rateLimitKey);
        if (currentLimit) {
          currentLimit.count++;
        }
        
        return reply.send({
          success: true,
          message: 'Verification email sent successfully.'
        });
      } else {
        return reply.status(500).send({
          success: false,
          message: result.error || 'Failed to resend verification email.'
        });
      }
    } catch (error) {
      console.error('❗❗❗ - [ADMIN RESEND VERIFICATION] Error:', error);
      return reply.status(500).send({
        success: false,
        message: 'An error occurred. Please try again later.'
      });
    }
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
  app.post('/admin/api/menu/save', {
    preHandler: [requireEditorOrAbove()]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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

  // POST /admin/api/upload-image - Upload image file for menu editor
  app.post('/admin/api/upload-image', {
    preHandler: [requireEditorOrAbove()]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] POST /admin/api/upload-image');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;

    try {
      // 🟡🟡🟡 - [MULTIPART] Parse multipart form data
      // Type assertion needed because FastifyRequest doesn't include multipart methods in base type
      const data = await (request as any).file();
      
      if (!data) {
        console.error('❗❗❗ - [ADMIN IMAGE UPLOAD] No file provided in request');
        return reply.status(400).send({
          success: false,
          message: 'No file provided. Please select an image file to upload.'
        });
      }

      // 🟡🟡🟡 - [VALIDATION] Validate image file (async validation)
      const validation = await validateImageFile(data);
      if (!validation.valid) {
        console.error('❗❗❗ - [ADMIN IMAGE UPLOAD] File validation failed:', validation.error);
        return reply.status(400).send({
          success: false,
          message: validation.error || 'File validation failed'
        });
      }

      // 🟡🟡🟡 - [SAVE] Save image file to theme directory
      const result = await saveImageFile(data, theme);

      console.log('✅✅✅ - [ADMIN IMAGE UPLOAD] Image uploaded successfully by admin:', admin.id.substring(0, 8), 'for theme:', theme, 'path:', result.relativePath);

      return reply.send({
        success: true,
        filePath: result.relativePath,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN IMAGE UPLOAD] Error uploading image:', error);
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to upload image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 2025-12-30T19:30:00Z 🟡🟡🟡 - [ADMIN DASHBOARD] Central dashboard for all backend superadmin routes
  // GET /admin/dashboard - Render admin dashboard with links to all superadmin routes (admin subdomain only)
  app.get('/admin/dashboard', {
    preHandler: [requireAdminSubdomain()]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] GET /admin/dashboard');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;

    try {
      const templatePath = 'admin/dashboard';
      const page_class = generatePageClass(templatePath);

      return reply.view(templatePath, {
        theme,
        adminUsername: admin.username,
        admin,
        page_class
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN DASHBOARD] Error loading dashboard:', error);
      return reply.status(500).send('Error loading dashboard');
    }
  });

  // 2025-12-29T00:00:00Z 🟡🟡🟡 - [PROTECTED ROUTES] Invitation and approval management (SUPER_ADMIN only)
  // 2025-12-30T17:40:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Invitation routes require admin subdomain access

  // GET /admin/invitations - Render invitation management page (SUPER_ADMIN only, admin subdomain only)
  app.get('/admin/invitations', {
    preHandler: [requireAdminSubdomain(), requireSuperAdmin()]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] GET /admin/invitations');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;

    try {
      const templatePath = 'admin/invitations';
      const page_class = generatePageClass(templatePath);

      return reply.view(templatePath, {
        theme,
        adminUsername: admin.username,
        admin,
        page_class
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN INVITATIONS] Error loading invitations page:', error);
      return reply.status(500).send('Error loading invitations page');
    }
  });

  // GET /admin/pending-approvals - List admins awaiting approval (admin subdomain only)
  app.get('/admin/pending-approvals', {
    preHandler: [requireAdminSubdomain(), requireSuperAdmin()]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] GET /admin/pending-approvals');
    
    try {
      const pendingAdmins = await AdminService.getPendingAdmins();
      
      return reply.send({
        success: true,
        admins: pendingAdmins.map(admin => ({
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          phone: admin.phone,
          status: admin.status,
          emailVerified: admin.emailVerified,
          createdAt: admin.createdAt
        }))
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN API] Error fetching pending admins:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch pending admins'
      });
    }
  });

  // POST /admin/invitations/create - Create new invitation (SUPER_ADMIN only, admin subdomain only)
  app.post('/admin/invitations/create', {
    preHandler: [requireAdminSubdomain(), requireSuperAdmin()]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] POST /admin/invitations/create');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;

    try {
      const body = request.body as any;
      const validationResult = invitationCreateSchema.safeParse({
        email: body.email || '',
        theme: body.theme || theme
      });

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid invitation data',
          errors: validationResult.error.flatten()
        });
      }

      const { email, theme: invitationTheme } = validationResult.data;

      // Create invitation
      const result = await AdminService.createInvitation(admin.id, email, invitationTheme);

      console.log('✅✅✅ - [ADMIN INVITATION] Invitation created successfully for:', email);

      return reply.send({
        success: true,
        message: 'Invitation sent successfully',
        invitationLink: result.invitationLink
      });
    } catch (error: any) {
      console.error('❗❗❗ - [ADMIN INVITATION] Error creating invitation:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to create invitation'
      });
    }
  });

  // POST /admin/approve - Approve and assign role to admin (SUPER_ADMIN only, admin subdomain only)
  app.post('/admin/approve', {
    preHandler: [requireAdminSubdomain(), requireSuperAdmin()]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] POST /admin/approve');
    
    const admin = (request as any).admin;

    try {
      const body = request.body as any;
      const validationResult = adminApprovalSchema.safeParse({
        adminId: body.adminId || '',
        role: body.role || 'READ_ONLY'
      });

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid approval data',
          errors: validationResult.error.flatten()
        });
      }

      const { adminId, role } = validationResult.data;

      // Approve admin
      await AdminService.approveAdmin(adminId, admin.id, role);

      // Activate admin
      await AdminService.activateAdmin(adminId);

      console.log('✅✅✅ - [ADMIN APPROVAL] Admin approved and activated:', adminId.substring(0, 8));

      return reply.send({
        success: true,
        message: 'Admin approved and activated successfully'
      });
    } catch (error: any) {
      console.error('❗❗❗ - [ADMIN APPROVAL] Error approving admin:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to approve admin'
      });
    }
  });

  console.log('✅✅✅ - [ADMIN ROUTES] Admin routes registered successfully');
}

