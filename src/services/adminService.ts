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
  role: 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY';
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
  static async createAdmin(
    username: string,
    password: string,
    theme: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    role: 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY' = 'READ_ONLY',
    status: 'PENDING' | 'EMAIL_VERIFIED' | 'APPROVED' | 'ACTIVE' | 'INACTIVE' = 'PENDING'
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
          role,
          status,
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
  static async createInvitation(
    inviterId: string,
    email: string,
    theme: string
  ): Promise<{ admin: Admin; invitationLink: string }> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Creating invitation for email:', email, 'theme:', theme);
    
    try {
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
          role: 'READ_ONLY', // Default role, will be assigned during approval
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

      // Send invitation email
      const inviter = await this.getAdminById(inviterId);
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

  // 🟡🟡🟡 - [APPROVE ADMIN] Backend team approves and assigns role
  static async approveAdmin(
    adminId: string,
    approverId: string,
    role: 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY'
  ): Promise<Admin> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Approving admin:', adminId.substring(0, 8), 'with role:', role);
    
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
          role,
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
}
