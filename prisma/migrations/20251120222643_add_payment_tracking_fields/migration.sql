-- 🟡🟡🟡 [2025-11-20] Add payment tracking fields to kloiOrdersTable
-- These fields support payment integration with providers like Stripe, PayPal, etc.

-- ✅✅✅ [2025-11-20] Add paymentProvider field - identifies the payment provider (e.g., 'stripe', 'paypal')
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "paymentProvider" VARCHAR(50);

-- ✅✅✅ [2025-11-20] Add paymentIntentId field - stores the provider's payment intent/charge ID
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "paymentIntentId" VARCHAR(255);

-- ✅✅✅ [2025-11-20] Add paymentStatus field - tracks payment status ('pending', 'succeeded', 'failed', 'refunded')
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "paymentStatus" VARCHAR(50);

-- ✅✅✅ [2025-11-20] Add paymentMethodId field - stores saved payment method ID (optional, for future use)
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "paymentMethodId" VARCHAR(255);

-- ✅✅✅ [2025-11-20] Add paidAt field - timestamp when payment was completed
ALTER TABLE "kloiOrdersTable" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ(6);