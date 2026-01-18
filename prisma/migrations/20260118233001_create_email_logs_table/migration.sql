-- 2026-01-18T23:30:00Z 🟡🟡🟡 - [EMAIL LOGS] Create EmailLogs table for tracking all email attempts
-- This table stores comprehensive email logs including webhook events

-- ✅✅✅ [2026-01-18] Create EmailLogs table
CREATE TABLE "EmailLogs" (
    "id" TEXT NOT NULL,
    "orderId" VARCHAR(255),
    "recipient" VARCHAR(255) NOT NULL,
    "messageId" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL,
    "errorMessage" TEXT,
    "eventType" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLogs_pkey" PRIMARY KEY ("id")
);

-- ✅✅✅ [2026-01-18] Create index on orderId for efficient queries
CREATE INDEX IF NOT EXISTS "email_logs_order_id_idx" ON "EmailLogs"("orderId");

-- ✅✅✅ [2026-01-18] Create index on messageId for efficient webhook lookups
CREATE INDEX IF NOT EXISTS "email_logs_message_id_idx" ON "EmailLogs"("messageId");

-- ✅✅✅ [2026-01-18] Create index on status for filtering by status
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "EmailLogs"("status");

-- ✅✅✅ [2026-01-18] Create index on createdAt for date range queries
CREATE INDEX IF NOT EXISTS "email_logs_created_at_idx" ON "EmailLogs"("createdAt");
