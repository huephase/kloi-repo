// src/services/payment/StripeProcessor.ts
// 🟡🟡🟡 - [2025-01-XX] Stripe implementation of PaymentProcessor interface

import Stripe from 'stripe';
import type {
  PaymentProcessor,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  ConfirmPaymentParams,
  PaymentResult,
  RetrievePaymentParams,
  PaymentDetails,
  WebhookVerificationResult,
  WebhookEvent,
  PaymentStatus
} from './types';

/**
 * StripeProcessor
 * 
 * Stripe implementation of the PaymentProcessor interface.
 * Handles all Stripe-specific payment operations including payment intents,
 * payment confirmation, and webhook verification.
 */
export class StripeProcessor implements PaymentProcessor {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    // 🟡🟡🟡 - [STRIPE INIT] Initialize Stripe client with secret key
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.error('❗❗❗ - [STRIPE PROCESSOR] STRIPE_SECRET_KEY not configured');
      throw new Error('Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    // 🟡🟡🟡 - [STRIPE INIT] Initialize Stripe with API version
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil', // ⚠️⚠️⚠️ NOTE: Using latest API version as required by Stripe SDK
    });

    // 🟡🟡🟡 - [STRIPE INIT] Get webhook secret for signature verification
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      console.warn('⚠️⚠️⚠️ - [STRIPE PROCESSOR] STRIPE_WEBHOOK_SECRET not configured. Webhook verification will fail.');
    }

    console.log('✅✅✅ - [STRIPE PROCESSOR] Stripe processor initialized');
  }

  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    console.log('🟡🟡🟡 - [STRIPE PROCESSOR] Creating payment intent', {
      amount: params.amount,
      currency: params.currency,
      orderId: params.orderId
    });

    try {
      // 🟡🟡🟡 - [STRIPE INTENT] Build metadata for order tracking
      const metadata: Record<string, string> = {
        orderId: params.orderId,
        ...(params.orderNumber && { orderNumber: String(params.orderNumber) }),
        ...(params.customerEmail && { customerEmail: params.customerEmail }),
        ...(params.customerName && { customerName: params.customerName }),
        ...(params.metadata || {})
      };

      // 🟡🟡🟡 - [STRIPE INTENT] Create payment intent with Stripe API
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount, // Amount in smallest currency unit (already converted)
        currency: params.currency.toLowerCase(), // Stripe expects lowercase currency codes
        metadata: metadata,
        automatic_payment_methods: {
          enabled: true, // Enable automatic payment methods (cards, etc.)
        },
      });

      console.log('✅✅✅ - [STRIPE PROCESSOR] Payment intent created:', paymentIntent.id);

      // 🟡🟡🟡 - [STRIPE INTENT] Map Stripe status to our PaymentStatus type
      const status = this.mapStripeStatusToPaymentStatus(paymentIntent.status);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || '',
        status: status,
        amount: paymentIntent.amount,
        currency: params.currency,
      };
    } catch (error) {
      console.error('❗❗❗ - [STRIPE PROCESSOR] Error creating payment intent:', error);
      
      // 🟡🟡🟡 - [STRIPE ERROR] Handle Stripe-specific errors
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Stripe error: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Confirm a payment after card entry
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentResult> {
    console.log('🟡🟡🟡 - [STRIPE PROCESSOR] Confirming payment', {
      paymentIntentId: params.paymentIntentId
    });

    try {
      // 🟡🟡🟡 - [STRIPE CONFIRM] Confirm payment intent with payment method
      const paymentIntent = await this.stripe.paymentIntents.confirm(params.paymentIntentId, {
        payment_method: params.paymentMethodId,
        return_url: params.returnUrl,
      });

      console.log('🟡🟡🟡 - [STRIPE PROCESSOR] Payment intent status:', paymentIntent.status);

      // 🟡🟡🟡 - [STRIPE CONFIRM] Check if additional action is required (3D Secure, etc.)
      const requiresAction = paymentIntent.status === 'requires_action' || 
                           paymentIntent.status === 'requires_confirmation';

      const status = this.mapStripeStatusToPaymentStatus(paymentIntent.status);

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        status: status,
        requiresAction: requiresAction,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      console.error('❗❗❗ - [STRIPE PROCESSOR] Error confirming payment:', error);
      
      // 🟡🟡🟡 - [STRIPE ERROR] Handle Stripe-specific errors with user-friendly messages
      if (error instanceof Stripe.errors.StripeCardError) {
        return {
          success: false,
          paymentIntentId: params.paymentIntentId,
          status: 'failed',
          error: this.getUserFriendlyErrorMessage(error),
        };
      }
      
      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          paymentIntentId: params.paymentIntentId,
          status: 'failed',
          error: error.message,
        };
      }
      
      throw error;
    }
  }

  /**
   * Retrieve payment details from Stripe
   */
  async retrievePayment(params: RetrievePaymentParams): Promise<PaymentDetails> {
    console.log('🟡🟡🟡 - [STRIPE PROCESSOR] Retrieving payment', {
      paymentIntentId: params.paymentIntentId
    });

    try {
      // 🟡🟡🟡 - [STRIPE RETRIEVE] Get payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(params.paymentIntentId);

      const status = this.mapStripeStatusToPaymentStatus(paymentIntent.status);

      // 🟡🟡🟡 - [STRIPE RETRIEVE] Extract paid timestamp if available
      let paidAt: Date | undefined;
      if (paymentIntent.status === 'succeeded' && paymentIntent.latest_charge) {
        try {
          const charge = await this.stripe.charges.retrieve(paymentIntent.latest_charge as string);
          paidAt = new Date(charge.created * 1000); // Stripe timestamps are in seconds
        } catch (chargeError) {
          console.warn('⚠️⚠️⚠️ - [STRIPE PROCESSOR] Could not retrieve charge details:', chargeError);
        }
      }

      return {
        paymentIntentId: paymentIntent.id,
        status: status,
        amount: paymentIntent.amount,
        currency: (paymentIntent.currency.toUpperCase() as any),
        createdAt: new Date(paymentIntent.created * 1000),
        paidAt: paidAt,
        customerEmail: paymentIntent.metadata?.customerEmail,
        metadata: paymentIntent.metadata || {},
      };
    } catch (error) {
      console.error('❗❗❗ - [STRIPE PROCESSOR] Error retrieving payment:', error);
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Stripe error: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Verify and parse webhook event from Stripe
   */
  async handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookVerificationResult> {
    console.log('🟡🟡🟡 - [STRIPE PROCESSOR] Handling webhook');

    try {
      // 🟡🟡🟡 - [STRIPE WEBHOOK] Verify webhook signature
      if (!this.webhookSecret) {
        console.error('❗❗❗ - [STRIPE PROCESSOR] Webhook secret not configured');
        return {
          valid: false,
          error: 'Webhook secret not configured',
        };
      }

      // 🟡🟡🟡 - [STRIPE WEBHOOK] Construct event from payload and signature
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      console.log('✅✅✅ - [STRIPE PROCESSOR] Webhook verified:', event.type);

      // 🟡🟡🟡 - [STRIPE WEBHOOK] Map Stripe event to our WebhookEvent interface
      const webhookEvent: WebhookEvent = {
        id: event.id,
        type: event.type,
        data: {
          object: event.data.object,
        },
        provider: 'stripe',
      };

      return {
        valid: true,
        event: webhookEvent,
      };
    } catch (error) {
      console.error('❗❗❗ - [STRIPE PROCESSOR] Webhook verification failed:', error);
      
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        return {
          valid: false,
          error: 'Invalid webhook signature',
        };
      }
      
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Webhook verification failed',
      };
    }
  }

  /**
   * Map Stripe payment intent status to our PaymentStatus type
   */
  private mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'pending',
      'requires_capture': 'pending',
      'succeeded': 'succeeded',
      'canceled': 'canceled',
    };

    return statusMap[stripeStatus] || 'pending';
  }

  /**
   * Get user-friendly error message from Stripe error
   */
  private getUserFriendlyErrorMessage(error: Stripe.errors.StripeCardError): string {
    const errorMessages: Record<string, string> = {
      'card_declined': 'Your card was declined. Please try a different payment method.',
      'insufficient_funds': 'Your card has insufficient funds. Please try a different payment method.',
      'expired_card': 'Your card has expired. Please use a different card.',
      'incorrect_cvc': 'Your card\'s security code is incorrect. Please check and try again.',
      'incorrect_number': 'Your card number is incorrect. Please check and try again.',
      'processing_error': 'An error occurred while processing your card. Please try again.',
      'generic_decline': 'Your card was declined. Please contact your bank or try a different payment method.',
    };

    return errorMessages[error.code || ''] || error.message || 'Payment failed. Please try again.';
  }
}
