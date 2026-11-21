-- AlterEnum
ALTER TYPE "DriveAccessLevel" ADD VALUE 'COMMENTER';

-- AlterTable
ALTER TABLE "drive_files" ADD COLUMN     "description" TEXT,
ADD COLUMN     "prevent_download" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prevent_editor_sharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "searchable_content" TEXT;

-- AlterTable
ALTER TABLE "drive_folders" ADD COLUMN     "color" VARCHAR(50),
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "file_assets" ADD COLUMN     "sha256" VARCHAR(64),
ADD COLUMN     "storage_backend" VARCHAR(20) NOT NULL DEFAULT 'CLOUDINARY',
ADD COLUMN     "storage_path" VARCHAR(500);

-- CreateTable
CREATE TABLE "calendar_event_attachments" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "drive_file_id" BIGINT,
    "asset_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_event_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_share_links" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT,
    "folder_id" BIGINT,
    "token" VARCHAR(64) NOT NULL,
    "role" "DriveAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "allow_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(6),
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "drive_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_access_requests" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT,
    "folder_id" BIGINT,
    "requested_by" BIGINT NOT NULL,
    "requested_role" "DriveAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "drive_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_activities" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT,
    "folder_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_shortcuts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "target_file_id" BIGINT,
    "target_folder_id" BIGINT,
    "parent_folder_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_shortcuts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_upload_sessions" (
    "id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "folder_id" BIGINT,
    "target_file_id" BIGINT,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "total_bytes" BIGINT NOT NULL,
    "uploaded_bytes" BIGINT NOT NULL DEFAULT 0,
    "chunk_size" INTEGER NOT NULL,
    "total_chunks" INTEGER NOT NULL,
    "completed_chunks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "storage_key" VARCHAR(500) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "drive_upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_event_attachments_event_id_idx" ON "calendar_event_attachments"("event_id");

-- CreateIndex
CREATE INDEX "calendar_event_attachments_drive_file_id_idx" ON "calendar_event_attachments"("drive_file_id");

-- CreateIndex
CREATE INDEX "calendar_event_attachments_asset_id_idx" ON "calendar_event_attachments"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "drive_share_links_token_key" ON "drive_share_links"("token");

-- CreateIndex
CREATE INDEX "drive_share_links_token_idx" ON "drive_share_links"("token");

-- CreateIndex
CREATE INDEX "drive_share_links_file_id_idx" ON "drive_share_links"("file_id");

-- CreateIndex
CREATE INDEX "drive_share_links_folder_id_idx" ON "drive_share_links"("folder_id");

-- CreateIndex
CREATE INDEX "drive_access_requests_file_id_status_idx" ON "drive_access_requests"("file_id", "status");

-- CreateIndex
CREATE INDEX "drive_access_requests_folder_id_status_idx" ON "drive_access_requests"("folder_id", "status");

-- CreateIndex
CREATE INDEX "drive_access_requests_requested_by_idx" ON "drive_access_requests"("requested_by");

-- CreateIndex
CREATE INDEX "drive_activities_file_id_created_at_idx" ON "drive_activities"("file_id", "created_at");

-- CreateIndex
CREATE INDEX "drive_activities_folder_id_created_at_idx" ON "drive_activities"("folder_id", "created_at");

-- CreateIndex
CREATE INDEX "drive_activities_user_id_created_at_idx" ON "drive_activities"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "drive_shortcuts_user_id_parent_folder_id_idx" ON "drive_shortcuts"("user_id", "parent_folder_id");

-- CreateIndex
CREATE INDEX "drive_upload_sessions_user_id_status_idx" ON "drive_upload_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "drive_upload_sessions_expires_at_idx" ON "drive_upload_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "calendar_event_attachments" ADD CONSTRAINT "calendar_event_attachments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_attachments" ADD CONSTRAINT "calendar_event_attachments_drive_file_id_fkey" FOREIGN KEY ("drive_file_id") REFERENCES "drive_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_attachments" ADD CONSTRAINT "calendar_event_attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_share_links" ADD CONSTRAINT "drive_share_links_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_share_links" ADD CONSTRAINT "drive_share_links_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_share_links" ADD CONSTRAINT "drive_share_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_access_requests" ADD CONSTRAINT "drive_access_requests_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_access_requests" ADD CONSTRAINT "drive_access_requests_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_access_requests" ADD CONSTRAINT "drive_access_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_access_requests" ADD CONSTRAINT "drive_access_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_activities" ADD CONSTRAINT "drive_activities_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_activities" ADD CONSTRAINT "drive_activities_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_activities" ADD CONSTRAINT "drive_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_shortcuts" ADD CONSTRAINT "drive_shortcuts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_shortcuts" ADD CONSTRAINT "drive_shortcuts_target_file_id_fkey" FOREIGN KEY ("target_file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_shortcuts" ADD CONSTRAINT "drive_shortcuts_target_folder_id_fkey" FOREIGN KEY ("target_folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_shortcuts" ADD CONSTRAINT "drive_shortcuts_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_upload_sessions" ADD CONSTRAINT "drive_upload_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
