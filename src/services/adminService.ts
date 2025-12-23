// src/services/adminService.ts
// Service for admin authentication and management
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

// 🟡🟡🟡 - [ADMIN SERVICE] Password hashing salt rounds
const SALT_ROUNDS = 10;

// 🟡🟡🟡 - [ADMIN SERVICE] Type definition for Admin (matches Prisma model)
export interface Admin {
  id: string;
  username: string;
  password: string;
  theme: string;
  email: string | null;
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
    email?: string
  ): Promise<Admin> {
    console.log('🟡🟡🟡 - [ADMIN SERVICE] Creating admin:', username, 'for theme:', theme);
    
    try {
      // Check if admin with same username already exists
      const existingAdmin = await prisma.admins.findUnique({
        where: { username }
      });

      if (existingAdmin) {
        console.log('❗❗❗ - [ADMIN SERVICE] Admin with username already exists:', username);
        throw new Error('Admin with this username already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create admin
      const admin = await prisma.admins.create({
        data: {
          username,
          password: hashedPassword,
          theme,
          email: email || null,
          isActive: true
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
          isActive: true
        }
      });

      if (!admin) {
        console.log('❗❗❗ - [ADMIN SERVICE] Admin not found or inactive:', username);
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
}

