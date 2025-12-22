// src/routes/finalConfirmation.ts
// 🟡🟡🟡 - [2025-01-XX] Final confirmation page route after successful payment

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { generatePageClass } from '../lib/pageClass';
import { prisma } from '../lib/prisma';
import { paymentService } from '../services/paymentService';

export default async function finalConfirmationRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // 🟡🟡🟡 - [2025-01-XX] FINAL CONFIRMATION PAGE ROUTE
  // Renders confirmation page after successful payment
  app.get('/final-confirmation', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [ROUTE] GET /final-confirmation - Rendering final confirmation page');

    try {
      // 🟡🟡🟡 - [THEME] Detect theme from request (set by middleware)
      const theme = (request as any).theme || 'default';
      const templatePath = 'wizard/final-confirmation';
      const page_class = generatePageClass(templatePath);
      console.log('🟡🟡🟡 - [ROUTE] Theme for final-confirmation:', theme);

      // 🟡🟡🟡 - [QUERY PARAM] Get order ID from query parameter
      const orderId = (request.query as any)?.order;
      
      if (!orderId || typeof orderId !== 'string') {
        console.warn('⚠️⚠️⚠️ - [FINAL CONFIRMATION] No order ID provided in query');
        return reply.status(400).send('Order ID is required. Please provide a valid order ID.');
      }

      console.log('🟡🟡🟡 - [FINAL CONFIRMATION] Order ID from query:', orderId);

      // ⚪⚪⚪ - [SESSION] Get session ID for validation
      const sessionId = request.session?.sessionId;
      console.log('⚪⚪⚪ - [FINAL CONFIRMATION] Session ID:', sessionId?.substring(0, 8));

      // 🟡🟡🟡 - [DATABASE] Get order from database
      const order = await prisma.kloiOrdersTable.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          location: true,
          eventDetails: true,
          eventSetup: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          paymentIntentId: true,
          paidAt: true,
          createdAt: true,
          sessionId: true,
        }
      });

      if (!order) {
        console.warn('⚠️⚠️⚠️ - [FINAL CONFIRMATION] Order not found:', orderId);
        return reply.status(404).send('Order not found. Please check your order ID and try again.');
      }

      console.log('✅✅✅ - [FINAL CONFIRMATION] Order found:', order.id, 'Order number:', order.orderNumber);

      // 🟡🟡🟡 - [SECURITY] Verify order belongs to session if session exists
      if (sessionId && order.sessionId !== sessionId) {
        console.warn('⚠️⚠️⚠️ - [FINAL CONFIRMATION] Order does not belong to session');
        // 🟡🟡🟡 - [SECURITY] Still allow access but log warning (user might have valid order ID)
        // In production, you might want to be stricter here
      }

      // 🟡🟡🟡 - [PAYMENT STATUS] Retrieve latest payment status
      let paymentDetails = null;
      if (order.paymentIntentId) {
        try {
          paymentDetails = await paymentService.retrievePaymentStatus(order.id);
          console.log('✅✅✅ - [FINAL CONFIRMATION] Payment status retrieved:', paymentDetails.status);
        } catch (error) {
          console.warn('⚠️⚠️⚠️ - [FINAL CONFIRMATION] Could not retrieve payment status from provider:', error);
          // Continue with database status if provider retrieval fails
        }
      }

      // 🟡🟡🟡 - [FORMAT] Format amounts for display
      const formatAmount = (amount: any): string => {
        if (!amount) return '0.00';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
        return numAmount.toFixed(2);
      };

      // 🟡🟡🟡 - [PARSE] Parse JSON fields
      const locationData = order.location && typeof order.location === 'object' ? order.location as any : null;
      const eventDetails = order.eventDetails && typeof order.eventDetails === 'object' ? order.eventDetails : null;
      const eventSetup = order.eventSetup && typeof order.eventSetup === 'object' ? order.eventSetup as any : null;

      // 🟡🟡🟡 - [CALCULATION] Calculate subtotal and surcharge for display
      const subtotal = eventSetup?.calculator?.totals?.subtotal || 
                       eventSetup?.calculator?.totals?.total || 
                       0;
      const surchargeStr = locationData?.components?.surcharge || 
                           locationData?.surcharge || 
                           '0';
      const surcharge = typeof surchargeStr === 'string' ? parseFloat(surchargeStr) : 
                        (typeof surchargeStr === 'number' ? surchargeStr : 0);
      const total = order.totalAmount ? Number(order.totalAmount) : (subtotal + surcharge);

      // 🟡🟡🟡 - [FORMAT DATES] Format dates for display
      const formatDateForDisplay = (date: Date | null | undefined): Date | null => {
        return date ? new Date(date) : null;
      };

      // 🟡🟡🟡 - [RENDER] Render final confirmation page template
      return reply.view(templatePath, {
        theme,
        page_class,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          firstName: order.firstName,
          lastName: order.lastName,
          phone: order.phone,
          email: order.email,
          totalAmount: total,
          totalAmountFormatted: formatAmount(total),
          subtotal: subtotal,
          subtotalFormatted: formatAmount(subtotal),
          surcharge: surcharge,
          surchargeFormatted: formatAmount(surcharge),
          status: order.status,
          paymentStatus: paymentDetails?.status || order.paymentStatus || 'unknown',
          paidAt: formatDateForDisplay(paymentDetails?.paidAt || order.paidAt),
          createdAt: formatDateForDisplay(order.createdAt),
        },
        locationData,
        eventDetails,
        eventSetup,
        paymentDetails,
        currency: process.env.DEFAULT_CURRENCY || 'AED',
      });
    } catch (error) {
      console.error('❗❗❗ - [ROUTE] Error rendering final confirmation:', error);
      console.error('❗❗❗ - [ROUTE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❗❗❗ - [ROUTE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        sessionId: request.session?.sessionId?.substring(0, 8)
      });
      return reply.status(500).send(`Failed to render final confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
