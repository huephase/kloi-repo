// 2025-12-29T00:00:00Z 🟡🟡🟡 - [SENDGRID CONFIG] SendGrid email service configuration
import sgMail from '@sendgrid/mail';

// 🟡🟡🟡 - [SENDGRID CONFIG] Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@kloi.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'KLOI Admin';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅✅✅ - [SENDGRID CONFIG] SendGrid initialized successfully');
} else {
  console.warn('⚠️⚠️⚠️ - [SENDGRID CONFIG] SENDGRID_API_KEY not found in environment variables');
}

export { sgMail, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME };
