// 2025-12-29T00:00:00Z 🟡🟡🟡 - [SENDGRID CONFIG] SendGrid email service configuration
import sgMail from '@sendgrid/mail';

// 🟡🟡🟡 - [SENDGRID CONFIG] Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@kloi.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'KLOI';
// 2026-01-16T17:25:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Admin CC email for all outgoing emails
const ADMIN_CC_EMAIL = process.env.ADMIN_CC_EMAIL;
// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Webhook secret for verifying SendGrid webhook signatures
const SENDGRID_WEBHOOK_SECRET = process.env.SENDGRID_WEBHOOK_SECRET;

// 2026-01-17T01:30:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Validate and initialize SendGrid API key
if (SENDGRID_API_KEY) {
  // 2026-01-17T01:30:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Validate API key format (should start with SG.)
  const apiKeyTrimmed = SENDGRID_API_KEY.trim();
  if (!apiKeyTrimmed.startsWith('SG.')) {
    console.error('❌❌❌ - [SENDGRID CONFIG] Invalid SendGrid API key format. API keys should start with "SG."');
    console.error('❌❌❌ - [SENDGRID CONFIG] Current key starts with:', apiKeyTrimmed.substring(0, 10) + '...');
    console.error('❌❌❌ - [SENDGRID CONFIG] Please check your SENDGRID_API_KEY environment variable');
  } else {
    sgMail.setApiKey(apiKeyTrimmed);
    console.log('✅✅✅ - [SENDGRID CONFIG] SendGrid initialized successfully');
    console.log('🟡🟡🟡 - [SENDGRID CONFIG] API key format validated (starts with SG.)');
  }
} else {
  console.error('❌❌❌ - [SENDGRID CONFIG] SENDGRID_API_KEY not found in environment variables');
  console.error('❌❌❌ - [SENDGRID CONFIG] Email sending will fail. Please set SENDGRID_API_KEY in your environment');
}

// 2026-01-16T17:25:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Warn if ADMIN_CC_EMAIL is not configured (optional but recommended)
if (!ADMIN_CC_EMAIL) {
  console.warn('⚠️⚠️⚠️ - [SENDGRID CONFIG] ADMIN_CC_EMAIL not found in environment variables - emails will not be CCed to admin');
}

// 2026-01-18T23:30:00Z 🟡🟡🟡 - [SENDGRID CONFIG] Validate and log webhook secret configuration
if (SENDGRID_WEBHOOK_SECRET) {
  const webhookSecretTrimmed = SENDGRID_WEBHOOK_SECRET.trim();
  if (webhookSecretTrimmed.length > 0) {
    console.log('✅✅✅ - [SENDGRID CONFIG] SendGrid webhook secret configured (length:', webhookSecretTrimmed.length, 'chars)');
  } else {
    console.warn('⚠️⚠️⚠️ - [SENDGRID CONFIG] SENDGRID_WEBHOOK_SECRET is empty - webhook signature verification will fail');
  }
} else {
  console.warn('⚠️⚠️⚠️ - [SENDGRID CONFIG] SENDGRID_WEBHOOK_SECRET not found in environment variables - webhook signature verification will fail');
  console.warn('⚠️⚠️⚠️ - [SENDGRID CONFIG] SendGrid webhooks will not be verified. Please set SENDGRID_WEBHOOK_SECRET in your environment');
}

export { sgMail, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME, ADMIN_CC_EMAIL, SENDGRID_WEBHOOK_SECRET };
