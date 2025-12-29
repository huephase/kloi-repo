// 2025-12-29T00:00:00Z 🟡🟡🟡 - [EMAIL SERVICE] Email service for sending emails via SendGrid
import { sgMail, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME } from '../config/sendgrid';

// 🟡🟡🟡 - [EMAIL SERVICE] Core email sending function
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('🟡🟡🟡 - [EMAIL SERVICE] Sending email to:', to);
  
  try {
    const msg = {
      to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME
      },
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text fallback
      html: htmlContent
    };

    const response = await sgMail.send(msg);
    console.log('✅✅✅ - [EMAIL SERVICE] Email sent successfully to:', to);
    return {
      success: true,
      messageId: response[0]?.headers['x-message-id'] as string | undefined
    };
  } catch (error: any) {
    console.error('❗❗❗ - [EMAIL SERVICE] Error sending email:', error);
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
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
          <p style="word-break: break-all; color: #666;">${invitationLink}</p>
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
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
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .info-box { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 12px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
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
