-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CloudinaryResourceType" AS ENUM ('IMAGE', 'VIDEO', 'RAW');

-- CreateEnum
CREATE TYPE "CloudinaryDeliveryType" AS ENUM ('UPLOAD', 'AUTHENTICATED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MailRecipientType" AS ENUM ('TO', 'CC', 'BCC');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'CHANNEL');

-- CreateEnum
CREATE TYPE "ChannelVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ConversationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'AUDIO', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DriveAccessLevel" AS ENUM ('VIEWER', 'EDITOR', 'MANAGER');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('PERSONAL', 'SHARED');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "CalendarAccessLevel" AS ENUM ('VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MeetingRole" AS ENUM ('HOST', 'CO_HOST', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MAIL', 'CHAT', 'CALENDAR', 'MEETING', 'DRIVE', 'SYSTEM');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" BIGINT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "profile_image_id" BIGINT,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "dob" DATE,
    "gender" VARCHAR(30),
    "address" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMPTZ(6),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "device_name" VARCHAR(255),
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "last_used_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "theme" VARCHAR(20) NOT NULL DEFAULT 'system',
    "language" VARCHAR(20) NOT NULL DEFAULT 'en',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "notification_preferences" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_by" BIGINT NOT NULL,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(100),
    "location" VARCHAR(255),
    "event_type" "CalendarEventType" NOT NULL DEFAULT 'PERSONAL',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PRIVATE',
    "recurrence_rule" TEXT,
    "meeting_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_participants" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "response_status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "calendar_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_reminders" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "minutes_before" INTEGER NOT NULL,
    "remind_at" TIMESTAMPTZ(6) NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_shares" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "shared_with_user_id" BIGINT NOT NULL,
    "permission" "CalendarAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "calendar_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" BIGSERIAL NOT NULL,
    "type" "ConversationType" NOT NULL,
    "visibility" "ChannelVisibility",
    "name" VARCHAR(150),
    "description" TEXT,
    "image_id" BIGINT,
    "direct_user_low_id" BIGINT,
    "direct_user_high_id" BIGINT,
    "created_by" BIGINT NOT NULL,
    "last_message_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "member_role" "ConversationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "last_read_message_id" BIGINT,
    "last_read_at" TIMESTAMPTZ(6),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "parent_message_id" BIGINT,
    "content" TEXT NOT NULL,
    "message_type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_attachments" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "asset_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_reactions" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "emoji" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_pinned_messages" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "pinned_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_pinned_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_folders" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "parent_folder_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" BIGINT,

    CONSTRAINT "drive_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_files" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "folder_id" BIGINT,
    "asset_id" BIGINT NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" BIGINT,

    CONSTRAINT "drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_file_versions" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "asset_id" BIGINT NOT NULL,
    "uploaded_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_permissions" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT,
    "folder_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "access_level" "DriveAccessLevel" NOT NULL,
    "granted_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "drive_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_favorites" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "file_id" BIGINT,
    "folder_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_recent_items" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "file_id" BIGINT,
    "folder_id" BIGINT,
    "accessed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_recent_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_comments" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "drive_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_messages" (
    "id" BIGSERIAL NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "thread_id" BIGINT,
    "parent_message_id" BIGINT,
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_recipients" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "recipient_type" "MailRecipientType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_user_states" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_trashed" BOOLEAN NOT NULL DEFAULT false,
    "trashed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mail_user_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_attachments" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "asset_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_drafts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "parent_message_id" BIGINT,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mail_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_draft_recipients" (
    "id" BIGSERIAL NOT NULL,
    "draft_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "recipient_type" "MailRecipientType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_draft_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_draft_attachments" (
    "id" BIGSERIAL NOT NULL,
    "draft_id" BIGINT NOT NULL,
    "asset_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_draft_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_folders" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mail_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_folder_messages" (
    "id" BIGSERIAL NOT NULL,
    "folder_id" BIGINT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_folder_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_labels" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_message_labels" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "label_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_message_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "host_id" BIGINT NOT NULL,
    "room_name" VARCHAR(255) NOT NULL,
    "meeting_code" VARCHAR(100) NOT NULL,
    "conversation_id" BIGINT,
    "scheduled_start" TIMESTAMPTZ(6),
    "scheduled_end" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "id" BIGSERIAL NOT NULL,
    "meeting_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "meeting_role" "MeetingRole" NOT NULL DEFAULT 'PARTICIPANT',
    "invitation_status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "joined_at" TIMESTAMPTZ(6),
    "left_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_recordings" (
    "id" BIGSERIAL NOT NULL,
    "meeting_id" BIGINT NOT NULL,
    "asset_id" BIGINT NOT NULL,
    "started_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "actor_id" BIGINT,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "reference_id" BIGINT,
    "reference_type" VARCHAR(50),
    "action_url" VARCHAR(500),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" BIGSERIAL NOT NULL,
    "organization_name" VARCHAR(255) NOT NULL,
    "logo_id" BIGINT,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" BIGSERIAL NOT NULL,
    "cloudinary_asset_id" VARCHAR(64),
    "public_id" VARCHAR(500) NOT NULL,
    "resource_type" "CloudinaryResourceType" NOT NULL,
    "delivery_type" "CloudinaryDeliveryType" NOT NULL DEFAULT 'AUTHENTICATED',
    "version" INTEGER,
    "format" VARCHAR(20),
    "original_filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "bytes" BIGINT NOT NULL,
    "secure_url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" DOUBLE PRECISION,
    "uploaded_by" BIGINT,
    "cloud_deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_user_id_key" ON "credentials"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_refresh_token_hash_idx" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_expires_at_idx" ON "user_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_created_by_start_time_idx" ON "calendar_events"("created_by", "start_time");

-- CreateIndex
CREATE INDEX "calendar_events_start_time_end_time_idx" ON "calendar_events"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "calendar_participants_user_id_idx" ON "calendar_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_participants_event_id_user_id_key" ON "calendar_participants"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_shares_owner_id_shared_with_user_id_key" ON "calendar_shares"("owner_id", "shared_with_user_id");

-- CreateIndex
CREATE INDEX "conversations_type_last_message_at_idx" ON "conversations"("type", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_direct_user_low_id_direct_user_high_id_key" ON "conversations"("direct_user_low_id", "direct_user_high_id");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_left_at_idx" ON "conversation_participants"("user_id", "left_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_created_at_idx" ON "chat_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_messages_parent_message_id_idx" ON "chat_messages"("parent_message_id");

-- CreateIndex
CREATE INDEX "chat_attachments_asset_id_idx" ON "chat_attachments"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_attachments_message_id_asset_id_key" ON "chat_attachments"("message_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_reactions_message_id_user_id_emoji_key" ON "chat_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "chat_pinned_messages_conversation_id_message_id_key" ON "chat_pinned_messages"("conversation_id", "message_id");

-- CreateIndex
CREATE INDEX "drive_folders_owner_id_parent_folder_id_idx" ON "drive_folders"("owner_id", "parent_folder_id");

-- CreateIndex
CREATE INDEX "drive_files_owner_id_folder_id_idx" ON "drive_files"("owner_id", "folder_id");

-- CreateIndex
CREATE INDEX "drive_files_asset_id_idx" ON "drive_files"("asset_id");

-- CreateIndex
CREATE INDEX "drive_file_versions_asset_id_idx" ON "drive_file_versions"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "drive_file_versions_file_id_version_number_key" ON "drive_file_versions"("file_id", "version_number");

-- CreateIndex
CREATE INDEX "drive_permissions_user_id_idx" ON "drive_permissions"("user_id");

-- CreateIndex
CREATE INDEX "drive_permissions_file_id_idx" ON "drive_permissions"("file_id");

-- CreateIndex
CREATE INDEX "drive_permissions_folder_id_idx" ON "drive_permissions"("folder_id");

-- CreateIndex
CREATE INDEX "drive_recent_items_user_id_accessed_at_idx" ON "drive_recent_items"("user_id", "accessed_at");

-- CreateIndex
CREATE INDEX "drive_comments_file_id_created_at_idx" ON "drive_comments"("file_id", "created_at");

-- CreateIndex
CREATE INDEX "mail_messages_sender_id_sent_at_idx" ON "mail_messages"("sender_id", "sent_at");

-- CreateIndex
CREATE INDEX "mail_messages_thread_id_idx" ON "mail_messages"("thread_id");

-- CreateIndex
CREATE INDEX "mail_messages_parent_message_id_idx" ON "mail_messages"("parent_message_id");

-- CreateIndex
CREATE INDEX "mail_recipients_user_id_message_id_idx" ON "mail_recipients"("user_id", "message_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_recipients_message_id_user_id_recipient_type_key" ON "mail_recipients"("message_id", "user_id", "recipient_type");

-- CreateIndex
CREATE INDEX "mail_user_states_user_id_is_read_idx" ON "mail_user_states"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "mail_user_states_message_id_user_id_key" ON "mail_user_states"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "mail_attachments_asset_id_idx" ON "mail_attachments"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_attachments_message_id_asset_id_key" ON "mail_attachments"("message_id", "asset_id");

-- CreateIndex
CREATE INDEX "mail_drafts_user_id_updated_at_idx" ON "mail_drafts"("user_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "mail_draft_recipients_draft_id_user_id_recipient_type_key" ON "mail_draft_recipients"("draft_id", "user_id", "recipient_type");

-- CreateIndex
CREATE INDEX "mail_draft_attachments_asset_id_idx" ON "mail_draft_attachments"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_draft_attachments_draft_id_asset_id_key" ON "mail_draft_attachments"("draft_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_folders_user_id_name_key" ON "mail_folders"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "mail_folder_messages_folder_id_message_id_key" ON "mail_folder_messages"("folder_id", "message_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_labels_user_id_name_key" ON "mail_labels"("user_id", "name");

-- CreateIndex
CREATE INDEX "mail_message_labels_user_id_idx" ON "mail_message_labels"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_message_labels_message_id_label_id_key" ON "mail_message_labels"("message_id", "label_id");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_room_name_key" ON "meetings"("room_name");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_meeting_code_key" ON "meetings"("meeting_code");

-- CreateIndex
CREATE INDEX "meetings_host_id_status_idx" ON "meetings"("host_id", "status");

-- CreateIndex
CREATE INDEX "meetings_scheduled_start_idx" ON "meetings"("scheduled_start");

-- CreateIndex
CREATE INDEX "meeting_participants_user_id_idx" ON "meeting_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_meeting_id_user_id_key" ON "meeting_participants"("meeting_id", "user_id");

-- CreateIndex
CREATE INDEX "meeting_recordings_meeting_id_idx" ON "meeting_recordings"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_recordings_asset_id_idx" ON "meeting_recordings"("asset_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_cloudinary_asset_id_key" ON "file_assets"("cloudinary_asset_id");

-- CreateIndex
CREATE INDEX "file_assets_uploaded_by_idx" ON "file_assets"("uploaded_by");

-- CreateIndex
CREATE INDEX "file_assets_cloud_deleted_at_created_at_idx" ON "file_assets"("cloud_deleted_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_resource_type_delivery_type_public_id_key" ON "file_assets"("resource_type", "delivery_type", "public_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profile_image_id_fkey" FOREIGN KEY ("profile_image_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_participants" ADD CONSTRAINT "calendar_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_participants" ADD CONSTRAINT "calendar_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_reminders" ADD CONSTRAINT "calendar_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_reminders" ADD CONSTRAINT "calendar_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_shares" ADD CONSTRAINT "calendar_shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_shares" ADD CONSTRAINT "calendar_shares_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_user_low_id_fkey" FOREIGN KEY ("direct_user_low_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_user_high_id_fkey" FOREIGN KEY ("direct_user_high_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_pinned_messages" ADD CONSTRAINT "chat_pinned_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_pinned_messages" ADD CONSTRAINT "chat_pinned_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_pinned_messages" ADD CONSTRAINT "chat_pinned_messages_pinned_by_fkey" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "drive_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_versions" ADD CONSTRAINT "drive_file_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_versions" ADD CONSTRAINT "drive_file_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_versions" ADD CONSTRAINT "drive_file_versions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_permissions" ADD CONSTRAINT "drive_permissions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_permissions" ADD CONSTRAINT "drive_permissions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_permissions" ADD CONSTRAINT "drive_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_permissions" ADD CONSTRAINT "drive_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_favorites" ADD CONSTRAINT "drive_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_favorites" ADD CONSTRAINT "drive_favorites_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_favorites" ADD CONSTRAINT "drive_favorites_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_recent_items" ADD CONSTRAINT "drive_recent_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_recent_items" ADD CONSTRAINT "drive_recent_items_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_recent_items" ADD CONSTRAINT "drive_recent_items_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_comments" ADD CONSTRAINT "drive_comments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_comments" ADD CONSTRAINT "drive_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "mail_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_recipients" ADD CONSTRAINT "mail_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_recipients" ADD CONSTRAINT "mail_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_user_states" ADD CONSTRAINT "mail_user_states_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_user_states" ADD CONSTRAINT "mail_user_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_drafts" ADD CONSTRAINT "mail_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_drafts" ADD CONSTRAINT "mail_drafts_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "mail_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_draft_recipients" ADD CONSTRAINT "mail_draft_recipients_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "mail_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_draft_recipients" ADD CONSTRAINT "mail_draft_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_draft_attachments" ADD CONSTRAINT "mail_draft_attachments_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "mail_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_draft_attachments" ADD CONSTRAINT "mail_draft_attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_folders" ADD CONSTRAINT "mail_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_folder_messages" ADD CONSTRAINT "mail_folder_messages_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "mail_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_folder_messages" ADD CONSTRAINT "mail_folder_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_labels" ADD CONSTRAINT "mail_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_message_labels" ADD CONSTRAINT "mail_message_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_message_labels" ADD CONSTRAINT "mail_message_labels_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_message_labels" ADD CONSTRAINT "mail_message_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "mail_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_recordings" ADD CONSTRAINT "meeting_recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_recordings" ADD CONSTRAINT "meeting_recordings_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_recordings" ADD CONSTRAINT "meeting_recordings_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================
-- Custom Constraints and Partial Indexes
-- ==========================================================

-- 1. CHECK on calendar_events: start_time < end_time
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_start_before_end_check"
  CHECK ("start_time" < "end_time");

-- 2. CHECK on conversations: for DIRECT, both user columns set and low < high; for others, both NULL
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_users_check"
  CHECK (
    ("type" = 'DIRECT' AND "direct_user_low_id" IS NOT NULL AND "direct_user_high_id" IS NOT NULL AND "direct_user_low_id" < "direct_user_high_id")
    OR
    ("type" <> 'DIRECT' AND "direct_user_low_id" IS NULL AND "direct_user_high_id" IS NULL)
  );

-- 3. CHECK on conversations: visibility set only when type = 'CHANNEL'
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_visibility_check"
  CHECK (
    ("type" = 'CHANNEL' AND "visibility" IS NOT NULL)
    OR
    ("type" <> 'CHANNEL' AND "visibility" IS NULL)
  );

-- 4. CHECK exactly one of file_id or folder_id on drive_permissions, drive_favorites and drive_recent_items
ALTER TABLE "drive_permissions" ADD CONSTRAINT "drive_permissions_exactly_one_target_check"
  CHECK (
    ("file_id" IS NOT NULL AND "folder_id" IS NULL)
    OR
    ("file_id" IS NULL AND "folder_id" IS NOT NULL)
  );

ALTER TABLE "drive_favorites" ADD CONSTRAINT "drive_favorites_exactly_one_target_check"
  CHECK (
    ("file_id" IS NOT NULL AND "folder_id" IS NULL)
    OR
    ("file_id" IS NULL AND "folder_id" IS NOT NULL)
  );

ALTER TABLE "drive_recent_items" ADD CONSTRAINT "drive_recent_items_exactly_one_target_check"
  CHECK (
    ("file_id" IS NOT NULL AND "folder_id" IS NULL)
    OR
    ("file_id" IS NULL AND "folder_id" IS NOT NULL)
  );

-- 5. Six partial unique indexes on drive_permissions, drive_favorites and drive_recent_items
CREATE UNIQUE INDEX "drive_permissions_file_user_uidx" ON "drive_permissions" ("file_id", "user_id") WHERE "file_id" IS NOT NULL;
CREATE UNIQUE INDEX "drive_permissions_folder_user_uidx" ON "drive_permissions" ("folder_id", "user_id") WHERE "folder_id" IS NOT NULL;

CREATE UNIQUE INDEX "drive_favorites_file_user_uidx" ON "drive_favorites" ("file_id", "user_id") WHERE "file_id" IS NOT NULL;
CREATE UNIQUE INDEX "drive_favorites_folder_user_uidx" ON "drive_favorites" ("folder_id", "user_id") WHERE "folder_id" IS NOT NULL;

CREATE UNIQUE INDEX "drive_recent_items_file_user_uidx" ON "drive_recent_items" ("file_id", "user_id") WHERE "file_id" IS NOT NULL;
CREATE UNIQUE INDEX "drive_recent_items_folder_user_uidx" ON "drive_recent_items" ("folder_id", "user_id") WHERE "folder_id" IS NOT NULL;

-- 6. Partial index on calendar_reminders(remind_at) WHERE is_sent = false
CREATE INDEX "calendar_reminders_remind_at_unsent_idx" ON "calendar_reminders" ("remind_at") WHERE "is_sent" = false;

-- 7. Unique index on organization_settings ((true))
CREATE UNIQUE INDEX "organization_settings_single_row_idx" ON "organization_settings" ((true));
