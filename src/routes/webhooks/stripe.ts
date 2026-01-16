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
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [WEBHOOK] Log webhook endpoint registration
  console.log('✅✅✅ - [WEBHOOK] Stripe webhook endpoint registered at: POST /webhooks/stripe');
  console.log('🟡🟡🟡 - [WEBHOOK] Webhook secret configured:', process.env.STRIPE_WEBHOOK_SECRET ? 'Yes' : 'No (webhook verification will fail)');
  console.log('🟡🟡🟡 - [WEBHOOK] Configure webhook in Stripe Dashboard to point to: https://your-domain.com/webhooks/stripe');
  
  // 2026-01-17T01:30:00Z 🟡🟡🟡 - [WEBHOOK] Configure content type parser to preserve raw body for signature verification
  // Stripe requires raw body (not parsed JSON) for signature verification
  // IMPORTANT: This must be registered BEFORE Fastify's default JSON parser
  // We use parseAs: 'buffer' to get the exact raw bytes, then convert to string for Stripe
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    // 2026-01-17T01:30:00Z 🟡🟡🟡 - [WEBHOOK] Store raw body as Buffer and string for signature verification
    // Stripe needs the exact raw body string (with original formatting) for signature verification
    const rawBodyString = body.toString('utf8');
    (req as any).rawBody = rawBodyString; // Store as string for Stripe
    (req as any).rawBodyBuffer = body; // Store as Buffer as backup
    
    try {
      // Parse JSON for Fastify's request.body (for convenience)
      const json = JSON.parse(rawBodyString);
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // 🟡🟡🟡 - [WEBHOOK] Stripe webhook endpoint (no session validation needed)
  app.post('/webhooks/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [WEBHOOK] Received Stripe webhook request');
    console.log('🟡🟡🟡 - [WEBHOOK] Request headers:', {
      'stripe-signature': request.headers['stripe-signature'] ? 'present' : 'missing',
      'content-type': request.headers['content-type'],
      'user-agent': request.headers['user-agent'],
      'host': request.headers['host']
    });

    try {
      // 2026-01-17T01:30:00Z 🟡🟡🟡 - [WEBHOOK] Get raw body for signature verification
      // CRITICAL: Must use the exact raw body string (not re-stringified JSON)
      // The raw body string preserves exact formatting (whitespace, newlines) required for signature verification
      const rawBody = (request as any).rawBody;
      const signature = request.headers['stripe-signature'] as string;
      
      // 2026-01-17T01:30:00Z 🟡🟡🟡 - [WEBHOOK] Log raw body length for debugging (not full body to avoid log spam)
      if (rawBody) {
        console.log('🟡🟡🟡 - [WEBHOOK] Raw body length:', rawBody.length, 'bytes');
      } else {
        console.error('❗❗❗ - [WEBHOOK] Raw body not found - signature verification will fail');
      }

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

      // 2026-01-17T01:30:00Z 🟡🟡🟡 - [WEBHOOK] Verify and parse webhook event
      // CRITICAL: Pass raw body as string directly (not re-stringified)
      // Stripe signature verification requires the exact raw body bytes as received
      const rawBodyString = typeof rawBody === 'string' ? rawBody : (rawBody ? rawBody.toString('utf8') : '');
      
      if (!rawBodyString) {
        console.error('❗❗❗ - [WEBHOOK] Cannot verify webhook - raw body is empty');
        return reply.status(400).send({
          success: false,
          message: 'Missing request body'
        });
      }
      
      const verificationResult = await processor.handleWebhook(
        rawBodyString,
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
