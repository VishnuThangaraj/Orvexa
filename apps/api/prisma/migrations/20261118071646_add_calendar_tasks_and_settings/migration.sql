-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "calendar_id" BIGINT,
ADD COLUMN     "color" VARCHAR(50),
ADD COLUMN     "recurrence_exceptions" TEXT;

-- CreateTable
CREATE TABLE "user_calendars" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "color" VARCHAR(50) NOT NULL DEFAULT '#039be5',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "system_type" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_tasks" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "details" TEXT,
    "due_date" TIMESTAMPTZ(6),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "calendar_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_settings" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "default_view" VARCHAR(20) NOT NULL DEFAULT 'week',
    "show_weekends" BOOLEAN NOT NULL DEFAULT true,
    "show_declined_events" BOOLEAN NOT NULL DEFAULT true,
    "show_completed_tasks" BOOLEAN NOT NULL DEFAULT true,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "calendar_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_calendars_user_id_idx" ON "user_calendars"("user_id");

-- CreateIndex
CREATE INDEX "calendar_tasks_user_id_due_date_idx" ON "calendar_tasks"("user_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_settings_user_id_key" ON "calendar_settings"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_calendar_id_idx" ON "calendar_events"("calendar_id");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "user_calendars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_calendars" ADD CONSTRAINT "user_calendars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_tasks" ADD CONSTRAINT "calendar_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_settings" ADD CONSTRAINT "calendar_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
