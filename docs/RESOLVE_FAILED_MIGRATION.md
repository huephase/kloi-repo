# Resolving Failed Prisma Migration on Render.com

## Problem

The migration `20251021193000_add_order_status_enum` is marked as failed in the database, preventing new migrations from being applied.

## Solution

You have two options to resolve this:

### Option 1: Manual Resolution (Recommended for First Time)

1. **Access Render.com Shell/Console**:
   - Go to your Render.com dashboard
   - Navigate to your service
   - Open the Shell/Console

2. **Check if Migration Actually Completed**:
   ```bash
   # Connect to your database and check if OrderStatus enum exists
   psql $DATABASE_URL -c "SELECT typname FROM pg_type WHERE typname = 'OrderStatus';"
   ```
   
   If the enum exists, the migration actually completed and just needs to be marked as applied.

3. **Mark Migration as Applied**:
   ```bash
   npx prisma migrate resolve --applied 20251021193000_add_order_status_enum
   ```

4. **Verify**:
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Update Pre-Deploy Command (Recommended for Automation)

Update your Render.com pre-deploy command to:

```bash
npx prisma migrate resolve --applied 20251021193000_add_order_status_enum || true && npx prisma migrate deploy && npx prisma generate
```

This will:
1. Try to mark the failed migration as applied (if it completed)
2. Continue with `migrate deploy` regardless
3. Generate Prisma client

**Note**: The `|| true` ensures the command continues even if the migration is already resolved or doesn't need resolving.

### Option 3: Rollback and Reapply (If Migration Didn't Complete)

If the migration didn't actually complete:

1. **Mark as Rolled Back**:
   ```bash
   npx prisma migrate resolve --rolled-back 20251021193000_add_order_status_enum
   ```

2. **Run Migrations Again**:
   ```bash
   npx prisma migrate deploy
   ```

## Why This Happened

The migration likely started but was interrupted or encountered an error partway through. Prisma tracks migration state in the `_prisma_migrations` table, and if a migration is marked as "failed", it won't apply new migrations until the state is resolved.

## Prevention

To prevent this in the future:
- Ensure database connections are stable during migrations
- Use transaction-safe migration scripts
- Monitor migration execution in production

## Verification

After resolving, verify the migration state:

```bash
npx prisma migrate status
```

This should show all migrations as applied with no failed migrations.

