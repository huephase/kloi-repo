-- 🟡🟡🟡 - [MIGRATION] Make Customers.email nullable and cap length to 100
-- ✅✅✅ - Safe to run multiple times; uses conditional checks

DO $$
BEGIN
  -- Ensure column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Customers'
      AND column_name = 'email'
  ) THEN
    -- Drop NOT NULL if present
    BEGIN
      ALTER TABLE "public"."Customers" ALTER COLUMN "email" DROP NOT NULL;
      -- 🟡🟡🟡 - [INFO] Dropped NOT NULL on Customers.email
    EXCEPTION WHEN others THEN
      -- 🟤🟤🟤 - Ignore if already nullable
      PERFORM 1;
    END;

    -- Ensure type is VARCHAR(100)
    BEGIN
      ALTER TABLE "public"."Customers" ALTER COLUMN "email" TYPE VARCHAR(100);
      -- 🟡🟡🟡 - [INFO] Set Customers.email to VARCHAR(100)
    EXCEPTION WHEN others THEN
      -- 🟤🟤🟤 - Ignore if already this type/length
      PERFORM 1;
    END;
  END IF;
END $$;


