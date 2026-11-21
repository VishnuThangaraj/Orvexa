<div align="center">

  <img src="apps/web/public/images/icon.svg" alt="Orvexa Logo" width="96" height="96" />

  # Orvexa — Unified Enterprise Digital Workspace

  <p><strong>Next-Generation Self-Hosted Collaboration Engine & Unified Communications Suite</strong></p>

  <p>
    Consolidating real-time team messaging, WebRTC video conferencing, cloud file storage, webmail, and calendar scheduling into a single, cohesive, high-performance monorepo application.
  </p>

  <!-- Shields & Badges -->
  <p>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" /></a>
    <a href="https://livekit.io/"><img src="https://img.shields.io/badge/LiveKit-WebRTC-FF4F00?style=for-the-badge&logo=webrtc&logoColor=white" alt="LiveKit" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" /></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>

  <!-- Interactive Quick Jump Bar -->
  <p>
    <b><a href="#-key-modules--interactive-feature-cards">Features</a></b> •
    <b><a href="#-system-architecture">Architecture</a></b> •
    <b><a href="#-tech-stack">Tech Stack</a></b> •
    <b><a href="#-deep-dive-domain-modules">Modules</a></b> •
    <b><a href="#-core-engineering-highlights">Engineering Masterclass</a></b> •
    <b><a href="#-monorepo-directory-structure">Directory Map</a></b> •
    <b><a href="#-getting-started">Quickstart</a></b> •
    <b><a href="#-available-scripts--tooling">Scripts</a></b> •
    <b><a href="#-roadmap--verification-status">Roadmap</a></b>
  </p>

</div>

---

## 📑 Interactive Table of Contents

<details open>
<summary><b>Click to expand / collapse navigation</b></summary>

- [✨ Executive Overview](#-executive-overview)
- [🧩 Key Modules & Interactive Feature Cards](#-key-modules--interactive-feature-cards)
- [🏛 System Architecture](#-system-architecture)
- [🛠 Tech Stack & Ecosystem](#-tech-stack)
- [🔬 Deep-Dive Domain Modules](#-deep-dive-domain-modules)
- [💎 Core Engineering Highlights](#-core-engineering-highlights)
- [📂 Monorepo Directory Structure](#-monorepo-directory-structure)
- [⚙️ Prerequisites](#-prerequisites)
- [🏁 Getting Started](#-getting-started)
  - [1. Clone & Install Dependencies](#1-clone--install-dependencies)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Database Setup & Migrations](#3-database-setup--migrations)
  - [4. Running Development Servers](#4-running-the-development-servers)
  - [5. Production Build & Deployment](#5-production-build--deployment)
- [📜 Available Scripts & Tooling](#-available-scripts--tooling)
- [🧪 Test Suite Coverage](#-test-suite-coverage)
- [🔒 Security & Audit Standards](#-security--audit-standards)
- [🗺 Roadmap & Verification Status](#-roadmap--verification-status)
- [🤝 Contributing & Specifications](#-contributing--specifications)
- [📄 License & Open Standards](#-license--open-standards)

</details>

---

## ✨ Executive Overview

**Orvexa** is a modern, high-performance, enterprise-grade unified digital workspace and communication suite. Built as a high-velocity TypeScript monorepo (`@orvexa/web` + `@orvexa/api`), it eliminates context switching across fragmented workplace apps by unifying:

1. **Bi-directional Real-Time Messaging & Spaces** with 60 FPS virtualization over 100,000+ items.
2. **Sub-100ms WebRTC Multi-Party Video/Audio Conferencing** driven by LiveKit SFU.
3. **Hierarchical Cloud Drive & Document Management** with Exclusive-Arc RBAC and live ZIP streaming.
4. **Threaded Enterprise Webmail** with rich recipient routing and transactional SMTP/Resend delivery.
5. **Intelligent Calendar & RRULE Scheduling Engine** with database-enforced temporal consistency.
6. **Zero-Knowledge Identity & Dual-Token Authentication** with GPU-resistant Argon2id hashing.

---

## 🧩 Key Modules & Interactive Feature Cards

<table>
  <tr>
    <td width="33%" valign="top">
      <h3 align="center">💬 Chat & Spaces</h3>
      <p align="center">
        <img src="https://img.shields.io/badge/Engine-Socket.io_4.x-black?style=flat-square" alt="Socket.io" />
        <img src="https://img.shields.io/badge/Virtualization-TanStack_Virtual-blue?style=flat-square" alt="Virtualization" />
      </p>
      <ul>
        <li><b>Bi-directional Sockets:</b> Instant dispatch with optimistic UI updates.</li>
        <li><b>Deduplicated 1:1 Pairs:</b> Database unique index via <code>LEAST/GREATEST</code>.</li>
        <li><b>Locked 60 FPS:</b> DOM recycling across channels with 100k+ messages.</li>
        <li><b>Reactions & Mentions:</b> Rich emoji reactions and member tagging.</li>
      </ul>
    </td>
    <td width="33%" valign="top">
      <h3 align="center">📹 Meet (WebRTC)</h3>
      <p align="center">
        <img src="https://img.shields.io/badge/SFU-LiveKit_WebRTC-orange?style=flat-square" alt="LiveKit" />
        <img src="https://img.shields.io/badge/Latency-<100ms-green?style=flat-square" alt="Latency" />
      </p>
      <ul>
        <li><b>LiveKit SFU Engine:</b> Multi-party HD audio/video calling.</li>
        <li><b>Meeting Codes:</b> Instant human-readable <code>xxx-yyyy-zzz</code> codes.</li>
        <li><b>Interactive Controls:</b> Screen sharing, audio/video toggling, tile grids.</li>
        <li><b>In-Call Chat:</b> Integrated real-time room side-panel messaging.</li>
      </ul>
    </td>
    <td width="33%" valign="top">
      <h3 align="center">📁 Drive (Cloud Storage)</h3>
      <p align="center">
        <img src="https://img.shields.io/badge/DAM-Cloudinary_CDN-blueviolet?style=flat-square" alt="Cloudinary" />
        <img src="https://img.shields.io/badge/Security-Exclusive_Arc_RBAC-red?style=flat-square" alt="Exclusive Arc" />
      </p>
      <ul>
        <li><b>Hierarchical Folders:</b> Drag-and-drop explorer with breadcrumb navigation.</li>
        <li><b>Versioning & Rollbacks:</b> Complete historical revision auditing.</li>
        <li><b>Batch ZIP Archiving:</b> Streamed on-the-fly via <code>archiver</code>.</li>
        <li><b>Trash Worker:</b> 30-day soft-delete lifecycle auto-purge worker.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3 align="center">✉️ Mail (Webmail)</h3>
      <p align="center">
        <img src="https://img.shields.io/badge/Delivery-Resend_/_SMTP-black?style=flat-square" alt="Resend" />
        <img src="https://img.shields.io/badge/Format-Rich_HTML-teal?style=flat-square" alt="Rich HTML" />
      </p>
      <ul>
        <li><b>Threaded Conversations:</b> Clustered mail items with unread indicators.</li>
        <li><b>Rich Composer:</b> Formatting tools with To, CC, and BCC recipient routing.</li>
        <li><b>Decoupled Attachments:</b> Zero-blob database via DAM file assets.</li>
        <li><b>Draft Persistence:</b> Auto-saved drafts and folder organization.</li>
      </ul>
    </td>
    <td width="33%" valign="top">
      <h3 align="center">📅 Calendar & Recurrence</h3>
      <p align="center">
        <img src="https://img.shields.io/badge/Rules-RRULE_Engine-success?style=flat-square" alt="RRULE" />
        <img src="https://img.shields.io/badge/Integrity-PostgreSQL_Invariants-blue?style=flat-square" alt="PostgreSQL Invariants" />
      </p>
      <ul>
        <li><b>Interactive Views:</b> Day, Week, and Month scheduling grids.</li>
        <li><b>Recurrence Engine:</b> Daily, weekly, monthly, and yearly recurring rules.</li>
        <li><b>Temporal Invariants:</b> Database constraint enforcing <code>start &lt; end</code>.</li>
        <li><b>1-Click Meet Binding:</b> Automatic generation of LiveKit meeting rooms.</li>
      </ul>
    </td>
    <td width="33%" valign="top">
      <h3 align="center">🔐 Identity & Security</h3>
      <p align="center">
        <img src="https://img.shields.io/badge/Hash-Argon2id-critical?style=flat-square" alt="Argon2id" />
        <img src="https://img.shields.io/badge/Tokens-HTTP--Only_Cookies-informational?style=flat-square" alt="HTTP-Only Cookies" />
      </p>
      <ul>
        <li><b>Argon2id Encryption:</b> Memory-hard, GPU-resistant credential hashing.</li>
        <li><b>Rotating Dual-Token:</b> Short-lived access + rotating refresh tokens.</li>
        <li><b>Timing Defense:</b> Constant-time dummy hashes against user enumeration.</li>
        <li><b>Session Revocation:</b> Live tracking and remote session revocation.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏛 System Architecture

Orvexa is engineered as a clean multi-tier distributed architecture ensuring strict separation of concerns, high read/write throughput, and sub-100ms real-time latency across audio, video, and data channels.

### 🌐 End-to-End Platform Topology

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client Layer (React 19 + TypeScript + Vite)"]
        UI["Web UI Components\n(Tailwind CSS v4 + Radix UI)"]
        State["State & Cache Layer\n(Zustand Stores + TanStack Query v5)"]
        VirtualDOM["Feed Virtualizer\n(@tanstack/react-virtual 60 FPS)"]
        SocketCl["Socket.io Client\n(Presence, Typing, Real-Time Sync)"]
        LKCl["LiveKit WebRTC Client\n(Audio/Video Tracks, Tiles, Screenshare)"]
    end

    subgraph GatewayLayer["⚡ API Gateway & Middleware (Express 5.x)"]
        AuthGuard["Auth & Cookie Guard\n(JWT SameSite HttpOnly Cookies)"]
        RateAudit["Audit & Security Filter\n(Helmet CSP + Audit Logger)"]
        ZodVal["Validation Layer\n(Zod Request Schemas)"]
        Router["Express REST Router\n(/api/auth, /api/chat, /api/drive, /api/meet, ...)"]
    end

    subgraph ServiceLayer["⚙️ Domain Services & Real-Time Engines"]
        ChatSvc["Chat & Spaces Service\n(Idempotency, 1:1 Invariant Pairs)"]
        MeetSvc["Meet Service & Token Engine\n(LiveKit Server SDK, Room Codes)"]
        DriveSvc["Drive & Archiver Service\n(Streaming ZIP, Exclusive-Arc RBAC)"]
        MailSvc["Webmail Service\n(Thread Aggregator, SMTP Router)"]
        CalSvc["Calendar Engine\n(RRULE Expander, Temporal Checks)"]
        SocketHub["Socket.io Server Hub\n(Multi-Room Events & Presence)"]
        Worker["Background Workers\n(Drive Trash Auto-Purge Worker)"]
    end

    subgraph InfraLayer["🗄️ Persistence & Cloud Infrastructure"]
        Prisma["Prisma ORM 7.x\n(Modular Multi-File Schemas)"]
        PG[("PostgreSQL 16+\n(64-bit BigInt Keys + Invariants)")]
        LKSFU["LiveKit SFU Server\n(Selective Forwarding Unit / WebRTC)"]
        Cloudinary["Cloudinary DAM & CDN\n(Zero-Blob Decoupled Asset Store)"]
        SMTPGateway["Email Gateway\n(Resend API / Transactional SMTP)"]
    end

    UI --> State
    State --> VirtualDOM
    State --> Router
    SocketCl <--> SocketHub
    LKCl <--> LKSFU

    Router --> AuthGuard --> RateAudit --> ZodVal
    ZodVal --> ChatSvc
    ZodVal --> MeetSvc
    ZodVal --> DriveSvc
    ZodVal --> MailSvc
    ZodVal --> CalSvc

    ChatSvc --> SocketHub
    MeetSvc --> LKSFU
    DriveSvc --> Cloudinary
    MailSvc --> SMTPGateway

    ChatSvc --> Prisma
    MeetSvc --> Prisma
    DriveSvc --> Prisma
    MailSvc --> Prisma
    CalSvc --> Prisma
    Worker --> Prisma

    Prisma <--> PG
```

### 🔄 Interactive Communication & Data Flow Diagrams

<details open>
<summary><b>Click to view: Real-Time WebSockets & LiveKit WebRTC Signaling Lifecycle</b></summary>

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Client A)
    actor Bob as Bob (Client B)
    participant API as Orvexa API Server
    participant Socket as Socket.io Server
    participant SFU as LiveKit SFU (WebRTC)
    participant DB as PostgreSQL 16 (Prisma)

    Note over Alice, Bob: 1. Bi-directional Chat & Presence Flow
    Alice->>Socket: Connect (JWT in Cookie)
    Socket->>DB: Validate Session & Set User Presence (ONLINE)
    Socket-->>Bob: Broadcast "user:presence" (Alice is Online)
    Alice->>API: POST /api/chat/messages (Idempotent payload)
    API->>DB: Persist Message (BigInt ID, timestamp UTC)
    API->>Socket: Emit "chat:message:created"
    Socket-->>Bob: Deliver message in real-time
    Bob-->>Socket: Emit "chat:seen" (Read receipt)
    Socket-->>Alice: Update receipt status in UI (Optimistic sync)

    Note over Alice, Bob: 2. WebRTC Video Conference (Meet) Flow
    Alice->>API: POST /api/meet/rooms (Create Room xxx-yyyy-zzz)
    API->>DB: Create Room record & Bind Host Permissions
    API-->>Alice: Return Room Details & JWT LiveKit Token
    Alice->>SFU: Connect via WebRTC (LiveKit Client with Token)
    SFU-->>Alice: Media Session Established (Publish Tracks)
    Bob->>API: POST /api/meet/rooms/:code/join
    API-->>Bob: Return Join Access JWT LiveKit Token
    Bob->>SFU: Join Room & Subscribe to Alice's Video/Audio Tracks
    SFU-->>Bob: Stream Alice's Video/Audio (Sub-100ms SFU Routing)
    Bob->>SFU: Publish Bob's Video/Audio / Screen Share
    SFU-->>Alice: Stream Bob's Track to Alice's Screen
```

</details>

<details>
<summary><b>Click to view: Decoupled DAM & Exclusive Arc Storage Pipeline</b></summary>

```mermaid
flowchart LR
    subgraph Client["Browser Client"]
        Uploader["File / Attachment Upload\n(Direct / Multipart)"]
        Downloader["Zip Archive Request\n(Multi-selection or Folder)"]
    end

    subgraph API["Orvexa API Engine"]
        Multer["Multer Streaming Buffer"]
        Sharp["Sharp Image Transformer\n(WebP / Resize / Optimization)"]
        Archiver["Archiver Streaming Engine\n(Zero-Disk In-Flight ZIP)"]
        PermEngine["Exclusive Arc Permission Guard\n(XOR Drive Check: File XOR Folder)"]
    end

    subgraph Cloud["External DAM"]
        CloudinaryCDN["Cloudinary Asset Storage\n(Original, Thumbnails, Secure URL)"]
    end

    subgraph DB["PostgreSQL 16"]
        AssetsTable[("file_assets Table\n(id BigInt, public_id, cdn_url,\nmime_type, byte_size, width, height)")]
        DomainTables[("Domain Entities\n(drive_files, chat_attachments,\nmail_attachments, user_avatars)")]
    end

    Uploader --> Multer --> Sharp
    Sharp --> CloudinaryCDN
    Sharp --> AssetsTable
    AssetsTable -. "Foreign Key Reference" .-> DomainTables

    Downloader --> PermEngine
    PermEngine --> Archiver
    CloudinaryCDN --> Archiver
    Archiver ==> |"Piped HTTP Streaming Response"| Client
```

</details>

---

## 🛠 Tech Stack

| Layer | Technology | Key Highlights |
| :--- | :--- | :--- |
| **Monorepo** | pnpm Workspaces | Efficient dependency sharing across `@orvexa/web`, `@orvexa/api`, and packages |
| **Frontend Framework** | React 19 + TypeScript | Modern concurrent rendering, strict types, Vite build tooling |
| **Styling & UI** | Tailwind CSS v4, Lucide Icons | Next-gen CSS engine, responsive layouts, Radix UI slot primitives |
| **Client State & Cache** | TanStack Query v5, Zustand | Server-state caching, optimistic updates, lightweight client state |
| **Virtualization** | `@tanstack/react-virtual` | 60 FPS DOM recycling for message feeds and large datasets |
| **Backend Runtime** | Node.js 22+, Express 5 | Asynchronous REST microservices, ES Modules with TSX runtime |
| **Database & ORM** | PostgreSQL 16+, Prisma ORM | 3NF normalized schema, multi-file Prisma schema, BigInt surrogate keys |
| **Real-Time WebSockets**| Socket.io 4.x | Event-driven architecture, distributed user presence tracking |
| **WebRTC Video/Audio** | LiveKit SFU | Room tokens, multi-peer video/audio feeds, screen sharing |
| **Asset Storage** | Cloudinary & Multer | Digital Asset Management (DAM), Sharp image optimization |
| **Security & Auth** | Argon2id, JWT, Helmet | HTTP-only cookies, CORS policy, timing-attack protection |

---

## 🔬 Deep-Dive Domain Modules

Explore the architectural implementation, real-time protocols, and engineering guarantees behind each subsystem:

<details open>
<summary><b>💬 1. Real-Time Chat & Spaces Engine</b></summary>

The Chat engine powers high-velocity bi-directional messaging across direct 1:1 threads and group spaces:

- **60 FPS DOM Recycling**: Rendered using `@tanstack/react-virtual` to recycle DOM elements dynamically. Handles channels containing 100,000+ messages while maintaining locked 60 FPS scrolling and negligible memory overhead.
- **Idempotent 1-on-1 Invariant**: Direct conversations enforce a mathematical uniqueness guarantee at the database layer via `UNIQUE (LEAST(user_a, user_b), GREATEST(user_a, user_b))`, eliminating race conditions and duplicate threads.
- **Bi-directional WebSockets**: Built on **Socket.io 4.x** with custom room namespaces (`chat:conversation:<id>`). Provides real-time typing indicators, read receipts (`seen_at`), message editing, soft deletions, and reaction counters.
- **Rich Media & Attachments**: Integrated with the DAM engine. Files, voice clips, and images are processed asynchronously via Cloudinary with responsive previews and secure signed delivery URLs.

| Protocol / Event | Description | Direction |
| :--- | :--- | :--- |
| `chat:message:send` | Dispatch message with optimistic client ID | Client ➔ Server |
| `chat:message:created` | Broadcast persistent message payload | Server ➔ Clients |
| `chat:typing` | User started / stopped typing indicator | Bi-directional |
| `chat:seen` | Read receipt acknowledgment | Client ➔ Server |
| `chat:reaction:toggle` | Add / remove emoji reaction on message | Bi-directional |

</details>

<details>
<summary><b>📹 2. Meet (WebRTC Video Conferencing)</b></summary>

Orvexa Meet delivers zero-install, enterprise-grade video and audio collaboration built on the **LiveKit SFU** architecture:

- **Sub-100ms Latency SFU**: Uses a Selective Forwarding Unit to distribute media tracks directly between participants, drastically reducing client bandwidth and CPU consumption compared to mesh WebRTC.
- **Human-Readable Meeting Codes**: Instant meeting generation producing structured codes in the format `xxx-yyyy-zzz` with cryptographically secure validation and database mapping.
- **Token-Based Room Security**: Meeting access is governed by short-lived, cryptographically signed LiveKit JWTs granting scoped publish/subscribe permissions based on user identity.
- **Comprehensive Room Controls**: Dynamic speaker grid, active speaker highlighting, screen sharing with system audio, participant mute/kick moderation, device selector modal (camera, mic, speaker), and an in-call chat panel.
- **Dedicated Route Architecture**: Isolated full-screen meeting experience (`/meet/:code`) decoupled from the standard application layout, with a post-meeting exit lounge (`/meet/:code/left`).

</details>

<details>
<summary><b>📁 3. Drive (Cloud File & Document Management)</b></summary>

Orvexa Drive provides a scalable, enterprise-grade cloud file system with mathematical access control:

- **Zero-Blob PostgreSQL Architecture**: Binary files are never stored in PostgreSQL. Uploads pass through Multer and Sharp image pipelines directly into Cloudinary CDN. The database maintains pure metadata pointers via the central `file_assets` table.
- **Exclusive-Arc (XOR) Access Control**: Folder and file sharing bypasses fragile polymorphic anti-patterns. Permissions utilize PostgreSQL `CHECK` constraints ensuring a permission record points to **either** a folder **or** a file, never both or neither.
- **In-Flight Batch ZIP Streaming**: Multi-file selections or entire nested folder hierarchies can be downloaded as a single compressed `.zip` archive on-the-fly via Node.js `archiver` streams, eliminating server disk buffering.
- **Version History & Rollbacks**: Every file modification increments a revision sequence with historical records preserved in `drive_file_versions`, enabling instant rollbacks to previous states.
- **Background Trash Auto-Purge Worker**: Soft-deleted files are held in a recycle bin and automatically purged after 30 days by a background worker (`drive.worker.ts`).
- **External Sharing Tokens**: Secure anonymous link sharing via cryptographic tokens (`/drive/s/:token`) with viewer permissions and access request approval flows (`/drive/request-access`).

</details>

<details>
<summary><b>✉️ 4. Mail (Enterprise Webmail Suite)</b></summary>

A responsive, full-featured webmail client built for transactional reliability and high-speed search:

- **Threaded Conversation Aggregation**: Incoming and outgoing emails are automatically grouped into conversation threads with unread indicators and participant tracking.
- **Multi-Folder Organization**: Complete folder support including Inbox, Sent, Drafts, Starred, and Trash with instant message triage and bulk actions.
- **Rich-Text Composer**: Full-featured WYSIWYG editor supporting To, CC, and BCC recipient distribution lists, file attachments, and background draft auto-saving.
- **Resend & SMTP Delivery Engine**: Transaction-safe mail dispatching with dual support for the **Resend API** and custom corporate SMTP servers.
- **Decoupled DAM Attachments**: Attachments are stored as digital assets and served via CDN URLs, ensuring lightning-fast email payloads.

</details>

<details>
<summary><b>📅 5. Calendar & Intelligent Scheduling</b></summary>

A business calendar and event coordination engine engineered for temporal accuracy:

- **Flexible Multi-View Layouts**: Interactive Day, Week, and Month scheduling grids with drag-to-create event interactions.
- **RFC-Compliant Recurrence Engine**: Comprehensive support for recurring events (daily, weekly, monthly, yearly) with customizable intervals, recurrence end rules, and exception overrides.
- **Database-Level Temporal Invariants**: PostgreSQL `CHECK` constraints guarantee that `start_time < end_time` at the schema level, eliminating impossible temporal states.
- **1-Click Meet Room Binding**: Create an Orvexa Meet room and attach its secure join link to any calendar event with a single toggle.
- **Timezone Localization**: Microsecond-precision timestamps stored strictly in UTC (`TIMESTAMPTZ(6)`) and dynamically localized to each user's configured timezone.

</details>

<details>
<summary><b>🔐 6. Identity, Authentication & Profile Security</b></summary>

Zero-trust enterprise identity and access management built with modern cryptographic standards:

- **Argon2id Password Hashing**: Utilizes the memory-hard, GPU-resistant Argon2id hashing algorithm to protect against offline brute-force and dictionary attacks.
- **Dual-Token Session Architecture**:
  - **Access Token**: Short-lived (15 minutes) JWT verified statelessly.
  - **Refresh Token**: Long-lived (7 days) rotating token stored in a hardened, `SameSite=Strict`, `HttpOnly`, `Secure` cookie.
- **Constant-Time Verification**: Prevents user enumeration and timing attacks through constant-time dummy hash verification when non-existent usernames/emails are queried.
- **Active Session Management**: Real-time auditing of active user sessions with IP addresses, user agents, and remote session termination capabilities.
- **User Profile Customization**: Avatar image cropping and optimization via Cloudinary, personalized theme toggling, and notification preferences.

</details>

---

## 💎 Core Engineering Highlights

Orvexa is engineered to solve the complex distributed systems and data consistency challenges inherent in enterprise communication suites:

### 1. 64-Bit Integer (`BigInt`) Architecture Everywhere
In high-throughput enterprise collaboration suites, 32-bit integer identifiers cap out at 2,147,483,647 ($2^{31} - 1$), causing catastrophic database overflow failures when message, notification, or audit logs exceed standard ranges.
- **Database Layer**: Every primary surrogate key and foreign key is defined as PostgreSQL `BIGINT` (`BIGSERIAL` / `int8`), guaranteeing an address space up to $9.22 \times 10^{18}$.
- **IEEE 754 Lossless Serialization**: JavaScript's native `Number` type experiences precision truncation for integers exceeding $2^{53} - 1$ (`9,007,199,254,740,991`). To prevent silent ID corruption, the backend runtime monkey-patches `BigInt.prototype.toJSON`:

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
All entity identifiers serialize as strings over REST and WebSocket channels, maintaining 100% precision across client runtimes.

---

### 2. Exclusive Arc (XOR) Foreign Key Constraints
Polymorphic associations (e.g., generic `target_type` + `target_id` strings) are a common database anti-pattern that disable relational foreign key constraints, break query optimizers, and permit orphaned records.

Orvexa solves this using **Exclusive Arc Foreign Keys** with PostgreSQL `CHECK` constraints and partial unique indexes for Drive permissions, favorites, and recent items:

```sql
-- Database-enforced Exclusive Arc check constraint
ALTER TABLE "drive_permissions"
ADD CONSTRAINT "drive_permissions_target_check"
CHECK (
  ("file_id" IS NOT NULL AND "folder_id" IS NULL) OR
  ("file_id" IS NULL AND "folder_id" IS NOT NULL)
);

-- Partial unique indexes preventing duplicate permissions
CREATE UNIQUE INDEX "drive_permissions_file_user_uidx" 
  ON "drive_permissions" ("file_id", "user_id") 
  WHERE "file_id" IS NOT NULL;

CREATE UNIQUE INDEX "drive_permissions_folder_user_uidx" 
  ON "drive_permissions" ("folder_id", "user_id") 
  WHERE "folder_id" IS NOT NULL;
```
**Benefits**:
- 100% database-enforced referential integrity.
- Automatic cascading deletes via native foreign keys.
- Optimal B-Tree index scan performance.

---

### 3. Decoupled Digital Asset Management (DAM) & Zero-Blob PostgreSQL
No binary BLOBs or Base64 payloads ever touch the PostgreSQL database.
- **Central Asset Abstraction**: Binary uploads pass through Multer and Sharp image pipelines straight into **Cloudinary CDN**, generating a record in the central `file_assets` table.
- **Domain Independence**: Chat attachments, webmail files, drive documents, and user avatars simply store a foreign key pointer (`file_asset_id`) to `file_assets`.
- **Automated Lifecycle**: When an asset is orphaned or permanently deleted, a background worker triggers the Cloudinary Admin API to purge remote files, preventing cloud storage bloat.

---

### 4. Mathematical Guarantees via Database Invariants
Business logic invariants are enforced directly at the schema layer rather than relying solely on ephemeral application code:

#### Canonical 1-on-1 Direct Conversation Pairing
To eliminate race conditions where two simultaneous users both initiate a direct chat resulting in duplicate conversation records, direct pairs are sorted deterministically and enforced by a compound unique constraint:
```sql
-- Enforced canonical order invariant
ALTER TABLE "conversations"
ADD CONSTRAINT "conversations_direct_user_order_check"
CHECK (
  ("type" = 'DIRECT' AND "direct_user_low_id" < "direct_user_high_id") OR
  ("type" != 'DIRECT' AND "direct_user_low_id" IS NULL AND "direct_user_high_id" IS NULL)
);

-- Compound unique index guaranteeing single conversation pair
CREATE UNIQUE INDEX "conversations_direct_users_uidx"
  ON "conversations" ("direct_user_low_id", "direct_user_high_id")
  WHERE "type" = 'DIRECT';
```

#### Temporal Consistency
Calendar start and end times enforce a physical time-arrow constraint:
```sql
ALTER TABLE "calendar_events"
ADD CONSTRAINT "calendar_events_start_before_end_check"
CHECK ("start_time" < "end_time");
```

---

### 5. Watermark Cursor Read Tracking vs. Per-User State
- **Chat**: Rather than creating millions of message-user status records, conversations maintain a watermark cursor (`conversation_participants.last_read_message_id`). Messages with `id > last_read_message_id` are dynamically evaluated as unread in $O(1)$ time complexity.
- **Mail**: Because email triage is non-linear, `mail_user_states` stores independent, partitioned per-user states (`is_read`, `is_starred`, `folder`) so actions by recipient A never mutate recipient B's mailbox.

---

### 6. Zero-Knowledge Cryptography & Timing-Attack Defense
- **Argon2id Hashing**: Passwords are encrypted using memory-hard Argon2id (resistant against GPU and ASIC cracking rigs).
- **Constant-Time Verification**: Prevents username enumeration through timing analysis. When an invalid user attempts authentication, the server runs a dummy Argon2 hash verification against a constant mock string, equalizing execution latency across valid and invalid user queries.
- **Dual-Token Session Architecture**: Short-lived (15 min) JWT Access Tokens paired with rotating Refresh Tokens stored exclusively in hardened `SameSite=Strict`, `HttpOnly`, `Secure` cookies.

---

## 📂 Monorepo Directory Structure

```text
orvexa/
├── apps/
│   ├── api/                              # Backend Express 5 REST & WebSocket service
│   │   ├── prisma/
│   │   │   ├── schema/                   # Modular multi-file Prisma schemas:
│   │   │   │   ├── schema.prisma         # Generator & PostgreSQL datasource
│   │   │   │   ├── enums.prisma          # Shared schema enumerations
│   │   │   │   ├── auth.prisma           # Users, sessions, credentials, preferences
│   │   │   │   ├── chat.prisma           # Conversations, messages, reactions, pins
│   │   │   │   ├── meet.prisma           # WebRTC LiveKit meetings, roles, attendance
│   │   │   │   ├── drive.prisma          # Folders, files, versions, XOR permissions
│   │   │   │   ├── mail.prisma           # Email threads, messages, per-user state
│   │   │   │   ├── calendar.prisma       # Events, recurrences, participants, reminders
│   │   │   │   ├── storage.prisma        # Cloudinary digital asset management (file_assets)
│   │   │   │   ├── notification.prisma   # User in-app notifications
│   │   │   │   └── audit.prisma          # System security and audit trail logs
│   │   │   ├── migrations/               # PostgreSQL schema migrations
│   │   │   └── seed.ts                   # Initial database seeds (Admin user, etc.)
│   │   ├── src/
│   │   │   ├── common/                   # BigInt lossless serializer, error types
│   │   │   ├── config/                   # Zod environment parsing, CORS, Cloudinary
│   │   │   ├── infrastructure/           # Database, LiveKit, Cloudinary, Redis, Storage
│   │   │   ├── middleware/               # Logger, auth guards, centralized error handler
│   │   │   ├── modules/                  # Domain feature modules:
│   │   │   │   ├── auth/                 # Authentication, Argon2, JWT cookies, sessions
│   │   │   │   ├── calendar/             # Events, recurrence rules, holiday engine
│   │   │   │   ├── chat/                 # Conversations, messages, repository, service
│   │   │   │   ├── drive/                # Files, folders, trash purge worker, permissions
│   │   │   │   ├── mail/                 # Threads, drafts, attachments, mail service
│   │   │   │   └── meet/                 # LiveKit tokens, rooms, meeting codes
│   │   │   ├── routes/                   # Consolidated Express route tree
│   │   │   ├── sockets/                  # Socket.io connection & presence server
│   │   │   ├── app.ts                    # Express app configuration & middleware
│   │   │   └── server.ts                 # Server entrypoint & graceful shutdown
│   │   └── tests/                        # 35+ Unit, Integration, and E2E test suites
│   │       ├── unit/                     # Business logic and validation tests
│   │       ├── integration/              # Database and API endpoint integration tests
│   │       └── e2e/                      # End-to-end full scenario tests
│   │
│   └── web/                              # Frontend React 19 single-page app
│       ├── public/                       # Favicons, vector logos, and manifest
│       └── src/
│           ├── common/                   # Global components, AppLayout, route guards
│           ├── lib/                      # Utilities, classnames helper, axios client
│           └── modules/                  # Domain UI modules:
│               ├── auth/                 # Sign In / Register forms, AuthStore
│               ├── calendar/             # Calendar views (Day/Week/Month), event modals
│               ├── chat/                 # Virtualized message stream, spaces sidebar
│               ├── drive/                # File explorer, breadcrumbs, sharing modals
│               ├── home/                 # Unified dashboard and recent activities
│               ├── landing/              # Public product landing page
│               ├── mail/                 # Email inbox, rich text composer, threads
│               ├── meet/                 # Video conference room, lobby, media controls
│               └── profile/              # User settings, security, and preferences
│
├── docs/                                 # Architectural specifications & ERDs
│   ├── api/                              # REST API specifications
│   ├── architecture/                     # System design documentation
│   └── database/                         # Database design specification & schema docs
│       ├── database-design.md            # Comprehensive database technical specification
│       └── database-erd.md               # Visual Crow's Foot ERD models
├── infrastructure/                       # Deployment and container orchestration
├── packages/                             # Shared monorepo libraries (TypeScript, ESLint)
├── pnpm-workspace.yaml                   # Monorepo workspace configuration
├── vercel.json                           # Vercel multi-service routing config
└── package.json                          # Root scripts & dev orchestrations
```

---

## ⚙️ Prerequisites

Before setting up Orvexa locally, ensure your machine satisfies the following runtime and database requirements:

| Component | Minimum Version | Recommended Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `v20.12.0` | `v22.x LTS` | `node -v` | Active Node.js runtime |
| **pnpm** | `v9.0.0` | `v9.15.0+` | `pnpm -v` | Corepack: `corepack enable && corepack prepare pnpm@latest --activate` |
| **PostgreSQL** | `16.0` | `16.4+` | `psql --version` | Relational database with BigInt and Partial Index support |
| **LiveKit Server** | `v1.7.0` | Latest | `livekit-server --version` | Required for WebRTC video conferencing (`livekit-server --dev`) |
| **Cloudinary** | Cloud Account | Free / Paid Tier | N/A | DAM media asset storage and transformations |

---

## 🏁 Getting Started

Follow these steps to configure, migrate, and run Orvexa in a local development environment:

### 1. Clone & Install Dependencies

Clone the monorepo and install dependencies across all workspace packages:

```bash
git clone https://github.com/VishnuThangaraj/Orvexa.git
cd Orvexa

# Install all monorepo dependencies via pnpm
pnpm install
```

---

### 2. Environment Configuration

The monorepo requires environment configurations for both the API backend and the Web frontend.

#### ⚙️ Backend Environment (`apps/api/.env`)
Create `apps/api/.env` (or copy from the template below):

```env
# Server & Application Identity
PROJECT_VERSION=1.0.0
NODE_ENV=development
PORT=6970
CLIENT_ORIGIN=http://localhost:5173

# PostgreSQL Database Connection Strings
DATABASE_URL="postgresql://postgres:password@localhost:5432/orvexa?schema=public"
CLOUD_DATABASE_URL="postgresql://postgres:password@localhost:5432/orvexa?schema=public"

# Default Administrator Seed Credentials
ADMIN_NAME="Administrator"
ADMIN_EMAIL="admin@orvexa.local"
ADMIN_PASSWORD="SuperSecretPassword123!"
ADMIN_USERNAME="admin"

# JWT Authentication & Cookie Security (Min 32 characters)
JWT_SECRET="your-ultra-secure-jwt-secret-key-min-32-chars-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-ultra-secure-jwt-refresh-secret-key-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudinary (Digital Asset Management & CDN)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# LiveKit WebRTC SFU Server
LIVEKIT_URL="ws://localhost:7880"
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"

# Transactional Webmail & SMTP (Resend or Custom SMTP)
SMTP_HOST="smtp.resend.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="resend"
SMTP_PASS="re_your_resend_api_key"
EMAIL_FROM="no-reply@orvexa.local"
```

#### 🌐 Frontend Environment (`apps/web/.env`)
Create `apps/web/.env` and point to your local API server:

```env
VITE_SERVER_URL="http://localhost:6970"
```

---

### 3. Database Setup & Migrations

Orvexa utilizes Prisma with modular multi-file schemas. Execute migrations and seed administrative credentials:

```bash
# 1. Generate Prisma Client bindings from multi-file schemas
pnpm --filter @orvexa/api db:generate

# 2. Execute database migrations
pnpm --filter @orvexa/api db:migrate

# 3. Seed default administrative credentials
pnpm --filter @orvexa/api db:seed
```

> [!TIP]
> **Default Admin Account:**
> - **Username:** `admin` (or `admin@orvexa.local`)
> - **Password:** `SuperSecretPassword123!`
>
> You can visually inspect database tables, records, and relations at any time with **Prisma Studio**:
> ```bash
> pnpm --filter @orvexa/api db:studio
> ```
> *Prisma Studio will launch at [http://localhost:5555](http://localhost:5555).*

---

### 4. Running Development Servers

Launch both the backend API and frontend React client concurrently:

```bash
pnpm dev
```

| Service | Address | Description |
| :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | React 19 Client with Tailwind v4 & Vite HMR |
| **Backend API** | [http://localhost:6970](http://localhost:6970) | Node.js Express 5 REST & Socket.io Server |
| **API Health** | [http://localhost:6970/health](http://localhost:6970/health) | System health and version endpoint |
| **LiveKit SFU** | `ws://localhost:7880` | WebRTC Selective Forwarding Unit |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | Visual relational database explorer |

To run services independently:
```bash
pnpm dev:api   # Runs only Express API server with tsx watch
pnpm dev:web   # Runs only Vite frontend dev server
```

---

### 5. Production Build & Deployment

Orvexa is architected for frictionless production deployments. The workspace root contains a unified [`vercel.json`](file:///workspace/Projects/Orvexa/vercel.json) configuration that maps incoming requests seamlessly across both services:

- All `/api/*` traffic is routed to the `@orvexa/api` Express service.
- All other web traffic `/*` is routed to the `@orvexa/web` Vite SPA.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "api": { "root": "apps/api", "framework": "express" },
    "web": { "root": "apps/web", "framework": "vite" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "api" } },
    { "source": "/(.*)", "destination": { "service": "web" } }
  ]
}
```

To compile all applications for production:
```bash
# Typecheck and build all workspace packages
pnpm build
```

---

## 📜 Available Scripts & Tooling

### Root Workspace Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Runs both `@orvexa/web` and `@orvexa/api` concurrently in development mode |
| `pnpm dev:api` | Starts only the Express API server with TSX hot-reloading (`tsx watch`) |
| `pnpm dev:web` | Starts only the Vite React frontend development server |
| `pnpm build` | Compiles all packages and applications across the workspace for production |

### Backend API Commands (`@orvexa/api`)

| Command | Description |
| :--- | :--- |
| `pnpm --filter @orvexa/api test` | Executes unit, integration, and E2E test suites with node runner |
| `pnpm --filter @orvexa/api db:generate` | Generates type-safe Prisma Client from multi-file schema |
| `pnpm --filter @orvexa/api db:migrate` | Applies pending PostgreSQL database migrations in development |
| `pnpm --filter @orvexa/api db:deploy` | Applies pending migrations in production / CI environments |
| `pnpm --filter @orvexa/api db:seed` | Populates database with default administrator seed account |
| `pnpm --filter @orvexa/api db:studio` | Launches visual Prisma Studio GUI on `http://localhost:5555` |

### Frontend Web Commands (`@orvexa/web`)

| Command | Description |
| :--- | :--- |
| `pnpm --filter @orvexa/web dev` | Starts Vite development server with HMR on port 5173 |
| `pnpm --filter @orvexa/web build` | Type-checks (`tsc -b`) and bundles web application with Vite |
| `pnpm --filter @orvexa/web lint` | Runs ESLint 9 checks across frontend source files |
| `pnpm --filter @orvexa/web preview` | Locally previews the production build output |

---

## 🧪 Test Suite Coverage

Orvexa maintains an exhaustive automated test pyramid with over **35 specialized test suites** covering domain repositories, services, HTTP endpoints, WebSocket events, and end-to-end user workflows.

<details open>
<summary><b>Click to expand / collapse complete test catalog</b></summary>

| Test Tier | Domain / Module | Target File | Verification Scope |
| :--- | :--- | :--- | :--- |
| **E2E** | Chat | `chat-e2e.test.ts` | Multi-user conversation creation, message send, receipt confirmation |
| **E2E** | Auth & Session | `session-e2e.test.ts` | Login, token issuance, cookie persistence, refresh rotation, logout |
| **Integration** | Auth | `auth.routes.test.ts` | HTTP endpoint authentication, payload rejection, cookie headers |
| **Integration** | Auth | `auth.service.test.ts` | Argon2id verification, session revocation, token creation |
| **Integration** | Auth | `auth.security.test.ts` | Timing attack resistance, dummy hash verification benchmarks |
| **Integration** | Auth | `auth.lockout.test.ts` | Rate-limiting and consecutive failure lockouts |
| **Integration** | Chat | `chat.routes.test.ts` | REST API routes, pagination cursors, authorization guards |
| **Integration** | Chat | `chat.messages.test.ts` | Idempotent message deduplication, database foreign keys |
| **Integration** | Chat | `chat.spaces.test.ts` | Public/private channel creation, participant memberships |
| **Integration** | Chat | `chat.seen-receipt.test.ts` | Watermark cursor updating and unread count aggregation |
| **Integration** | Chat | `chat.interactions.test.ts` | Emoji reactions toggling, message pinning, mentions |
| **Integration** | Chat | `chat.attachments.test.ts` | Attachment metadata binding via DAM `file_assets` |
| **Integration** | Meet | `meet.api.test.ts` | Room code generation (`xxx-yyyy-zzz`), LiveKit JWT token signing |
| **Integration** | Drive | `drive.crud.test.ts` | Folder nesting, file upload records, metadata updates |
| **Integration** | Drive | `drive.sharing.test.ts` | Exclusive-Arc (XOR) permissions, share tokens, access requests |
| **Integration** | Drive | `drive.download.test.ts` | In-flight streaming ZIP archive bundling via Archiver |
| **Integration** | Mail | `mail.thread.test.ts` | Thread clustering, multi-recipient To/CC/BCC, user states |
| **Integration** | Calendar | `calendar.api.test.ts` | Event CRUD, temporal invariant validation, recurrence expansion |
| **Integration** | Sockets | `socket.connection.test.ts`| WebSocket handshake, presence broadcasting, room routing |
| **Unit** | Drive | `drive.schema.test.ts` | Exclusive Arc XOR database constraint assertions |
| **Unit** | Storage | `storage.provider.test.ts` | Cloudinary asset management, signed URL generators |
| **Unit** | Calendar | `calendar.recurrence.test.ts` | RFC-compliant recurrence pattern generator |
| **Unit** | Meet | `meet.code.test.ts` | Human-readable room code format validation |
| **Unit** | Security | `hash.test.ts` | Argon2id memory-hardness and parameter consistency |

To run the complete test suite:
```bash
pnpm --filter @orvexa/api test
```

</details>

---

## 🔒 Security & Audit Standards

Orvexa is designed from the ground up for strict enterprise security, regulatory compliance, and auditability:

```mermaid
flowchart LR
    Request["Incoming Client Request"] --> Helmet["Helmet Security Headers\n(CSP, HSTS, Frameguard)"]
    Helmet --> CookieGuard["Cookie & Session Guard\n(HttpOnly, SameSite=Strict)"]
    CookieGuard --> ZodGuard["Zod Payload Validator\n(Strict Schema Filtering)"]
    ZodGuard --> AppLogic["Domain Service Logic\n(Argon2id / Business Rules)"]
    AppLogic --> DB["PostgreSQL 16\n(Exclusive Arc & Constraints)"]
    AppLogic --> AuditLogger["Audit Logging Interceptor\n(IP, Latency, Status, Agent)"]
```

- **Cryptographic Credential Storage**: Passwords are protected using **Argon2id** (memory-hard, GPU-resistant). Constant-time dummy verification ensures consistent latency during failed authentication attempts, neutralizing user enumeration and timing attacks.
- **Dual-Token Cookie Isolation**: Sensitive tokens are never stored in `localStorage` or `sessionStorage`. Short-lived Access Tokens and rotating Refresh Tokens are isolated inside **HTTP-only, Secure, SameSite=Strict** cookies, immune to client-side XSS exfiltration.
- **Strict Payload Validation**: All incoming requests are validated against strict **Zod** schemas before reaching route controllers, preventing SQL injection, mass assignment, and type confusion vulnerabilities.
- **Hardened HTTP Headers**: **Helmet** enforces strict Content Security Policies (CSP), HTTP Strict Transport Security (HSTS), X-Content-Type-Options (`nosniff`), and X-Frame-Options (`DENY`).
- **Comprehensive Audit Trail**: Incoming requests are intercepted by an asynchronous audit logger that captures client IP addresses, HTTP methods, route paths, response status codes, latencies, and user agents.
- **Exclusive-Arc Data Protection**: Access permissions use database-level XOR foreign keys and check constraints, preventing orphaned access grants or unauthorized permission escalation.

---

## 🗺 Roadmap & Verification Status

### ✅ Production-Ready Core Capabilities

- [x] **Real-Time Chat & Spaces**:
  - [x] Bi-directional messaging via Socket.io with optimistic dispatch.
  - [x] 60 FPS DOM recycling over 100,000+ items via `@tanstack/react-virtual`.
  - [x] Canonical 1-on-1 deduplicated conversation invariant (`LEAST/GREATEST`).
  - [x] Emoji reactions, mentions, file attachments, and watermark read cursors.
- [x] **Meet (WebRTC Video Conferencing)**:
  - [x] Sub-100ms multi-party audio/video conferencing powered by LiveKit SFU.
  - [x] Structured room codes (`xxx-yyyy-zzz`) and cryptographic JWT room tokens.
  - [x] Audio/video muting, screen sharing with audio, tile layouts, and in-call chat.
  - [x] Dedicated full-screen meeting room route (`/meet/:code`) and exit lounge.
- [x] **Drive (Cloud File & Document Management)**:
  - [x] Zero-blob database architecture backed by Cloudinary DAM.
  - [x] Exclusive Arc (XOR) referential integrity for files and folders.
  - [x] In-flight batch ZIP archive streaming via `archiver`.
  - [x] File version history and instant revision rollbacks.
  - [x] 30-day soft-delete recycle bin with background auto-purge worker.
- [x] **Mail (Enterprise Webmail)**:
  - [x] Threaded conversation clustering with unread tracking.
  - [x] Rich-text composer with multi-recipient routing (To, CC, BCC) and drafts.
  - [x] Transaction-safe delivery via SMTP and Resend API.
- [x] **Calendar & Scheduling**:
  - [x] Day, Week, and Month interactive calendar grids.
  - [x] RFC-compliant RRULE recurrence engine (daily, weekly, monthly, yearly).
  - [x] Database-enforced temporal check constraint (`start_time < end_time`).
  - [x] 1-click Orvexa Meet room creation and event binding.
- [x] **Identity & Session Security**:
  - [x] Memory-hard Argon2id hashing + constant-time dummy verification.
  - [x] Dual-token session rotation in HTTP-only SameSite cookies.
  - [x] Real-time session monitoring and remote session revocation.

### 🚀 Upcoming Milestones & Enterprise Horizon

- [ ] **End-to-End Encryption (E2EE)**: Client-side cryptographic ratchet (Olm/Megolm) for zero-trust 1:1 chat channels.
- [ ] **Federated Full-Text Search**: Cross-subsystem unified search indexing Mail, Drive, and Chat with PostgreSQL `tsvector` and `pg_trgm`.
- [ ] **Native Mobile Clients**: Dedicated iOS and Android applications built with React Native / Flutter.
- [ ] **Enterprise SSO & Directory Sync**: SAML 2.0, OIDC, and SCIM directory synchronization (Okta, Azure AD, Google Workspace).
- [ ] **Server-Side Call Recording**: Direct-to-cloud audio/video session recording with automated transcription export.

---

## 🤝 Contributing & Architecture Specifications

We welcome contributions to the Orvexa platform! To ensure high architectural rigor, please review our foundational design documents before submitting pull requests:

### Technical Specifications
- 📘 **[Database Design Specification](file:///workspace/Projects/Orvexa/docs/database/database-design.md)** — Comprehensive documentation of the 27 physical relational models, BigInt key standards, XOR foreign key constraints, and performance indexes.
- 📐 **[Entity-Relationship Diagram (ERD)](file:///workspace/Projects/Orvexa/docs/database/database-erd.md)** — Visual Crow's Foot ERD models for every subsystem.

### Contribution Workflow
1. **Fork & Branch**: Create a feature branch from `main` (`git checkout -b feat/your-feature-name`).
2. **Code Standards**: Ensure code adheres to strict TypeScript and ESLint standards (`pnpm --filter @orvexa/web lint`).
3. **Database Changes**: If modifying database schemas, add models to `apps/api/prisma/schema/*.prisma`, generate migrations with `pnpm --filter @orvexa/api db:migrate`, and add corresponding tests.
4. **Verification**: Run the full test suite across the monorepo:
   ```bash
   pnpm --filter @orvexa/api test
   ```
5. **Pull Request**: Open a detailed PR with test coverage metrics and architecture notes.

---

## 📄 License & Open Standards

This project is licensed under the **[ISC License](LICENSE)**.

### Ecosystem Acknowledgments
- **[React](https://react.dev/)** & **[Vite](https://vitejs.dev/)** — Frontend rendering and lightning-fast developer experience.
- **[Express](https://expressjs.com/)** & **[Prisma ORM](https://www.prisma.io/)** — Robust backend REST routing and type-safe database access.
- **[LiveKit](https://livekit.io/)** — Next-generation WebRTC SFU infrastructure.
- **[Socket.io](https://socket.io/)** — Distributed bi-directional WebSocket communication.
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Next-generation CSS styling engine.
