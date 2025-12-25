// src/scripts/resolveFailedMigration.ts
// ⚠️⚠️⚠️ [2025-01-30] Script to resolve failed Prisma migrations
// This script checks if a migration actually completed and provides instructions to resolve

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function checkAndResolveMigration() {
  try {
    console.log('🟡🟡🟡 - [MIGRATION RESOLVE] Checking database migration status...');
    
    // Check if OrderStatus enum exists (indicates migration may have completed)
    const enumCheck = await prisma.$queryRaw<Array<{ typname: string }>>`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'OrderStatus'
    `;
    
    const enumExists = enumCheck.length > 0;
    console.log('🟡🟡🟡 - [MIGRATION RESOLVE] OrderStatus enum exists:', enumExists);
    
    // Check if status column is using the enum type
    const columnCheck = await prisma.$queryRaw<Array<{ data_type: string; udt_name: string }>>`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'kloiOrdersTable' 
      AND column_name = 'status'
    `;
    
    const usesEnum = columnCheck.length > 0 && columnCheck[0].udt_name === 'OrderStatus';
    console.log('🟡🟡🟡 - [MIGRATION RESOLVE] Status column uses OrderStatus enum:', usesEnum);
    
    if (enumExists && usesEnum) {
      console.log('✅✅✅ - [MIGRATION RESOLVE] Migration appears to have completed successfully');
      console.log('🟡🟡🟡 - [MIGRATION RESOLVE] Attempting to mark migration as applied...');
      
      try {
        // Try to resolve the migration as applied
        execSync('npx prisma migrate resolve --applied 20251021193000_add_order_status_enum', {
          stdio: 'inherit'
        });
        console.log('✅✅✅ - [MIGRATION RESOLVE] Migration marked as applied successfully');
        return true;
      } catch (error) {
        console.log('❗❗❗ - [MIGRATION RESOLVE] Could not automatically resolve migration');
        console.log('🟡🟡🟡 - [MIGRATION RESOLVE] Please run manually:');
        console.log('   npx prisma migrate resolve --applied 20251021193000_add_order_status_enum');
        return false;
      }
    } else {
      console.log('❗❗❗ - [MIGRATION RESOLVE] Migration does not appear to have completed');
      console.log('🟡🟡🟡 - [MIGRATION RESOLVE] You may need to manually fix the database state');
      return false;
    }
  } catch (error) {
    console.error('❌❌❌ - [MIGRATION RESOLVE] Error checking migration status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    const resolved = await checkAndResolveMigration();
    process.exit(resolved ? 0 : 1);
  } catch (error) {
    console.error('❌❌❌ - [MIGRATION RESOLVE] Fatal error:', error);
    process.exit(1);
  }
}

main();

