-- ⚠️⚠️⚠️ [2025-01-21] Create enum type if not exists before using it
-- This ensures the enum exists in fresh/shadow databases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED');
  END IF;
END
$$;

-- 🟡🟡🟡 [2025-01-21] Drop old default and change column type
ALTER TABLE "kloiOrdersTable" ALTER COLUMN "status" DROP DEFAULT;

-- ✅✅✅ [2025-01-21] Convert column to use OrderStatus enum
ALTER TABLE "kloiOrdersTable"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING "status"::text::"OrderStatus";

-- ✅✅✅ [2025-01-21] Set new default as a valid enum value
ALTER TABLE "kloiOrdersTable"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';