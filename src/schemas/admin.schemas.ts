// src/schemas/admin.schemas.ts
// Zod schemas for admin API validation
import { z } from 'zod';

// 🟡🟡🟡 - [ADMIN VALIDATION] Admin login schema
export const adminLoginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(100, 'Username must be 100 characters or less')
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  theme: z.string()
    .min(1, 'Theme is required')
    .max(50, 'Theme must be 50 characters or less')
    .trim()
});

// 🟡🟡🟡 - [ADMIN VALIDATION] Menu save schema - validates menu JSON structure
export const menuSaveSchema = z.object({
  name: z.string()
    .min(1, 'Menu name is required')
    .max(255, 'Menu name must be 255 characters or less')
    .trim(),
  menuItems: z.record(z.unknown())
    .refine((val) => {
      // Basic validation: ensure menuItems is an object
      return typeof val === 'object' && val !== null && !Array.isArray(val);
    }, 'Menu items must be a valid object')
});

// 🟡🟡🟡 - [ADMIN VALIDATION] Admin creation schema
export const adminCreateSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(100, 'Username must be 100 characters or less')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be 255 characters or less')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  theme: z.string()
    .min(1, 'Theme is required')
    .max(50, 'Theme must be 50 characters or less')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Theme can only contain letters, numbers, underscores, and hyphens'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim()
    .optional(),
  phone: z.string()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number must be 20 characters or less')
    .trim()
    .optional(),
  level: z.number()
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(8, 'Level must be at most 8')
    .optional() // 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level (1-8) instead of role
});

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN VALIDATION] Admin sign-up schema
export const adminSignUpSchema = z.object({
  invitationToken: z.string()
    .min(1, 'Invitation token is required')
    .max(255, 'Invalid invitation token'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim(),
  phone: z.string()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number must be 20 characters or less')
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be 255 characters or less')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  passwordConfirm: z.string()
    .min(1, 'Password confirmation is required')
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm']
});

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN VALIDATION] Email verification schema
export const emailVerificationSchema = z.object({
  token: z.string()
    .min(1, 'Verification token is required')
    .max(255, 'Invalid verification token')
});

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN VALIDATION] Invitation creation schema
// 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Added optional level field
export const invitationCreateSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be 100 characters or less')
    .trim(),
  theme: z.string()
    .min(1, 'Theme is required')
    .max(50, 'Theme must be 50 characters or less')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Theme can only contain letters, numbers, underscores, and hyphens'),
  level: z.number()
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(8, 'Level must be at most 8')
    .optional() // Optional - defaults based on inviter permissions
});

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN VALIDATION] Admin approval schema
// 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Updated to use level (1-8) instead of role
export const adminApprovalSchema = z.object({
  adminId: z.string()
    .uuid('Invalid admin ID'),
  level: z.number()
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(8, 'Level must be at most 8')
    .refine((val) => val >= 1 && val <= 8, {
      message: 'Level must be between 1 and 8'
    })
});

// 2025-12-29T00:00:00Z 🟡🟡🟡 - [ADMIN VALIDATION] Resend verification schema
export const resendVerificationSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be 100 characters or less')
    .trim()
});

// 🟡🟡🟡 - [ADMIN VALIDATION] Image upload schema - validates file upload request
// Note: Actual file validation is done in imageUploadService, this schema is for request structure
export const imageUploadSchema = z.object({
  // File validation is handled server-side via multipart parser
  // This schema can be extended if additional form fields are needed
});

