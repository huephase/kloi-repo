// Zod schemas for wizard steps
import { z } from 'zod';

console.log('🟡🟡🟡 - [wizard.schemas] Defining wizard step schemas');

export const customerInfoSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
});
console.log('🟡🟡🟡 - [wizard.schemas] customerInfoSchema created');

export const eventSetupSchema = z.object({
  eventType: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  location: z.string().min(1),
});
console.log('🟡🟡🟡 - [wizard.schemas] eventSetupSchema created');

export const menuSelectionSchema = z.object({
  menuItems: z.array(z.string().min(1)),
});
console.log('🟡🟡🟡 - [wizard.schemas] menuSelectionSchema created');

export const guestCountsSchema = z.object({
  adults: z.number().int().min(0),
  children: z.number().int().min(0),
});
console.log('🟡🟡🟡 - [wizard.schemas] guestCountsSchema created');

export const eventSummarySchema = z.object({
  customerInfo: customerInfoSchema,
  eventSetup: eventSetupSchema,
  menuSelection: menuSelectionSchema,
  guestCounts: guestCountsSchema,
  totalPrice: z.number().min(0),
});
console.log('🟡🟡🟡 - [wizard.schemas] eventSummarySchema created');
