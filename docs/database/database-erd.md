# Orvexa Platform — Entity-Relationship Diagram (ERD) Specification

## Document Control & Metadata

| Attribute | Specification |
| :--- | :--- |
| **Document Title** | Orvexa Enterprise Entity-Relationship Diagram (ERD) Specification |
| **Document Version** | `1.0.0` (Production Reference) |
| **Companion Specification** | [`database-design.md`](file:///workspace/Projects/Orvexa/docs/database/database-design.md) |
| **Target Engine** | PostgreSQL 16+ |
| **Diagramming Standard** | Crow's Foot Notation via Mermaid `erDiagram` |
| **Schema Reference** | `apps/api/prisma/schema/*.prisma` & `apps/api/prisma/migrations/` |
| **Total Entity Models** | 27 Physical Relational Tables |
| **Last Reviewed** | November 2026 |

---

## 1. Architectural Overview & Diagram Notation

This document provides visual topological models of the Orvexa enterprise database. The schema is anchored by two central hubs:
1. **`users`** — Central actor in the Identity, Authorization, Collaboration, Mail, Drive, Calendar, Meeting, and Audit domains.
2. **`file_assets`** — Central digital asset management (DAM) hub managing all physical media stored in Cloudinary.

### 1.1 Crow's Foot Cardinality Notation Reference

```
    ||--||    Exactly One to Exactly One
    ||--o|    Exactly One to Zero or One
    ||--|{    Exactly One to One or More
    ||--o{    Exactly One to Zero or More
```

---

## 2. High-Level Core Platform Architecture ERD

This high-level ERD illustrates the foundational inter-subsystem connections between primary domain anchors across the Orvexa platform.

```mermaid
erDiagram
    users ||--o| organization_settings : "manages_branding"
    users ||--o| file_assets : "has_avatar"
    users ||--o{ file_assets : "uploads"
    organization_settings ||--o| file_assets : "has_logo"

    %% Auth Subsystem
    users ||--o| credentials : "authenticates_with"
    users ||--o{ user_sessions : "maintains"
    users ||--o{ password_reset_tokens : "requests"
    users ||--o| user_preferences : "configures"

    %% Drive Subsystem
    users ||--o{ drive_folders : "owns"
    users ||--o{ drive_files : "owns"
    drive_folders ||--o{ drive_files : "contains"
    drive_files }|--|| file_assets : "references_asset"
    drive_files ||--|{ drive_file_versions : "versions"

    %% Chat Subsystem
    users ||--o{ conversation_participants : "participates_in"
    conversations ||--|{ conversation_participants : "has_members"
    conversations ||--o{ chat_messages : "contains"
    users ||--o{ chat_messages : "sends"
    chat_messages ||--o{ chat_attachments : "attaches"
    chat_attachments }|--|| file_assets : "links_asset"

    %% Mail Subsystem
    users ||--o{ mail_messages : "sends"
    mail_messages ||--|{ mail_recipients : "delivered_to"
    mail_messages ||--|{ mail_user_states : "per_user_state"
    mail_messages ||--o{ mail_attachments : "attaches"
    mail_attachments }|--|| file_assets : "links_asset"

    %% Calendar & Meetings
    users ||--o{ calendar_events : "organizes"
    calendar_events ||--o{ calendar_participants : "invites"
    users ||--o{ meetings : "hosts"
    meetings ||--o{ meeting_participants : "attends"
    meetings ||--o{ meeting_recordings : "records"
    meeting_recordings }|--|| file_assets : "persists_as"
    calendar_events }o--o| meetings : "integrates"
    meetings }o--o| conversations : "binds_chat"

    %% Notifications & Audit
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "triggers"
```

---

## 3. Subsystem Domain Deep-Dive ERDs

---

### 3.1 Identity & Access Management (IAM) Domain

Stores user identities, credentials, active sessions, password reset tokens, and localized preferences.

```mermaid
erDiagram
    users ||--o| credentials : "has"
    users ||--o{ user_sessions : "owns"
    users ||--o{ password_reset_tokens : "requests"
    users ||--o| user_preferences : "configures"
    users }o--o| file_assets : "profile_image"

    users {
        bigint id PK
        varchar full_name
        bigint profile_image_id FK
        varchar email UK
        varchar phone
        date dob
        varchar gender
        text address
        UserRole role
        boolean is_active
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    credentials {
        bigint id PK
        bigint user_id FK,UK
        varchar password_hash
        timestamptz password_changed_at
        integer failed_login_attempts
        timestamptz locked_until
        timestamptz created_at
        timestamptz updated_at
    }

    user_sessions {
        bigint id PK
        bigint user_id FK
        varchar refresh_token_hash
        varchar device_name
        text user_agent
        varchar ip_address
        timestamptz last_used_at
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
    }

    password_reset_tokens {
        bigint id PK
        bigint user_id FK
        varchar token_hash UK
        timestamptz expires_at
        timestamptz used_at
        timestamptz created_at
    }

    user_preferences {
        bigint id PK
        bigint user_id FK,UK
        varchar theme
        varchar language
        varchar timezone
        jsonb notification_preferences
        timestamptz created_at
        timestamptz updated_at
    }
```

---

### 3.2 Organization Settings & Media Storage (DAM) Domain

Centralized asset registry abstracting Cloudinary cloud storage and workspace-level configuration.

```mermaid
erDiagram
    organization_settings }o--o| file_assets : "brand_logo"
    users ||--o{ file_assets : "uploads"

    organization_settings {
        bigint id PK
        varchar organization_name
        bigint logo_id FK
        varchar timezone
        timestamptz created_at
        timestamptz updated_at
    }

    file_assets {
        bigint id PK
        varchar cloudinary_asset_id UK
        varchar public_id
        CloudinaryResourceType resource_type
        CloudinaryDeliveryType delivery_type
        integer version
        varchar format
        varchar original_filename
        varchar mime_type
        bigint bytes
        text secure_url
        integer width
        integer height
        double_precision duration_seconds
        bigint uploaded_by FK
        timestamptz cloud_deleted_at
        timestamptz created_at
    }
```

---

### 3.3 Cloud Drive & Document Management Subsystem (DMS)

Hierarchical directories, versioned files, granular sharing permissions, comments, favorites, and access logs.

```mermaid
erDiagram
    drive_folders ||--o{ drive_folders : "parent_to_subfolders"
    drive_folders ||--o{ drive_files : "contains"
    users ||--o{ drive_folders : "owns"
    users ||--o{ drive_files : "owns"

    drive_files ||--|{ drive_file_versions : "historical_versions"
    drive_files }|--|| file_assets : "current_asset"
    drive_file_versions }|--|| file_assets : "version_asset"
    users ||--o{ drive_file_versions : "uploads"

    drive_files ||--o{ drive_comments : "annotated_by"
    users ||--o{ drive_comments : "authors"

    %% XOR Polymorphic Permissions, Favorites, Recents
    drive_folders ||--o{ drive_permissions : "shared_folder"
    drive_files ||--o{ drive_permissions : "shared_file"
    users ||--o{ drive_permissions : "granted_to"
    users ||--o{ drive_permissions : "granted_by"

    drive_folders ||--o{ drive_favorites : "favorited_folder"
    drive_files ||--o{ drive_favorites : "favorited_file"
    users ||--o{ drive_favorites : "user_favorites"

    drive_folders ||--o{ drive_recent_items : "recent_folder"
    drive_files ||--o{ drive_recent_items : "recent_file"
    users ||--o{ drive_recent_items : "user_recents"

    drive_folders {
        bigint id PK
        varchar name
        bigint owner_id FK
        bigint parent_folder_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
        bigint deleted_by FK
    }

    drive_files {
        bigint id PK
        varchar name
        bigint owner_id FK
        bigint folder_id FK
        bigint asset_id FK
        integer current_version
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
        bigint deleted_by FK
    }

    drive_file_versions {
        bigint id PK
        bigint file_id FK
        integer version_number
        bigint asset_id FK
        bigint uploaded_by FK
        timestamptz created_at
    }

    drive_permissions {
        bigint id PK
        bigint file_id FK
        bigint folder_id FK
        bigint user_id FK
        DriveAccessLevel access_level
        bigint granted_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    drive_favorites {
        bigint id PK
        bigint user_id FK
        bigint file_id FK
        bigint folder_id FK
        timestamptz created_at
    }

    drive_recent_items {
        bigint id PK
        bigint user_id FK
        bigint file_id FK
        bigint folder_id FK
        timestamptz accessed_at
    }

    drive_comments {
        bigint id PK
        bigint file_id FK
        bigint user_id FK
        text content
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
```

---

### 3.4 Real-Time Chat, Channels & Messaging Subsystem

Supports 1-on-1 direct rooms, multi-user groups, and broadcast channels with rich message types, reactions, threaded replies, and pinned items.

```mermaid
erDiagram
    conversations ||--|{ conversation_participants : "members"
    users ||--o{ conversation_participants : "user_memberships"
    conversations ||--o{ chat_messages : "message_stream"
    users ||--o{ chat_messages : "authors"
    chat_messages ||--o{ chat_messages : "replies_to"

    chat_messages ||--o{ chat_attachments : "includes"
    chat_attachments }|--|| file_assets : "asset"

    chat_messages ||--o{ chat_reactions : "receives"
    users ||--o{ chat_reactions : "reacts"

    conversations ||--o{ chat_pinned_messages : "pinned_in"
    chat_messages ||--o{ chat_pinned_messages : "is_pinned"
    users ||--o{ chat_pinned_messages : "pinned_by"

    conversations }o--o| file_assets : "avatar_image"
    conversations }o--o| users : "direct_low_user"
    conversations }o--o| users : "direct_high_user"
    conversations }o--|| users : "creator"

    conversations {
        bigint id PK
        ConversationType type
        ChannelVisibility visibility
        varchar name
        text description
        bigint image_id FK
        bigint direct_user_low_id FK
        bigint direct_user_high_id FK
        bigint created_by FK
        timestamptz last_message_at
        timestamptz created_at
        timestamptz updated_at
        timestamptz archived_at
    }

    conversation_participants {
        bigint id PK
        bigint conversation_id FK
        bigint user_id FK
        ConversationMemberRole member_role
        timestamptz joined_at
        timestamptz left_at
        boolean is_muted
        boolean is_archived
        boolean is_pinned
        bigint last_read_message_id FK
        timestamptz last_read_at
    }

    chat_messages {
        bigint id PK
        bigint conversation_id FK
        bigint sender_id FK
        bigint parent_message_id FK
        text content
        ChatMessageType message_type
        boolean is_edited
        timestamptz edited_at
        timestamptz deleted_at
        bigint deleted_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    chat_attachments {
        bigint id PK
        bigint message_id FK
        bigint asset_id FK
        timestamptz created_at
    }

    chat_reactions {
        bigint id PK
        bigint message_id FK
        bigint user_id FK
        varchar emoji
        timestamptz created_at
    }

    chat_pinned_messages {
        bigint id PK
        bigint conversation_id FK
        bigint message_id FK
        bigint pinned_by FK
        timestamptz created_at
    }
```

---

### 3.5 Unified Mail Collaboration Subsystem

RFC 5322 email transmission with per-user decoupled state (read/star/archive/trash), custom folder trees, color labels, and draft autosaving.

```mermaid
erDiagram
    users ||--o{ mail_messages : "sends"
    mail_messages ||--o{ mail_messages : "replies_to"
    mail_messages ||--|{ mail_recipients : "recipients"
    users ||--o{ mail_recipients : "recipient_user"

    mail_messages ||--|{ mail_user_states : "per_user_views"
    users ||--o{ mail_user_states : "state_owner"

    mail_messages ||--o{ mail_attachments : "has"
    mail_attachments }|--|| file_assets : "asset"

    users ||--o{ mail_drafts : "authors"
    mail_drafts }o--o| mail_messages : "replying_to"
    mail_drafts ||--o{ mail_draft_recipients : "draft_recipients"
    users ||--o{ mail_draft_recipients : "draft_user"
    mail_drafts ||--o{ mail_draft_attachments : "draft_attachments"
    mail_draft_attachments }|--|| file_assets : "asset"

    users ||--o{ mail_folders : "creates"
    mail_folders ||--o{ mail_folder_messages : "organizes"
    mail_messages ||--o{ mail_folder_messages : "filed_under"

    users ||--o{ mail_labels : "defines"
    mail_labels ||--o{ mail_message_labels : "tags"
    mail_messages ||--o{ mail_message_labels : "labeled_with"
    users ||--o{ mail_message_labels : "tagged_by"

    mail_messages {
        bigint id PK
        bigint sender_id FK
        bigint thread_id
        bigint parent_message_id FK
        varchar subject
        text body
        timestamptz sent_at
        timestamptz created_at
        timestamptz updated_at
    }

    mail_recipients {
        bigint id PK
        bigint message_id FK
        bigint user_id FK
        MailRecipientType recipient_type
        timestamptz created_at
    }

    mail_user_states {
        bigint id PK
        bigint message_id FK
        bigint user_id FK
        boolean is_read
        timestamptz read_at
        boolean is_starred
        boolean is_archived
        boolean is_trashed
        timestamptz trashed_at
        timestamptz created_at
        timestamptz updated_at
    }

    mail_attachments {
        bigint id PK
        bigint message_id FK
        bigint asset_id FK
        timestamptz created_at
    }

    mail_drafts {
        bigint id PK
        bigint user_id FK
        bigint parent_message_id FK
        varchar subject
        text body
        timestamptz created_at
        timestamptz updated_at
    }

    mail_draft_recipients {
        bigint id PK
        bigint draft_id FK
        bigint user_id FK
        MailRecipientType recipient_type
        timestamptz created_at
    }

    mail_draft_attachments {
        bigint id PK
        bigint draft_id FK
        bigint asset_id FK
        timestamptz created_at
    }

    mail_folders {
        bigint id PK
        bigint user_id FK
        varchar name
        timestamptz created_at
        timestamptz updated_at
    }

    mail_folder_messages {
        bigint id PK
        bigint folder_id FK
        bigint message_id FK
        timestamptz created_at
    }

    mail_labels {
        bigint id PK
        bigint user_id FK
        varchar name
        varchar color
        timestamptz created_at
    }

    mail_message_labels {
        bigint id PK
        bigint user_id FK
        bigint message_id FK
        bigint label_id FK
        timestamptz created_at
    }
```

---

### 3.6 Calendar & Video Meetings Subsystem

Event scheduling, attendee RSVPs, cron reminders, calendar sharing, and LiveKit WebRTC meetings with recordings.

```mermaid
erDiagram
    users ||--o{ calendar_events : "organizes"
    calendar_events ||--o{ calendar_participants : "invites"
    users ||--o{ calendar_participants : "attendee"
    calendar_events ||--o{ calendar_reminders : "schedules"
    users ||--o{ calendar_reminders : "reminder_target"

    users ||--o{ calendar_shares : "owner"
    users ||--o{ calendar_shares : "delegated_to"

    users ||--o{ meetings : "hosts"
    meetings ||--o{ meeting_participants : "attendees"
    users ||--o{ meeting_participants : "participant_user"
    meetings ||--o{ meeting_recordings : "recordings"
    meeting_recordings }|--|| file_assets : "asset"
    users ||--o{ meeting_recordings : "started_by"

    calendar_events }o--o| meetings : "meeting_link"
    meetings }o--o| conversations : "chat_link"

    calendar_events {
        bigint id PK
        varchar title
        text description
        bigint created_by FK
        timestamptz start_time
        timestamptz end_time
        boolean is_all_day
        varchar timezone
        varchar location
        CalendarEventType event_type
        EventVisibility visibility
        text recurrence_rule
        bigint meeting_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz cancelled_at
    }

    calendar_participants {
        bigint id PK
        bigint event_id FK
        bigint user_id FK
        InvitationStatus response_status
        timestamptz created_at
        timestamptz updated_at
    }

    calendar_reminders {
        bigint id PK
        bigint event_id FK
        bigint user_id FK
        integer minutes_before
        timestamptz remind_at
        boolean is_sent
        timestamptz sent_at
        timestamptz created_at
    }

    calendar_shares {
        bigint id PK
        bigint owner_id FK
        bigint shared_with_user_id FK
        CalendarAccessLevel permission
        timestamptz created_at
        timestamptz updated_at
    }

    meetings {
        bigint id PK
        varchar title
        text description
        bigint host_id FK
        varchar room_name UK
        varchar meeting_code UK
        bigint conversation_id FK
        timestamptz scheduled_start
        timestamptz scheduled_end
        timestamptz started_at
        timestamptz ended_at
        MeetingStatus status
        timestamptz created_at
        timestamptz updated_at
    }

    meeting_participants {
        bigint id PK
        bigint meeting_id FK
        bigint user_id FK
        MeetingRole meeting_role
        InvitationStatus invitation_status
        timestamptz joined_at
        timestamptz left_at
        timestamptz created_at
    }

    meeting_recordings {
        bigint id PK
        bigint meeting_id FK
        bigint asset_id FK
        bigint started_by FK
        timestamptz created_at
    }
```

---

### 3.7 Notifications & Activity Audit Trail Subsystem

Central notification inbox with polymorphic referencing, and an append-only compliance audit trail.

```mermaid
erDiagram
    users ||--o{ notifications : "recipient"
    users ||--o{ notifications : "actor"
    users ||--o{ audit_logs : "actor"

    notifications {
        bigint id PK
        bigint user_id FK
        bigint actor_id FK
        varchar title
        text message
        NotificationType type
        bigint reference_id
        varchar reference_type
        varchar action_url
        boolean is_read
        timestamptz read_at
        timestamptz created_at
    }

    audit_logs {
        bigint id PK
        bigint user_id FK
        varchar action
        varchar entity_type
        bigint entity_id
        varchar ip_address
        text user_agent
        jsonb details
        timestamptz created_at
    }
```

---

## 4. Comprehensive Foreign Key & Cardinality Reference Matrix

The following matrix documents all 50+ foreign key constraints in the Orvexa database, detailing relationship cardinality, source/target tables, and PostgreSQL referential delete actions.

| # | Source Table | Foreign Key Column | Target Table | Target Column | Cardinality | ON DELETE Action | Business Meaning / Dependency |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `organization_settings` | `logo_id` | `file_assets` | `id` | `N:0..1` | `SET NULL` | Organization branding logo image. |
| **2** | `users` | `profile_image_id` | `file_assets` | `id` | `N:0..1` | `SET NULL` | User avatar image. |
| **3** | `credentials` | `user_id` | `users` | `id` | `1:1` | `CASCADE` | User authentication secret credentials. |
| **4** | `user_sessions` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | User client login session tokens. |
| **5** | `password_reset_tokens`| `user_id` | `users` | `id` | `N:1` | `CASCADE` | Ephemeral reset verification tokens. |
| **6** | `user_preferences` | `user_id` | `users` | `id` | `1:1` | `CASCADE` | UI and notification settings per user. |
| **7** | `file_assets` | `uploaded_by` | `users` | `id` | `N:0..1` | `SET NULL` | User who uploaded the physical asset. |
| **8** | `drive_folders` | `owner_id` | `users` | `id` | `N:1` | `RESTRICT` | Prevent deleting users owning active folders. |
| **9** | `drive_folders` | `parent_folder_id` | `drive_folders` | `id` | `N:0..1` | `RESTRICT` | Self-referencing directory tree hierarchy. |
| **10**| `drive_folders` | `deleted_by` | `users` | `id` | `N:0..1` | `SET NULL` | User who soft-deleted the directory. |
| **11**| `drive_files` | `owner_id` | `users` | `id` | `N:1` | `RESTRICT` | Prevent deleting users owning active files. |
| **12**| `drive_files` | `folder_id` | `drive_folders` | `id` | `N:0..1` | `RESTRICT` | Parent folder containment (`NULL` = root). |
| **13**| `drive_files` | `asset_id` | `file_assets` | `id` | `N:1` | `RESTRICT` | Current active file asset head pointer. |
| **14**| `drive_files` | `deleted_by` | `users` | `id` | `N:0..1` | `SET NULL` | User who soft-deleted the file. |
| **15**| `drive_file_versions` | `file_id` | `drive_files` | `id` | `N:1` | `CASCADE` | Historical file revision log. |
| **16**| `drive_file_versions` | `asset_id` | `file_assets` | `id` | `N:1` | `RESTRICT` | Immutable binary asset for this version. |
| **17**| `drive_file_versions` | `uploaded_by` | `users` | `id` | `N:1` | `RESTRICT` | User who submitted the revision. |
| **18**| `drive_permissions` | `file_id` | `drive_files` | `id` | `N:0..1` | `CASCADE` | XOR file permission target. |
| **19**| `drive_permissions` | `folder_id` | `drive_folders` | `id` | `N:0..1` | `CASCADE` | XOR folder permission target. |
| **20**| `drive_permissions` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Granted recipient user. |
| **21**| `drive_permissions` | `granted_by` | `users` | `id` | `N:1` | `RESTRICT` | Authorizing manager user. |
| **22**| `drive_favorites` | `file_id` | `drive_files` | `id` | `N:0..1` | `CASCADE` | XOR favorited file target. |
| **23**| `drive_favorites` | `folder_id` | `drive_folders` | `id` | `N:0..1` | `CASCADE` | XOR favorited folder target. |
| **24**| `drive_favorites` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | User who favorited the item. |
| **25**| `drive_recent_items` | `file_id` | `drive_files` | `id` | `N:0..1` | `CASCADE` | XOR recent file target. |
| **26**| `drive_recent_items` | `folder_id` | `drive_folders` | `id` | `N:0..1` | `CASCADE` | XOR recent folder target. |
| **27**| `drive_recent_items` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | User who accessed the item. |
| **28**| `drive_comments` | `file_id` | `drive_files` | `id` | `N:1` | `CASCADE` | File annotation conversation thread. |
| **29**| `drive_comments` | `user_id` | `users` | `id` | `N:1` | `RESTRICT` | Author of the comment. |
| **30**| `conversations` | `image_id` | `file_assets` | `id` | `N:0..1` | `SET NULL` | Conversation/channel avatar graphic. |
| **31**| `conversations` | `direct_user_low_id` | `users` | `id` | `N:0..1` | `SET NULL` | Canonical low user ID for 1-on-1 direct rooms. |
| **32**| `conversations` | `direct_user_high_id`| `users` | `id` | `N:0..1` | `SET NULL` | Canonical high user ID for 1-on-1 direct rooms. |
| **33**| `conversations` | `created_by` | `users` | `id` | `N:1` | `RESTRICT` | Room initiator / owner. |
| **34**| `conversation_participants`| `conversation_id`| `conversations` | `id` | `N:1` | `CASCADE` | Room membership mapping. |
| **35**| `conversation_participants`| `user_id` | `users` | `id` | `N:1` | `CASCADE` | Participating member user. |
| **36**| `conversation_participants`| `last_read_message_id`| `chat_messages`| `id`| `N:0..1`| `SET NULL` | Watermark cursor for unread counters. |
| **37**| `chat_messages` | `conversation_id` | `conversations` | `id` | `N:1` | `CASCADE` | Messages in room stream. |
| **38**| `chat_messages` | `sender_id` | `users` | `id` | `N:1` | `RESTRICT` | Author of the message. |
| **39**| `chat_messages` | `parent_message_id` | `chat_messages` | `id` | `N:0..1` | `SET NULL` | Threaded reply parent pointer. |
| **40**| `chat_messages` | `deleted_by` | `users` | `id` | `N:0..1` | `SET NULL` | User who soft-deleted the message. |
| **41**| `chat_attachments` | `message_id` | `chat_messages` | `id` | `N:1` | `CASCADE` | Message attachments. |
| **42**| `chat_attachments` | `asset_id` | `file_assets` | `id` | `N:1` | `RESTRICT` | Attached physical media asset. |
| **43**| `chat_reactions` | `message_id` | `chat_messages` | `id` | `N:1` | `CASCADE` | Emoji reaction targets. |
| **44**| `chat_reactions` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | User who reacted. |
| **45**| `chat_pinned_messages`| `conversation_id`| `conversations` | `id` | `N:1` | `CASCADE` | Room pinned list. |
| **46**| `chat_pinned_messages`| `message_id` | `chat_messages` | `id` | `N:1` | `CASCADE` | Target pinned message. |
| **47**| `chat_pinned_messages`| `pinned_by` | `users` | `id` | `N:1` | `RESTRICT` | Moderator who pinned the message. |
| **48**| `mail_messages` | `sender_id` | `users` | `id` | `N:1` | `RESTRICT` | Author of the sent email. |
| **49**| `mail_messages` | `parent_message_id` | `mail_messages` | `id` | `N:0..1` | `SET NULL` | Email reply chain thread parent. |
| **50**| `mail_recipients` | `message_id` | `mail_messages` | `id` | `N:1` | `CASCADE` | Delivery routing list. |
| **51**| `mail_recipients` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Recipient user ID. |
| **52**| `mail_user_states` | `message_id` | `mail_messages` | `id` | `N:1` | `CASCADE` | Per-user decoupled state (read/star/trash). |
| **53**| `mail_user_states` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | State owner. |
| **54**| `mail_attachments` | `message_id` | `mail_messages` | `id` | `N:1` | `CASCADE` | Email attachment list. |
| **55**| `mail_attachments` | `asset_id` | `file_assets` | `id` | `N:1` | `RESTRICT` | Attachment physical media asset. |
| **56**| `mail_drafts` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Draft author. |
| **57**| `mail_drafts` | `parent_message_id` | `mail_messages` | `id` | `N:0..1` | `SET NULL` | Email being replied to in draft. |
| **58**| `mail_draft_recipients`| `draft_id` | `mail_drafts` | `id` | `N:1` | `CASCADE` | Draft recipient staging. |
| **59**| `mail_draft_recipients`| `user_id` | `users` | `id` | `N:1` | `CASCADE` | Staged recipient user. |
| **60**| `mail_draft_attachments`| `draft_id` | `mail_drafts` | `id` | `N:1` | `CASCADE` | Staged draft attachments. |
| **61**| `mail_draft_attachments`| `asset_id` | `file_assets` | `id` | `N:1` | `RESTRICT` | Staged media asset. |
| **62**| `mail_folders` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Custom user folder tree. |
| **63**| `mail_folder_messages`| `folder_id` | `mail_folders` | `id` | `N:1` | `CASCADE` | Folder containment mapping. |
| **64**| `mail_folder_messages`| `message_id` | `mail_messages` | `id` | `N:1` | `CASCADE` | Message inside folder. |
| **65**| `mail_labels` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Custom user label tags. |
| **66**| `mail_message_labels` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Label assignment owner. |
| **67**| `mail_message_labels` | `message_id` | `mail_messages` | `id` | `N:1` | `CASCADE` | Labeled email message. |
| **68**| `mail_message_labels` | `label_id` | `mail_labels` | `id` | `N:1` | `CASCADE` | Assigned label tag. |
| **69**| `calendar_events` | `created_by` | `users` | `id` | `N:1` | `RESTRICT` | Event creator / organizer. |
| **70**| `calendar_events` | `meeting_id` | `meetings` | `id` | `N:0..1` | `SET NULL` | Cross-linked WebRTC meeting room. |
| **71**| `calendar_participants`| `event_id` | `calendar_events` | `id` | `N:1` | `CASCADE` | Event invitees / attendees. |
| **72**| `calendar_participants`| `user_id` | `users` | `id` | `N:1` | `CASCADE` | Invitee user. |
| **73**| `calendar_reminders` | `event_id` | `calendar_events` | `id` | `N:1` | `CASCADE` | Scheduled event alert queue. |
| **74**| `calendar_reminders` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Alert recipient user. |
| **75**| `calendar_shares` | `owner_id` | `users` | `id` | `N:1` | `CASCADE` | Delegating calendar owner. |
| **76**| `calendar_shares` | `shared_with_user_id`| `users` | `id` | `N:1` | `CASCADE` | Authorized recipient user. |
| **77**| `meetings` | `host_id` | `users` | `id` | `N:1` | `RESTRICT` | LiveKit meeting host. |
| **78**| `meetings` | `conversation_id` | `conversations` | `id` | `N:0..1` | `SET NULL` | Persistent meeting chat room. |
| **79**| `meeting_participants`| `meeting_id` | `meetings` | `id` | `N:1` | `CASCADE` | Meeting attendees & RSVP tracking. |
| **80**| `meeting_participants`| `user_id` | `users` | `id` | `N:1` | `CASCADE` | Attendee user. |
| **81**| `meeting_recordings` | `meeting_id` | `meetings` | `id` | `N:1` | `CASCADE` | Conference recordings. |
| **82**| `meeting_recordings` | `asset_id` | `file_assets` | `id` | `N:1` | `RESTRICT` | Physical video/audio media asset. |
| **83**| `meeting_recordings` | `started_by` | `users` | `id` | `N:0..1` | `SET NULL` | User who initiated recording. |
| **84**| `notifications` | `user_id` | `users` | `id` | `N:1` | `CASCADE` | Notification recipient. |
| **85**| `notifications` | `actor_id` | `users` | `id` | `N:0..1` | `SET NULL` | Triggering actor user. |
| **86**| `audit_logs` | `user_id` | `users` | `id` | `N:0..1` | `SET NULL` | Acting user (`NULL` = system task). |

---

## 5. Topological Notes & Special Constraint Structures

### 5.1 Self-Referencing Recursive Trees
Three distinct models in Orvexa utilize hierarchical self-referencing relationships:
1. **`drive_folders`:** `parent_folder_id` references `drive_folders.id` with `ON DELETE RESTRICT`, preventing accidental recursive subtree deletion without explicit client confirmation.
2. **`chat_messages`:** `parent_message_id` references `chat_messages.id` with `ON DELETE SET NULL`, preserving conversational context while decoupling reply chains.
3. **`mail_messages`:** `parent_message_id` references `mail_messages.id` with `ON DELETE SET NULL`, maintaining threaded email conversation grouping.

### 5.2 Exclusive Arc (XOR) Polymorphic Patterns
For `drive_permissions`, `drive_favorites`, and `drive_recent_items`:
- A database check constraint enforces that exactly one of `file_id` or `folder_id` is non-null:
  $$\left(\text{file\_id} \text{ IS NOT NULL} \land \text{folder\_id} \text{ IS NULL}\right) \lor \left(\text{file\_id} \text{ IS NULL} \land \text{folder\_id} \text{ IS NOT NULL}\right)$$
- Partial unique indexes enforce idempotency per user per target node without resorting to unconstrained polymorphic string columns.

### 5.3 Canonical Direct Message Pair Constraint
In `conversations`:
- For 1-on-1 direct rooms (`type = 'DIRECT'`), `direct_user_low_id < direct_user_high_id` is strictly enforced by check constraint.
- The composite unique index on `("direct_user_low_id", "direct_user_high_id")` guarantees that only one direct room can ever exist between any two users in the workspace.
