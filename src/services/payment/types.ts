// src/services/payment/types.ts
// 🟡🟡🟡 - [2025-01-XX] Shared payment types and interfaces for payment integration

// 🟡🟡🟡 - [PAYMENT TYPES] Payment status enum
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';

// 🟡🟡🟡 - [PAYMENT TYPES] Supported payment providers
export type PaymentProvider = 'stripe' | 'paypal' | 'square';

// 🟡🟡🟡 - [PAYMENT TYPES] Currency codes
export type Currency = 'AED' | 'USD' | 'EUR' | 'GBP';

// 🟡🟡🟡 - [PAYMENT TYPES] Parameters for creating a payment intent
export interface CreatePaymentIntentParams {
  amount: number; // Amount in smallest currency unit (fils for AED, cents for USD)
  currency: Currency;
  orderId: string;
  orderNumber?: number;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>; // Additional metadata for the payment intent
}

// 🟡🟡🟡 - [PAYMENT TYPES] Result from creating a payment intent
export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
}

// 🟡🟡🟡 - [PAYMENT TYPES] Parameters for confirming a payment
export interface ConfirmPaymentParams {
  paymentIntentId: string;
  paymentMethodId: string;
  returnUrl?: string; // Optional return URL for redirect-based flows
}

// 🟡🟡🟡 - [PAYMENT TYPES] Result from confirming a payment
export interface PaymentResult {
  success: boolean;
  paymentIntentId: string;
  status: PaymentStatus;
  error?: string; // Error message if payment failed
  requiresAction?: boolean; // True if 3D Secure or other action required
  clientSecret?: string; // Client secret for additional confirmation if needed
}

// 🟡🟡🟡 - [PAYMENT TYPES] Parameters for retrieving payment status
export interface RetrievePaymentParams {
  paymentIntentId: string;
}

// 🟡🟡🟡 - [PAYMENT TYPES] Payment details from provider
export interface PaymentDetails {
  paymentIntentId: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  createdAt: Date;
  paidAt?: Date;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

// 🟡🟡🟡 - [PAYMENT TYPES] Webhook event structure
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any; // Provider-specific event data
  };
  provider: PaymentProvider;
}

// 🟡🟡🟡 - [PAYMENT TYPES] Webhook verification result
export interface WebhookVerificationResult {
  valid: boolean;
  event?: WebhookEvent;
  error?: string;
}

// 🟡🟡🟡 - [PAYMENT TYPES] Payment processor interface (implemented by all providers)
export interface PaymentProcessor {
  /**
   * Create a payment intent with the provider
   * @param params Payment intent creation parameters
   * @returns Payment intent result with client secret
   */
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;

  /**
   * Confirm a payment after card entry
   * @param params Payment confirmation parameters
   * @returns Payment result with status
   */
  confirmPayment(params: ConfirmPaymentParams): Promise<PaymentResult>;

  /**
   * Retrieve payment details from provider
   * @param params Payment retrieval parameters
   * @returns Payment details
   */
  retrievePayment(params: RetrievePaymentParams): Promise<PaymentDetails>;

  /**
   * Verify and parse webhook event from provider
   * @param payload Raw webhook payload
   * @param signature Webhook signature for verification
   * @returns Webhook verification result
   */
  handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookVerificationResult>;
}
