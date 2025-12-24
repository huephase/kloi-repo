/*
  Warnings:

  - You are about to drop the `taxesFees` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[theme]` on the table `Menus` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Customers_email_key";

-- AlterTable
ALTER TABLE "deliveryLocations" ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL;

-- DropTable
-- ⚠️⚠️⚠️ NOTE: This DROP was unintentional - the TaxesFees model was missing from schema.prisma
-- The table was restored in migration 20251224133916_restore_taxes_fees_table
DROP TABLE "taxesFees";

-- CreateTable
CREATE TABLE "Admins" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "theme" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admins_username_key" ON "Admins"("username");

-- CreateIndex
CREATE INDEX "Admins_theme_idx" ON "Admins"("theme");

-- CreateIndex
CREATE INDEX "Admins_username_idx" ON "Admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Menus_theme_key" ON "Menus"("theme");
