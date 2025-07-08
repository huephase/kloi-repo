/*
  Warnings:

  - You are about to drop the column `eventDate` on the `kloiOrdersTable` table. All the data in the column will be lost.
  - You are about to drop the column `eventStartTime` on the `kloiOrdersTable` table. All the data in the column will be lost.
  - You are about to drop the column `eventEndTime` on the `kloiOrdersTable` table. All the data in the column will be lost.

*/

-- Add the new eventDateTime JSONB column
ALTER TABLE "kloiOrdersTable" ADD COLUMN "eventDateTime" JSONB;

-- Migrate existing data from the old columns to the new JSONB column
UPDATE "kloiOrdersTable" 
SET "eventDateTime" = json_build_object(
  'events', json_build_array(
    json_build_object(
      'date', CASE WHEN "eventDate" IS NOT NULL THEN to_char("eventDate", 'YYYY-MM-DD') ELSE null END,
      'startTime', CASE WHEN "eventStartTime" IS NOT NULL THEN to_char("eventStartTime", 'HH24:MI') ELSE null END,
      'endTime', CASE WHEN "eventEndTime" IS NOT NULL THEN to_char("eventEndTime", 'HH24:MI') ELSE null END
    )
  )
)
WHERE "eventDate" IS NOT NULL OR "eventStartTime" IS NOT NULL OR "eventEndTime" IS NOT NULL;

-- Drop the old columns
ALTER TABLE "kloiOrdersTable" DROP COLUMN "eventDate";
ALTER TABLE "kloiOrdersTable" DROP COLUMN "eventStartTime";
ALTER TABLE "kloiOrdersTable" DROP COLUMN "eventEndTime"; 