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

      // 🟡🟡🟡 - [DATA SOURCE] Use order's persisted data instead of session data (more reliable)
      // ⚠️⚠️⚠️ - [DATA SOURCE] Order's eventSetup and location are the source of truth, session may be stale
      const orderEventSetup = (order.eventSetup as any) || null;
      const orderLocation = (order.location as any) || null;
      
      // 🟡🟡🟡 - [CALCULATION] Calculate final total from order's persisted data (server-side, never trust client)
      // ⚠️⚠️⚠️ - [DATA SOURCE] Only use order's eventSetup if it has calculator totals, otherwise use session's eventSetup
      // Order's eventSetup might only contain date/time info (from date step), not calculator totals (from event step)
      const orderHasCalculatorTotals = orderEventSetup?.calculator?.totals?.total || orderEventSetup?.calculator?.totals?.subtotal;
      const eventSetupForCalculation = (orderHasCalculatorTotals && orderEventSetup) ? orderEventSetup : eventSetup;
      const locationForCalculation = orderLocation || locationData;
      
      console.log('🟡🟡🟡 - [CHECKOUT] Data source selection:', {
        orderHasCalculatorTotals: !!orderHasCalculatorTotals,
        usingOrderEventSetup: orderHasCalculatorTotals && !!orderEventSetup,
        usingSessionEventSetup: !orderHasCalculatorTotals || !orderEventSetup,
        orderEventSetupKeys: orderEventSetup ? Object.keys(orderEventSetup) : [],
        sessionEventSetupHasCalculator: !!(eventSetup?.calculator?.totals)
      });
      
      // 🟡🟡🟡 - [SUBTOTAL] Extract subtotal from calculator totals (check both total and subtotal fields)
      const subtotal = eventSetupForCalculation?.calculator?.totals?.total || 
                       eventSetupForCalculation?.calculator?.totals?.subtotal || 
                       0;
      
      // 🟡🟡🟡 - [SURCHARGE] Extract surcharge from location data (check components first, then top-level)
      const surchargeStr = locationForCalculation?.components?.surcharge || 
                           locationForCalculation?.surcharge || 
                           '0';
      const surcharge = typeof surchargeStr === 'string' ? parseFloat(surchargeStr) : 
                        (typeof surchargeStr === 'number' ? surchargeStr : 0);
      
      // 🟡🟡🟡 - [TOTAL] Calculate final total (subtotal + surcharge)
      // ⚠️⚠️⚠️ - [TOTAL] If order.totalAmount exists and is valid, prefer it over calculated total
      let total = subtotal + surcharge;
      if (order.totalAmount && typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount) {
        const orderTotalAmount = (order.totalAmount as any).toNumber();
        if (orderTotalAmount > 0 && isFinite(orderTotalAmount)) {
          console.log('🟡🟡🟡 - [CHECKOUT] Using order.totalAmount from database:', orderTotalAmount);
          total = orderTotalAmount;
        }
      } else if (order.totalAmount && typeof order.totalAmount === 'number' && order.totalAmount > 0) {
        console.log('🟡🟡🟡 - [CHECKOUT] Using order.totalAmount from database:', order.totalAmount);
        total = order.totalAmount;
      }

      console.log('🟡🟡🟡 - [CHECKOUT] Amount breakdown:', { 
        subtotal, 
        surcharge, 
        total,
        orderTotalAmount: order.totalAmount,
        usingOrderData: !!orderEventSetup,
        calculatorTotals: eventSetupForCalculation?.calculator?.totals
      });

      // ⚠️⚠️⚠️ - [VALIDATION] Ensure total is greater than 0 before proceeding
      if (!total || total <= 0 || !isFinite(total)) {
        console.error('❌❌❌ - [CHECKOUT] Invalid total amount calculated:', total);
        console.error('❌❌❌ - [CHECKOUT] Order eventSetup:', JSON.stringify(orderEventSetup, null, 2));
        console.error('❌❌❌ - [CHECKOUT] Order location:', JSON.stringify(orderLocation, null, 2));
        console.error('❌❌❌ - [CHECKOUT] Session eventSetup calculator totals:', eventSetup?.calculator?.totals);
        console.error('❌❌❌ - [CHECKOUT] EventSetup used for calculation:', eventSetupForCalculation === orderEventSetup ? 'ORDER' : 'SESSION');
        console.error('❌❌❌ - [CHECKOUT] Subtotal calculated:', subtotal, 'Surcharge:', surcharge);
        
        // 🟡🟡🟡 - [FALLBACK] If calculator totals are missing, redirect to event-summary to recalculate
        // The event-summary page has the calculator and will recalculate and save totals properly
        console.log('🟡🟡🟡 - [CHECKOUT] Calculator totals missing, redirecting to event-summary to recalculate');
        return reply.redirect('/event-summary?recalculate=true');
      }

      // 🟡🟡🟡 - [PAYMENT INTENT] Create payment intent if not already created
      let clientSecret: string | null = null;
      let paymentIntentId: string | null = null;

      if (order.paymentIntentId) {
        // 🟡🟡🟡 - [PAYMENT INTENT] Payment intent already exists, try to reuse it
        console.log('🟡🟡🟡 - [CHECKOUT] Payment intent already exists:', order.paymentIntentId);
        try {
          const paymentDetails = await paymentService.retrievePaymentStatus(order.id);
          
          // 🟡🟡🟡 - [PAYMENT INTENT] Check if payment intent is in a terminal state
          if (paymentDetails.status === 'succeeded' || paymentDetails.status === 'canceled') {
            console.log('🟡🟡🟡 - [CHECKOUT] Existing payment intent is completed/canceled, creating new one');
            const result = await paymentService.createPaymentIntent(order.id, {
              eventSetup: eventSetupForCalculation,
              locationData: locationForCalculation,
              eventDetails: (order.eventDetails as any) || eventDetails
            });
            clientSecret = result.clientSecret;
            paymentIntentId = result.paymentIntentId;
          } else if (paymentDetails.clientSecret) {
            // 🟡🟡🟡 - [PAYMENT INTENT] Payment intent exists and is in a valid state, reuse it
            console.log('✅✅✅ - [CHECKOUT] Reusing existing payment intent:', order.paymentIntentId, 'Status:', paymentDetails.status);
            clientSecret = paymentDetails.clientSecret;
            paymentIntentId = order.paymentIntentId;
          } else {
            // 🟡🟡🟡 - [PAYMENT INTENT] Payment intent exists but no client secret, create new one
            console.log('⚠️⚠️⚠️ - [CHECKOUT] Payment intent exists but no client secret available, creating new one');
            const result = await paymentService.createPaymentIntent(order.id, {
              eventSetup: eventSetupForCalculation,
              locationData: locationForCalculation,
              eventDetails: (order.eventDetails as any) || eventDetails
            });
            clientSecret = result.clientSecret;
            paymentIntentId = result.paymentIntentId;
          }
        } catch (error) {
          console.error('❗❗❗ - [CHECKOUT] Error retrieving payment status, creating new intent:', error);
          const result = await paymentService.createPaymentIntent(order.id, {
            eventSetup: eventSetupForCalculation,
            locationData: locationForCalculation,
            eventDetails: (order.eventDetails as any) || eventDetails
          });
          clientSecret = result.clientSecret;
          paymentIntentId = result.paymentIntentId;
        }
      } else {
        // 🟡🟡🟡 - [PAYMENT INTENT] Create new payment intent
        console.log('🟡🟡🟡 - [CHECKOUT] Creating new payment intent');
        const result = await paymentService.createPaymentIntent(order.id, {
          eventSetup: eventSetupForCalculation,
          locationData: locationForCalculation,
          eventDetails: (order.eventDetails as any) || eventDetails
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

      // 🟡🟡🟡 - [FORMAT] Format amounts for display with thousand separators and 2 decimal places
      // ⚠️⚠️⚠️ - [FORMAT] Uses toLocaleString to add comma separators for thousands (e.g., 80945.55 → "80,945.55")
      const formatAmount = (amount: number): string => {
        return amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      };

      // 🟡🟡🟡 - [EVENT DETAILS] Merge order's top-level customer fields with eventDetails JSONB
      // ⚠️⚠️⚠️ - [EVENT DETAILS] Customer info (firstName, lastName, phone, email) is stored as top-level fields on order,
      // not in order.eventDetails JSONB. We need to merge them for the template.
      const orderEventDetailsJson = (order.eventDetails as any) || {};
      const mergedEventDetails = {
        ...orderEventDetailsJson, // Property-related info (propertyType, buildingName, etc.)
        // 🟡🟡🟡 - [CUSTOMER INFO] Add customer info from order's top-level fields
        firstName: order.firstName || orderEventDetailsJson.firstName || (eventDetails as any)?.firstName || '',
        lastName: order.lastName || orderEventDetailsJson.lastName || (eventDetails as any)?.lastName || '',
        phone: order.phone || orderEventDetailsJson.phone || (eventDetails as any)?.phone || '',
        email: order.email || orderEventDetailsJson.email || (eventDetails as any)?.email || null,
      };
      
      console.log('🟡🟡🟡 - [CHECKOUT] Merged eventDetails for template:', {
        hasFirstName: !!mergedEventDetails.firstName,
        hasLastName: !!mergedEventDetails.lastName,
        hasPhone: !!mergedEventDetails.phone,
        hasEmail: !!mergedEventDetails.email,
        orderFirstName: order.firstName,
        orderLastName: order.lastName,
        orderPhone: order.phone,
      });

      // 🟡🟡🟡 - [RENDER] Render checkout page template
      // ⚠️⚠️⚠️ - [TEMPLATE DATA] Use order's persisted data for display (more reliable than session)
      return reply.view(templatePath, {
        theme,
        page_class,
        locationData: locationForCalculation || locationData, // Use order's location, fallback to session
        eventDetails: mergedEventDetails, // Use merged eventDetails with customer info from order's top-level fields
        dateInfo, // Keep dateInfo from session (not stored in order)
        eventSetup: eventSetupForCalculation || eventSetup, // Use order's eventSetup, fallback to session
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
