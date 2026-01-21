// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN SERVICE] Service for admin authentication and management
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { generateSecureToken } from '../lib/utils';
import { sendInvitationEmail, sendEmailVerificationEmail, sendApprovalNotificationEmail, sendAccountActivatedEmail } from './emailService';

// 🟡🟡🟡 - [ADMIN SERVICE] Password hashing salt rounds
const SALT_ROUNDS = 10;

// 🟡🟡🟡 - [ADMIN SERVICE] Token expiry hours
const INVITATION_EXPIRY_HOURS = parseInt(process.env.ADMIN_INVITATION_EXPIRY_HOURS || '168', 10); // 7 days default
const EMAIL_VERIFICATION_EXPIRY_HOURS = parseInt(process.env.ADMIN_EMAIL_VERIFICATION_EXPIRY_HOURS || '168', 10); // 7 days default
const BACKEND_TEAM_EMAIL = process.env.ADMIN_APPROVAL_NOTIFICATION_EMAIL || '';

// 🟡🟡🟡 - [ADMIN SERVICE] Type definition for Admin (matches Prisma model)
export interface Admin {
  id: string;
  username: string | null;
  password: string | null;
  theme: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Admin level (1-8): Levels 1-4 are Backend Admins, Levels 5-8 are Theme Admins
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpiry: Date | null;
  invitationToken: string | null;
  invitationExpiry: Date | null;
  invitedBy: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  status: 'PENDING' | 'EMAIL_VERIFIED' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 🟡🟡🟡 - [ADMIN SERVICE] Admin service class for authentication and CRUD operations
export class AdminService {
  
  // 🟡🟡🟡 - [PASSWORD HASHING] Hash password with bcrypt
  static async hashPassword(password: string): Promise<string> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Hashing password');
    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      console.log('✅✅✅ - [ADMIN SERVICE] Password hashed successfully');
      return hash;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  // 🟡🟡🟡 - [PASSWORD VERIFICATION] Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Verifying password');
    try {
      const isValid = await bcrypt.compare(password, hash);
      if (isValid) {
        console.log('✅✅✅ - [ADMIN SERVICE] Password verified successfully');
      } else {
        console.log('❗❗❗ - [ADMIN SERVICE] Password verification failed');
      }
      return isValid;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error verifying password:', error);
      return false;
    }
  }

  // 🟡🟡🟡 - [CREATE ADMIN] Create admin with hashed password
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level instead of role
  static async createAdmin(
    username: string,
    password: string,
    theme: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 8, // Default to Level 8 (lowest level)
    status: 'PENDING' | 'EMAIL_VERIFIED' | 'APPROVED' | 'ACTIVE' | 'INACTIVE' = 'PENDING',
    emailVerified: boolean = false
  ): Promise<Admin> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Creating admin:', username, 'for theme:', theme);
    
    try {
      // Check if admin with same username already exists
      if (username) {
        const existingAdmin = await prisma.admins.findUnique({
          where: { username }
        });

        if (existingAdmin) {
          console.log('❗❗❗ - [ADMIN SERVICE] Admin with username already exists:', username);
          throw new Error('Admin with this username already exists');
        }
      }

      // Hash password if provided
      const hashedPassword = password ? await this.hashPassword(password) : null;

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
          level, // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Use level instead of role
          status,
          emailVerified,
          isActive: status === 'ACTIVE'
        }
      });

      console.log('✅✅✅ - [ADMIN SERVICE] Admin created successfully:', admin.id.substring(0, 8));
      return admin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error creating admin:', error);
      throw error;
    }
  }

  // 🟡🟡🟡 - [AUTHENTICATE ADMIN] Authenticate admin for specific theme
  static async authenticateAdmin(
    username: string,
    password: string,
    theme: string
  ): Promise<Admin | null> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Authenticating admin:', username, 'for theme:', theme);
    
    try {
      // Find admin by username and theme
      const admin = await prisma.admins.findFirst({
        where: {
          username,
          theme,
          isActive: true,
          status: 'ACTIVE' // Only allow ACTIVE status
        }
      });

      if (!admin) {
        console.log('❗❗❗ - [ADMIN SERVICE] Admin not found, inactive, or not ACTIVE status:', username);
        return null;
      }

      // Check if email is verified
      if (!admin.emailVerified) {
        console.log('❗❗❗ - [ADMIN SERVICE] Admin email not verified:', username);
        return null;
      }

      // Check if password exists
      if (!admin.password) {
        console.log('❗❗❗ - [ADMIN SERVICE] Admin has no password set:', username);
        return null;
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, admin.password);
      
      if (!isValidPassword) {
        console.log('❗❗❗ - [ADMIN SERVICE] Invalid password for admin:', username);
        return null;
      }

      console.log('✅✅✅ - [ADMIN SERVICE] Admin authenticated successfully:', admin.id.substring(0, 8));
      return admin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error authenticating admin:', error);
      return null;
    }
  }

  // 🟡🟡🟡 - [GET ADMIN BY ID] Get admin by ID
  static async getAdminById(id: string): Promise<Admin | null> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Getting admin by ID:', id.substring(0, 8));
    
    try {
      const admin = await prisma.admins.findUnique({
        where: { id }
      });

      if (!admin) {
        console.log('⚠️⚠️⚠️ - [ADMIN SERVICE] Admin not found:', id.substring(0, 8));
        return null;
      }

      console.log('✅✅✅ - [ADMIN SERVICE] Admin found:', admin.id.substring(0, 8));
      return admin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error getting admin by ID:', error);
      return null;
    }
  }

  // 🟡🟡🟡 - [GET ADMIN BY EMAIL] Get admin by email
  static async getAdminByEmail(email: string): Promise<Admin | null> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Getting admin by email:', email);
    
    try {
      const admin = await prisma.admins.findFirst({
        where: { email }
      });

      if (!admin) {
        console.log('⚠️⚠️⚠️ - [ADMIN SERVICE] Admin not found for email:', email);
        return null;
      }

      console.log('✅✅✅ - [ADMIN SERVICE] Admin found for email:', email);
      return admin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error getting admin by email:', error);
      return null;
    }
  }

  // 🟡🟡🟡 - [GET ADMINS BY THEME] Get all admins for a theme (for future admin management)
  static async getAdminsByTheme(theme: string): Promise<Admin[]> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Getting admins for theme:', theme);
    
    try {
      const admins = await prisma.admins.findMany({
        where: {
          theme,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('✅✅✅ - [ADMIN SERVICE] Found', admins.length, 'admins for theme:', theme);
      return admins as Admin[];
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error getting admins by theme:', error);
      return [];
    }
  }

  // 🟡🟡🟡 - [CREATE INVITATION] Create invitation for new admin
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to support level-based invitation creation
  static async createInvitation(
    inviterId: string,
    email: string,
    theme: string,
    targetLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  ): Promise<{ admin: Admin; invitationLink: string }> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Creating invitation for email:', email, 'theme:', theme, 'targetLevel:', targetLevel);
    
    try {
      // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Validate inviter can create invitation for target level/theme
      const inviter = await this.getAdminById(inviterId);
      if (!inviter) {
        throw new Error('Inviter admin not found');
      }

      const defaultLevel = targetLevel || 8; // Default to Level 8 if not specified
      
      // Validate permission to create invitation
      if (!this.canCreateInvitationForLevel(inviter.level, defaultLevel, inviter.theme, theme)) {
        console.log('❗❗❗ - [ADMIN SERVICE] Inviter does not have permission to create invitation. Inviter level:', inviter.level, 'Target level:', defaultLevel, 'Inviter theme:', inviter.theme, 'Target theme:', theme);
        throw new Error('You do not have permission to create invitations for this level and theme');
      }

      // Check if admin with this email already exists
      const existingAdmin = await this.getAdminByEmail(email);
      if (existingAdmin) {
        console.log('❗❗❗ - [ADMIN SERVICE] Admin with email already exists:', email);
        throw new Error('Admin with this email already exists');
      }

      // Generate invitation token
      const invitationToken = generateSecureToken(32);
      const invitationExpiry = new Date();
      invitationExpiry.setHours(invitationExpiry.getHours() + INVITATION_EXPIRY_HOURS);

      // Create admin record with PENDING status
      const admin = await prisma.admins.create({
        data: {
          username: null, // Will be set during sign-up
          password: null, // Will be set during sign-up
          theme,
          email,
          firstName: '', // Will be set during sign-up
          lastName: '', // Will be set during sign-up
          phone: '', // Will be set during sign-up
          level: defaultLevel, // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Use target level (will be confirmed during approval)
          status: 'PENDING',
          invitationToken,
          invitationExpiry,
          invitedBy: inviterId,
          isActive: false,
          emailVerified: false
        }
      });

      // Generate invitation link
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const invitationLink = `${baseUrl}/admin/signup?token=${invitationToken}`;

      // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Reuse inviter variable from above instead of redeclaring
      const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Admin';
      await sendInvitationEmail(email, invitationLink, inviterName);

      console.log('✅✅✅ - [ADMIN SERVICE] Invitation created successfully for:', email);
      return { admin: admin as Admin, invitationLink };
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error creating invitation:', error);
      throw error;
    }
  }

  // 🟡🟡🟡 - [VALIDATE INVITATION TOKEN] Validate invitation token
  static async validateInvitationToken(token: string): Promise<Admin | null> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Validating invitation token');
    
    try {
      const admin = await prisma.admins.findUnique({
        where: { invitationToken: token }
      });

      if (!admin) {
        console.log('❗❗❗ - [ADMIN SERVICE] Invalid invitation token');
        return null;
      }

      // Check if token is expired
      if (!admin.invitationExpiry || admin.invitationExpiry < new Date()) {
        console.log('❗❗❗ - [ADMIN SERVICE] Invitation token expired');
        return null;
      }

      // Check if already used (status should be PENDING)
      if (admin.status !== 'PENDING') {
        console.log('❗❗❗ - [ADMIN SERVICE] Invitation token already used');
        return null;
      }

      console.log('✅✅✅ - [ADMIN SERVICE] Invitation token is valid');
      return admin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error validating invitation token:', error);
      return null;
    }
  }

  // 🟡🟡🟡 - [SIGN UP ADMIN] Complete sign-up process
  static async signUpAdmin(
    invitationToken: string,
    firstName: string,
    lastName: string,
    phone: string,
    password: string
  ): Promise<{ admin: Admin; verificationLink: string }> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Processing sign-up for invitation token');
    
    try {
      // Validate invitation token
      const admin = await this.validateInvitationToken(invitationToken);
      if (!admin) {
        throw new Error('Invalid or expired invitation token');
      }

      // Generate username from email (first part before @)
      const username = admin.email?.split('@')[0] || `admin_${admin.id.substring(0, 8)}`;
      
      // Check if username already exists, if so append random suffix
      let finalUsername = username;
      let counter = 1;
      while (await prisma.admins.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}_${counter}`;
        counter++;
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Generate email verification token
      const emailVerificationToken = generateSecureToken(32);
      const emailVerificationExpiry = new Date();
      emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

      // Update admin record
      const updatedAdmin = await prisma.admins.update({
        where: { id: admin.id },
        data: {
          username: finalUsername,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          emailVerificationToken,
          emailVerificationExpiry,
          invitationToken: null, // Clear invitation token after use
          status: 'PENDING' // Still PENDING until email verified
        }
      });

      // Generate verification link
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const verificationLink = `${baseUrl}/admin/verify-email?token=${emailVerificationToken}`;

      // Send verification email
      await sendEmailVerificationEmail(admin.email!, verificationLink);

      console.log('✅✅✅ - [ADMIN SERVICE] Sign-up completed successfully for:', admin.id.substring(0, 8));
      return { admin: updatedAdmin as Admin, verificationLink };
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error processing sign-up:', error);
      throw error;
    }
  }

  // 🟡🟡🟡 - [GENERATE EMAIL VERIFICATION TOKEN] Generate new verification token
  static async generateEmailVerificationToken(adminId: string): Promise<string> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Generating email verification token for admin:', adminId.substring(0, 8));
    
    const token = generateSecureToken(32);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

    await prisma.admins.update({
      where: { id: adminId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiry: expiry
      }
    });

    console.log('✅✅✅ - [ADMIN SERVICE] Email verification token generated');
    return token;
  }

  // 🟡🟡🟡 - [VERIFY EMAIL] Verify email using token
  static async verifyEmail(token: string): Promise<Admin | null> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Verifying email with token');
    
    try {
      const admin = await prisma.admins.findUnique({
        where: { emailVerificationToken: token }
      });

      if (!admin) {
        console.log('❗❗❗ - [ADMIN SERVICE] Invalid verification token');
        return null;
      }

      // Check if token is expired
      if (!admin.emailVerificationExpiry || admin.emailVerificationExpiry < new Date()) {
        console.log('❗❗❗ - [ADMIN SERVICE] Verification token expired');
        return null;
      }

      // Check if already verified
      if (admin.emailVerified) {
        console.log('🟡🟡🟡 - [ADMIN SERVICE] Email already verified');
        return admin as Admin;
      }

      // Update admin: mark email as verified, update status
      const updatedAdmin = await prisma.admins.update({
        where: { id: admin.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null, // Clear token after use
          emailVerificationExpiry: null,
          status: 'EMAIL_VERIFIED'
        }
      });

      // Send notification to backend team
      if (BACKEND_TEAM_EMAIL) {
        const adminName = `${admin.firstName} ${admin.lastName}`;
        await sendApprovalNotificationEmail(BACKEND_TEAM_EMAIL, admin.email!, adminName);
      }

      console.log('✅✅✅ - [ADMIN SERVICE] Email verified successfully for:', admin.id.substring(0, 8));
      return updatedAdmin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error verifying email:', error);
      return null;
    }
  }

  // 🟡🟡🟡 - [RESEND VERIFICATION EMAIL] Resend verification email
  static async resendVerificationEmail(adminId: string): Promise<{ success: boolean; error?: string }> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Resending verification email for admin:', adminId.substring(0, 8));
    
    try {
      const admin = await this.getAdminById(adminId);
      if (!admin) {
        return { success: false, error: 'Admin not found' };
      }

      if (admin.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      // Generate new verification token
      const token = await this.generateEmailVerificationToken(adminId);
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const verificationLink = `${baseUrl}/admin/verify-email?token=${token}`;

      // Send verification email
      await sendEmailVerificationEmail(admin.email!, verificationLink);

      console.log('✅✅✅ - [ADMIN SERVICE] Verification email resent successfully');
      return { success: true };
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error resending verification email:', error);
      return { success: false, error: 'Failed to resend verification email' };
    }
  }

  // 🟡🟡🟡 - [APPROVE ADMIN] Backend team approves and assigns level
  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level instead of role
  static async approveAdmin(
    adminId: string,
    approverId: string,
    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  ): Promise<Admin> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Approving admin:', adminId.substring(0, 8), 'with level:', level);
    
    try {
      const admin = await this.getAdminById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      if (admin.status !== 'EMAIL_VERIFIED') {
        throw new Error('Admin must have verified email before approval');
      }

      const updatedAdmin = await prisma.admins.update({
        where: { id: adminId },
        data: {
          level, // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Use level instead of role
          approvedAt: new Date(),
          approvedBy: approverId,
          status: 'APPROVED'
        }
      });

      console.log('✅✅✅ - [ADMIN SERVICE] Admin approved successfully');
      return updatedAdmin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error approving admin:', error);
      throw error;
    }
  }

  // 🟡🟡🟡 - [ACTIVATE ADMIN] Activate admin account
  static async activateAdmin(adminId: string): Promise<Admin> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Activating admin:', adminId.substring(0, 8));
    
    try {
      const admin = await this.getAdminById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      if (admin.status !== 'APPROVED') {
        throw new Error('Admin must be approved before activation');
      }

      const updatedAdmin = await prisma.admins.update({
        where: { id: adminId },
        data: {
          isActive: true,
          status: 'ACTIVE'
        }
      });

      // Send activation email
      if (admin.email) {
        const adminName = `${admin.firstName} ${admin.lastName}`;
        await sendAccountActivatedEmail(admin.email, adminName);
      }

      console.log('✅✅✅ - [ADMIN SERVICE] Admin activated successfully');
      return updatedAdmin as Admin;
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error activating admin:', error);
      throw error;
    }
  }

  // 🟡🟡🟡 - [GET PENDING ADMINS] Get list of admins awaiting approval
  static async getPendingAdmins(): Promise<Admin[]> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Getting pending admins');
    
    try {
      const admins = await prisma.admins.findMany({
        where: {
          status: {
            in: ['EMAIL_VERIFIED', 'APPROVED']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('✅✅✅ - [ADMIN SERVICE] Found', admins.length, 'pending admins');
      return admins as Admin[];
    } catch (error) {
      console.error('❗❗❗ - [ADMIN SERVICE] Error getting pending admins:', error);
      return [];
    }
  }

  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Check if inviter can create invitation for target level/theme
  static canCreateInvitationForLevel(
    inviterLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    targetLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    inviterTheme: string,
    targetTheme: string
  ): boolean {
    // Level 1-2 can create any level (1-8) for any theme
    if (inviterLevel === 1 || inviterLevel === 2) {
      return true;
    }
    
    // Level 5 can create levels 5-8 for assigned theme only
    if (inviterLevel === 5) {
      return targetLevel >= 5 && targetLevel <= 8 && inviterTheme === targetTheme;
    }
    
    // Others cannot create invitations
    return false;
  }

  // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Check if approver can approve admin for target level/theme
  static canApproveAdminForLevel(
    approverLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    targetLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    approverTheme: string,
    targetTheme: string
  ): boolean {
    // Level 1 can approve any level for any theme
    if (approverLevel === 1) {
      return true;
    }
    
    // Level 5 can approve levels 5-8 for assigned theme only
    if (approverLevel === 5) {
      return targetLevel >= 5 && targetLevel <= 8 && approverTheme === targetTheme;
    }
    
    // Others cannot approve admins
    return false;
  }
}
