<div align="center">

  <img src="apps/web/public/images/icon.svg" alt="Orvexa Logo" width="88" height="88" />

  <h1>Orvexa</h1>

  <p><strong>Unified Digital Workspace &amp; Real-Time Collaboration Engine</strong></p>

  <p>
    Consolidating customizable Home command center &amp; <code>⌘K</code> federated search, 60 FPS Socket.IO Chat &amp; Spaces, sub-100ms LiveKit WebRTC Meet, versioned Cloud Drive with Exclusive-Arc RBAC, threaded Webmail, and RRULE Calendar &amp; Tasks into a single self-hosted TypeScript monorepo.
  </p>

  <p>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 6.0" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.3-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19" /></a>
    <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5.3-111111?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-7.10-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma 7" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16+" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO 4.8" /></a>
    <a href="https://livekit.io/"><img src="https://img.shields.io/badge/LiveKit-WebRTC-FF5A1F?style=for-the-badge&logo=webrtc&logoColor=white" alt="LiveKit WebRTC" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" alt="MIT License" /></a>
  </p>

  <p>
    <a href="#executive-overview">Overview</a> &bull;
    <a href="#workspace-suite">Workspace Suite</a> &bull;
    <a href="#system-architecture">Architecture</a> &bull;
    <a href="#tech-stack">Tech Stack</a> &bull;
    <a href="#engineering-highlights">Engineering</a> &bull;
    <a href="#domain-modules-and-api-reference">API &amp; Sockets</a> &bull;
    <a href="#monorepo-and-database-topology">Schema &amp; Repo</a> &bull;
    <a href="#getting-started">Getting Started</a> &bull;
    <a href="#scripts-and-automated-testing">Testing</a> &bull;
    <a href="#security-architecture">Security</a>
  </p>

</div>

---

<details>
<summary><strong>Table of Contents</strong> &mdash; Click to expand full navigation</summary>

1. [Executive Overview](#executive-overview)
2. [Workspace Suite](#workspace-suite)
3. [System Architecture](#system-architecture)
4. [Tech Stack](#tech-stack)
5. [Engineering Highlights](#engineering-highlights)
6. [Domain Modules and API Reference](#domain-modules-and-api-reference)
7. [Monorepo and Database Topology](#monorepo-and-database-topology)
8. [Getting Started](#getting-started)
9. [Scripts and Automated Testing](#scripts-and-automated-testing)
10. [Security Architecture](#security-architecture)
11. [Roadmap](#roadmap)
12. [Contributing and Documentation](#contributing-and-documentation)
13. [License](#license)

</details>

---

## Executive Overview

**Orvexa** is an enterprise-grade, self-hosted digital workspace platform built as a cohesive pnpm TypeScript monorepo (`@orvexa/web` + `@orvexa/api`). It eliminates tool fragmentation and context switching by uniting real-time messaging, WebRTC video conferencing, hierarchical cloud file storage, internal workspace webmail, calendar scheduling, task management, and cross-module discovery inside one unified runtime.

Unlike loosely coupled SaaS mashups, Orvexa is engineered around shared identity, database-enforced mathematical invariants, and a unified asset model across **51 PostgreSQL tables** and **48 automated test suites**.

| Pillar | Architectural Guarantee |
| :--- | :--- |
| **Lossless 64-Bit Identity** | PostgreSQL `BIGINT` (`BIGSERIAL`) keys across every table, serialized losslessly to strings via `BigInt.prototype.toJSON`. |
| **Schema-Enforced Invariants** | Exclusive-Arc (XOR) foreign keys, canonical `1:1` DM ordering (`low < high`), and `start_time < end_time` enforced in SQL. |
| **Locked 60 FPS Real-Time UI** | `@tanstack/react-virtual` DOM recycling paired with Socket.IO 4.8 presence, typing indicators, and idempotent dispatch. |
| **Sub-100ms WebRTC Media** | LiveKit Selective Forwarding Unit (SFU) with cryptographic `xxx-yyyy-zzz` room codes, host knock-to-join waiting rooms, and scoped JWT grants. |
| **Hybrid Asset & Blob Pipeline** | Cloudinary CDN for avatars, chat, and mail attachments alongside pluggable local/chunked blob storage, Sharp WebP thumbnails, and streamed ZIP archives. |
| **Zero-Trust Session Defense** | Argon2id password hashing, constant-time dummy verification, account lockouts, rotating `SHA-256` refresh sessions in `HttpOnly` cookies, and audit logging. |

---

## Workspace Suite

Orvexa consolidates eight tightly integrated modules behind a single workspace shell, App Switcher, and global `⌘K` search modal:

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>Home Command Center &amp; <code>⌘K</code> Search</h3>
      <p>
        <img src="https://img.shields.io/badge/Aggregation-Promise.allSettled-0B57D0?style=flat-square" alt="Fault-Isolated Aggregation" />
        <img src="https://img.shields.io/badge/Discovery-Global_%E2%8C%98K-1A73E8?style=flat-square" alt="Global Search" />
      </p>
      <ul>
        <li><b>Fault-Isolated Dashboard:</b> Aggregates Mail, Chat, Calendar, Meet, Drive, Tasks, and Activity slices concurrently so partial errors never crash the workspace.</li>
        <li><b>Customizable Layout:</b> Per-user widget ordering, collapse state, visibility, and sizing persisted in <code>user_dashboard_preferences</code>.</li>
        <li><b>Cross-Module Search (<code>⌘K</code>):</b> Federated instant search spanning Mail threads, Chat messages/people/spaces, Calendar events, and Drive items with deep linking.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Chat &amp; Spaces</h3>
      <p>
        <img src="https://img.shields.io/badge/Transport-Socket.IO_4.8-010101?style=flat-square" alt="Socket.IO" />
        <img src="https://img.shields.io/badge/Scroll-TanStack_Virtual-00AC47?style=flat-square" alt="TanStack Virtual" />
      </p>
      <ul>
        <li><b>DMs, Groups &amp; Channels:</b> Canonical deduplicated <code>1:1</code> direct threads plus public/private team spaces with role management.</li>
        <li><b>60 FPS Virtualized Stream:</b> High-volume feed rendering with <code>clientMessageId</code> idempotency and optimistic state reconciliation.</li>
        <li><b>Rich Collaboration:</b> Threaded replies, <code>@user</code> and <code>@all</code> mentions, emoji reactions, message pinning, file attachments, watermark read cursors, and live presence (<code>ACTIVE</code>, <code>AWAY</code>, <code>DND</code>).</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>Meet (LiveKit WebRTC)</h3>
      <p>
        <img src="https://img.shields.io/badge/Media_SFU-LiveKit_WebRTC-FF5A1F?style=flat-square" alt="LiveKit SFU" />
        <img src="https://img.shields.io/badge/Room_Codes-xxx--yyyy--zzz-00832D?style=flat-square" alt="Room Codes" />
      </p>
      <ul>
        <li><b>Multi-Party HD Video &amp; Audio:</b> Low-latency SFU routing with adaptive speaker grids, screen sharing, device pickers, and isolated full-screen routes (<code>/meet/:code</code>).</li>
        <li><b>Host Waiting Room:</b> Real-time <code>meet:knock</code> lobby admitting or denying attendees individually or in bulk (<code>meet:admit_all</code>).</li>
        <li><b>Moderation &amp; In-Call Chat:</b> Room locking, scoped LiveKit JWTs, host toggles for screen share, chat, and reactions, webhook syncing, and persistent <code>meeting_messages</code>.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Drive (Cloud File Management)</h3>
      <p>
        <img src="https://img.shields.io/badge/RBAC-Exclusive_Arc_XOR-DC2626?style=flat-square" alt="Exclusive Arc XOR" />
        <img src="https://img.shields.io/badge/Streaming-Archiver_%2B_Range-F29900?style=flat-square" alt="Streaming" />
      </p>
      <ul>
        <li><b>Resumable &amp; Batch Uploads:</b> Chunked upload sessions (<code>init</code> / <code>chunk</code> / <code>complete</code> / <code>abort</code>), folder tree ingestion, and recursive CTE traversal.</li>
        <li><b>Granular Access &amp; Sharing:</b> Inherited folder RBAC (<code>OWNER</code> &gt; <code>MANAGER</code> &gt; <code>EDITOR</code> &gt; <code>COMMENTER</code> &gt; <code>VIEWER</code>), share links (<code>/drive/s/:token</code>), access requests, and download/reshare locks.</li>
        <li><b>Versioning, Previews &amp; ZIPs:</b> Full revision history &amp; rollbacks, HTTP <code>Range</code> media streaming, Sharp WebP thumbnails, shortcuts, comments, zero-buffer ZIP downloads, and 30-day trash auto-purge.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>Mail (Workspace Webmail)</h3>
      <p>
        <img src="https://img.shields.io/badge/Routing-Threaded_%40orvexa.com-EA4335?style=flat-square" alt="Threaded Webmail" />
        <img src="https://img.shields.io/badge/Assets-Cloudinary_DAM-6366F1?style=flat-square" alt="Cloudinary DAM" />
      </p>
      <ul>
        <li><b>Threaded Conversations:</b> Automatic parent/thread clustering with workspace recipient resolution across <code>TO</code>, <code>CC</code>, and <code>BCC</code>.</li>
        <li><b>Partitioned Mailbox State:</b> Independent per-recipient <code>mail_user_states</code> across Inbox, Starred, Sent, Drafts, Snoozed, Archive, and Trash plus custom folders and labels.</li>
        <li><b>Composer &amp; Batch Triage:</b> Rich-text composition, persistent drafts, sidebar unread counters, bulk state actions, and decoupled DAM file attachments.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Calendar, Recurrence &amp; Tasks</h3>
      <p>
        <img src="https://img.shields.io/badge/Recurrence-RFC_RRULE-1A73E8?style=flat-square" alt="RFC RRULE" />
        <img src="https://img.shields.io/badge/Integrity-start_%3C_end-2563EB?style=flat-square" alt="Temporal Invariant" />
      </p>
      <ul>
        <li><b>Multi-Calendar Views:</b> Interactive Day, Week, and Month views with secondary calendars, calendar sharing, public holidays, and customizable user settings.</li>
        <li><b>RRULE Expansion Engine:</b> Supports <code>DAILY</code>, <code>WEEKLY</code>, <code>MONTHLY</code>, and <code>YEARLY</code> recurrences with <code>BYDAY</code>, <code>INTERVAL</code>, <code>COUNT</code>, <code>UNTIL</code>, and exception dates.</li>
        <li><b>Meetings, RSVPs &amp; Tasks:</b> 1-click LiveKit room binding, participant RSVP tracking, Drive/file attachments, reminders, and integrated <code>CalendarTask</code> checklists.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>Identity, Sessions &amp; Profile</h3>
      <p>
        <img src="https://img.shields.io/badge/Hashing-Argon2id-7C3AED?style=flat-square" alt="Argon2id" />
        <img src="https://img.shields.io/badge/Cookies-HttpOnly_%2B_Strict-059669?style=flat-square" alt="HttpOnly Cookies" />
      </p>
      <ul>
        <li><b>Dual-Token Session Rotation:</b> 15-minute JWT access tokens paired with 7-day rotating refresh tokens stored hashed (<code>SHA-256</code>) in <code>user_sessions</code>.</li>
        <li><b>Multi-Device Session Control:</b> Inspect active IP/device sessions and remotely revoke individual sessions or sign out everywhere.</li>
        <li><b>Profile &amp; Localization:</b> Live username availability validation, Cloudinary avatar upload/removal, theme toggling (light/dark/system), timezone, and notification preferences.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Governance, Notifications &amp; Audit</h3>
      <p>
        <img src="https://img.shields.io/badge/RBAC-ADMIN_%2F_MEMBER-334155?style=flat-square" alt="Role Guards" />
        <img src="https://img.shields.io/badge/Compliance-Audit_Trail-475569?style=flat-square" alt="Audit Trail" />
      </p>
      <ul>
        <li><b>Sanitized Request Auditing:</b> Post-response middleware records user ID, method, route, status code, IP, user agent, and redacted payloads into <code>audit_logs</code>.</li>
        <li><b>Unified Notification Feed:</b> Typed activity events (<code>MAIL</code>, <code>CHAT</code>, <code>CALENDAR</code>, <code>MEETING</code>, <code>DRIVE</code>, <code>SYSTEM</code>) surfaced in Home Activity widgets.</li>
        <li><b>Role-Gated Administration:</b> Protected <code>AdminRoute</code> and backend <code>authorize("ADMIN", "MEMBER")</code> middleware enforcing workspace privilege boundaries.</li>
      </ul>
    </td>
  </tr>
</table>

---

## System Architecture

Orvexa follows a modular layered architecture separating the React SPA client, Express 5 gateway and validation pipeline, domain service engines, real-time WebSocket/WebRTC signaling planes, and PostgreSQL + asset persistence.

### End-to-End Platform Topology

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (@orvexa/web — React 19 + Vite 8 + Tailwind v4)"]
        UI["Workspace Shell & Views\n(Home, Mail, Chat, Meet, Calendar, Drive, Profile, Admin)"]
        State["State & Data Layer\n(TanStack Query v5 + Zustand + React Hook Form)"]
        VirtualDOM["60 FPS Virtualizer\n(@tanstack/react-virtual)"]
        SocketCl["Socket.IO Client\n(Presence, Typing, Chat & Meet Lobby)"]
        LKCl["LiveKit WebRTC Client\n(Tracks, Adaptive Grid, Screen Share)"]
    end

    subgraph GatewayLayer["HTTP Gateway & Middleware (@orvexa/api — Express 5.3)"]
        SecHeaders["Security & Transport\n(Helmet, CORS, Cookie Parser, Trust Proxy)"]
        RateGuard["Rate & Auth Guards\n(IP Auth Limiter, Bearer JWT + iat Check, RBAC)"]
        ZodVal["Request Validation\n(Zod Schemas + Multer Memory Buffers)"]
        Audit["Audit Interceptor\n(Sanitized Async AuditLog Writer)"]
        Router["REST Router (/api/*)\n(auth, profile, home, mail, chat, calendar, meet, drive)"]
    end

    subgraph ServiceLayer["Domain Engines, Real-Time Hub & Workers"]
        HomeSvc["Home & Search Service\n(Promise.allSettled + Cross-Module Search)"]
        ChatSvc["Chat & Spaces Service\n(Idempotency, Watermark Cursors, Mentions)"]
        MeetSvc["Meet Service\n(xxx-yyyy-zzz Codes, LiveKit JWT & Webhooks)"]
        DriveSvc["Drive & Archiver Service\n(Recursive CTEs, XOR RBAC, Chunked Uploads, ZIP)"]
        MailSvc["Mail & Thread Service\n(Workspace Routing, User States, Drafts)"]
        CalSvc["Calendar & Task Service\n(RRULE Expander, Holidays, Reminders, Tasks)"]
        SocketHub["Socket.IO Server\n(Personal, Conversation & Meet Host Rooms)"]
        Worker["Background Worker\n(drive.worker.ts — 30-Day Trash Auto-Purge)"]
    end

    subgraph InfraLayer["Persistence, Media & SFU Infrastructure"]
        Prisma["Prisma ORM 7.10 (@prisma/adapter-pg)\n(12 Modular Schemas, 51 Models, 16 Enums)"]
        PG[("PostgreSQL 16+\n(BigInt Keys, CHECK Invariants, Partial Indexes)")]
        LKSFU["LiveKit SFU Server\n(Sub-100ms WebRTC Media Routing)"]
        Cloudinary["Cloudinary DAM & CDN\n(Avatars, Chat & Mail Attachments)"]
        BlobFS["Pluggable Blob Storage\n(LocalStorageProvider — SHA-256 + Range + Chunks)"]
    end

    UI --> State --> Router
    State --> VirtualDOM
    SocketCl <--> SocketHub
    LKCl <--> LKSFU

    Router --> SecHeaders --> RateGuard --> ZodVal
    ZodVal --> HomeSvc & ChatSvc & MeetSvc & DriveSvc & MailSvc & CalSvc
    Router -. "res.on('finish')" .-> Audit

    ChatSvc --> SocketHub
    MeetSvc --> SocketHub
    MeetSvc --> LKSFU
    MailSvc & ChatSvc --> Cloudinary
    DriveSvc --> BlobFS

    HomeSvc & ChatSvc & MeetSvc & DriveSvc & MailSvc & CalSvc & Audit & Worker --> Prisma
    Prisma <--> PG
```

### Real-Time & Storage Data Flows

<details open>
<summary><strong>1. Real-Time Messaging, Typing, Watermarks &amp; Presence (Socket.IO 4.8)</strong></summary>

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Client A)
    actor Bob as Bob (Client B)
    participant API as Express REST API
    participant Socket as Socket.IO Hub
    participant DB as PostgreSQL 16+

    Alice->>Socket: Connect (Bearer JWT verified + passwordChangedAt check)
    Socket->>Socket: Join personal room user:{id} & track presence
    Socket-->>Bob: Broadcast "presence:state" (isOnline: true, status: ACTIVE)

    Alice->>Socket: Emit "chat:join" { conversationId }
    Socket->>DB: Verify ConversationParticipant membership
    Socket->>Socket: Join room conversation:{conversationId}

    Alice->>Socket: Emit "typing:start" { conversationId }
    Socket-->>Bob: Emit "typing:user_typing" { conversationId, userId, isTyping: true }

    Alice->>Socket: Emit "chat:send" { conversationId, content, clientMessageId }
    Socket->>DB: Idempotent insert into chat_messages (BigInt ID, UTC)
    Socket-->>Bob: Emit "message:received" (formatted message payload)
    Socket-->>Alice: Ack { success: true, data: message }

    Bob->>Socket: Emit "message:read" { conversationId, messageId }
    Socket->>DB: Advance watermark (lastReadMessageId, lastReadAt)
    Socket-->>Alice: Emit "message:read_receipt" { conversationId, userId, messageId, readAt }
```

</details>

<details>
<summary><strong>2. LiveKit WebRTC Conferencing &amp; Host Knock-to-Join Waiting Room</strong></summary>

```mermaid
sequenceDiagram
    autonumber
    actor Host as Host
    actor Guest as Participant
    participant API as Meet REST API
    participant Socket as Socket.IO Hub
    participant SFU as LiveKit SFU
    participant DB as PostgreSQL 16+

    Host->>API: POST /api/meet (Create Meeting)
    API->>DB: Persist Meeting with crypto xxx-yyyy-zzz code
    API-->>Host: Return Meeting Metadata

    Host->>Socket: Emit "meet:join_room" { meetingCode }
    Socket->>Socket: Join meet:{code} and meet:{code}:host

    Host->>API: POST /api/meet/:code/token
    API-->>Host: Return Scoped LiveKit JWT
    Host->>SFU: Connect WebRTC Session & Publish Tracks

    Guest->>Socket: Emit "meet:knock" { meetingCode, displayName }
    Socket->>DB: Upsert MeetingParticipant (PENDING)
    Socket-->>Host: Emit "meet:knock_received" { userId, displayName, avatarUrl }

    Host->>Socket: Emit "meet:admit" { meetingCode, userId }
    Socket->>DB: Update invitationStatus = ACCEPTED
    Socket-->>Guest: Emit "meet:admitted" { meetingCode }

    Guest->>API: POST /api/meet/:code/token
    API-->>Guest: Return Participant LiveKit JWT
    Guest->>SFU: Connect WebRTC & Subscribe/Publish Sub-100ms Media

    Guest->>Socket: Emit "meet:send_chat" { meetingCode, content }
    Socket->>DB: Persist MeetingMessage
    Socket-->>Host: Emit "meet:chat_message"
```

</details>

<details>
<summary><strong>3. Hybrid Asset &amp; Pluggable Blob Storage Pipeline (Drive + DAM)</strong></summary>

```mermaid
flowchart LR
    subgraph Client["Browser Client"]
        DriveUp["Drive Upload\n(Multipart or Resumable Chunks)"]
        AssetUp["Avatar / Chat / Mail Upload\n(Multipart Buffer)"]
        ZipReq["Multi-Select / Folder Export\n(POST /api/drive/download-zip)"]
    end

    subgraph API["Orvexa API Pipeline"]
        UploadInit["Resumable Session Manager\n(/upload/init -> PATCH /chunk -> /complete)"]
        LocalFS["LocalStorageProvider\n(Path-Traversal Guard + SHA-256 + Stitching)"]
        Sharp["Sharp Transformer\n(On-Demand WebP Thumbnails)"]
        Archiver["Archiver Streamer\n(Recursive CTE -> Zero-Buffer ZIP)"]
        CldSvc["Cloudinary Upload Streamer"]
    end

    subgraph Store["Persistence & CDN"]
        PG[("PostgreSQL file_assets\n(storageBackend, storagePath, sha256, secureUrl)")]
        Disk[("Blob & Chunk Store\n(storage/blobs & storage/chunks)")]
        CDN["Cloudinary CDN"]
    end

    DriveUp --> UploadInit --> LocalFS --> Disk
    LocalFS --> PG
    DriveUp --> Sharp

    AssetUp --> CldSvc --> CDN
    CldSvc --> PG

    ZipReq --> Archiver
    Disk --> Archiver --> |"Streaming application/zip"| Client
```

</details>

---

## Tech Stack

| Layer | Technology | Version | Role in Orvexa |
| :--- | :--- | :--- | :--- |
| **Monorepo** | pnpm Workspaces | `9+` | Workspace dependency linking (`@orvexa/web`, `@orvexa/api`, `packages/*`) |
| **Language** | TypeScript | `~6.0.3` | End-to-end static typing across frontend, backend, and tests |
| **Frontend Core** | React &amp; React DOM | `^19.3.1` | Concurrent UI rendering with code-split lazy routes |
| **Build &amp; Dev** | Vite | `^8.3.6` | Fast HMR development server and optimized production bundling |
| **Styling** | Tailwind CSS | `^4.3.4` | Utility-first styling (`@tailwindcss/vite`), theme tokens, CVA variants |
| **Routing &amp; Forms** | React Router DOM &amp; RHF | `^7.18.5` / `^7.91.0` | Protected/Admin/Public route guards and Zod-validated forms |
| **State &amp; Cache** | TanStack Query &amp; Zustand | `^5.106.1` / `^5.0.16` | Server-state caching, optimistic mutations, and reactive auth/socket stores |
| **Virtualization** | `@tanstack/react-virtual` | `^3.14.26` | 60 FPS DOM recycling for large chat histories |
| **Backend Runtime** | Node.js &amp; Express | `22+` / `^5.3.0` | Modular async REST API with centralized error and audit middleware |
| **Database &amp; ORM** | PostgreSQL &amp; Prisma | `16+` / `^7.10.1` | Native `@prisma/adapter-pg` driver, 12 modular `.prisma` files, 51 models |
| **Real-Time** | Socket.IO | `^4.8.4` | Authenticated WebSocket rooms, typing, presence, chat, and meet lobby |
| **WebRTC SFU** | LiveKit SDK &amp; Components | `^2.19.2` / `^2.23.0` | Room token signing, webhook verification, and React media components |
| **Media &amp; Archives** | Cloudinary, Sharp &amp; Archiver | `^2.11` / `^0.35` / `^8.0` | DAM CDN uploads, on-demand WebP thumbnails, and streamed ZIP exports |
| **Security &amp; Validation** | Argon2, JWT, Helmet, Zod | `^0.45` / `^9.0` / `^8.3` / `^4.6` | Password hashing, token signing, security headers, and strict request schemas |
| **Testing &amp; Linting** | `tsx --test` &amp; ESLint | `^4.23.15` / `^10.14.0` | Native Node test runner via `tsx` (48 suites) and ESLint 10 rulesets |

---

## Engineering Highlights

### 1. Lossless 64-Bit Integer (`BigInt`) Identifiers

All primary surrogate keys and foreign keys use PostgreSQL `BIGINT` (`BIGSERIAL`) to prevent 32-bit integer exhaustion ($2^{31} - 1$) across high-volume chat logs, notifications, and audit records. Because JavaScript's `Number` silently truncates integers above `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$), the API runtime standardizes lossless string serialization at process startup:

```typescript
// apps/api/src/common/utils/bigint.ts
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function (): string {
  return this.toString();
};
```

### 2. Exclusive-Arc (XOR) Foreign Keys &amp; Partial Unique Indexes

Polymorphic string associations (`entity_type` + `entity_id`) bypass foreign-key enforcement and invite orphaned rows. For Drive permissions, favorites, and recent items, Orvexa enforces **Exclusive-Arc (XOR) Foreign Keys** in PostgreSQL so every record references **exactly one** of `file_id` or `folder_id` with full `ON DELETE CASCADE` integrity:

```sql
-- apps/api/prisma/migrations/20261107160344_init_cloudinary_schema/migration.sql
ALTER TABLE "drive_permissions" ADD CONSTRAINT "drive_permissions_exactly_one_target_check"
  CHECK (
    ("file_id" IS NOT NULL AND "folder_id" IS NULL)
    OR
    ("file_id" IS NULL AND "folder_id" IS NOT NULL)
  );

CREATE UNIQUE INDEX "drive_permissions_file_user_uidx"
  ON "drive_permissions" ("file_id", "user_id") WHERE "file_id" IS NOT NULL;

CREATE UNIQUE INDEX "drive_permissions_folder_user_uidx"
  ON "drive_permissions" ("folder_id", "user_id") WHERE "folder_id" IS NOT NULL;
```

The identical XOR pattern + partial unique index guarantee protects both `drive_favorites` and `drive_recent_items`.

### 3. Database-Enforced Domain Invariants

Critical domain guarantees live inside PostgreSQL `CHECK` constraints and unique indexes rather than application memory alone:

```sql
-- Canonical 1:1 Direct Conversation Deduplication (prevents concurrent duplicate DM rooms)
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_users_check"
  CHECK (
    ("type" = 'DIRECT' AND "direct_user_low_id" IS NOT NULL AND "direct_user_high_id" IS NOT NULL AND "direct_user_low_id" < "direct_user_high_id")
    OR
    ("type" <> 'DIRECT' AND "direct_user_low_id" IS NULL AND "direct_user_high_id" IS NULL)
  );

CREATE UNIQUE INDEX "conversations_direct_user_low_id_direct_user_high_id_key"
  ON "conversations"("direct_user_low_id", "direct_user_high_id");

-- Channel visibility allowed exclusively on CHANNEL conversations
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_visibility_check"
  CHECK (
    ("type" = 'CHANNEL' AND "visibility" IS NOT NULL)
    OR
    ("type" <> 'CHANNEL' AND "visibility" IS NULL)
  );

-- Physical time-arrow integrity on calendar events
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_start_before_end_check"
  CHECK ("start_time" < "end_time");
```

### 4. Recursive CTE Folder Traversal &amp; Cycle Prevention

In `apps/api/src/modules/drive/drive.permission.ts` and `drive.service.ts`, hierarchical operations execute single-roundtrip PostgreSQL `WITH RECURSIVE` Common Table Expressions to:

- **Inherit Permissions** up the ancestor chain (`OWNER` &gt; `MANAGER` &gt; `EDITOR` &gt; `COMMENTER` &gt; `VIEWER`).
- **Reject Circular Folder Moves** by verifying a target parent folder is neither the moved folder itself nor any descendant.
- **Stream Entire Subtrees** into zero-buffer `.zip` downloads preserving nested relative paths.
- **Cascade Permanent Deletions** across arbitrarily deep directory hierarchies and reclaim underlying storage blobs.

### 5. Watermark Read Cursors vs. Partitioned Mail States

- **Chat (`conversation_participants`)**: Tracks `last_read_message_id` and `last_read_at` per participant instead of creating $O(N \times M)$ per-message read rows, enabling fast watermark updates and unread evaluation.
- **Mail (`mail_user_states`)**: Because email triage is independent per recipient, each participant maintains an isolated state row (`is_read`, `is_starred`, `is_archived`, `is_trashed`) plus personal `mail_folders` and `mail_labels`.

### 6. Fault-Isolated Home Aggregation &amp; `⌘K` Federated Search

`HomeService.getOverview` (`GET /api/home/overview`) fans out across 7 domain services (`mail`, `chat`, `calendar`, `meet`, `drive`, `tasks`, `activity`) using `Promise.allSettled`, returning independent `{ status: "success" | "error" }` slices so individual module degradations never block the dashboard. `GET /api/home/search` fans out in parallel across Mail, Chat, Calendar, and Drive for instant `⌘K` command-palette navigation.

---

## Domain Modules and API Reference

<details>
<summary><strong>REST API Surface</strong> &mdash; Express 5 modular routes mounted under <code>/api</code></summary>

| Mount Path | Module | Key Capabilities &amp; Endpoints |
| :--- | :--- | :--- |
| `/health`, `/health/cloudinary` | System | Liveness, `PROJECT_VERSION`, UTC timestamp, and Cloudinary connectivity ping |
| `/api/auth` | Identity &amp; Auth | `POST /`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/change-password`, `GET /`, `GET/DELETE /sessions` |
| `/api/profile` | User Profile | `GET/PATCH /`, `GET /username-availability`, `PATCH /preferences`, `POST/DELETE /photo` |
| `/api/home` | Command Center | `GET /overview`, per-widget slices (`/mail`, `/chat`, `/calendar`, `/meet`, `/drive`, `/tasks`, `/activity`), `GET /search`, `GET/PUT /preferences` |
| `/api/mail` | Workspace Mail | `POST /send`, `POST/DELETE /attachments`, `GET /inbox`, `/starred`, `/sent`, `/drafts`, `/snoozed`, `/trash`, `/counts`, `/threads/:threadId`, `PATCH /messages/:id/state`, `POST /messages/batch-state` |
| `/api/chat` | Chat &amp; Spaces | `GET /presence`, `/users`, `/search`, `/spaces/discover`, `GET/POST /conversations`, `POST /direct`, participant management, messages CRUD, `/read`, `/reactions`, `/pin`, `/pins`, `/attachments` |
| `/api/calendar` | Calendar &amp; Tasks | CRUD `/events`, `PATCH /events/:id/rsvp`, CRUD `/calendars`, CRUD `/tasks`, `GET/PATCH /settings` |
| `/api/meet` | LiveKit Meet | `POST /webhook`, CRUD `/`, `GET /:code`, `POST /:code/token`, `PATCH /:code/settings`, `POST /:code/admit`, `/:code/deny`, `/:code/end`, `GET/POST /:code/messages` |
| `/api/drive` | Cloud Drive | `GET /storage`, `POST /upload`, resumable `/upload/init`, `PATCH /upload/:sessionId/chunk`, `/complete`, `/abort`, `POST /download-zip`, folders/files CRUD, `/download`, `/stream`, `/preview`, `/thumbnail`, `/move`, `/copy`, `/star`, permissions &amp; `/link`, `/s/:token`, `/access-requests`, `/shortcuts`, `/search`, `/recent`, `/starred`, `/activities`, `/files/:id/versions`, `/trash/empty`, `/trash/purge`, `/save-asset` |

</details>

<details>
<summary><strong>Socket.IO Real-Time Protocol Contract</strong> &mdash; Verified from <code>apps/api/src/sockets/socket.types.ts</code></summary>

| Direction | Event Name | Payload / Purpose |
| :--- | :--- | :--- |
| **Client &rarr; Server** | `chat:join` / `chat:leave` | Join or leave `conversation:{conversationId}` after membership check |
| **Client &rarr; Server** | `chat:send` | Send message (`conversationId`, `content`, `clientMessageId`, `messageType`, `parentMessageId`, `attachmentIds`) with sliding-window rate guard (15 msgs / 3s) |
| **Client &rarr; Server** | `typing:start` / `typing:stop` | Broadcast ephemeral typing status to conversation room |
| **Client &rarr; Server** | `message:read` | Advance participant read watermark to `messageId` |
| **Client &rarr; Server** | `presence:update` | Set user status (`ACTIVE` \| `AWAY` \| `DND`) |
| **Client &rarr; Server** | `meet:join_room` / `meet:leave_room` | Enter or leave `meet:{code}` (and `meet:{code}:host` for hosts) |
| **Client &rarr; Server** | `meet:knock` / `meet:cancel_knock` | Request admission or cancel waiting room knock |
| **Client &rarr; Server** | `meet:admit` / `meet:deny` / `meet:admit_all` | Host waiting-room admission controls |
| **Client &rarr; Server** | `meet:send_chat` | Persist and broadcast in-meeting chat message |
| **Server &rarr; Client** | `message:received` / `message:updated` / `message:deleted` | Real-time message lifecycle updates |
| **Server &rarr; Client** | `typing:user_typing` | Typing state for `conversationId` and `userId` |
| **Server &rarr; Client** | `message:read_receipt` / `message:reaction_updated` / `message:pinned_updated` | Read watermarks, emoji reactions, and pinned state |
| **Server &rarr; Client** | `presence:state` | Online/offline status (`ACTIVE`, `AWAY`, `DND`, `lastSeen`) |
| **Server &rarr; Client** | `meet:knock_received` / `meet:knock_cancelled` | Host lobby notifications for waiting participants |
| **Server &rarr; Client** | `meet:admitted` / `meet:denied` / `meet:ended` | Participant admission decision or host room termination |
| **Server &rarr; Client** | `meet:chat_message` / `meet:settings_updated` | In-call chat broadcast and live host policy updates |

</details>

<details>
<summary><strong>Frontend Route Architecture</strong> &mdash; Verified from <code>apps/web/src/App.tsx</code></summary>

| Route Pattern | Access Guard | Layout | View |
| :--- | :--- | :--- | :--- |
| `/` | Public | Standalone | Product Landing Page (`Landing.tsx`) |
| `/authenticate` | `PublicRoute` (Guest-only) | Standalone | Sign In &amp; Password Flows (`AuthPage.tsx`) |
| `/home` | `ProtectedRoute` | `AppLayout` | Customizable Widget Command Center (`Home.tsx`) |
| `/mail` | `ProtectedRoute` | `AppLayout` | Threaded Enterprise Webmail (`Mail.tsx`) |
| `/chat` | `ProtectedRoute` | `AppLayout` | Virtualized Chat &amp; Spaces (`Chat.tsx`) |
| `/calendar` | `ProtectedRoute` | `AppLayout` | Multi-View Calendar, RRULE &amp; Tasks (`Calendar.tsx`) |
| `/drive`, `/drive/folders/:id`, `/drive/shared`, `/drive/recent`, `/drive/starred`, `/drive/trash` | `ProtectedRoute` | `AppLayout` | Cloud File Explorer (`DrivePage.tsx`) |
| `/drive/s/:token`, `/drive/request-access` | `ProtectedRoute` | Full-Screen | Share Link Resolution &amp; Access Requests |
| `/meet` | `ProtectedRoute` | `AppLayout` | Meeting Launcher &amp; Code Entry (`MeetLandingPage.tsx`) |
| `/meet/:code`, `/meet/:code/left` | `ProtectedRoute` | Full-Screen | Immersive LiveKit Conference Room &amp; Exit Lounge |
| `/profile` | `ProtectedRoute` | `AppLayout` | Profile, Avatar, Security &amp; Sessions (`Profile.tsx`) |
| `/admin` | `ProtectedRoute` + `AdminRoute` | `AppLayout` | Admin Workspace Console (`AdministrationPage.tsx`) |

</details>

---

## Monorepo and Database Topology

### Repository Directory Map

```text
Orvexa/
├── apps/
│   ├── api/                              # Backend Express 5 REST, WebSocket & Worker service (@orvexa/api)
│   │   ├── prisma/
│   │   │   ├── schema/                   # 12 modular Prisma schema files (51 models, 16 enums)
│   │   │   ├── migrations/               # 10 PostgreSQL migrations + custom SQL invariants
│   │   │   ├── seeds/                    # Modular seeders (user.seed.ts, mail.seed.ts, calendar.seed.ts)
│   │   │   └── seed.ts                   # Database seed orchestrator
│   │   ├── src/
│   │   │   ├── common/                   # AppError, BigInt toJSON, cookies, hash, jwt, password, roles
│   │   │   ├── config/                   # Env validation, CORS policy, Cloudinary SDK, Prisma singleton
│   │   │   ├── infrastructure/           # Prisma PG adapter, Cloudinary uploader, LocalStorageProvider
│   │   │   ├── middleware/               # Auth, RBAC authorize, Zod validate, Multer uploads, rate limit, audit logger
│   │   │   ├── modules/                  # auth, calendar, chat, drive (+ trash worker), home, mail, meet, profile
│   │   │   ├── routes/                   # Consolidated /api router
│   │   │   ├── sockets/                  # Socket.IO server, JWT handshake guard, presence, chat & meet handlers
│   │   │   ├── app.ts                    # Express 5 application pipeline & health checks
│   │   │   └── server.ts                 # HTTP/WS bootstrap, trash worker start & graceful shutdown
│   │   ├── storage/                      # Local blob & resumable chunk storage (blobs/, chunks/)
│   │   ├── tests/                        # 48 test suites (unit/, integration/, e2e/) + schema-verification.ts
│   │   └── prisma.config.ts              # Prisma 7 multi-file schema & seed configuration
│   │
│   └── web/                              # Frontend React 19 SPA (@orvexa/web)
│       ├── public/images/                # Brand SVGs, WebP logos & webmanifest favicons
│       └── src/
│           ├── app/                      # QueryClient & global Providers
│           ├── common/                   # AppLayout, Navbar, AppSwitcher, Route guards, ThemeProvider, API client
│           ├── components/ui/            # Reusable base UI primitives
│           ├── lib/                      # Classname & shared helpers
│           └── modules/                  # admin, auth, calendar, chat, drive, home, landing, mail, meet, profile
│
├── docs/
│   ├── database/
│   │   ├── database-design.md            # Core relational design principles & schema documentation
│   │   └── database-erd.md               # Visual Crow's Foot entity-relationship diagrams
│   ├── api/                              # Reserved for REST OpenAPI / endpoint specs
│   ├── architecture/                     # Reserved for system ADR documents
│   └── development/                      # Reserved for contributor guides
│
├── infrastructure/
│   └── docker/                           # Reserved for container & compose manifests
├── packages/                             # Reserved shared workspace packages (eslint-config, shared, typescript-config, validators)
├── LICENSE                               # MIT License
├── package.json                          # Root monorepo scripts
├── pnpm-workspace.yaml                   # Workspace & Prisma engine build configuration
└── vercel.json                           # Multi-service routing (/api/* -> api, /* -> web)
```

### Modular Prisma Schema (`51` Models &middot; `16` Enums)

<details>
<summary><strong>Inspect all 12 Prisma schema modules</strong> in <code>apps/api/prisma/schema/</code></summary>

| Schema File | Scope | Key Models |
| :--- | :--- | :--- |
| `schema.prisma` | Generator &amp; DB | `prisma-client` generator (`src/generated/prisma`), `postgresql` datasource |
| `enums.prisma` | Shared Enums | 16 enums (`UserRole`, `ConversationType`, `DriveAccessLevel`, `MeetingStatus`, `NotificationType`, etc.) |
| `auth.prisma` | Identity &amp; Access | `User`, `Credentials`, `UserSession`, `PasswordResetToken`, `UserPreference` |
| `storage.prisma` | Asset Registry | `FileAsset` (bridges `CLOUDINARY` and `LOCAL` backends with `sha256` &amp; metadata) |
| `drive.prisma` | Cloud DMS | `DriveFolder`, `DriveFile`, `DriveFileVersion`, `DrivePermission`, `DriveFavorite`, `DriveRecentItem`, `DriveComment`, `DriveShareLink`, `DriveAccessRequest`, `DriveActivity`, `DriveShortcut`, `DriveUploadSession` |
| `chat.prisma` | Chat &amp; Spaces | `Conversation`, `ConversationParticipant`, `ChatMessage`, `ChatAttachment`, `ChatReaction`, `ChatPinnedMessage`, `ChatMention` |
| `mail.prisma` | Workspace Webmail | `MailMessage`, `MailRecipient`, `MailUserState`, `MailAttachment`, `MailDraft`, `MailDraftRecipient`, `MailDraftAttachment`, `MailFolder`, `MailFolderMessage`, `MailLabel`, `MailMessageLabel` |
| `calendar.prisma` | Calendar &amp; Tasks | `CalendarEvent`, `CalendarParticipant`, `CalendarReminder`, `CalendarShare`, `UserCalendar`, `CalendarTask`, `CalendarSetting`, `CalendarEventAttachment` |
| `meeting.prisma` | Video Meetings | `Meeting`, `MeetingParticipant`, `MeetingRecording`, `MeetingMessage` |
| `dashboard.prisma` | Command Center | `UserDashboardPreference` |
| `notification.prisma` | Notifications | `Notification` |
| `audit.prisma` | Compliance Logs | `AuditLog` |

</details>

---

## Getting Started

### Prerequisites

| Requirement | Minimum | Recommended | Verification | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `20.12.0` | `22.x` LTS | `node -v` | Required for ESM + modern native APIs |
| **pnpm** | `9.0.0` | `9.15+` | `pnpm -v` | `corepack enable && corepack prepare pnpm@latest --activate` |
| **PostgreSQL** | `16.0` | `16.4+` | `psql --version` | Required for partial unique indexes &amp; `CHECK` constraints |
| **LiveKit Server** | `1.7+` | Latest | `livekit-server --version` | Local dev mode via `livekit-server --dev` for Meet video/audio |
| **Cloudinary** | Active Account | Free / Paid | &mdash; | Used for profile photos, chat attachments, and mail attachments |

### 1. Clone &amp; Install

```bash
git clone https://github.com/VishnuThangaraj/Orvexa.git
cd Orvexa
pnpm install
```

### 2. Environment Configuration

Create `apps/api/.env` and `apps/web/.env`.

<details open>
<summary><strong>Backend Environment (<code>apps/api/.env</code>)</strong></summary>

```env
# Application Identity & Networking
PROJECT_VERSION="1.0.0"
NODE_ENV="development"
PORT=6970
CLIENT_ORIGIN="http://localhost:5173"

# PostgreSQL Connections
DATABASE_URL="postgresql://postgres:password@localhost:5432/orvexa?schema=public"
CLOUD_DATABASE_URL="postgresql://postgres:password@localhost:5432/orvexa?schema=public"

# Default Administrator Seed Credentials
ADMIN_NAME="Administrator"
ADMIN_EMAIL="admin@orvexa.local"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ChangeThisStrongPassword123!"

# JWT Authentication & Cookies
JWT_SECRET="replace-with-a-random-32-plus-char-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="replace-with-a-different-32-plus-char-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudinary Digital Asset Management
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# LiveKit WebRTC SFU (optional overrides; defaults shown)
LIVEKIT_URL="ws://localhost:7880"
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
LIVEKIT_WEBHOOK_SECRET="secret"

# Optional Drive & Storage Tuning (defaults shown)
# STORAGE_BACKEND="local"
# STORAGE_LOCAL_DIR="./storage/blobs"
# STORAGE_CHUNK_DIR="./storage/chunks"
# DRIVE_TOTAL_QUOTA_BYTES="16106127360"
# TRASH_RETENTION_DAYS="30"
# TRASH_PURGE_INTERVAL_MS="86400000"
```

</details>

<details open>
<summary><strong>Frontend Environment (<code>apps/web/.env</code>)</strong></summary>

```env
VITE_SERVER_URL="http://localhost:6970"
```

</details>

### 3. Database Provisioning &amp; Seeding

```bash
# 1. Generate Prisma Client into apps/api/src/generated/prisma
pnpm --filter @orvexa/api db:generate

# 2. Apply PostgreSQL migrations & custom SQL invariants
pnpm --filter @orvexa/api db:migrate

# 3. Seed admin account, 20 workspace members, sample mail threads & calendars
pnpm --filter @orvexa/api db:seed
```

> [!TIP]
> Seeding creates your configured `ADMIN_USERNAME` / `ADMIN_EMAIL` administrator alongside 20 pre-populated workspace members (default dev password `orvexa@123` defined in `apps/api/prisma/seeds/user.seed.ts`), sample threaded mail conversations, and default calendars. Launch Prisma Studio at `http://localhost:5555` anytime with `pnpm --filter @orvexa/api db:studio`.

### 4. Start Development Services

Start LiveKit locally in a separate terminal if testing WebRTC rooms:

```bash
livekit-server --dev
```

Then run both workspace applications concurrently:

```bash
pnpm dev
```

| Service | Local URL | Purpose |
| :--- | :--- | :--- |
| **Web Client** | [http://localhost:5173](http://localhost:5173) | React 19 + Vite 8 + Tailwind v4 SPA |
| **API &amp; WebSockets** | [http://localhost:6970](http://localhost:6970) | Express 5 REST API &amp; Socket.IO server |
| **Health Endpoint** | [http://localhost:6970/health](http://localhost:6970/health) | Service status &amp; version check |
| **Cloudinary Ping** | [http://localhost:6970/health/cloudinary](http://localhost:6970/health/cloudinary) | DAM credential &amp; network verification |
| **LiveKit SFU** | `ws://localhost:7880` | WebRTC Selective Forwarding Unit |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | Visual database explorer (when started) |

### 5. Production Build &amp; Deployment

Orvexa ships with a root [`vercel.json`](vercel.json) multi-service routing configuration that directs `/api/*` requests to `@orvexa/api` (`express`) and all SPA navigation routes (`/*`) to `@orvexa/web` (`vite`):

```bash
# Generate Prisma client, type-check, and compile all workspace packages
pnpm build
```

For production database migrations in CI/CD pipelines, run:

```bash
pnpm --filter @orvexa/api db:deploy
```

---

## Scripts and Automated Testing

### Workspace Commands

| Scope | Command | Description |
| :--- | :--- | :--- |
| **Root** | `pnpm dev` | Runs `@orvexa/web` and `@orvexa/api` concurrently in dev mode |
| **Root** | `pnpm dev:api` | Runs Express API + Socket.IO with `tsx watch` |
| **Root** | `pnpm dev:web` | Runs Vite frontend dev server |
| **Root** | `pnpm build` | Builds all packages across the monorepo (`pnpm -r build`) |
| **API** | `pnpm --filter @orvexa/api start` | Starts compiled API server (`node dist/server.js`) |
| **API** | `pnpm --filter @orvexa/api test` | Runs all 48 unit, integration &amp; E2E suites sequentially (`tsx --test --test-concurrency=1`) |
| **API** | `pnpm --filter @orvexa/api db:generate` | Generates Prisma Client bindings |
| **API** | `pnpm --filter @orvexa/api db:migrate` | Runs interactive Prisma development migrations |
| **API** | `pnpm --filter @orvexa/api db:deploy` | Applies pending migrations in CI/production |
| **API** | `pnpm --filter @orvexa/api db:seed` | Executes `prisma/seed.ts` |
| **API** | `pnpm --filter @orvexa/api db:studio` | Opens Prisma Studio |
| **Web** | `pnpm --filter @orvexa/web lint` | Runs ESLint 10 static analysis across frontend source |
| **Web** | `pnpm --filter @orvexa/web preview` | Previews built Vite production bundle locally |

### Verification Pyramid (`48` Suites + Schema Verifier)

`pnpm --filter @orvexa/api test` executes **2 End-to-End**, **31 Integration**, and **15 Unit** test suites via `tsx --test --test-concurrency=1`, backed by `apps/api/tests/schema-verification.ts` for constraint verification.

<details>
<summary><strong>Complete Automated Test Catalog</strong> &mdash; All 48 test files in <code>apps/api/tests/</code></summary>

| Tier | Domain | Test Suite |
| :--- | :--- | :--- |
| **E2E (2)** | Chat, Auth | `tests/e2e/chat-e2e.test.ts`, `tests/e2e/session-e2e.test.ts` |
| **Integration (6)** | Auth &amp; Security | `auth.lockout.test.ts`, `auth.password.test.ts`, `auth.repository.test.ts`, `auth.routes.test.ts`, `auth.security.test.ts`, `auth.service.test.ts` |
| **Integration (11)** | Chat &amp; Spaces | `chat.attachments.test.ts`, `chat.idempotency.test.ts`, `chat.interactions.test.ts`, `chat.mentions.test.ts`, `chat.messages.test.ts`, `chat.preferences-presence.test.ts`, `chat.routes.test.ts`, `chat.search.test.ts`, `chat.seen-receipt.test.ts`, `chat.spaces.test.ts`, `chat.threads.test.ts` |
| **Integration (8)** | Drive DMS | `drive.crud.test.ts`, `drive.download.test.ts`, `drive.permission.test.ts`, `drive.phase5.test.ts`, `drive.phase6.test.ts`, `drive.phase7.test.ts`, `drive.sharing.test.ts`, `drive.upload.test.ts` |
| **Integration (6)** | Core Domains &amp; WS | `calendar.api.test.ts`, `home.api.test.ts`, `mail.thread.test.ts`, `meet.api.test.ts`, `profile.api.test.ts`, `socket.connection.test.ts` |
| **Unit (15)** | Validators &amp; Utils | `auth.validation.test.ts`, `calendar.recurrence.test.ts`, `chat.attachment.validation.test.ts`, `chat.interactions.test.ts`, `chat.message.validation.test.ts`, `chat.validation.test.ts`, `drive.schema.test.ts`, `hash.test.ts`, `mail.validation.test.ts`, `meet.code.test.ts`, `middleware.test.ts`, `profile.validation.test.ts`, `socket.auth.test.ts`, `storage.provider.test.ts`, `upload.middleware.test.ts` |
| **Schema Check** | PostgreSQL | `tests/schema-verification.ts` |

</details>

---

## Security Architecture

```mermaid
flowchart LR
    Req["Incoming HTTP / WS Request"] --> Headers["Helmet + Strict CORS\n(allowlist CLIENT_ORIGIN + credentials)"]
    Headers --> Limiter["Sliding-Window Auth Limiter\n(100 req / 15 min per IP + Retry-After)"]
    Limiter --> AuthN["JWT + Cookie Guard\n(HttpOnly, SameSite=Strict, iat > passwordChangedAt)"]
    AuthN --> AuthZ["RBAC & XOR Checks\n(ADMIN/MEMBER + Drive Exclusive-Arc)"]
    AuthZ --> Zod["Strict Zod Schema Validation"]
    Zod --> Crypto["Argon2id + SHA-256 Token Rotation\n(5-Attempt 15m Lockout + Timing Defense)"]
    Crypto --> Audit["Sanitized AuditLog Persistence\n(Redacts password, token, secret)"]
```

- **Memory-Hard Credential Hashing**: Passwords are hashed with **Argon2id** (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`). Missing users and null hashes trigger constant-time `DUMMY_PASSWORD_HASH` verification to mitigate timing enumeration.
- **Brute-Force &amp; IP Rate Defense**: 5 consecutive failed logins trigger a 15-minute account lock (`HTTP 423 Locked`), reinforced by `authRateLimiter` (100 requests per 15-minute window per IP).
- **Hardened Dual-Token Rotation**: Refresh tokens are `SHA-256` hashed before persistence in `user_sessions`, delivered exclusively via `HttpOnly`, `SameSite=Strict`, `Secure` (production), `Path=/api/auth` cookies, rotated on refresh with reuse detection, and invalidated globally on password reset or change (`passwordChangedAt` vs. JWT `iat`).
- **Transport, Input &amp; Storage Hardening**: `helmet()` headers, strict `CLIENT_ORIGIN` CORS allowlisting, Zod payload validation, path-traversal / zip-slip checks in `LocalStorageProvider`, and async `AuditLog` persistence that automatically masks sensitive request keys.

---

## Roadmap

### Implemented &amp; Verified

- [x] **Home Command Center**: Fault-isolated 7-widget aggregation, user layout customization, and federated `⌘K` search across Mail, Chat, Calendar, and Drive.
- [x] **Chat &amp; Spaces**: Socket.IO 4.8 messaging, `@tanstack/react-virtual` 60 FPS feed, canonical `1:1` DM deduplication, threaded replies, mentions, reactions, pins, idempotency, watermark read cursors, and presence states.
- [x] **Meet (LiveKit WebRTC)**: `xxx-yyyy-zzz` room codes, LiveKit SFU JWTs, knock-to-join waiting rooms, host room moderation, webhooks, and persistent in-call chat.
- [x] **Drive (Cloud DMS)**: Recursive CTE folder trees, Exclusive-Arc XOR RBAC with ancestor inheritance, resumable chunked uploads, HTTP `Range` streaming, Sharp WebP thumbnails, versioning &amp; rollbacks, share links &amp; access requests, shortcuts, streamed ZIP exports, and 30-day auto-purge worker.
- [x] **Mail**: Threaded workspace conversations, `TO`/`CC`/`BCC` routing, drafts, snooze, archive, trash, custom folders/labels, batch triage, and Cloudinary DAM attachments.
- [x] **Calendar &amp; Tasks**: Multi-calendar Day/Week/Month views, RFC `RRULE` recurrence expansion, public holiday engine, RSVP tracking, `CalendarTask` checklists, `start_time < end_time` SQL checks, and 1-click Meet room binding.
- [x] **Identity, Profile &amp; Audit**: Argon2id auth, rotating refresh sessions, remote session revocation, Cloudinary avatar management, and sanitized request audit logs.

### Next-Phase Milestones

- [ ] **PostgreSQL Full-Text GIN Indexing**: Upgrade `drive_files.searchable_content` and `⌘K` search queries with `tsvector` + `pg_trgm` ranking.
- [ ] **Outbound SMTP / Resend Relay**: Wire external internet email delivery via `resend` / SMTP alongside internal `@orvexa.com` workspace routing.
- [ ] **Full Admin Governance Console**: Expand `/admin` UI for user provisioning, audit log inspection, and workspace quota policies.
- [ ] **LiveKit Egress Cloud Recording**: Automated server-side meeting recording pipeline linked to `meeting_recordings` and `file_assets`.
- [ ] **Shared Workspace Packages &amp; Docker Compose**: Populate `packages/shared`, `packages/validators`, and one-command orchestration manifests in `infrastructure/docker`.
- [ ] **Enterprise SSO &amp; E2EE**: SAML 2.0 / OIDC directory federation and client-side end-to-end encrypted direct messaging.

---

## Contributing and Documentation

Before proposing schema or architectural changes, review the database specifications included in the repository:

- [Database Design Specification](docs/database/database-design.md) &mdash; Core relational architecture, 3NF baseline, `BigInt` standards, Exclusive-Arc XOR constraints, and index strategies.
- [Entity-Relationship Diagrams](docs/database/database-erd.md) &mdash; Visual Crow's Foot domain models.

### Contribution Workflow

1. Branch from `main` (`git checkout -b feat/your-change`).
2. Follow TypeScript strictness and frontend lint rules (`pnpm --filter @orvexa/web lint`).
3. Keep modular Prisma schemas organized inside `apps/api/prisma/schema/*.prisma` and generate migrations via `pnpm --filter @orvexa/api db:migrate`.
4. Verify your changes pass the full test suite and workspace build before opening a pull request:

```bash
pnpm --filter @orvexa/api test && pnpm --filter @orvexa/web lint && pnpm build
```

---

## License

Licensed under the **[MIT License](LICENSE)** &copy; 2026 Vishnu Thangaraj.
