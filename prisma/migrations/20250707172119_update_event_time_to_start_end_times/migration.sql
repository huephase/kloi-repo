/*
  Warnings:

  - You are about to drop the column `eventTime` on the `kloiOrdersTable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "kloiOrdersTable" DROP COLUMN "eventTime",
ADD COLUMN     "eventEndTime" TIME,
ADD COLUMN     "eventStartTime" TIME;
