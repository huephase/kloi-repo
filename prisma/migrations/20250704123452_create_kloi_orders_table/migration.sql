/*
  Warnings:

  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropTable
DROP TABLE "Order";

-- CreateTable
CREATE TABLE "kloiOrdersTable" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "firstName" VARCHAR(20) NOT NULL,
    "lastName" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100),
    "location" JSONB NOT NULL,
    "eventDetails" JSONB NOT NULL,
    "eventDate" DATE,
    "eventTime" TIME,
    "eventDatetime" TIMESTAMPTZ,
    "eventSetup" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "totalAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "kloiOrdersTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kloiOrdersTable_orderNumber_key" ON "kloiOrdersTable"("orderNumber");

-- AddForeignKey
ALTER TABLE "kloiOrdersTable" ADD CONSTRAINT "kloiOrdersTable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kloiOrdersTable" ADD CONSTRAINT "kloiOrdersTable_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
