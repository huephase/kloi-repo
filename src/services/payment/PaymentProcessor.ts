// src/services/payment/PaymentProcessor.ts
// 🟡🟡🟡 - [2025-01-XX] Abstract interface/contract for payment processors

import type { PaymentProcessor } from './types';

/**
 * PaymentProcessor Interface
 * 
 * This interface defines the contract that all payment processors must implement.
 * It provides a consistent API for payment operations regardless of the underlying provider.
 * 
 * Implementation Notes:
 * - All methods must handle errors gracefully and return appropriate error information
 * - Amounts should be in the smallest currency unit (fils for AED, cents for USD)
 * - Webhook verification must always verify signatures before processing events
 * - All methods should log operations with appropriate emoji prefixes
 */
export type { PaymentProcessor };

/**
 * PaymentProcessor Interface Documentation
 * 
 * All payment processors must implement these methods:
 * 
 * 1. createPaymentIntent(params)
 *    - Creates a payment intent with the provider
 *    - Returns payment intent ID and client secret for frontend integration
 *    - Should include order metadata for tracking
 * 
 * 2. confirmPayment(params)
 *    - Confirms a payment after card details are collected
 *    - Returns payment status and any required actions (e.g., 3D Secure)
 *    - Should handle payment failures gracefully
 * 
 * 3. retrievePayment(params)
 *    - Retrieves current payment status from provider
 *    - Used for status checks and reconciliation
 *    - Should return complete payment details
 * 
 * 4. handleWebhook(payload, signature)
 *    - Verifies webhook signature for security
 *    - Parses webhook event from provider
 *    - Returns verified event or error if verification fails
 *    - Must never process unverified webhooks
 */
export default PaymentProcessor;
