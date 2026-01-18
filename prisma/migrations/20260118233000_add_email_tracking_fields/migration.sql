-- 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL TRACKING] Add email tracking fields to kloiOrdersTable
-- These fields support email tracking for order confirmation emails via SendGrid

-- ✅✅✅ [2026-01-18] Add emailSentAt field - timestamp when email was sent
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMPTZ(6);

-- ✅✅✅ [2026-01-18] Add emailMessageId field - stores SendGrid message ID for tracking
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "emailMessageId" VARCHAR(255);

-- ✅✅✅ [2026-01-18] Add emailStatus field - tracks email status ('sent', 'failed', 'delivered', 'bounced', 'opened', 'clicked')
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "emailStatus" VARCHAR(50);
