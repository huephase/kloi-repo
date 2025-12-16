-- 🟡🟡🟡 [2025-12-16] Create Leads table for pre-checkout customer data
-- Leads table stores customer information during wizard flow before payment completion
-- Allows duplicates (no unique constraints) unlike Customers table

-- ✅✅✅ [2025-12-16] Create Leads table with same structure as Customers (without unique constraints)
CREATE TABLE "Leads" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(100),
    "phone" VARCHAR(20),
    "firstName" VARCHAR(50),
    "lastName" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leads_pkey" PRIMARY KEY ("id")
);

-- ✅✅✅ [2025-12-16] Add leadId field to kloiOrdersTable to link orders to leads
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "leadId" TEXT;

-- ✅✅✅ [2025-12-16] Add foreign key constraint for leadId (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kloiOrdersTable_leadId_fkey'
  ) THEN
    ALTER TABLE "kloiOrdersTable" ADD CONSTRAINT "kloiOrdersTable_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

