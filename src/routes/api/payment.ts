// src/routes/api/payment.ts
// 🟡🟡🟡 - [2025-01-XX] Payment API endpoints

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { paymentService } from '../../services/paymentService';
import { 
  createPaymentIntentSchema, 
  confirmPaymentSchema, 
  paymentStatusSchema,
  orderIdParamSchema 
} from '../../schemas/payment.schemas';
import { ZodError } from 'zod';
import { prisma } from '../../lib/prisma';

export default async function paymentRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // 🟡🟡🟡 - [PAYMENT API] Create payment intent endpoint
  app.post('/payment/create-intent', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [PAYMENT API] POST /api/payment/create-intent');

    try {
      // 🟡🟡🟡 - [VALIDATION] Validate request body
      const validationResult = createPaymentIntentSchema.safeParse(request.body);
      if (!validationResult.success) {
        console.error('❗❗❗ - [PAYMENT API] Validation failed:', validationResult.error);
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { orderId } = validationResult.data;

      // 🟡🟡🟡 - [SESSION] Get session data
      const sessionAny = (request.session as any) || {};
      const sessionId = request.session?.sessionId;

      if (!sessionId) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT API] No session ID found');
        return reply.status(401).send({
          success: false,
          message: 'Session not found. Please start from the beginning.'
        });
      }

      // 🟡🟡🟡 - [DATABASE] Verify order belongs to session
      const order = await prisma.kloiOrdersTable.findFirst({
        where: {
          id: orderId,
          sessionId: sessionId
        }
      });

      if (!order) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT API] Order not found or does not belong to session');
        return reply.status(404).send({
          success: false,
          message: 'Order not found or access denied'
        });
      }

      // 🟡🟡🟡 - [PAYMENT INTENT] Get session data for calculation
      const sessionData = {
        eventSetup: sessionAny.eventSetup,
        locationData: sessionAny.locationData,
        eventDetails: sessionAny.eventDetails,
      };

      if (!sessionData.eventSetup || !sessionData.locationData) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT API] Missing required session data');
        return reply.status(400).send({
          success: false,
          message: 'Missing required information. Please complete all wizard steps first.'
        });
      }

      // 🟡🟡🟡 - [PAYMENT INTENT] Create payment intent
      const result = await paymentService.createPaymentIntent(orderId, sessionData);

      console.log('✅✅✅ - [PAYMENT API] Payment intent created:', result.paymentIntentId);

      return reply.send({
        success: true,
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
      });
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT API] Error creating payment intent:', error);
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment intent'
      });
    }
  });

  // 🟡🟡🟡 - [PAYMENT API] Confirm payment endpoint
  app.post('/payment/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [PAYMENT API] POST /api/payment/confirm');

    try {
      // 🟡🟡🟡 - [VALIDATION] Validate request body
      const validationResult = confirmPaymentSchema.safeParse(request.body);
      if (!validationResult.success) {
        console.error('❗❗❗ - [PAYMENT API] Validation failed:', validationResult.error);
        return reply.status(400).send({
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { orderId, paymentMethodId } = validationResult.data;

      // 🟡🟡🟡 - [SESSION] Verify session
      const sessionId = request.session?.sessionId;
      if (!sessionId) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT API] No session ID found');
        return reply.status(401).send({
          success: false,
          message: 'Session not found. Please start from the beginning.'
        });
      }

      // 🟡🟡🟡 - [DATABASE] Verify order belongs to session
      const order = await prisma.kloiOrdersTable.findFirst({
        where: {
          id: orderId,
          sessionId: sessionId
        }
      });

      if (!order) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT API] Order not found or does not belong to session');
        return reply.status(404).send({
          success: false,
          message: 'Order not found or access denied'
        });
      }

      // 🟡🟡🟡 - [PAYMENT CONFIRM] Confirm payment
      const result = await paymentService.confirmPayment(orderId, paymentMethodId);

      console.log('🟡🟡🟡 - [PAYMENT API] Payment confirmation result:', {
        success: result.success,
        status: result.status
      });

      return reply.send({
        success: result.success,
        paymentIntentId: result.paymentIntentId,
        status: result.status,
        requiresAction: result.requiresAction,
        clientSecret: result.clientSecret,
        error: result.error,
      });
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT API] Error confirming payment:', error);
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm payment'
      });
    }
  });

  // 🟡🟡🟡 - [PAYMENT API] Get payment status endpoint
  app.get<{ Params: { orderId: string } }>('/payment/status/:orderId', async (request, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [PAYMENT API] GET /api/payment/status/:orderId');

    try {
      // 🟡🟡🟡 - [VALIDATION] Validate orderId parameter
      const validationResult = orderIdParamSchema.safeParse({ orderId: request.params.orderId });
      if (!validationResult.success) {
        console.error('❗❗❗ - [PAYMENT API] Validation failed:', validationResult.error);
        return reply.status(400).send({
          success: false,
          message: 'Invalid order ID'
        });
      }

      const { orderId } = validationResult.data;

      // 🟡🟡🟡 - [SESSION] Verify session (optional for status checks, but recommended)
      const sessionId = request.session?.sessionId;

      // 🟡🟡🟡 - [DATABASE] Get order
      const order = await prisma.kloiOrdersTable.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          sessionId: true,
          paymentStatus: true,
          paymentIntentId: true,
          status: true,
        }
      });

      if (!order) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT API] Order not found');
        return reply.status(404).send({
          success: false,
          message: 'Order not found'
        });
      }

      // 🟡🟡🟡 - [SECURITY] Verify order belongs to session if session exists
      if (sessionId && order.sessionId !== sessionId) {
        console.warn('⚠️⚠️⚠️ - [PAYMENT API] Order does not belong to session');
        return reply.status(403).send({
          success: false,
          message: 'Access denied'
        });
      }

      // 🟡🟡🟡 - [PAYMENT STATUS] Retrieve latest payment status from provider
      let paymentDetails = null;
      if (order.paymentIntentId) {
        try {
          paymentDetails = await paymentService.retrievePaymentStatus(orderId);
        } catch (error) {
          console.warn('⚠️⚠️⚠️ - [PAYMENT API] Could not retrieve payment status from provider:', error);
          // Return database status if provider retrieval fails
        }
      }

      return reply.send({
        success: true,
        orderId: order.id,
        paymentStatus: paymentDetails?.status || order.paymentStatus,
        orderStatus: order.status,
        paymentIntentId: order.paymentIntentId,
        paidAt: paymentDetails?.paidAt?.toISOString(),
      });
    } catch (error) {
      console.error('❗❗❗ - [PAYMENT API] Error retrieving payment status:', error);
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve payment status'
      });
    }
  });
}
