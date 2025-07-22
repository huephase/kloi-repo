// Zod schemas for wizard steps
import { z } from 'zod';

// console.log('🟡🟡🟡 - [wizard.schemas] Defining wizard step schemas');

// 🟡🟡🟡 - [VALIDATION SCHEMA] Location data schema
export const locationDataSchema = z.object({
  fullAddress: z.string().min(1, 'Location address is required'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  components: z.record(z.string()).optional(),
});

// 🟡🟡🟡 - [VALIDATION SCHEMA] Comprehensive customer info schema for event-details form
export const eventDetailsSchema = z.object({
  // Always required fields
  firstName: z.string()
    .min(1, 'First name is required')
    .max(20, 'First name must be 20 characters or less')
    .regex(/^[a-zA-Z\-\s]+$/, 'First name can only contain letters, hyphens, and spaces'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(20, 'Last name must be 20 characters or less')
    .regex(/^[a-zA-Z\-\s]+$/, 'Last name can only contain letters, hyphens, and spaces'),
  
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 9;
    }, 'Phone number must contain at least 9 digits'),
  
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'EVENT'], {
    required_error: 'Property type is required',
    invalid_type_error: 'Property type must be APARTMENT, HOUSE, OFFICE, or EVENT',
  }),
  
  // Conditional fields based on property type
  buildingName: z.string()
    .max(30, 'Building name must be 30 characters or less')
    .regex(/^[a-zA-Z0-9\-,\s]*$/, 'Building name can only contain letters, numbers, hyphens, commas, and spaces')
    .optional(),
  
  houseNumber: z.string()
    .max(12, 'House number must be 12 characters or less')
    .regex(/^[0-9\-\s]*$/, 'House number can only contain numbers, hyphens, and spaces')
    .optional(),
  
  floorNumber: z.string()
    .max(3, 'Floor number must be 3 characters or less')
    .refine((val) => {
      if (!val) return true; // Allow empty for optional validation
      const upperVal = val.toUpperCase();
      // Allow G, GF, M, MF or numbers 1-170
      if (['G', 'GF', 'M', 'MF'].includes(upperVal)) return true;
      const numVal = parseInt(upperVal, 10);
      return !isNaN(numVal) && numVal >= 1 && numVal <= 170;
    }, 'Floor number must be G, GF, M, MF, or a number between 1-170')
    .optional(),
  
  unitNumber: z.string()
    .max(4, 'Unit number must be 4 digits or less')
    .regex(/^[0-9]*$/, 'Unit number can only contain numbers')
    .refine((val) => {
      if (!val) return true; // Allow empty for optional validation
      const numVal = parseInt(val, 10);
      return !isNaN(numVal) && numVal >= 1 && numVal <= 9999;
    }, 'Unit number must be between 1-9999')
    .optional(),
  
  // Optional fields
  street: z.string()
    .max(30, 'Street name must be 30 characters or less')
    .regex(/^[a-zA-Z0-9\-,\s]*$/, 'Street name can only contain letters, numbers, hyphens, commas, and spaces')
    .optional(),
  
  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')), // Allow empty string
  
  additionalDirections: z.string()
    .max(100, 'Additional directions must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\-,\s]*$/, 'Additional directions can only contain letters, numbers, hyphens, commas, and spaces')
    .optional(),
})
.refine((data) => {
  // ✅✅✅ - [CONDITIONAL VALIDATION] Building name is required for APARTMENT, OFFICE, EVENT
  if (['APARTMENT', 'OFFICE', 'EVENT'].includes(data.propertyType)) {
    return data.buildingName && data.buildingName.length > 0;
  }
  return true;
}, {
  message: 'Building name is required for apartments, offices, and events',
  path: ['buildingName'],
})
.refine((data) => {
  // ✅✅✅ - [CONDITIONAL VALIDATION] House number is required for HOUSE
  if (data.propertyType === 'HOUSE') {
    return data.houseNumber && data.houseNumber.length > 0;
  }
  return true;
}, {
  message: 'House number is required for houses',
  path: ['houseNumber'],
})
.refine((data) => {
  // ✅✅✅ - [CONDITIONAL VALIDATION] Floor number is required for APARTMENT, OFFICE, EVENT
  if (['APARTMENT', 'OFFICE', 'EVENT'].includes(data.propertyType)) {
    return data.floorNumber && data.floorNumber.length > 0;
  }
  return true;
}, {
  message: 'Floor number is required for apartments, offices, and events',
  path: ['floorNumber'],
})
.refine((data) => {
  // ✅✅✅ - [CONDITIONAL VALIDATION] Unit number is required for APARTMENT, OFFICE (optional for EVENT)
  if (['APARTMENT', 'OFFICE'].includes(data.propertyType)) {
    return data.unitNumber && data.unitNumber.length > 0;
  }
  return true;
}, {
  message: 'Unit number is required for apartments and offices',
  path: ['unitNumber'],
});

// 🟡🟡🟡 - [VALIDATION SCHEMA] Date and time selection schema for date picker
export const dateSelectionSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'))
    .min(1, 'At least one date must be selected')
    .max(30, 'Maximum 30 dates can be selected'),
  
  startTime: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM')
    .refine((val) => {
      const [hours] = val.split(':').map(Number);
      return hours >= 7 && hours <= 23; // 7 AM to 11 PM
    }, 'Start time must be between 7:00 AM and 11:00 PM'),
  
  endTime: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM')
    .refine((val) => {
      const [hours] = val.split(':').map(Number);
      return (hours >= 8 && hours <= 23) || hours === 0; // 8 AM to 12 AM (midnight)
    }, 'End time must be between 8:00 AM and 12:00 AM'),
  
  isMultiDay: z.boolean().default(false),
})
.refine((data) => {
  // 🟡🟡🟡 - [TIME VALIDATION] Ensure end time is after start time
  const startHour = parseInt(data.startTime.split(':')[0]);
  const endHour = parseInt(data.endTime.split(':')[0]);
  
  // Handle midnight (00:00) as 24
  const adjustedEndHour = endHour === 0 ? 24 : endHour;
  
  return adjustedEndHour > startHour;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})
.refine((data) => {
  // 🟡🟡🟡 - [DATE VALIDATION] Ensure dates are in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return data.dates.every(dateStr => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  });
}, {
  message: 'All selected dates must be in the future',
  path: ['dates'],
});

// 🟡🟡🟡 - [LEGACY SCHEMA] Keep existing schemas for backward compatibility
export const customerInfoSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
});
// console.log('🟡🟡🟡 - [wizard.schemas] customerInfoSchema created');

// 🟡🟡🟡 - [VALIDATION SCHEMA] Event setup schema for menu selections
export const eventSetupSchema = z.object({
  radioSelections: z.record(z.string()).optional(),
  checkboxSelections: z.record(z.string()).optional(),
  productQuantities: z.record(z.number().int().min(0)).optional(),
});
// console.log('🟡🟡🟡 - [wizard.schemas] eventSetupSchema created');

export const menuSelectionSchema = z.object({
  menuItems: z.array(z.string().min(1)),
});
// console.log('🟡🟡🟡 - [wizard.schemas] menuSelectionSchema created');

export const guestCountsSchema = z.object({
  adults: z.number().int().min(0),
  children: z.number().int().min(0),
});
// console.log('🟡🟡🟡 - [wizard.schemas] guestCountsSchema created');

export const eventSummarySchema = z.object({
  customerInfo: customerInfoSchema,
  eventSetup: eventSetupSchema,
  menuSelection: menuSelectionSchema,
  guestCounts: guestCountsSchema,
  totalPrice: z.number().min(0),
});
// console.log('🟡🟡🟡 - [wizard.schemas] eventSummarySchema created');

console.log('✅✅✅ - [wizard.schemas] All validation schemas created successfully');
