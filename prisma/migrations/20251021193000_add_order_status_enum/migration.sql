-- 🟡🟡🟡 - [ORDER STATUS ENUM] Create OrderStatus enum type
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED');

-- 🟡🟡🟡 - [ORDER STATUS COLUMN] Convert status column from VARCHAR to OrderStatus enum
ALTER TABLE "kloiOrdersTable" 
ALTER COLUMN "status" TYPE "OrderStatus" 
USING "status"::"OrderStatus";