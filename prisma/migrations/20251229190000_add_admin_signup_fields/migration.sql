-- Set search path to public schema
SET search_path = public;

-- CreateEnum (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'EDITOR', 'READ_ONLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminStatus" AS ENUM ('PENDING', 'EMAIL_VERIFIED', 'APPROVED', 'ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if Admins table exists and alter it
DO $$ 
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Admins') THEN
        -- AlterTable
        ALTER TABLE public."Admins" ALTER COLUMN "username" DROP NOT NULL;
        ALTER TABLE public."Admins" ALTER COLUMN "password" DROP NOT NULL;
    ELSE
        RAISE NOTICE 'Table "Admins" does not exist. Skipping ALTER TABLE statements.';
    END IF;
END $$;

-- AlterTable
-- Add columns as nullable first, then update existing rows, then set NOT NULL
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Admins') THEN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'firstName') THEN
            ALTER TABLE public."Admins" ADD COLUMN "firstName" VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'lastName') THEN
            ALTER TABLE public."Admins" ADD COLUMN "lastName" VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'phone') THEN
            ALTER TABLE public."Admins" ADD COLUMN "phone" VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'role') THEN
            ALTER TABLE public."Admins" ADD COLUMN "role" "AdminRole";
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'emailVerified') THEN
            ALTER TABLE public."Admins" ADD COLUMN "emailVerified" BOOLEAN;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'emailVerificationToken') THEN
            ALTER TABLE public."Admins" ADD COLUMN "emailVerificationToken" VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'emailVerificationExpiry') THEN
            ALTER TABLE public."Admins" ADD COLUMN "emailVerificationExpiry" TIMESTAMP(3);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'invitationToken') THEN
            ALTER TABLE public."Admins" ADD COLUMN "invitationToken" VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'invitationExpiry') THEN
            ALTER TABLE public."Admins" ADD COLUMN "invitationExpiry" TIMESTAMP(3);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'invitedBy') THEN
            ALTER TABLE public."Admins" ADD COLUMN "invitedBy" TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'approvedAt') THEN
            ALTER TABLE public."Admins" ADD COLUMN "approvedAt" TIMESTAMP(3);
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'approvedBy') THEN
            ALTER TABLE public."Admins" ADD COLUMN "approvedBy" TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admins' AND column_name = 'status') THEN
            ALTER TABLE public."Admins" ADD COLUMN "status" "AdminStatus";
        END IF;

        -- Update existing rows with default values
        UPDATE public."Admins" SET 
          "firstName" = COALESCE("firstName", ''),
          "lastName" = COALESCE("lastName", ''),
          "phone" = COALESCE("phone", ''),
          "role" = COALESCE("role", 'READ_ONLY'::"AdminRole"),
          "emailVerified" = COALESCE("emailVerified", false),
          "status" = COALESCE("status", 'PENDING'::"AdminStatus")
        WHERE "firstName" IS NULL OR "lastName" IS NULL OR "phone" IS NULL OR "role" IS NULL OR "emailVerified" IS NULL OR "status" IS NULL;

        -- Set NOT NULL constraints
        ALTER TABLE public."Admins" ALTER COLUMN "firstName" SET NOT NULL;
        ALTER TABLE public."Admins" ALTER COLUMN "firstName" SET DEFAULT '';
        ALTER TABLE public."Admins" ALTER COLUMN "lastName" SET NOT NULL;
        ALTER TABLE public."Admins" ALTER COLUMN "lastName" SET DEFAULT '';
        ALTER TABLE public."Admins" ALTER COLUMN "phone" SET NOT NULL;
        ALTER TABLE public."Admins" ALTER COLUMN "phone" SET DEFAULT '';
        ALTER TABLE public."Admins" ALTER COLUMN "role" SET NOT NULL;
        ALTER TABLE public."Admins" ALTER COLUMN "role" SET DEFAULT 'READ_ONLY';
        ALTER TABLE public."Admins" ALTER COLUMN "emailVerified" SET NOT NULL;
        ALTER TABLE public."Admins" ALTER COLUMN "emailVerified" SET DEFAULT false;
        ALTER TABLE public."Admins" ALTER COLUMN "status" SET NOT NULL;
        ALTER TABLE public."Admins" ALTER COLUMN "status" SET DEFAULT 'PENDING';
    ELSE
        RAISE NOTICE 'Table "Admins" does not exist. Skipping column additions.';
    END IF;
END $$;

-- CreateIndex
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Admins') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "Admins_invitationToken_key" ON public."Admins"("invitationToken");
        CREATE UNIQUE INDEX IF NOT EXISTS "Admins_emailVerificationToken_key" ON public."Admins"("emailVerificationToken");
        CREATE INDEX IF NOT EXISTS "Admins_invitationToken_idx" ON public."Admins"("invitationToken");
        CREATE INDEX IF NOT EXISTS "Admins_emailVerificationToken_idx" ON public."Admins"("emailVerificationToken");
        CREATE INDEX IF NOT EXISTS "Admins_email_idx" ON public."Admins"("email");
        CREATE INDEX IF NOT EXISTS "Admins_status_idx" ON public."Admins"("status");
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Admins') THEN
        BEGIN
            ALTER TABLE public."Admins" ADD CONSTRAINT "Admins_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES public."Admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Admins') THEN
        BEGIN
            ALTER TABLE public."Admins" ADD CONSTRAINT "Admins_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES public."Admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

