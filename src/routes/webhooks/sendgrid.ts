// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] SendGrid webhook handler with signature verification
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { SendGridWebhookService, SendGridWebhookEvent } from '../../services/sendgridWebhookService';

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] In-memory store for processed event IDs (idempotency)
// In production, use Redis or database for distributed systems
const processedEventIds = new Set<string>();

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Cleanup old event IDs periodically (keep last 1000)
setInterval(() => {
  if (processedEventIds.size > 1000) {
    const idsArray = Array.from(processedEventIds);
    processedEventIds.clear();
    // Keep last 500
    idsArray.slice(-500).forEach(id => processedEventIds.add(id));
    console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Cleaned up processed event IDs, kept last 500');
  }
}, 3600000); // Every hour

export default async function sendgridWebhookRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Log webhook endpoint registration
  console.log('✅✅✅ - [SENDGRID WEBHOOK] SendGrid webhook endpoint registered at: POST /webhooks/sendgrid');
  console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Webhook secret configured:', process.env.SENDGRID_WEBHOOK_SECRET ? 'Yes' : 'No (webhook verification will be skipped)');
  console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Configure webhook in SendGrid Dashboard to point to: https://your-domain.com/webhooks/sendgrid');
  
  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Configure content type parser to preserve raw body for signature verification
  // SendGrid requires raw body (not parsed JSON) for signature verification
  // IMPORTANT: This must be registered BEFORE Fastify's default JSON parser
  // We use parseAs: 'buffer' to get the exact raw bytes, then convert to string
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Store raw body as Buffer and string for signature verification
    // SendGrid needs the exact raw body string (with original formatting) for signature verification
    const rawBodyString = body.toString('utf8');
    (req as any).rawBody = rawBodyString; // Store as string
    (req as any).rawBodyBuffer = body; // Store as Buffer as backup
    
    try {
      // Parse JSON for Fastify's request.body (for convenience)
      const json = JSON.parse(rawBodyString);
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] SendGrid webhook endpoint (no session validation needed)
  app.post('/webhooks/sendgrid', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Received SendGrid webhook request');
    console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Request headers:', {
      'x-twilio-email-event-webhook-signature': request.headers['x-twilio-email-event-webhook-signature'] ? 'present' : 'missing',
      'x-twilio-email-event-webhook-timestamp': request.headers['x-twilio-email-event-webhook-timestamp'] ? 'present' : 'missing',
      'content-type': request.headers['content-type'],
      'user-agent': request.headers['user-agent'],
      'host': request.headers['host']
    });

    try {
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Get raw body for signature verification
      const rawBody = (request as any).rawBody;
      const signature = request.headers['x-twilio-email-event-webhook-signature'] as string;
      const timestamp = request.headers['x-twilio-email-event-webhook-timestamp'] as string;
      
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Log raw body length for debugging
      if (rawBody) {
        console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Raw body length:', rawBody.length, 'bytes');
      } else {
        console.error('❗❗❗ - [SENDGRID WEBHOOK] Raw body not found');
      }

      if (!rawBody) {
        console.error('❗❗❗ - [SENDGRID WEBHOOK] Missing request body');
        return reply.status(400).send({
          success: false,
          message: 'Missing request body'
        });
      }

      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Verify webhook signature
      const rawBodyString = typeof rawBody === 'string' ? rawBody : (rawBody ? rawBody.toString('utf8') : '');
      
      if (!rawBodyString) {
        console.error('❗❗❗ - [SENDGRID WEBHOOK] Cannot verify webhook - raw body is empty');
        return reply.status(400).send({
          success: false,
          message: 'Missing request body'
        });
      }
      
      const verificationResult = SendGridWebhookService.verifyWebhookSignature(
        rawBodyString,
        signature,
        timestamp
      );

      if (!verificationResult.valid) {
        console.error('❗❗❗ - [SENDGRID WEBHOOK] Webhook verification failed:', verificationResult.error);
        return reply.status(400).send({
          success: false,
          message: verificationResult.error || 'Webhook verification failed'
        });
      }

      console.log('✅✅✅ - [SENDGRID WEBHOOK] Webhook verified successfully');

      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Parse webhook events
      // SendGrid sends events as an array
      const events = Array.isArray(request.body) ? request.body as SendGridWebhookEvent[] : [request.body as SendGridWebhookEvent];
      
      if (!events || events.length === 0) {
        console.warn('⚠️⚠️⚠️ - [SENDGRID WEBHOOK] No events found in webhook payload');
        return reply.send({
          success: true,
          message: 'Webhook received but no events to process'
        });
      }

      console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Processing', events.length, 'webhook event(s)');

      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Process each event
      let processedCount = 0;
      let skippedCount = 0;

      for (const event of events) {
        // Check idempotency using sg_event_id
        const eventId = event.sg_event_id || `${event.sg_message_id}-${event.event}-${event.timestamp}`;
        
        if (processedEventIds.has(eventId)) {
          console.log('🟡🟡🟡 - [SENDGRID WEBHOOK] Event already processed (idempotency check):', eventId);
          skippedCount++;
          continue;
        }

        // Process the event
        const processed = await SendGridWebhookService.processWebhookEvent(event);

        if (processed) {
          processedEventIds.add(eventId);
          processedCount++;
          console.log('✅✅✅ - [SENDGRID WEBHOOK] Event processed successfully:', event.event, eventId);
        } else {
          console.warn('⚠️⚠️⚠️ - [SENDGRID WEBHOOK] Event processing returned false:', event.event, eventId);
        }
      }

      console.log('✅✅✅ - [SENDGRID WEBHOOK] Webhook processing complete. Processed:', processedCount, 'Skipped:', skippedCount);

      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Always return 200 to SendGrid (even if processing failed)
      // This prevents SendGrid from retrying the webhook
      return reply.send({
        success: true,
        message: 'Webhook received',
        processed: processedCount,
        skipped: skippedCount,
        total: events.length
      });
    } catch (error) {
      console.error('❗❗❗ - [SENDGRID WEBHOOK] Error processing webhook:', error);
      console.error('❗❗❗ - [SENDGRID WEBHOOK] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK] Return 200 to prevent SendGrid retries for unexpected errors
      // Log the error for manual investigation
      return reply.status(200).send({
        success: false,
        message: 'Webhook received but processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
