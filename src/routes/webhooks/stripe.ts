// src/routes/webhooks/stripe.ts
// 🟡🟡🟡 - [2025-01-XX] Stripe webhook handler with signature verification

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { paymentService } from '../../services/paymentService';
import { PaymentProcessorFactory } from '../../services/payment/PaymentProcessorFactory';

// 🟡🟡🟡 - [WEBHOOK] In-memory store for processed event IDs (idempotency)
// In production, use Redis or database for distributed systems
const processedEventIds = new Set<string>();

// 🟡🟡🟡 - [WEBHOOK] Cleanup old event IDs periodically (keep last 1000)
setInterval(() => {
  if (processedEventIds.size > 1000) {
    const idsArray = Array.from(processedEventIds);
    processedEventIds.clear();
    // Keep last 500
    idsArray.slice(-500).forEach(id => processedEventIds.add(id));
    console.log('🟡🟡🟡 - [WEBHOOK] Cleaned up processed event IDs, kept last 500');
  }
}, 3600000); // Every hour

export default async function stripeWebhookRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // 🟡🟡🟡 - [WEBHOOK] Configure content type parser to preserve raw body for signature verification
  // Stripe requires raw body (not parsed JSON) for signature verification
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    // Store raw body for signature verification
    (req as any).rawBody = body;
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // 🟡🟡🟡 - [WEBHOOK] Stripe webhook endpoint (no session validation needed)
  app.post('/webhooks/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [WEBHOOK] Received Stripe webhook request');

    try {
      // 🟡🟡🟡 - [WEBHOOK] Get raw body for signature verification
      // The raw body should be stored by the content type parser above
      const rawBody = (request as any).rawBody || JSON.stringify(request.body);
      const signature = request.headers['stripe-signature'] as string;

      if (!signature) {
        console.error('❗❗❗ - [WEBHOOK] Missing Stripe signature header');
        return reply.status(400).send({
          success: false,
          message: 'Missing Stripe signature'
        });
      }

      if (!rawBody) {
        console.error('❗❗❗ - [WEBHOOK] Missing request body');
        return reply.status(400).send({
          success: false,
          message: 'Missing request body'
        });
      }

      // 🟡🟡🟡 - [WEBHOOK] Get payment processor for webhook handling
      const processor = PaymentProcessorFactory.create();

      // 🟡🟡🟡 - [WEBHOOK] Verify and parse webhook event
      const verificationResult = await processor.handleWebhook(
        typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
        signature
      );

      if (!verificationResult.valid || !verificationResult.event) {
        console.error('❗❗❗ - [WEBHOOK] Webhook verification failed:', verificationResult.error);
        return reply.status(400).send({
          success: false,
          message: verificationResult.error || 'Webhook verification failed'
        });
      }

      const event = verificationResult.event;
      console.log('✅✅✅ - [WEBHOOK] Webhook verified:', event.type, event.id);

      // 🟡🟡🟡 - [WEBHOOK] Check idempotency (prevent duplicate processing)
      if (processedEventIds.has(event.id)) {
        console.log('🟡🟡🟡 - [WEBHOOK] Event already processed (idempotency check):', event.id);
        return reply.send({
          success: true,
          message: 'Event already processed',
          eventId: event.id
        });
      }

      // 🟡🟡🟡 - [WEBHOOK] Process webhook event
      const processed = await paymentService.processWebhook(event);

      if (processed) {
        // 🟡🟡🟡 - [WEBHOOK] Mark event as processed
        processedEventIds.add(event.id);
        console.log('✅✅✅ - [WEBHOOK] Webhook processed successfully:', event.type);
      } else {
        console.warn('⚠️⚠️⚠️ - [WEBHOOK] Webhook processing returned false:', event.type);
      }

      // 🟡🟡🟡 - [WEBHOOK] Always return 200 to Stripe (even if processing failed)
      // This prevents Stripe from retrying the webhook
      return reply.send({
        success: true,
        message: 'Webhook received',
        eventId: event.id,
        eventType: event.type
      });
    } catch (error) {
      console.error('❗❗❗ - [WEBHOOK] Error processing webhook:', error);
      console.error('❗❗❗ - [WEBHOOK] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // 🟡🟡🟡 - [WEBHOOK] Return 200 to prevent Stripe retries for unexpected errors
      // Log the error for manual investigation
      return reply.status(200).send({
        success: false,
        message: 'Webhook received but processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
