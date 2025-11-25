// src/routes/checkout.ts
// 🟡🟡🟡 - [2025-01-XX] Checkout page route for payment processing

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { generatePageClass } from '../lib/pageClass';
import { prisma } from '../lib/prisma';
import { paymentService } from '../services/paymentService';

export default async function checkoutRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // 🟡🟡🟡 - [2025-01-XX] CHECKOUT PAGE ROUTE
  // Renders checkout page with order summary and payment form
  app.get('/checkout', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ROUTE] GET /checkout - Rendering checkout page');

    try {
      // 🟡🟡🟡 - [THEME] Detect theme from request (set by middleware)
      const theme = (request as any).theme || 'default';
      const templatePath = 'wizard/checkout';
      const page_class = generatePageClass(templatePath);
      console.log('🟡🟡🟡 - [ROUTE] Theme for checkout:', theme);

      // ⚪⚪⚪ - [SESSION] Read session-stored values for each step
      const sessionAny = (request.session as any) || {};
      const locationData = sessionAny.locationData || null;
      const eventDetails = sessionAny.eventDetails || null;
      const dateInfo = sessionAny.dateInfo || null;
      const eventSetup = sessionAny.eventSetup || null;
      const sessionId = request.session?.sessionId;

      console.log('⚪⚪⚪ - [CHECKOUT] Session ID:', sessionId?.substring(0, 8));
      console.log('⚪⚪⚪ - [CHECKOUT] Keys present:', {
        hasLocation: !!locationData,
        hasEventDetails: !!eventDetails,
        hasDateInfo: !!dateInfo,
        hasEventSetup: !!eventSetup
      });

      // 🟡🟡🟡 - [VALIDATION] Validate session has required data
      if (!locationData || !eventDetails || !eventSetup) {
        console.warn('⚠️⚠️⚠️ - [CHECKOUT] Missing required session data');
        return reply.status(400).send('Missing required information. Please complete all wizard steps first.');
      }

      if (!sessionId) {
        console.warn('⚠️⚠️⚠️ - [CHECKOUT] No session ID found');
        return reply.status(401).send('Session not found. Please start from the beginning.');
      }

      // 🟡🟡🟡 - [DATABASE] Get or find existing order by sessionId
      let order = await prisma.kloiOrdersTable.findFirst({
        where: { sessionId: sessionId },
        orderBy: { createdAt: 'desc' } // Get most recent order for this session
      });

      if (!order) {
        console.warn('⚠️⚠️⚠️ - [CHECKOUT] No order found for session, redirecting to event-summary');
        // Redirect to event summary if order doesn't exist
        return reply.redirect('/event-summary');
      }

      console.log('✅✅✅ - [CHECKOUT] Order found:', order.id, 'Order number:', order.orderNumber);

      // 🟡🟡🟡 - [CALCULATION] Calculate final total (server-side, never trust client)
      const subtotal = eventSetup?.calculator?.totals?.subtotal || 
                       eventSetup?.calculator?.totals?.total || 
                       0;
      const surchargeStr = locationData?.components?.surcharge || 
                           locationData?.surcharge || 
                           '0';
      const surcharge = typeof surchargeStr === 'string' ? parseFloat(surchargeStr) : 
                        (typeof surchargeStr === 'number' ? surchargeStr : 0);
      const total = subtotal + surcharge;

      console.log('🟡🟡🟡 - [CHECKOUT] Amount breakdown:', { subtotal, surcharge, total });

      // 🟡🟡🟡 - [PAYMENT INTENT] Create payment intent if not already created
      let clientSecret: string | null = null;
      let paymentIntentId: string | null = null;

      if (order.paymentIntentId) {
        // 🟡🟡🟡 - [PAYMENT INTENT] Payment intent already exists, retrieve client secret
        console.log('🟡🟡🟡 - [CHECKOUT] Payment intent already exists:', order.paymentIntentId);
        try {
          const paymentDetails = await paymentService.retrievePaymentStatus(order.id);
          // For Stripe, we need to get the client secret from the payment intent
          // Since we don't store it, we'll need to create a new one if needed
          // For now, create a new payment intent if the existing one is not in a valid state
          if (paymentDetails.status === 'succeeded' || paymentDetails.status === 'canceled') {
            console.log('🟡🟡🟡 - [CHECKOUT] Existing payment intent is completed/canceled, creating new one');
            const result = await paymentService.createPaymentIntent(order.id, {
              eventSetup,
              locationData,
              eventDetails
            });
            clientSecret = result.clientSecret;
            paymentIntentId = result.paymentIntentId;
          } else {
            // Payment intent exists and is pending, but we need client secret
            // We'll create a new one for simplicity (in production, store client secret)
            console.log('🟡🟡🟡 - [CHECKOUT] Creating new payment intent for pending order');
            const result = await paymentService.createPaymentIntent(order.id, {
              eventSetup,
              locationData,
              eventDetails
            });
            clientSecret = result.clientSecret;
            paymentIntentId = result.paymentIntentId;
          }
        } catch (error) {
          console.error('❗❗❗ - [CHECKOUT] Error retrieving payment status, creating new intent:', error);
          const result = await paymentService.createPaymentIntent(order.id, {
            eventSetup,
            locationData,
            eventDetails
          });
          clientSecret = result.clientSecret;
          paymentIntentId = result.paymentIntentId;
        }
      } else {
        // 🟡🟡🟡 - [PAYMENT INTENT] Create new payment intent
        console.log('🟡🟡🟡 - [CHECKOUT] Creating new payment intent');
        const result = await paymentService.createPaymentIntent(order.id, {
          eventSetup,
          locationData,
          eventDetails
        });
        clientSecret = result.clientSecret;
        paymentIntentId = result.paymentIntentId;
      }

      if (!clientSecret) {
        console.error('❗❗❗ - [CHECKOUT] Failed to get client secret');
        return reply.status(500).send('Failed to initialize payment. Please try again.');
      }

      // 🟡🟡🟡 - [STRIPE] Get publishable key for frontend
      const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
      if (!stripePublishableKey) {
        console.error('❗❗❗ - [CHECKOUT] STRIPE_PUBLISHABLE_KEY not configured');
        return reply.status(500).send('Payment system not configured. Please contact support.');
      }

      // 🟡🟡🟡 - [FORMAT] Format amounts for display (2 decimal places)
      const formatAmount = (amount: number): string => {
        return amount.toFixed(2);
      };

      // 🟡🟡🟡 - [RENDER] Render checkout page template
      return reply.view(templatePath, {
        theme,
        page_class,
        locationData,
        eventDetails,
        dateInfo,
        eventSetup,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: total,
          totalAmountFormatted: formatAmount(total),
          subtotal: subtotal,
          subtotalFormatted: formatAmount(subtotal),
          surcharge: surcharge,
          surchargeFormatted: formatAmount(surcharge),
        },
        stripePublishableKey,
        clientSecret,
        paymentIntentId,
        currency: process.env.DEFAULT_CURRENCY || 'AED',
      });
    } catch (error) {
      console.error('❗❗❗ - [ROUTE] Error rendering checkout:', error);
      console.error('❗❗❗ - [ROUTE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❗❗❗ - [ROUTE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        sessionId: request.session?.sessionId?.substring(0, 8)
      });
      return reply.status(500).send(`Failed to render checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
