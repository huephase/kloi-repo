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
    .or(z.literal(''))
});

