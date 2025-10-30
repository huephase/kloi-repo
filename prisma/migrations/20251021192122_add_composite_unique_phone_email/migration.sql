-- 🟡🟡🟡 - [COMPOSITE UNIQUE CONSTRAINT] Add composite unique constraint for phone and email combination
-- This migration adds a composite unique constraint to ensure phone and email combinations are unique
-- This allows multiple customers without email (NULL emails) but prevents duplicate phone-email pairs

-- AlterTable: Add composite unique constraint
ALTER TABLE "Customers" ADD CONSTRAINT "unique_phone_email" UNIQUE ("phone", "email");

