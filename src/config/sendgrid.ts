// 2025-12-29T00:00:00Z 🟡🟡🟡 - [SENDGRID CONFIG] SendGrid email service configuration
import sgMail from '@sendgrid/mail';

// 🟡🟡🟡 - [SENDGRID CONFIG] Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@kloi.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'KLOI Admin';
// 2026-01-16T17:25:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Admin CC email for all outgoing emails
const ADMIN_CC_EMAIL = process.env.ADMIN_CC_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅✅✅ - [SENDGRID CONFIG] SendGrid initialized successfully');
} else {
  console.warn('⚠️⚠️⚠️ - [SENDGRID CONFIG] SENDGRID_API_KEY not found in environment variables');
}

// 2026-01-16T17:25:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Warn if ADMIN_CC_EMAIL is not configured (optional but recommended)
if (!ADMIN_CC_EMAIL) {
  console.warn('⚠️⚠️⚠️ - [SENDGRID CONFIG] ADMIN_CC_EMAIL not found in environment variables - emails will not be CCed to admin');
}

export { sgMail, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME, ADMIN_CC_EMAIL };
