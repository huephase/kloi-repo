// src/schemas/payment.schemas.ts
// 🟡🟡🟡 - [2025-01-XX] Payment validation schemas using Zod

import { z } from 'zod';

// 🟡🟡🟡 - [PAYMENT SCHEMAS] Schema for creating payment intent
export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  // Amount and currency are optional as they should be calculated server-side
  // But we allow them for validation if provided
  amount: z.number().min(0).optional(),
  currency: z.enum(['AED', 'USD', 'EUR', 'GBP']).optional(),
});

// 🟡🟡🟡 - [PAYMENT SCHEMAS] Schema for confirming payment
export const confirmPaymentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  returnUrl: z.string().url().optional(), // Optional return URL for redirect-based flows
});

// 🟡🟡🟡 - [PAYMENT SCHEMAS] Schema for payment status query
export const paymentStatusSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
});

// 🟡🟡🟡 - [PAYMENT SCHEMAS] Schema for payment intent ID parameter
export const paymentIntentIdSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
});

// 🟡🟡🟡 - [PAYMENT SCHEMAS] Schema for order ID parameter (URL param)
export const orderIdParamSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
});

console.log('✅✅✅ - [PAYMENT SCHEMAS] Payment validation schemas created');
