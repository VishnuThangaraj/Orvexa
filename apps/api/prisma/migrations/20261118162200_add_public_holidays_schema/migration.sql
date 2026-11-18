-- AlterEnum
ALTER TYPE "CalendarEventType" ADD VALUE 'HOLIDAY';

-- DropForeignKey
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_created_by_fkey";

-- AlterTable
ALTER TABLE "calendar_events" ALTER COLUMN "created_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "calendar_settings" ADD COLUMN     "hidden_calendar_ids" TEXT;

-- AlterTable
ALTER TABLE "user_calendars" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "user_calendars_is_public_idx" ON "user_calendars"("is_public");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
