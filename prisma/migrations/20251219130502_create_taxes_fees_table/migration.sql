-- CreateTable
CREATE TABLE IF NOT EXISTS "taxesFees" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "country_code" VARCHAR(10) NOT NULL,
    "applies_to" VARCHAR(50) NOT NULL,
    "calculation_type" VARCHAR(20) NOT NULL,
    "rate_value" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxesFees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "taxesFees_code_key" ON "taxesFees"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "taxesFees_country_code_idx" ON "taxesFees"("country_code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "taxesFees_active_idx" ON "taxesFees"("active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "taxesFees_dates_idx" ON "taxesFees"("startDate", "endDate");

-- Insert seed data
INSERT INTO "taxesFees" ("id", "code", "name", "type", "category", "country_code", "applies_to", "calculation_type", "rate_value", "currency", "active", "startDate", "endDate", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'VAT_AE', 'UAE VAT 5%', 'TAX', 'VAT', 'AE', 'ORDER_TOTAL', 'PERCENTAGE', 5.00, 'AED', true, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'SERVICE_FEE', 'Service fee 3%', 'FEE', 'SERVICE', 'AE', 'ORDER_TOTAL', 'PERCENTAGE', 3.00, 'AED', true, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'PROC_FEE_150', 'Processing fee 150', 'FEE', 'PROCESSING', 'AE', 'ORDER_TOTAL', 'FIXED', 150.0, 'AED', true, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

