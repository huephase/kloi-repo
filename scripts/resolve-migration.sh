#!/bin/bash
# scripts/resolve-migration.sh
# ⚠️⚠️⚠️ [2025-01-30] Script to resolve failed Prisma migration before deploying
# This checks if the migration completed and marks it as applied if so

set -e

echo "🟡🟡🟡 - [MIGRATION RESOLVE] Checking if OrderStatus enum exists..."

# Check if the migration actually completed by checking for the enum
ENUM_EXISTS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM pg_type WHERE typname = 'OrderStatus'" 2>/dev/null || echo "0")

if [ "$ENUM_EXISTS" -gt 0 ]; then
  echo "✅✅✅ - [MIGRATION RESOLVE] OrderStatus enum exists, migration appears to have completed"
  echo "🟡🟡🟡 - [MIGRATION RESOLVE] Marking migration as applied..."
  npx prisma migrate resolve --applied 20251021193000_add_order_status_enum || {
    echo "❗❗❗ - [MIGRATION RESOLVE] Could not mark migration as applied automatically"
    echo "🟡🟡🟡 - [MIGRATION RESOLVE] This is okay, migrate deploy will handle it"
  }
else
  echo "❗❗❗ - [MIGRATION RESOLVE] OrderStatus enum does not exist"
  echo "🟡🟡🟡 - [MIGRATION RESOLVE] Migration may need to be rolled back or fixed manually"
fi

echo "🟡🟡🟡 - [MIGRATION RESOLVE] Proceeding with migrate deploy..."

