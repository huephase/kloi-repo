-- This migration sets the orderNumber sequence to start from 1000
-- 🟡🟡🟡 - [DATABASE MIGRATION] Update sequence to start from 1000 as requested

-- Reset the sequence to start from 1000
ALTER SEQUENCE "kloiOrdersTable_orderNumber_seq" RESTART WITH 1000;

-- Update existing records if any (though there shouldn't be many at this point)
-- This ensures any existing orders get updated to the new numbering scheme
UPDATE "kloiOrdersTable" SET "orderNumber" = "orderNumber" + 999 WHERE "orderNumber" < 1000;