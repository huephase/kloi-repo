// 2025-12-29T00:00:00Z 🟡🟡🟡 - [EMAIL SERVICE] Email service for sending emails via SendGrid
import { sgMail, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME, ADMIN_CC_EMAIL } from '../config/sendgrid';
import { prisma } from '../lib/prisma';
import { EmailLogService } from './emailLogService';

// 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Core email sending function with CC support
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string,
  cc?: string | string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('🟡🟡🟡 - [EMAIL SERVICE] Sending email to:', to);
  
  try {
    // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Build CC list - always include ADMIN_CC_EMAIL if configured
    const ccList: string[] = [];
    
    // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Add explicit CC addresses if provided
    if (cc) {
      if (Array.isArray(cc)) {
        ccList.push(...cc);
      } else {
        ccList.push(cc);
      }
    }
    
    // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Always add ADMIN_CC_EMAIL if configured (avoid duplicates)
    if (ADMIN_CC_EMAIL && !ccList.includes(ADMIN_CC_EMAIL)) {
      ccList.push(ADMIN_CC_EMAIL);
      console.log('🟡🟡🟡 - [EMAIL SERVICE] Adding ADMIN_CC_EMAIL to CC list:', ADMIN_CC_EMAIL);
    }
    
    const msg: any = {
      to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME
      },
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text fallback
      html: htmlContent
    };
    
    // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Add CC field only if there are CC recipients
    if (ccList.length > 0) {
      msg.cc = ccList.length === 1 ? ccList[0] : ccList;
      console.log('🟡🟡🟡 - [EMAIL SERVICE] Email will be CCed to:', ccList);
    }

    const response = await sgMail.send(msg);
    console.log('✅✅✅ - [EMAIL SERVICE] Email sent successfully to:', to);
    if (ccList.length > 0) {
      console.log('✅✅✅ - [EMAIL SERVICE] Email CCed to:', ccList);
    }
    
    // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL SERVICE] Extract messageId from SendGrid response
    // SendGrid returns messageId in response headers as 'x-message-id'
    const messageId = response[0]?.headers?.['x-message-id'] as string | undefined;
    if (messageId) {
      console.log('🟡🟡🟡 - [EMAIL SERVICE] Email messageId captured:', messageId);
    } else {
      console.warn('⚠️⚠️⚠️ - [EMAIL SERVICE] MessageId not found in SendGrid response headers');
      console.log('🟡🟡🟡 - [EMAIL SERVICE] Response headers:', JSON.stringify(response[0]?.headers || {}, null, 2));
    }
    
    return {
      success: true,
      messageId: messageId
    };
  } catch (error: any) {
    // 2026-01-17T01:30:00Z 🟡🟡🟡 - [EMAIL SERVICE] Enhanced error logging for SendGrid authentication issues
    console.error('❗❗❗ - [EMAIL SERVICE] Error sending email:', error);
    
    // 2026-01-17T01:30:00Z 🟡🟡🟡 - [EMAIL SERVICE] Check for authentication errors (401 Unauthorized)
    if (error.code === 401 || error.response?.statusCode === 401) {
      console.error('❌❌❌ - [EMAIL SERVICE] SendGrid authentication failed (401 Unauthorized)');
      console.error('❌❌❌ - [EMAIL SERVICE] This usually means:');
      console.error('❌❌❌ - [EMAIL SERVICE]   1. SENDGRID_API_KEY is missing or incorrect');
      console.error('❌❌❌ - [EMAIL SERVICE]   2. API key format is invalid (should start with "SG.")');
      console.error('❌❌❌ - [EMAIL SERVICE]   3. API key has been revoked or expired');
      console.error('❌❌❌ - [EMAIL SERVICE]   4. API key does not have "Mail Send" permissions');
      console.error('❌❌❌ - [EMAIL SERVICE] Please check your SendGrid API key configuration');
      
      // 2026-01-17T01:30:00Z 🟡🟡🟡 - [EMAIL SERVICE] Log API key status (without exposing the key)
      const apiKey = process.env.SENDGRID_API_KEY;
      if (apiKey) {
        console.error('🟡🟡🟡 - [EMAIL SERVICE] API key is set (length:', apiKey.length, 'chars, starts with:', apiKey.substring(0, 3) + '...)');
      } else {
        console.error('❌❌❌ - [EMAIL SERVICE] API key is NOT set in environment variables');
      }
      
      return {
        success: false,
        error: 'SendGrid authentication failed. Please check SENDGRID_API_KEY configuration.'
      };
    }
    
    // 2026-01-17T01:30:00Z 🟡🟡🟡 - [EMAIL SERVICE] Log other SendGrid errors with details
    if (error.response?.body?.errors) {
      console.error('❗❗❗ - [EMAIL SERVICE] SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

// 🟡🟡🟡 - [EMAIL SERVICE] Send invitation email to new admin
export async function sendInvitationEmail(
  email: string,
  invitationLink: string,
  inviterName?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🟡🟡🟡 - [EMAIL SERVICE] Sending invitation email to:', email);
  
  const inviterText = inviterName ? ` by ${inviterName}` : '';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Admin Invitation</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have been invited${inviterText} to become an admin for the KLOI platform.</p>
          <p>Click the button below to complete your sign-up:</p>
          <div style="text-align: center;">
            <a href="${invitationLink}" class="button">Accept Invitation</a>
          </div>
          <div class="warning">
            <strong>Note:</strong> This invitation link will expire in 7 days. Please complete your sign-up before then.
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${invitationLink}</p>
          <p>If you did not expect this invitation, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from KLOI Admin System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Admin Invitation

Hello,

You have been invited${inviterText} to become an admin for the KLOI platform.

Click the link below to complete your sign-up:
${invitationLink}

Note: This invitation link will expire in 7 days. Please complete your sign-up before then.

If you did not expect this invitation, please ignore this email.

This is an automated message from KLOI Admin System.
  `;

  return await sendEmail(
    email,
    'Admin Invitation - KLOI Platform',
    htmlContent,
    textContent
  );
}

// 🟡🟡🟡 - [EMAIL SERVICE] Send email verification email
export async function sendEmailVerificationEmail(
  email: string,
  verificationLink: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🟡🟡🟡 - [EMAIL SERVICE] Sending email verification to:', email);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for signing up as an admin. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email</a>
          </div>
          <div class="warning">
            <strong>Note:</strong> This verification link will expire in 7 days. Please verify your email before then.
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationLink}</p>
          <p>If you did not sign up for an admin account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from KLOI Admin System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Verify Your Email

Hello,

Thank you for signing up as an admin. Please verify your email address by clicking the link below:
${verificationLink}

Note: This verification link will expire in 7 days. Please verify your email before then.

If you did not sign up for an admin account, please ignore this email.

This is an automated message from KLOI Admin System.
  `;

  return await sendEmail(
    email,
    'Verify Your Email - KLOI Admin',
    htmlContent,
    textContent
  );
}

// 🟡🟡🟡 - [EMAIL SERVICE] Send approval notification email to backend team
export async function sendApprovalNotificationEmail(
  backendTeamEmail: string,
  adminEmail: string,
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🟡🟡🟡 - [EMAIL SERVICE] Sending approval notification to backend team');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .info-box { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 12px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Admin Approval Required</h1>
        </div>
        <div class="content">
          <p>Hello Backend Team,</p>
          <p>A new admin has completed email verification and is awaiting approval:</p>
          <div class="info-box">
            <p><strong>Name:</strong> ${adminName}</p>
            <p><strong>Email:</strong> ${adminEmail}</p>
            <p><strong>Status:</strong> Email Verified - Awaiting Approval</p>
          </div>
          <p>Please review and approve this admin account in the database, then assign an appropriate role (SUPER_ADMIN, EDITOR, or READ_ONLY).</p>
          <p>After approval and role assignment, the admin account will be activated and the user will be notified.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from KLOI Admin System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Admin Approval Required

Hello Backend Team,

A new admin has completed email verification and is awaiting approval:

Name: ${adminName}
Email: ${adminEmail}
Status: Email Verified - Awaiting Approval

Please review and approve this admin account in the database, then assign an appropriate role (SUPER_ADMIN, EDITOR, or READ_ONLY).

After approval and role assignment, the admin account will be activated and the user will be notified.

This is an automated message from KLOI Admin System.
  `;

  return await sendEmail(
    backendTeamEmail,
    `Admin Approval Required: ${adminName}`,
    htmlContent,
    textContent
  );
}

// 🟡🟡🟡 - [EMAIL SERVICE] Send account activated email to admin
export async function sendAccountActivatedEmail(
  email: string,
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🟡🟡🟡 - [EMAIL SERVICE] Sending account activated email to:', email);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; }
        .success-box { background-color: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Activated</h1>
        </div>
        <div class="content">
          <p>Hello ${adminName},</p>
          <div class="success-box">
            <p><strong>Your admin account has been approved and activated!</strong></p>
          </div>
          <p>You can now log in to the admin panel using your credentials.</p>
          <p>If you have any questions or need assistance, please contact the backend team.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from KLOI Admin System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Account Activated

Hello ${adminName},

Your admin account has been approved and activated!

You can now log in to the admin panel using your credentials.

If you have any questions or need assistance, please contact the backend team.

This is an automated message from KLOI Admin System.
  `;

  return await sendEmail(
    email,
    'Your Admin Account Has Been Activated - KLOI',
    htmlContent,
    textContent
  );
}

// 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Send order confirmation email to customer
export async function sendOrderConfirmationEmail(
  order: {
    orderNumber: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    totalAmount: any;
    paidAt: Date | null;
    createdAt: Date;
    location: any;
    eventDetails: any;
    eventSetup: any;
  },
  currency: string = 'AED'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('🟡🟡🟡 - [EMAIL SERVICE] Sending order confirmation email for order:', order.orderNumber);
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Validate customer email exists
  if (!order.email) {
    console.warn('⚠️⚠️⚠️ - [EMAIL SERVICE] Cannot send order confirmation - customer email is missing for order:', order.orderNumber);
    
    // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL TRACKING] Log failed attempt to email_logs
    try {
      // Fetch order ID by orderNumber for logging
      const orderRecord = await prisma.kloiOrdersTable.findUnique({
        where: { orderNumber: order.orderNumber },
        select: { id: true }
      });
      
      if (orderRecord) {
        await EmailLogService.logEmailAttempt(
          orderRecord.id,
          order.email || 'unknown',
          null,
          'failed',
          'Customer email is required to send confirmation email'
        );
      }
    } catch (logError) {
      console.error('❗❗❗ - [EMAIL SERVICE] Error logging failed email attempt:', logError);
    }
    
    return {
      success: false,
      error: 'Customer email is required to send confirmation email'
    };
  }
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Parse JSON fields
  const locationData = order.location && typeof order.location === 'object' ? order.location as any : null;
  const eventDetails = order.eventDetails && typeof order.eventDetails === 'object' ? order.eventDetails : null;
  const eventSetup = order.eventSetup && typeof order.eventSetup === 'object' ? order.eventSetup as any : null;
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Format amounts for display
  const formatAmount = (amount: any): string => {
    if (!amount) return '0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return numAmount.toFixed(2);
  };
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Calculate pricing breakdown
  const subtotal = eventSetup?.calculator?.totals?.subtotal || 
                   eventSetup?.calculator?.totals?.total || 
                   0;
  const surchargeStr = locationData?.components?.surcharge || 
                       locationData?.surcharge || 
                       '0';
  const surcharge = typeof surchargeStr === 'string' ? parseFloat(surchargeStr) : 
                    (typeof surchargeStr === 'number' ? surchargeStr : 0);
  const total = order.totalAmount ? Number(order.totalAmount) : (subtotal + surcharge);
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Format dates for display
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Format event dates
  const formatEventDates = (): string => {
    if (!eventSetup?.dates || !Array.isArray(eventSetup.dates) || eventSetup.dates.length === 0) {
      return 'N/A';
    }
    try {
      if (eventSetup.dates.length === 1) {
        const date = new Date(eventSetup.dates[0]);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        const startDate = new Date(eventSetup.dates[0]);
        const endDate = new Date(eventSetup.dates[eventSetup.dates.length - 1]);
        return `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      }
    } catch {
      return 'N/A';
    }
  };
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Format event times
  const formatEventTimes = (): string => {
    if (!eventSetup?.startTime || !eventSetup?.endTime) {
      return 'N/A';
    }
    return `${eventSetup.startTime} - ${eventSetup.endTime}`;
  };
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Build location address string
  const buildLocationAddress = (): string => {
    if (!locationData) return 'N/A';
    const parts: string[] = [];
    if (locationData.fullAddress) {
      parts.push(locationData.fullAddress);
    } else {
      if (locationData.components?.street_number) parts.push(locationData.components.street_number);
      if (locationData.components?.route) parts.push(locationData.components.route);
      if (locationData.components?.sublocality) parts.push(locationData.components.sublocality);
      if (locationData.components?.city) parts.push(locationData.components.city);
      if (locationData.components?.country) parts.push(locationData.components.country);
    }
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Build event details address
  const buildEventDetailsAddress = (): string => {
    if (!eventDetails) return '';
    const parts: string[] = [];
    if (eventDetails.buildingName) parts.push(eventDetails.buildingName);
    if (eventDetails.houseNumber) parts.push(`House ${eventDetails.houseNumber}`);
    if (eventDetails.floorNumber) parts.push(`Floor ${eventDetails.floorNumber}`);
    if (eventDetails.unitNumber) parts.push(`Unit ${eventDetails.unitNumber}`);
    if (eventDetails.street) parts.push(eventDetails.street);
    return parts.length > 0 ? parts.join(', ') : '';
  };
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Build menu breakdown summary
  const buildMenuBreakdown = (): string => {
    if (!eventSetup?.calculator?.breakdown || !Array.isArray(eventSetup.calculator.breakdown)) {
      return '<p>Menu details not available.</p>';
    }
    let html = '<ul style="list-style: none; padding: 0;">';
    eventSetup.calculator.breakdown.forEach((item: any) => {
      if (item.label && item.total) {
        html += `<li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="float: left;">${item.label}</span>
          <span style="float: right; font-weight: bold;">${currency} ${formatAmount(item.total)}</span>
          <div style="clear: both;"></div>
        </li>`;
      }
    });
    html += '</ul>';
    return html;
  };
  
  const customerName = `${order.firstName} ${order.lastName}`;
  const orderDate = formatDate(order.createdAt);
  const paidDate = formatDate(order.paidAt);
  const eventDates = formatEventDates();
  const eventTimes = formatEventTimes();
  const locationAddress = buildLocationAddress();
  const eventAddress = buildEventDetailsAddress();
  const menuBreakdown = buildMenuBreakdown();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .success-box { background-color: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; }
        .info-box { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 12px; margin: 20px 0; }
        .section { margin: 20px 0; padding: 15px; background-color: white; border-radius: 4px; }
        .section h3 { margin-top: 0; color: #4CAF50; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; display: inline-block; width: 150px; }
        .price-row { padding: 8px 0; }
        .price-total { font-size: 18px; font-weight: bold; color: #4CAF50; padding-top: 10px; border-top: 2px solid #4CAF50; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
          <p>Thank you for your order!</p>
        </div>
        <div class="content">
          <div class="success-box">
            <p><strong>Your order has been confirmed and payment has been processed successfully.</strong></p>
            <p>Order Number: <strong>#${order.orderNumber}</strong></p>
          </div>
          
          <div class="section">
            <h3>Customer Information</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span>${customerName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span>${order.phone}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span>${order.email}</span>
            </div>
          </div>
          
          <div class="section">
            <h3>Delivery Location</h3>
            <div class="detail-row">
              <span>${locationAddress}</span>
            </div>
            ${eventAddress ? `<div class="detail-row"><span><strong>Additional Details:</strong> ${eventAddress}</span></div>` : ''}
            ${eventDetails?.additionalDirections ? `<div class="detail-row"><span><strong>Directions:</strong> ${eventDetails.additionalDirections}</span></div>` : ''}
          </div>
          
          <div class="section">
            <h3>Event Details</h3>
            <div class="detail-row">
              <span class="detail-label">Event Dates:</span>
              <span>${eventDates}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Event Times:</span>
              <span>${eventTimes}</span>
            </div>
            ${eventDetails?.propertyType ? `<div class="detail-row"><span class="detail-label">Property Type:</span><span>${eventDetails.propertyType}</span></div>` : ''}
          </div>
          
          <div class="section">
            <h3>Order Summary</h3>
            ${menuBreakdown}
            <div class="price-row">
              <span style="float: left;">Subtotal:</span>
              <span style="float: right;">${currency} ${formatAmount(subtotal)}</span>
              <div style="clear: both;"></div>
            </div>
            ${surcharge > 0 ? `<div class="price-row">
              <span style="float: left;">Delivery Surcharge:</span>
              <span style="float: right;">${currency} ${formatAmount(surcharge)}</span>
              <div style="clear: both;"></div>
            </div>` : ''}
            <div class="price-row price-total">
              <span style="float: left;">Total Paid:</span>
              <span style="float: right;">${currency} ${formatAmount(total)}</span>
              <div style="clear: both;"></div>
            </div>
          </div>
          
          <div class="section">
            <h3>Payment Information</h3>
            <div class="detail-row">
              <span class="detail-label">Payment Status:</span>
              <span style="color: #4CAF50; font-weight: bold;">Confirmed</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Order Date:</span>
              <span>${orderDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span>${paidDate}</span>
            </div>
          </div>
          
          <div class="info-box">
            <p><strong>What's Next?</strong></p>
            <p>We've received your order and payment. Our team will contact you shortly to confirm the details and finalize your event arrangements.</p>
            <p>If you have any questions or need to make changes, please contact us with your order number: <strong>#${order.orderNumber}</strong></p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email from KLOI.</p>
          <p>Please keep this email for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // 2026-01-16T17:25:00Z 🟡🟡🟡 - [EMAIL SERVICE] Generate plain text version
  const textContent = `
Order Confirmation - Order #${order.orderNumber}

Thank you for your order! Your order has been confirmed and payment has been processed successfully.

CUSTOMER INFORMATION
Name: ${customerName}
Phone: ${order.phone}
Email: ${order.email}

DELIVERY LOCATION
${locationAddress}
${eventAddress ? `Additional Details: ${eventAddress}` : ''}
${eventDetails?.additionalDirections ? `Directions: ${eventDetails.additionalDirections}` : ''}

EVENT DETAILS
Event Dates: ${eventDates}
Event Times: ${eventTimes}
${eventDetails?.propertyType ? `Property Type: ${eventDetails.propertyType}` : ''}

ORDER SUMMARY
${eventSetup?.calculator?.breakdown && Array.isArray(eventSetup.calculator.breakdown) 
  ? eventSetup.calculator.breakdown.map((item: any) => 
      item.label && item.total ? `${item.label}: ${currency} ${formatAmount(item.total)}` : ''
    ).filter(Boolean).join('\n')
  : 'Menu details not available.'}

Subtotal: ${currency} ${formatAmount(subtotal)}
${surcharge > 0 ? `Delivery Surcharge: ${currency} ${formatAmount(surcharge)}` : ''}
Total Paid: ${currency} ${formatAmount(total)}

PAYMENT INFORMATION
Payment Status: Confirmed
Order Date: ${orderDate}
Payment Date: ${paidDate}

WHAT'S NEXT?
We've received your order and payment. Our team will contact you shortly to confirm the details and finalize your event arrangements.

If you have any questions or need to make changes, please contact us with your order number: #${order.orderNumber}

---
This is an automated confirmation email from KLOI.
Please keep this email for your records.
  `;
  
  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL SERVICE] Send email and capture messageId
  const emailResult = await sendEmail(
    order.email,
    `Order Confirmation - Order #${order.orderNumber}`,
    htmlContent,
    textContent
  );
  
  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL TRACKING] Fetch order ID for database updates
  let orderRecord = null;
  try {
    orderRecord = await prisma.kloiOrdersTable.findUnique({
      where: { orderNumber: order.orderNumber },
      select: { id: true }
    });
  } catch (dbError) {
    console.error('❗❗❗ - [EMAIL SERVICE] Error fetching order for tracking:', dbError);
  }
  
  // 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL TRACKING] Update order and log email attempt
  if (emailResult.success && emailResult.messageId) {
    try {
      // Update order with email tracking information
      if (orderRecord) {
        await prisma.kloiOrdersTable.update({
          where: { id: orderRecord.id },
          data: {
            emailSentAt: new Date(),
            emailMessageId: emailResult.messageId,
            emailStatus: 'sent'
          }
        });
        console.log('✅✅✅ - [EMAIL SERVICE] Order updated with email tracking info for order:', order.orderNumber);
      }
      
      // Log successful email attempt
      if (orderRecord) {
        await EmailLogService.logEmailAttempt(
          orderRecord.id,
          order.email,
          emailResult.messageId,
          'sent'
        );
        console.log('✅✅✅ - [EMAIL SERVICE] Email attempt logged successfully for order:', order.orderNumber);
      }
    } catch (trackingError) {
      // Don't fail the email send if tracking fails
      console.error('❗❗❗ - [EMAIL SERVICE] Error updating email tracking:', trackingError);
      console.error('❗❗❗ - [EMAIL SERVICE] Email was sent successfully but tracking failed for order:', order.orderNumber);
    }
  } else {
    // Log failed email attempt
    try {
      if (orderRecord) {
        await EmailLogService.logEmailAttempt(
          orderRecord.id,
          order.email,
          null,
          'failed',
          emailResult.error || 'Unknown error sending email'
        );
        
        // Update order with failed status
        await prisma.kloiOrdersTable.update({
          where: { id: orderRecord.id },
          data: {
            emailStatus: 'failed'
          }
        });
        console.log('🟡🟡🟡 - [EMAIL SERVICE] Failed email attempt logged for order:', order.orderNumber);
      }
    } catch (logError) {
      console.error('❗❗❗ - [EMAIL SERVICE] Error logging failed email attempt:', logError);
    }
  }
  
  return emailResult;
}
