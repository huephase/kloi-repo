// src/services/payment/PaymentProcessorFactory.ts
// 🟡🟡🟡 - [2025-01-XX] Factory pattern to create payment processors

import type { PaymentProcessor, PaymentProvider } from './types';

// 🟡🟡🟡 - [FACTORY] Lazy import to avoid circular dependencies
let StripeProcessor: any = null;

/**
 * PaymentProcessorFactory
 * 
 * Factory class to create payment processor instances based on environment configuration.
 * Supports switching payment providers via PAYMENT_PROVIDER environment variable.
 * 
 * Usage:
 *   const processor = PaymentProcessorFactory.create();
 *   const intent = await processor.createPaymentIntent({ ... });
 */
export class PaymentProcessorFactory {
  /**
   * Create a payment processor instance based on PAYMENT_PROVIDER environment variable
   * @returns PaymentProcessor instance
   * @throws Error if provider not found or not configured
   */
  static create(): PaymentProcessor {
    // 🟡🟡🟡 - [FACTORY] Get payment provider from environment (default: 'stripe')
    const provider = (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase() as PaymentProvider;
    
    console.log('🟡🟡🟡 - [PAYMENT FACTORY] Creating payment processor for provider:', provider);

    switch (provider) {
      case 'stripe':
        // 🟡🟡🟡 - [FACTORY] Lazy load StripeProcessor to avoid circular dependencies
        if (!StripeProcessor) {
          try {
            const stripeModule = require('./StripeProcessor');
            StripeProcessor = stripeModule.StripeProcessor || stripeModule.default;
          } catch (error) {
            console.error('❗❗❗ - [PAYMENT FACTORY] Failed to load StripeProcessor:', error);
            throw new Error('Stripe processor not available. Please check StripeProcessor implementation.');
          }
        }
        
        // 🟡🟡🟡 - [FACTORY] Verify Stripe configuration
        if (!process.env.STRIPE_SECRET_KEY) {
          console.error('❗❗❗ - [PAYMENT FACTORY] STRIPE_SECRET_KEY not configured');
          throw new Error('Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable.');
        }
        
        console.log('✅✅✅ - [PAYMENT FACTORY] Stripe processor created successfully');
        return new StripeProcessor();
        
      case 'paypal':
        // 🟡🟡🟡 - [FACTORY] PayPal processor not yet implemented
        console.error('❗❗❗ - [PAYMENT FACTORY] PayPal processor not yet implemented');
        throw new Error('PayPal processor not yet implemented. Please use "stripe" as payment provider.');
        
      case 'square':
        // 🟡🟡🟡 - [FACTORY] Square processor not yet implemented
        console.error('❗❗❗ - [PAYMENT FACTORY] Square processor not yet implemented');
        throw new Error('Square processor not yet implemented. Please use "stripe" as payment provider.');
        
      default:
        console.error('❗❗❗ - [PAYMENT FACTORY] Unknown payment provider:', provider);
        throw new Error(`Unknown payment provider: ${provider}. Supported providers: stripe, paypal, square`);
    }
  }

  /**
   * Get the current payment provider from environment
   * @returns Current payment provider name
   */
  static getCurrentProvider(): PaymentProvider {
    return (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase() as PaymentProvider;
  }

  /**
   * Check if a payment provider is configured
   * @param provider Provider name to check
   * @returns True if provider is configured and available
   */
  static isProviderAvailable(provider: PaymentProvider): boolean {
    switch (provider) {
      case 'stripe':
        return !!process.env.STRIPE_SECRET_KEY;
      case 'paypal':
        return false; // Not yet implemented
      case 'square':
        return false; // Not yet implemented
      default:
        return false;
    }
  }
}
