// Zod schemas for payments
import { z } from 'zod';

console.log('🟡🟡🟡 - [payment.schemas] Defining payment schemas');

export const paymentIntentCreateSchema = z.object({
  amount: z.number().int().min(1),
  currency: z.string().length(3),
  orderId: z.string().min(1),
});
console.log('🟡🟡🟡 - [payment.schemas] paymentIntentCreateSchema created');

export const paymentIntentConfirmSchema = z.object({
  paymentIntentId: z.string().min(1),
});
console.log('🟡🟡🟡 - [payment.schemas] paymentIntentConfirmSchema created');

export const paymentWebhookSchema = z.object({
  type: z.string().min(1),
  data: z.any(),
});
console.log('🟡🟡🟡 - [payment.schemas] paymentWebhookSchema created');
