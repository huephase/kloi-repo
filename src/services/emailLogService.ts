// 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Centralized service for email logging
import { prisma } from '../lib/prisma';

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Type definition for EmailLog (matches Prisma model)
export interface EmailLog {
  id: string;
  orderId: string | null;
  recipient: string;
  messageId: string | null;
  status: string;
  errorMessage: string | null;
  eventType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Email log service class for centralized email logging
export class EmailLogService {
  
  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Log email attempt
  static async logEmailAttempt(
    orderId: string | null,
    recipient: string,
    messageId: string | null,
    status: string,
    errorMessage?: string | null
  ): Promise<EmailLog> {
    console.log('🟡🟡🟡 - [EMAIL LOG SERVICE] Logging email attempt for order:', orderId?.substring(0, 8) || 'N/A', 'recipient:', recipient, 'status:', status);
    
    try {
      const emailLog = await prisma.emailLogs.create({
        data: {
          orderId: orderId || null,
          recipient,
          messageId: messageId || null,
          status,
          errorMessage: errorMessage || null,
          eventType: null // Initial log entry, webhook events will update this
        }
      });

      console.log('✅✅✅ - [EMAIL LOG SERVICE] Email attempt logged successfully:', emailLog.id.substring(0, 8));
      return emailLog as EmailLog;
    } catch (error) {
      console.error('❗❗❗ - [EMAIL LOG SERVICE] Error logging email attempt:', error);
      throw error;
    }
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Update email log from webhook event
  static async updateEmailLog(
    messageId: string,
    status: string,
    eventType?: string | null
  ): Promise<EmailLog | null> {
    console.log('🟡🟡🟡 - [EMAIL LOG SERVICE] Updating email log for messageId:', messageId, 'status:', status, 'eventType:', eventType);
    
    try {
      // Find existing log by messageId
      const existingLog = await prisma.emailLogs.findFirst({
        where: { messageId }
      });

      if (!existingLog) {
        console.warn('⚠️⚠️⚠️ - [EMAIL LOG SERVICE] Email log not found for messageId:', messageId);
        return null;
      }

      // Update the log
      const updatedLog = await prisma.emailLogs.update({
        where: { id: existingLog.id },
        data: {
          status,
          eventType: eventType || null,
          updatedAt: new Date()
        }
      });

      console.log('✅✅✅ - [EMAIL LOG SERVICE] Email log updated successfully:', updatedLog.id.substring(0, 8));
      return updatedLog as EmailLog;
    } catch (error) {
      console.error('❗❗❗ - [EMAIL LOG SERVICE] Error updating email log:', error);
      return null;
    }
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Get all email logs for an order
  static async getEmailLogsByOrder(orderId: string): Promise<EmailLog[]> {
    console.log('🟡🟡🟡 - [EMAIL LOG SERVICE] Getting email logs for order:', orderId.substring(0, 8));
    
    try {
      const logs = await prisma.emailLogs.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      });

      console.log('✅✅✅ - [EMAIL LOG SERVICE] Found', logs.length, 'email logs for order:', orderId.substring(0, 8));
      return logs as EmailLog[];
    } catch (error) {
      console.error('❗❗❗ - [EMAIL LOG SERVICE] Error getting email logs by order:', error);
      return [];
    }
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Get email logs by SendGrid message ID
  static async getEmailLogsByMessageId(messageId: string): Promise<EmailLog[]> {
    console.log('🟡🟡🟡 - [EMAIL LOG SERVICE] Getting email logs for messageId:', messageId);
    
    try {
      const logs = await prisma.emailLogs.findMany({
        where: { messageId },
        orderBy: { createdAt: 'desc' }
      });

      console.log('✅✅✅ - [EMAIL LOG SERVICE] Found', logs.length, 'email logs for messageId:', messageId);
      return logs as EmailLog[];
    } catch (error) {
      console.error('❗❗❗ - [EMAIL LOG SERVICE] Error getting email logs by messageId:', error);
      return [];
    }
  }

  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOG SERVICE] Get email log by ID
  static async getEmailLogById(id: string): Promise<EmailLog | null> {
    console.log('🟡🟡🟡 - [EMAIL LOG SERVICE] Getting email log by ID:', id.substring(0, 8));
    
    try {
      const log = await prisma.emailLogs.findUnique({
        where: { id }
      });

      if (!log) {
        console.warn('⚠️⚠️⚠️ - [EMAIL LOG SERVICE] Email log not found:', id.substring(0, 8));
        return null;
      }

      console.log('✅✅✅ - [EMAIL LOG SERVICE] Email log found:', id.substring(0, 8));
      return log as EmailLog;
    } catch (error) {
      console.error('❗❗❗ - [EMAIL LOG SERVICE] Error getting email log by ID:', error);
      return null;
    }
  }
}
