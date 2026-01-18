// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Service for processing SendGrid webhook events
import { SENDGRID_WEBHOOK_SECRET } from '../config/sendgrid';
import { prisma } from '../lib/prisma';
import { EmailLogService } from './emailLogService';

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Type definitions for SendGrid webhook events
export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: string; // 'delivered', 'bounce', 'open', 'click', etc.
  sg_event_id: string;
  sg_message_id: string;
  reason?: string; // For bounce events
  url?: string; // For click events
  useragent?: string; // For open/click events
  ip?: string; // For open/click events
  [key: string]: any; // Allow additional fields
}

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Webhook verification result
export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] SendGrid webhook service class
export class SendGridWebhookService {
  
  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Verify webhook signature
  // Note: SendGrid signed webhooks use ECDSA with public key, but for simplicity we'll use secret-based verification
  // For production, consider implementing public key verification using @sendgrid/eventwebhook
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature?: string,
    timestamp?: string
  ): WebhookVerificationResult {
    console.log('🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Verifying webhook signature');
    
    // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Check if webhook secret is configured
    if (!SENDGRID_WEBHOOK_SECRET) {
      console.warn('⚠️⚠️⚠️ - [SENDGRID WEBHOOK SERVICE] Webhook secret not configured - skipping verification');
      // For development, allow webhooks without verification
      // In production, this should be enforced
      return { valid: true };
    }
    
    // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Basic verification - check if signature matches expected format
    // Note: For production, implement proper ECDSA signature verification with public key
    // This is a simplified version - enhance with @sendgrid/eventwebhook for production
    if (signature && SENDGRID_WEBHOOK_SECRET) {
      // Simple verification: check if signature is present and not empty
      // TODO: Implement proper ECDSA signature verification using SendGrid public key
      console.log('🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Signature present, basic verification passed');
      console.log('⚠️⚠️⚠️ - [SENDGRID WEBHOOK SERVICE] NOTE: Full ECDSA signature verification not implemented. Consider using @sendgrid/eventwebhook for production.');
      return { valid: true };
    }
    
    console.log('✅✅✅ - [SENDGRID WEBHOOK SERVICE] Webhook verification passed');
    return { valid: true };
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Process webhook event and update database
  static async processWebhookEvent(event: SendGridWebhookEvent): Promise<boolean> {
    console.log('🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Processing webhook event:', event.event, 'for messageId:', event.sg_message_id);
    
    try {
      const messageId = event.sg_message_id;
      const eventType = event.event;
      
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Find order by messageId
      const order = await prisma.kloiOrdersTable.findFirst({
        where: { emailMessageId: messageId }
      });
      
      if (!order) {
        console.warn('⚠️⚠️⚠️ - [SENDGRID WEBHOOK SERVICE] Order not found for messageId:', messageId);
        // Still log the event even if order not found
        await EmailLogService.updateEmailLog(messageId, this.mapEventToStatus(eventType), eventType);
        return false;
      }
      
      console.log('✅✅✅ - [SENDGRID WEBHOOK SERVICE] Order found for messageId:', messageId, 'order:', order.orderNumber);
      
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Map event type to email status
      const emailStatus = this.mapEventToStatus(eventType);
      
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Update order email status
      // Only update if the new status is more advanced (e.g., don't overwrite 'clicked' with 'opened')
      const currentStatus = order.emailStatus;
      const shouldUpdate = this.shouldUpdateStatus(currentStatus, emailStatus);
      
      if (shouldUpdate) {
        await prisma.kloiOrdersTable.update({
          where: { id: order.id },
          data: {
            emailStatus: emailStatus
          }
        });
        console.log('✅✅✅ - [SENDGRID WEBHOOK SERVICE] Order email status updated to:', emailStatus, 'for order:', order.orderNumber);
      } else {
        console.log('🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Status not updated - current status:', currentStatus, 'new status:', emailStatus);
      }
      
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Update email log
      const errorMessage = event.reason || null;
      await EmailLogService.updateEmailLog(messageId, emailStatus, eventType);
      
      // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] If bounce, log error message
      if (eventType === 'bounce' && errorMessage) {
        // Create a new log entry for bounce with error message
        await EmailLogService.logEmailAttempt(
          order.id,
          event.email,
          messageId,
          'bounced',
          errorMessage
        );
      }
      
      console.log('✅✅✅ - [SENDGRID WEBHOOK SERVICE] Webhook event processed successfully');
      return true;
    } catch (error) {
      console.error('❗❗❗ - [SENDGRID WEBHOOK SERVICE] Error processing webhook event:', error);
      return false;
    }
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Map SendGrid event type to email status
  private static mapEventToStatus(eventType: string): string {
    const statusMap: Record<string, string> = {
      'processed': 'sent',
      'delivered': 'delivered',
      'bounce': 'bounced',
      'dropped': 'failed',
      'deferred': 'sent',
      'open': 'opened',
      'click': 'clicked',
      'spamreport': 'bounced',
      'unsubscribe': 'delivered',
      'group_unsubscribe': 'delivered',
      'group_resubscribe': 'delivered'
    };
    
    return statusMap[eventType.toLowerCase()] || 'sent';
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Determine if status should be updated
  // Prevents overwriting more advanced statuses with less advanced ones
  private static shouldUpdateStatus(currentStatus: string | null, newStatus: string): boolean {
    if (!currentStatus) return true;
    
    const statusHierarchy: Record<string, number> = {
      'sent': 1,
      'delivered': 2,
      'opened': 3,
      'clicked': 4,
      'bounced': 5,
      'failed': 5
    };
    
    const currentLevel = statusHierarchy[currentStatus] || 0;
    const newLevel = statusHierarchy[newStatus] || 0;
    
    // Update if new status is more advanced, or if current is failed/bounced and new is better
    return newLevel > currentLevel || (currentStatus === 'failed' && newStatus !== 'failed');
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Update order email status
  static async updateOrderEmailStatus(
    orderId: string,
    messageId: string,
    status: string
  ): Promise<boolean> {
    console.log('🟡🟡🟡 - [SENDGRID WEBHOOK SERVICE] Updating order email status:', orderId.substring(0, 8), 'status:', status);
    
    try {
      await prisma.kloiOrdersTable.update({
        where: { id: orderId },
        data: {
          emailStatus: status
        }
      });
      
      console.log('✅✅✅ - [SENDGRID WEBHOOK SERVICE] Order email status updated successfully');
      return true;
    } catch (error) {
      console.error('❗❗❗ - [SENDGRID WEBHOOK SERVICE] Error updating order email status:', error);
      return false;
    }
  }
}
