-- Down migration for 20261120060838_add_drive_features_and_calendar_attachments

-- Drop foreign keys
ALTER TABLE "calendar_event_attachments" DROP CONSTRAINT IF EXISTS "calendar_event_attachments_event_id_fkey";
ALTER TABLE "calendar_event_attachments" DROP CONSTRAINT IF EXISTS "calendar_event_attachments_drive_file_id_fkey";
ALTER TABLE "calendar_event_attachments" DROP CONSTRAINT IF EXISTS "calendar_event_attachments_asset_id_fkey";

ALTER TABLE "drive_share_links" DROP CONSTRAINT IF EXISTS "drive_share_links_file_id_fkey";
ALTER TABLE "drive_share_links" DROP CONSTRAINT IF EXISTS "drive_share_links_folder_id_fkey";
ALTER TABLE "drive_share_links" DROP CONSTRAINT IF EXISTS "drive_share_links_created_by_fkey";

ALTER TABLE "drive_access_requests" DROP CONSTRAINT IF EXISTS "drive_access_requests_file_id_fkey";
ALTER TABLE "drive_access_requests" DROP CONSTRAINT IF EXISTS "drive_access_requests_folder_id_fkey";
ALTER TABLE "drive_access_requests" DROP CONSTRAINT IF EXISTS "drive_access_requests_requested_by_fkey";
ALTER TABLE "drive_access_requests" DROP CONSTRAINT IF EXISTS "drive_access_requests_reviewed_by_fkey";

ALTER TABLE "drive_activities" DROP CONSTRAINT IF EXISTS "drive_activities_file_id_fkey";
ALTER TABLE "drive_activities" DROP CONSTRAINT IF EXISTS "drive_activities_folder_id_fkey";
ALTER TABLE "drive_activities" DROP CONSTRAINT IF EXISTS "drive_activities_user_id_fkey";

ALTER TABLE "drive_shortcuts" DROP CONSTRAINT IF EXISTS "drive_shortcuts_user_id_fkey";
ALTER TABLE "drive_shortcuts" DROP CONSTRAINT IF EXISTS "drive_shortcuts_target_file_id_fkey";
ALTER TABLE "drive_shortcuts" DROP CONSTRAINT IF EXISTS "drive_shortcuts_target_folder_id_fkey";
ALTER TABLE "drive_shortcuts" DROP CONSTRAINT IF EXISTS "drive_shortcuts_parent_folder_id_fkey";

ALTER TABLE "drive_upload_sessions" DROP CONSTRAINT IF EXISTS "drive_upload_sessions_user_id_fkey";

-- Drop tables
DROP TABLE IF EXISTS "calendar_event_attachments" CASCADE;
DROP TABLE IF EXISTS "drive_upload_sessions" CASCADE;
DROP TABLE IF EXISTS "drive_shortcuts" CASCADE;
DROP TABLE IF EXISTS "drive_activities" CASCADE;
DROP TABLE IF EXISTS "drive_access_requests" CASCADE;
DROP TABLE IF EXISTS "drive_share_links" CASCADE;

-- Drop columns
ALTER TABLE "file_assets"
  DROP COLUMN IF EXISTS "sha256",
  DROP COLUMN IF EXISTS "storage_backend",
  DROP COLUMN IF EXISTS "storage_path";

ALTER TABLE "drive_folders"
  DROP COLUMN IF EXISTS "color",
  DROP COLUMN IF EXISTS "description";

ALTER TABLE "drive_files"
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "prevent_download",
  DROP COLUMN IF EXISTS "prevent_editor_sharing",
  DROP COLUMN IF EXISTS "searchable_content";
