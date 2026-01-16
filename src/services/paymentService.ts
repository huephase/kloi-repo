// src/services/paymentService.ts
// 🟡🟡🟡 - [2025-01-XX] Main payment service that orchestrates payment operations

import { prisma } from '../lib/prisma';
import { PaymentProcessorFactory } from './payment/PaymentProcessorFactory';
import type {
  PaymentProcessor,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  ConfirmPaymentParams,
  PaymentResult,
  RetrievePaymentParams,
  PaymentDetails,
  WebhookEvent,
  Currency
} from './payment/types';
import { OrderStatus } from '../types/index';

/**
 * PaymentService
 * 
 * Main service that orchestrates payment operations using the payment processor abstraction.
 * Handles business logic, database updates, and currency conversions.
 */
class PaymentService {
  private processor: PaymentProcessor;

  constructor() {
    // 🟡🟡🟡 - [PAYMENT SERVICE] Initialize payment processor using factory
    try {
      this.processor = PaymentProcessorFactory.create();
      console.log('✅✅✅ - [PAYMENT SERVICE] Payment service initialized with provider:', PaymentProcessorFactory.getCurrentProvider());
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT SERVICE] Failed to initialize payment processor:', error);
      throw error;
    }
  }

  /**
   * Calculate total amount from session data
   * @param eventSetup Event setup data from session (includes calculator totals)
   * @param locationData Location data from session (includes surcharge)
   * @returns Total amount in major currency units (AED)
   */
  calculateTotalAmount(eventSetup: any, locationData: any): number {
    console.log('🟡🟡🟡 - [PAYMENT SERVICE] Calculating total amount');

    // 🟡🟡🟡 - [CALCULATION] Get subtotal from calculator totals
    const subtotal = eventSetup?.calculator?.totals?.total || 
                     eventSetup?.calculator?.totals?.subtotal || 
                     0;

    // 🟡🟡🟡 - [CALCULATION] Get surcharge from location data (check components first, then top-level)
    const surchargeStr = locationData?.components?.surcharge || 
                         locationData?.surcharge || 
                         '0';
    const surcharge = typeof surchargeStr === 'string' ? parseFloat(surchargeStr) : 
                      (typeof surchargeStr === 'number' ? surchargeStr : 0);

    // 🟡🟡🟡 - [CALCULATION] Calculate final total (subtotal + surcharge)
    const total = subtotal + surcharge;

    console.log('🟡🟡🟡 - [PAYMENT SERVICE] Amount breakdown:', {
      subtotal,
      surcharge,
      total
    });

    // 🟡🟡🟡 - [VALIDATION] Ensure total is valid
    if (!isFinite(total) || total < 0) {
      console.error('❗❗❗ - [PAYMENT SERVICE] Invalid total amount:', total);
      throw new Error('Invalid total amount calculated');
    }

    return total;
  }

  /**
   * Create a payment intent for an order
   * @param orderId Order ID from database
   * @param sessionData Session data containing eventSetup and locationData
   * @returns Payment intent result with client secret
   */
  async createPaymentIntent(orderId: string, sessionData: {
    eventSetup?: any;
    locationData?: any;
    eventDetails?: any;
  }): Promise<PaymentIntentResult> {
    console.log('🟡🟡🟡 - [PAYMENT SERVICE] Creating payment intent for order:', orderId);

    try {
      // 🟡🟡🟡 - [VALIDATION] Validate required session data
      if (!sessionData.eventSetup || !sessionData.locationData) {
        throw new Error('Missing required session data for payment intent creation');
      }

      // 🟡🟡🟡 - [CALCULATION] Calculate total amount (server-side, never trust client)
      const totalAmount = this.calculateTotalAmount(sessionData.eventSetup, sessionData.locationData);

      // 🟡🟡🟡 - [CURRENCY] Get currency from environment (default: AED)
      const currency = (process.env.DEFAULT_CURRENCY || 'AED') as Currency;

      // 🟡🟡🟡 - [CONVERSION] Convert to smallest currency unit (AED to fils: multiply by 100)
      const amountInSmallestUnit = Math.round(totalAmount * 100);

      console.log('🟡🟡🟡 - [PAYMENT SERVICE] Payment amount:', {
        totalAmount,
        currency,
        amountInSmallestUnit
      });

      // 🟡🟡🟡 - [DATABASE] Get order details for metadata
      const order = await prisma.kloiOrdersTable.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // 🟡🟡🟡 - [PAYMENT INTENT] Build customer info for metadata
      const customerEmail = sessionData.eventDetails?.email || order.email;
      const customerName = sessionData.eventDetails?.firstName && sessionData.eventDetails?.lastName
        ? `${sessionData.eventDetails.firstName} ${sessionData.eventDetails.lastName}`
        : `${order.firstName} ${order.lastName}`;

      // 🟡🟡🟡 - [PAYMENT INTENT] Create payment intent parameters
      const params: CreatePaymentIntentParams = {
        amount: amountInSmallestUnit,
        currency: currency,
        orderId: orderId,
        orderNumber: order.orderNumber,
        customerEmail: customerEmail || undefined,
        customerName: customerName,
      };

      // 🟡🟡🟡 - [PAYMENT INTENT] Create payment intent using processor
      const result = await this.processor.createPaymentIntent(params);

      // 🟡🟡🟡 - [DATABASE] Update order with payment intent information
      await prisma.kloiOrdersTable.update({
        where: { id: orderId },
        data: {
          paymentProvider: PaymentProcessorFactory.getCurrentProvider(),
          paymentIntentId: result.paymentIntentId,
          paymentStatus: result.status,
          totalAmount: totalAmount, // Store in major currency units
        }
      });

      console.log('✅✅✅ - [PAYMENT SERVICE] Payment intent created and order updated:', result.paymentIntentId);

      return result;
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT SERVICE] Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm a payment after card entry
   * @param orderId Order ID
   * @param paymentMethodId Payment method ID from Stripe Elements
   * @returns Payment result
   */
  async confirmPayment(orderId: string, paymentMethodId: string): Promise<PaymentResult> {
    console.log('🟡🟡🟡 - [PAYMENT SERVICE] Confirming payment for order:', orderId);

    try {
      // 🟡🟡🟡 - [DATABASE] Get order to retrieve payment intent ID
      const order = await prisma.kloiOrdersTable.findUnique({
        where: { id: orderId },
        select: {
          paymentIntentId: true,
        }
      });

      if (!order || !order.paymentIntentId) {
        throw new Error(`Order not found or payment intent not created: ${orderId}`);
      }

      // 🟡🟡🟡 - [PAYMENT CONFIRM] Confirm payment using processor
      const params: ConfirmPaymentParams = {
        paymentIntentId: order.paymentIntentId,
        paymentMethodId: paymentMethodId,
      };

      const result = await this.processor.confirmPayment(params);

      // 🟡🟡🟡 - [DATABASE] Update order with payment status
      await prisma.kloiOrdersTable.update({
        where: { id: orderId },
        data: {
          paymentStatus: result.status,
          paymentMethodId: paymentMethodId,
        }
      });

      console.log('🟡🟡🟡 - [PAYMENT SERVICE] Payment confirmation result:', {
        success: result.success,
        status: result.status,
        requiresAction: result.requiresAction
      });

      return result;
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT SERVICE] Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Retrieve payment status for an order
   * @param orderId Order ID
   * @returns Payment details
   */
  async retrievePaymentStatus(orderId: string): Promise<PaymentDetails> {
    console.log('🟡🟡🟡 - [PAYMENT SERVICE] Retrieving payment status for order:', orderId);

    try {
      // 🟡🟡🟡 - [DATABASE] Get order to retrieve payment intent ID
      const order = await prisma.kloiOrdersTable.findUnique({
        where: { id: orderId },
        select: {
          paymentIntentId: true,
        }
      });

      if (!order || !order.paymentIntentId) {
        throw new Error(`Order not found or payment intent not created: ${orderId}`);
      }

      // 🟡🟡🟡 - [PAYMENT RETRIEVE] Retrieve payment details using processor
      const params: RetrievePaymentParams = {
        paymentIntentId: order.paymentIntentId,
      };

      const details = await this.processor.retrievePayment(params);

      // 🟡🟡🟡 - [DATABASE] Update order with latest payment status
      await prisma.kloiOrdersTable.update({
        where: { id: orderId },
        data: {
          paymentStatus: details.status,
          paidAt: details.paidAt || undefined,
        }
      });

      console.log('✅✅✅ - [PAYMENT SERVICE] Payment status retrieved:', details.status);

      return details;
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT SERVICE] Error retrieving payment status:', error);
      throw error;
    }
  }

  /**
   * Process webhook event and update order status
   * @param event Webhook event from payment provider
   * @returns Success status
   */
  async processWebhook(event: WebhookEvent): Promise<boolean> {
    console.log('🟡🟡🟡 - [PAYMENT SERVICE] Processing webhook event:', event.type);

    try {
      // 🟡🟡🟡 - [WEBHOOK] Extract payment intent ID from event data
      const paymentIntentId = event.data.object?.id;
      if (!paymentIntentId) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT SERVICE] Webhook event missing payment intent ID');
        return false;
      }

      // 🟡🟡🟡 - [DATABASE] Find order by payment intent ID
      const order = await prisma.kloiOrdersTable.findFirst({
        where: { paymentIntentId: paymentIntentId },
      });

      if (!order) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT SERVICE] Order not found for payment intent:', paymentIntentId);
        return false;
      }

      // 🟡🟡🟡 - [WEBHOOK] Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('✅✅✅ - [PAYMENT SERVICE] Payment succeeded for order:', order.id);
          
          // 🟡🟡🟡 - [LEAD TO CUSTOMER CONVERSION] Convert lead to customer after successful payment
          let customerId: string | null = null;
          if (order.leadId) {
            console.log('🟡🟡🟡 - [PAYMENT SERVICE] Converting lead to customer:', order.leadId);
            
            // Import convertLeadToCustomer dynamically to avoid circular dependencies
            const { convertLeadToCustomer } = await import('./leadService');
            const conversionResult = await convertLeadToCustomer(order.leadId);
            
            if (conversionResult.success && conversionResult.customerId) {
              customerId = conversionResult.customerId;
              console.log('✅✅✅ - [PAYMENT SERVICE] Lead converted to customer successfully:', customerId);
            } else {
              // 🟡🟡🟡 - [CONFLICT HANDLING] Conflict detected during conversion
              // This means customer already exists, use existing customer
              console.log('❗❗❗ - [PAYMENT SERVICE] Conflict detected during lead conversion:', conversionResult.message);
              
              // 🟡🟡🟡 - [CONFLICT RESOLUTION] Try to find existing customer by phone/email from lead
              const lead = await prisma.leads.findUnique({
                where: { id: order.leadId }
              });
              
              if (lead && lead.phone) {
                // Check for existing customer
                const existingCustomer = await prisma.customers.findFirst({
                  where: {
                    OR: [
                      { phone: lead.phone },
                      ...(lead.email ? [{ email: lead.email }] : [])
                    ]
                  }
                });
                
                if (existingCustomer) {
                  customerId = existingCustomer.id;
                  console.log('✅✅✅ - [PAYMENT SERVICE] Using existing customer:', customerId);
                } else {
                  console.error('❌❌❌ - [PAYMENT SERVICE] Could not find existing customer for lead');
                }
              }
            }
          }
          
          // 🟡🟡🟡 - [ORDER UPDATE] Update order with COMPLETED status and link to customer
          await prisma.kloiOrdersTable.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.COMPLETED,
              paymentStatus: 'succeeded',
              paidAt: new Date(),
              userId: customerId || undefined, // Link to customer if conversion succeeded
            }
          });
          
          console.log('✅✅✅ - [PAYMENT SERVICE] Order status updated to COMPLETED');
          if (customerId) {
            console.log('✅✅✅ - [PAYMENT SERVICE] Order linked to customer:', customerId);
          }
          
          // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Send order confirmation email after successful payment
          try {
            console.log('🟡🟡🟡 - [PAYMENT SERVICE] Preparing to send order confirmation email for order:', order.orderNumber);
            
            // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Fetch full order details including all JSON fields for email
            const fullOrder = await prisma.kloiOrdersTable.findUnique({
              where: { id: order.id },
              select: {
                orderNumber: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                totalAmount: true,
                paidAt: true,
                createdAt: true,
                location: true,
                eventDetails: true,
                eventSetup: true,
              }
            });
            
            if (!fullOrder) {
              console.error('❗❗❗ - [PAYMENT SERVICE] Could not fetch order details for email:', order.id);
            } else if (!fullOrder.email) {
              console.warn('⚠️⚠️⚠️ - [PAYMENT SERVICE] Skipping email - customer email not available for order:', order.orderNumber);
            } else {
              // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Import email service dynamically to avoid circular dependencies
              const { sendOrderConfirmationEmail } = await import('./emailService');
              const currency = (process.env.DEFAULT_CURRENCY || 'AED');
              
              const emailResult = await sendOrderConfirmationEmail(fullOrder, currency);
              
              if (emailResult.success) {
                console.log('✅✅✅ - [PAYMENT SERVICE] Order confirmation email sent successfully for order:', order.orderNumber);
              } else {
                console.error('❗❗❗ - [PAYMENT SERVICE] Failed to send order confirmation email for order:', order.orderNumber, emailResult.error);
                // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Email failure should not block payment processing
                // Payment is already confirmed, email is a notification
              }
            }
          } catch (emailError) {
            // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Handle email errors gracefully - don't fail webhook processing
            console.error('❗❗❗ - [PAYMENT SERVICE] Error sending order confirmation email:', emailError);
            console.error('❗❗❗ - [PAYMENT SERVICE] Payment was successful, but email notification failed. Order:', order.orderNumber);
            // Continue processing - payment is already confirmed
          }
          
          break;

        case 'payment_intent.payment_failed':
          console.log('❗❗❗ - [PAYMENT SERVICE] Payment failed for order:', order.id);
          
          await prisma.kloiOrdersTable.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'failed',
            }
          });
          
          console.log('🟡🟡🟡 - [PAYMENT SERVICE] Order payment status updated to failed');
          break;

        case 'payment_intent.canceled':
          console.log('⚠️⚠️⚠️ - [PAYMENT SERVICE] Payment canceled for order:', order.id);
          
          await prisma.kloiOrdersTable.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'canceled',
            }
          });
          
          console.log('🟡🟡🟡 - [PAYMENT SERVICE] Order payment status updated to canceled');
          break;

        default:
          console.log('🟡🟡🟡 - [PAYMENT SERVICE] Unhandled webhook event type:', event.type);
          return false;
      }

      return true;
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT SERVICE] Error processing webhook:', error);
      return false;
    }
  }
}

// 🟡🟡🟡 - [PAYMENT SERVICE] Export singleton instance
export const paymentService = new PaymentService();
