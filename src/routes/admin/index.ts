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
import { 
  validateAdminSession, 
  requireEditorOrAbove, // Legacy compatibility - maps to level-based checks
  requireAdminSubdomain,
  requireLevel1,
  canEditMenuAssignedTheme,
  canUploadImagesAssignedTheme,
  type AdminLevel // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Import AdminLevel type for type assertions
} from '../../hooks/adminHooks';
import { generatePageClass } from '../../lib/pageClass';
import { saveImageFile, validateImageFile } from '../../services/imageUploadService';
import { performHealthCheck } from '../healthCheck';
import { generateCsrfToken } from '../../lib/csrf';
import { checkRateLimit, incrementRateLimit, resetRateLimit } from '../../lib/rateLimiter';
// 2026-01-18T23:30:00Z 🟡🟡🟡 - [ADMIN EMAIL TRACKING] Import email tracking services
import { EmailLogService } from '../../services/emailLogService';
import { sendOrderConfirmationEmail } from '../../services/emailService';

// 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Rate limiting constants
// ⚠️⚠️⚠️ - [RATE LIMITING] SECURITY FIX: Rate limiting now uses Redis for multi-instance support
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5; // 5 failed attempts per 15 minutes per IP

const SIGNUP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SIGNUP_RATE_LIMIT_MAX_ATTEMPTS = 3; // 3 sign-ups per hour per IP

const RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RESEND_VERIFICATION_RATE_LIMIT_MAX_ATTEMPTS = 3; // 3 requests per hour per email

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

    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for login form
    const csrfToken = await generateCsrfToken(reply);

    return reply.view(templatePath, {
      theme,
      error,
      csrfToken,
      page_class
    });
  });

  // POST /admin/login - Authenticate admin
  app.post('/admin/login', {
    preHandler: [app.csrfProtection]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] POST /admin/login');
    
    const theme = (request as any).theme || 'default';
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Check rate limit using Redis
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `admin-login-${clientIp}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT_WINDOW_MS, LOGIN_RATE_LIMIT_MAX_ATTEMPTS);
    
    if (!rateLimitResult.allowed) {
      console.warn(`❗❗❗ - [ADMIN LOGIN ${new Date().toISOString()}] Rate limit exceeded for IP`, clientIp);
      return reply.status(429).send({
        success: false,
        message: 'Too many login attempts. Please wait 15 minutes and try again.',
        retryAfter: rateLimitResult.retryAfter
      });
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
        // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Increment rate limit counter on failed login using Redis
        await incrementRateLimit(rateLimitKey, LOGIN_RATE_LIMIT_WINDOW_MS);
        
        console.log('❗❗❗ - [ADMIN LOGIN] Authentication failed for username:', username);
        const templatePath = 'admin/login';
        const page_class = generatePageClass(templatePath);
        
        // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for error response
        const csrfToken = await generateCsrfToken(reply);
        
        return reply.view(templatePath, {
          theme,
          error: 'Invalid username or password',
          csrfToken,
          page_class
        });
      }

      // ✅✅✅ - [SESSION] Set admin session
      (request.session as any).adminId = admin.id;
      (request.session as any).adminTheme = admin.theme;

      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Reset rate limit on successful login using Redis
      await resetRateLimit(rateLimitKey);

      console.log('✅✅✅ - [ADMIN LOGIN] Admin authenticated successfully:', admin.id.substring(0, 8));
      return reply.redirect(`/admin/menu-editor?theme=${theme}`);
    } catch (error) {
      console.error('❗❗❗ - [ADMIN LOGIN] Error during login:', error);
      const templatePath = 'admin/login';
      const page_class = generatePageClass(templatePath);
      
      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for error response
      const csrfToken = await generateCsrfToken(reply);
      
      return reply.view(templatePath, {
        theme,
        error: 'Login failed. Please try again.',
        csrfToken,
        page_class
      });
    }
  });

  // POST /admin/logout - Clear admin session
  app.post('/admin/logout', {
    preHandler: [app.csrfProtection]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
        // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for error response
        const csrfToken = await generateCsrfToken(reply);
        return reply.view(templatePath, {
          theme,
          error: 'Invalid or expired invitation link. Please contact your administrator for a new invitation.',
          csrfToken,
          page_class
        });
      }
    } else {
      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for error response
      const csrfToken = await generateCsrfToken(reply);
      return reply.view(templatePath, {
        theme,
        error: 'Invitation token is required. Please use the invitation link sent to your email.',
        csrfToken,
        page_class
      });
    }

    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for signup form
    const csrfToken = await generateCsrfToken(reply);

    return reply.view(templatePath, {
      theme,
      error,
      invitationData,
      csrfToken,
      page_class
    });
  });

  // POST /admin/signup - Process sign-up
  app.post('/admin/signup', {
    preHandler: [app.csrfProtection]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN ROUTE] POST /admin/signup');
    
    const theme = (request as any).theme || 'default';
    const clientIp = request.ip || 'unknown';
    
    // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Check rate limit for sign-up using Redis
    const rateLimitKey = `admin-signup-${clientIp}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, SIGNUP_RATE_LIMIT_WINDOW_MS, SIGNUP_RATE_LIMIT_MAX_ATTEMPTS);
    
    if (!rateLimitResult.allowed) {
      console.warn(`❗❗❗ - [ADMIN SIGNUP ${new Date().toISOString()}] Rate limit exceeded for IP`, clientIp);
      return reply.status(429).send({
        success: false,
        message: 'Too many sign-up attempts. Please wait 1 hour and try again.',
        retryAfter: rateLimitResult.retryAfter
      });
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
        
        // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for error response
        const csrfToken = await generateCsrfToken(reply);
        
        return reply.view(templatePath, {
          theme,
          error: 'Please check your input and try again.',
          invitationData,
          csrfToken,
          page_class
        });
      }

      const { invitationToken, firstName, lastName, phone, password } = validationResult.data;

      // Process sign-up
      const result = await AdminService.signUpAdmin(invitationToken, firstName, lastName, phone, password);

      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Reset rate limit on successful sign-up using Redis
      await resetRateLimit(rateLimitKey);

      console.log('✅✅✅ - [ADMIN SIGNUP] Sign-up completed successfully for:', result.admin.id.substring(0, 8));
      
      // Redirect to verification sent page
      return reply.redirect(`/admin/verification-sent?theme=${theme}&email=${encodeURIComponent(result.admin.email || '')}`);
    } catch (error: any) {
      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Increment rate limit counter on failed sign-up using Redis
      await incrementRateLimit(rateLimitKey, SIGNUP_RATE_LIMIT_WINDOW_MS);
      
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
      
      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for error response
      const csrfToken = await generateCsrfToken(reply);
      
      return reply.view(templatePath, {
        theme,
        error: error.message || 'Sign-up failed. Please try again.',
        invitationData,
        csrfToken,
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
  app.post('/admin/resend-verification', {
    preHandler: [app.csrfProtection]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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

      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Check rate limit for resend verification using Redis
      const rateLimitKey = `admin-resend-verification-${email}`;
      const rateLimitResult = await checkRateLimit(rateLimitKey, RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS, RESEND_VERIFICATION_RATE_LIMIT_MAX_ATTEMPTS);
      
      if (!rateLimitResult.allowed) {
        console.warn(`❗❗❗ - [ADMIN RESEND VERIFICATION ${new Date().toISOString()}] Rate limit exceeded for email`, email);
        return reply.status(429).send({
          success: false,
          message: 'Too many verification email requests. Please wait 1 hour and try again.',
          retryAfter: rateLimitResult.retryAfter
        });
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
        // 2026-01-12T19:10:00Z 🟡🟡🟡 - [RATE LIMITING] Increment rate limit counter using Redis
        await incrementRateLimit(rateLimitKey, RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS);
        
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

      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for menu editor (for AJAX requests)
      const csrfToken = await generateCsrfToken(reply);

      return reply.view(templatePath, {
        theme,
        menu: menuData,
        adminUsername: admin.username,
        csrfToken,
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
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level-based permission check
  app.post('/admin/api/menu/save', {
    preHandler: [app.csrfProtection, async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = (request as any).admin;
      const theme = (request as any).theme || 'default';
      
      if (!admin) {
        return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
      }
      
      if (!canEditMenuAssignedTheme(admin.level, admin.theme, theme)) {
        console.log('❗❗❗ - [MENU SAVE] Admin level insufficient for editing menu. Level:', admin.level, 'Admin theme:', admin.theme, 'Target theme:', theme);
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to edit this menu.'
        });
      }
    }]
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
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level-based permission check
  app.post('/admin/api/upload-image', {
    preHandler: [app.csrfProtection, async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = (request as any).admin;
      const theme = (request as any).theme || 'default';
      
      if (!admin) {
        return reply.redirect(`/admin/login?theme=${theme}&error=access_denied`);
      }
      
      if (!canUploadImagesAssignedTheme(admin.level, admin.theme, theme)) {
        console.log('❗❗❗ - [UPLOAD IMAGE] Admin level insufficient for uploading images. Level:', admin.level, 'Admin theme:', admin.theme, 'Target theme:', theme);
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to upload images for this theme.'
        });
      }
    }]
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


  // 2025-12-29T00:00:00Z 🟡🟡🟡 - [PROTECTED ROUTES] Invitation and approval management
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated: Level 1 can manage all admins, Level 5 can manage theme admins
  // 2025-12-30T17:40:00Z 🟡🟡🟡 - [ADMIN SUBDOMAIN] Invitation routes require admin subdomain access

  // GET /admin/invitations - Render invitation management page (Level 1 or Level 5 for theme admins, admin subdomain only)
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to allow Level 1 and Level 5 (for theme admins)
  app.get('/admin/invitations', {
    preHandler: [requireAdminSubdomain(), async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = (request as any).admin;
      if (!admin) {
        return reply.redirect(`/admin/login?theme=admin&error=access_denied`);
      }
      // Level 1 can create backend admin invitations, Level 5 can create theme admin invitations
      if (admin.level !== 1 && admin.level !== 5) {
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to access invitation management.'
        });
      }
    }]
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

  // GET /admin/pending-approvals - List admins awaiting approval (Level 1 or Level 5, admin subdomain only)
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to allow Level 1 and Level 5
  app.get('/admin/pending-approvals', {
    preHandler: [requireAdminSubdomain(), requireLevel1()] // Only Level 1 can view all pending approvals
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

  // POST /admin/invitations/create - Create new invitation (Level 1-2 or Level 5, admin subdomain only)
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to support level-based invitation creation
  app.post('/admin/invitations/create', {
    preHandler: [app.csrfProtection, requireAdminSubdomain(), async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = (request as any).admin;
      if (!admin) {
        return reply.redirect(`/admin/login?theme=admin&error=access_denied`);
      }
      // Level 1-2 can create any invitations, Level 5 can create theme admin invitations
      if (admin.level !== 1 && admin.level !== 2 && admin.level !== 5) {
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to create invitations.'
        });
      }
    }]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] POST /admin/invitations/create');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;

    try {
      const body = request.body as any;
      const validationResult = invitationCreateSchema.safeParse({
        email: body.email || '',
        theme: body.theme || theme,
        level: body.level ? parseInt(body.level, 10) : undefined
      });

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid invitation data',
          errors: validationResult.error.flatten()
        });
      }

      const { email, theme: invitationTheme, level: targetLevel } = validationResult.data;

      // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Type assertion: Zod returns number but we need AdminLevel
      const validatedLevel: AdminLevel | undefined = targetLevel !== undefined && targetLevel >= 1 && targetLevel <= 8 
        ? (targetLevel as AdminLevel) 
        : undefined;

      // Create invitation with target level
      const result = await AdminService.createInvitation(admin.id, email, invitationTheme, validatedLevel);

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

  // POST /admin/approve - Approve and assign level to admin (Level 1 or Level 5, admin subdomain only)
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level instead of role
  app.post('/admin/approve', {
    preHandler: [app.csrfProtection, requireAdminSubdomain(), async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = (request as any).admin;
      if (!admin) {
        return reply.redirect(`/admin/login?theme=admin&error=access_denied`);
      }
      // Level 1 can approve any admin, Level 5 can approve theme admins for their theme
      if (admin.level !== 1 && admin.level !== 5) {
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to approve admins.'
        });
      }
    }]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN API] POST /admin/approve');
    
    const admin = (request as any).admin;

    try {
      const body = request.body as any;
      const validationResult = adminApprovalSchema.safeParse({
        adminId: body.adminId || '',
        level: body.level ? parseInt(body.level, 10) : 8 // Default to Level 8 if not specified
      });

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid approval data',
          errors: validationResult.error.flatten()
        });
      }

      const { adminId, level } = validationResult.data;

      // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Type assertion: Zod returns number but we need AdminLevel
      const validatedLevel: AdminLevel = level as AdminLevel;
      const adminLevel: AdminLevel = admin.level as AdminLevel;

      // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Validate approver can approve admin for target level/theme
      const targetAdmin = await AdminService.getAdminById(adminId);
      if (!targetAdmin) {
        return reply.status(404).send({
          success: false,
          message: 'Admin not found'
        });
      }

      if (!AdminService.canApproveAdminForLevel(adminLevel, validatedLevel, admin.theme, targetAdmin.theme)) {
        return reply.status(403).send({
          success: false,
          message: 'You do not have permission to approve admins for this level and theme.'
        });
      }

      // Approve admin
      await AdminService.approveAdmin(adminId, admin.id, validatedLevel);

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

  // 2025-01-03T11:59:00Z 🟡🟡🟡 - [ADMIN DASHBOARD] Register admin dashboard route under /admin/ prefix
  // GET /admin/dashboard - Render admin dashboard with links to all superadmin routes (admin subdomain only, requires authentication)
  app.get('/admin/dashboard', {
    preHandler: [requireAdminSubdomain(), validateAdminSession]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN DASHBOARD] GET /admin/dashboard');
    
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

  // 2025-01-03T11:59:00Z 🟡🟡🟡 - [ADMIN HEALTH CHECK] Register admin health check route under /admin/ prefix
  // GET /admin/kloiserverhealthcheck - System health check dashboard (admin subdomain only, requires authentication)
  app.get('/admin/kloiserverhealthcheck', {
    preHandler: [requireAdminSubdomain(), validateAdminSession]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN HEALTH CHECK] GET /admin/kloiserverhealthcheck');
    
    try {
      // 2025-01-03T11:59:00Z 🟡🟡🟡 - [ADMIN HEALTH CHECK] Use shared health check function for DRY principle
      const htmlContent = await performHealthCheck();
      
      return reply
        .header('Content-Type', 'text/html')
        .send(htmlContent);
    } catch (error) {
      console.error('❗❗❗ - [ADMIN HEALTH CHECK] Error performing health check:', error);
      return reply.status(500).send('Error performing health check');
    }
  });

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [ADMIN EMAIL TRACKING] Email status and management routes
  
  // GET /admin/orders/:orderId/email-status - Display email status for specific order
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level-based permission check
  app.get('/admin/orders/:orderId/email-status', {
    preHandler: [validateAdminSession, requireEditorOrAbove()] // Legacy compatibility maintained
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN EMAIL STATUS] GET /admin/orders/:orderId/email-status');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;
    const orderId = (request.params as any).orderId;

    try {
      // Fetch order details
      const order = await prisma.kloiOrdersTable.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          emailSentAt: true,
          emailMessageId: true,
          emailStatus: true,
          createdAt: true,
          totalAmount: true
        }
      });

      if (!order) {
        return reply.status(404).send('Order not found');
      }

      // Fetch email logs for this order
      const emailLogs = await EmailLogService.getEmailLogsByOrder(orderId);

      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [CSRF] Generate CSRF token for resend email form
      const csrfToken = await generateCsrfToken(reply);

      const templatePath = 'admin/email-status';
      const page_class = generatePageClass(templatePath);

      return reply.view(templatePath, {
        theme,
        admin,
        order,
        emailLogs,
        csrfToken,
        page_class
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN EMAIL STATUS] Error loading email status:', error);
      return reply.status(500).send('Error loading email status');
    }
  });

  // POST /admin/orders/:orderId/resend-email - Resend order confirmation email
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level-based permission check
  app.post('/admin/orders/:orderId/resend-email', {
    preHandler: [validateAdminSession, requireEditorOrAbove(), app.csrfProtection] // Legacy compatibility maintained
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN RESEND EMAIL] POST /admin/orders/:orderId/resend-email');
    
    const orderId = (request.params as any).orderId;

    try {
      // Fetch full order details
      const order = await prisma.kloiOrdersTable.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          totalAmount: true,
          paidAt: true,
          createdAt: true,
          location: true,
          eventDetails: true,
          eventSetup: true
        }
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          message: 'Order not found'
        });
      }

      if (!order.email) {
        return reply.status(400).send({
          success: false,
          message: 'Order does not have an email address'
        });
      }

      // Send order confirmation email
      const currency = process.env.DEFAULT_CURRENCY || 'AED';
      const emailResult = await sendOrderConfirmationEmail(order, currency);

      if (emailResult.success) {
        console.log('✅✅✅ - [ADMIN RESEND EMAIL] Order confirmation email resent successfully for order:', order.orderNumber);
        return reply.send({
          success: true,
          message: 'Email resent successfully',
          messageId: emailResult.messageId
        });
      } else {
        console.error('❗❗❗ - [ADMIN RESEND EMAIL] Failed to resend email for order:', order.orderNumber, emailResult.error);
        return reply.status(500).send({
          success: false,
          message: emailResult.error || 'Failed to resend email'
        });
      }
    } catch (error: any) {
      console.error('❗❗❗ - [ADMIN RESEND EMAIL] Error resending email:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to resend email'
      });
    }
  });

  // GET /admin/email-logs - List all email logs with filtering and pagination
  app.get('/admin/email-logs', {
    preHandler: [validateAdminSession]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ADMIN EMAIL LOGS] GET /admin/email-logs');
    
    const theme = (request as any).theme || 'default';
    const admin = (request as any).admin;
    const query = (request.query as any) || {};

    try {
      // Parse query parameters
      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '50', 10);
      const orderId = query.orderId || null;
      const recipient = query.recipient || null;
      const status = query.status || null;
      const startDate = query.startDate || null;
      const endDate = query.endDate || null;

      // Build where clause
      const where: any = {};
      if (orderId) {
        where.orderId = orderId;
      }
      if (recipient) {
        where.recipient = { contains: recipient, mode: 'insensitive' };
      }
      if (status) {
        where.status = status;
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Fetch email logs with pagination
      const [emailLogs, totalCount] = await Promise.all([
        prisma.emailLogs.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.emailLogs.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const templatePath = 'admin/email-logs';
      const page_class = generatePageClass(templatePath);

      return reply.view(templatePath, {
        theme,
        admin,
        emailLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        },
        filters: {
          orderId,
          recipient,
          status,
          startDate,
          endDate
        },
        page_class
      });
    } catch (error) {
      console.error('❗❗❗ - [ADMIN EMAIL LOGS] Error loading email logs:', error);
      return reply.status(500).send('Error loading email logs');
    }
  });

  console.log('✅✅✅ - [ADMIN ROUTES] Admin routes registered successfully');
}

