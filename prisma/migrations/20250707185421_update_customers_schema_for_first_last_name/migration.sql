/*
  Warnings:

  - You are about to drop the column `name` on the `Customers` table. All the data in the column will be lost.
  - You are about to alter the column `phone` on the `Customers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE "Customers" DROP COLUMN "name",
ADD COLUMN     "firstName" VARCHAR(50),
ADD COLUMN     "lastName" VARCHAR(50),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(20);
