-- 2026-01-20T20:40:00Z 🟡🟡🟡 - [ADMIN LEVELS] Migration: Replace AdminRole enum with integer level field (1-8)
-- Migration strategy:
--   SUPER_ADMIN + theme='admin' → Level 1 (Super Admin)
--   SUPER_ADMIN + theme!='admin' → Level 5 (Theme Super Admin)
--   EDITOR + theme='admin' → Level 2 (Backend Admin)
--   EDITOR + theme!='admin' → Level 6 (Theme Editor)
--   READ_ONLY + theme='admin' → Level 4 (Backend Viewer)
--   READ_ONLY + theme!='admin' → Level 8 (Theme Viewer)

-- Step 1: Add new level column with default value
ALTER TABLE "Admins" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 8;

-- Step 2: Migrate existing data based on role and theme
-- SUPER_ADMIN with admin theme → Level 1
UPDATE "Admins" 
SET "level" = 1 
WHERE "role" = 'SUPER_ADMIN' AND "theme" = 'admin';

-- SUPER_ADMIN with non-admin theme → Level 5
UPDATE "Admins" 
SET "level" = 5 
WHERE "role" = 'SUPER_ADMIN' AND "theme" != 'admin';

-- EDITOR with admin theme → Level 2
UPDATE "Admins" 
SET "level" = 2 
WHERE "role" = 'EDITOR' AND "theme" = 'admin';

-- EDITOR with non-admin theme → Level 6
UPDATE "Admins" 
SET "level" = 6 
WHERE "role" = 'EDITOR' AND "theme" != 'admin';

-- READ_ONLY with admin theme → Level 4
UPDATE "Admins" 
SET "level" = 4 
WHERE "role" = 'READ_ONLY' AND "theme" = 'admin';

-- READ_ONLY with non-admin theme → Level 8
UPDATE "Admins" 
SET "level" = 8 
WHERE "role" = 'READ_ONLY' AND "theme" != 'admin';

-- Step 3: Add constraint to ensure level is between 1 and 8
ALTER TABLE "Admins" ADD CONSTRAINT "Admins_level_check" CHECK ("level" >= 1 AND "level" <= 8);

-- Step 4: Remove default from level column (now that data is migrated)
ALTER TABLE "Admins" ALTER COLUMN "level" DROP DEFAULT;

-- Step 5: Drop the old role column
ALTER TABLE "Admins" DROP COLUMN "role";

-- Step 6: Drop the AdminRole enum type (if it exists and is not used elsewhere)
-- Note: PostgreSQL will automatically remove the enum if it's not referenced
DROP TYPE IF EXISTS "AdminRole";
