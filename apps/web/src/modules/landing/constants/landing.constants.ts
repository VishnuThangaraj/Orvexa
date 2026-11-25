export const whatsIncluded = [
  {
    title: "Unified real-time collaboration",
    content:
      "Eliminate context switching with Socket.io 4.x messaging, 60 FPS virtualized channels, and sub-100ms LiveKit WebRTC video rooms.",
  },
  {
    title: "Self-hosted cloud architecture",
    content:
      "Run Mail, Drive, Calendar, Chat, Meet, and Home on your own infrastructure powered by React 19, Express 5, PostgreSQL, and Redis.",
  },
  {
    title: "Enterprise-grade security & RBAC",
    content:
      "Protect every workspace with Argon2id hashing, rotating HTTP-only cookie sessions, and Exclusive-Arc Drive access controls.",
  },
];

export const INCLUDED_APPS = [
  { name: "Home", description: "Unified dashboard & ⌘K", to: "/home" },
  { name: "Mail", description: "Threaded webmail", to: "/mail" },
  { name: "Chat", description: "60 FPS Spaces & DMs", to: "/chat" },
  { name: "Meet", description: "LiveKit WebRTC calls", to: "/meet" },
  { name: "Calendar", description: "RRULE scheduling", to: "/calendar" },
  { name: "Drive", description: "Versioned cloud files", to: "/drive" },
];

export const LANDING_FEATURES = [
  {
    eyebrow: "CHAT & SPACES",
    title: "60 FPS real-time messaging",
    description:
      "Bi-directional Socket.io channels with optimistic updates, deduplicated 1:1 pairs, emoji reactions, member mentions, and TanStack Virtual scrolling across 100k+ messages.",
  },
  {
    eyebrow: "MEET (WEBRTC)",
    title: "Sub-100ms video conferencing",
    description:
      "Powered by LiveKit SFU with instant xxx-yyyy-zzz meeting codes, screen sharing, adaptive tile grids, audio/video controls, and integrated in-call room chat.",
  },
  {
    eyebrow: "DRIVE",
    title: "Versioned cloud storage & RBAC",
    description:
      "Drag-and-drop folder hierarchies, complete revision rollbacks, on-the-fly batch ZIP streaming, share links with access requests, and a 30-day trash auto-purge worker.",
  },
  {
    eyebrow: "MAIL",
    title: "Threaded enterprise webmail",
    description:
      "Clustered conversations with unread indicators, rich HTML composer with To/CC/BCC routing, draft persistence, and decoupled DAM attachments via Resend or SMTP.",
  },
  {
    eyebrow: "CALENDAR",
    title: "Intelligent RRULE scheduling",
    description:
      "Interactive Day, Week, and Month views with daily, weekly, monthly, and yearly recurrence rules, PostgreSQL temporal invariants, and 1-click LiveKit Meet binding.",
  },
  {
    eyebrow: "HOME & SECURITY",
    title: "Unified command center & Argon2id",
    description:
      "Customizable dashboard widgets, global ⌘K search, live presence status (Active, Away, DND), Argon2id password hashing, and remote session revocation.",
  },
];

export interface LatestCardItem {
  id: string;
  eyebrow: string;
  title: string;
  ctaLabel: string;
  to?: string;
  href?: string;
  variant: "announcement" | "architecture" | "updates" | "security" | "comparison";
}

export const LATEST_ITEMS: LatestCardItem[] = [
  {
    id: "latest-unified",
    eyebrow: "ANNOUNCEMENT",
    title: "Unlock faster team workflows with Orvexa Unified Workspace",
    ctaLabel: "Get started",
    to: "/authenticate",
    variant: "announcement",
  },
  {
    id: "latest-architecture",
    eyebrow: "ARCHITECTURE",
    title: "Orvexa Monorepo: React 19, Express 5, PostgreSQL & LiveKit SFU",
    ctaLabel: "Explore modules",
    href: "#features",
    variant: "architecture",
  },
  {
    id: "latest-realtime",
    eyebrow: "PLATFORM",
    title: "Stay in sync with Socket.io 4.x presence, typing & 60 FPS feeds",
    ctaLabel: "See what's included",
    href: "#included",
    variant: "updates",
  },
  {
    id: "latest-security",
    eyebrow: "SECURITY",
    title: "Zero-knowledge Argon2id auth, rotating tokens & Exclusive-Arc RBAC",
    ctaLabel: "Read security FAQs",
    href: "#faq",
    variant: "security",
  },
  {
    id: "latest-comparison",
    eyebrow: "SELF-HOSTED SUITE",
    title: "Compare Orvexa unified workspace against fragmented SaaS tools",
    ctaLabel: "Explore features",
    href: "#features",
    variant: "comparison",
  },
];

export const FAQ = [
  {
    id: "faq-001",
    question: "What's included in Orvexa Workspace?",
    answer:
      "Orvexa Workspace consolidates six core applications into one unified platform: Home (customizable widget dashboard and ⌘K global search), Mail (threaded webmail), Chat & Spaces (real-time messaging), Meet (LiveKit WebRTC video conferencing), Calendar (RRULE scheduling), and Drive (versioned cloud storage).",
  },
  {
    id: "faq-002",
    question: "How does Orvexa handle real-time messaging and video calls?",
    answer:
      "Chat & Spaces uses Socket.io 4.x with optimistic UI updates and TanStack Virtual DOM recycling to keep channels locked at 60 FPS even past 100,000 messages. Meet runs on a LiveKit SFU engine for sub-100ms multi-party HD audio, video, screen sharing, and in-call chat.",
  },
  {
    id: "faq-003",
    question: "How are files and permissions secured in Orvexa Drive?",
    answer:
      "Drive enforces Exclusive-Arc role-based access control at the database level, supports granular share links and access request workflows, tracks full file version history for rollbacks, streams batch ZIP archives on the fly, and automatically purges trashed items after 30 days.",
  },
  {
    id: "faq-004",
    question: "What authentication and security standards does Orvexa use?",
    answer:
      "Orvexa hashes credentials with memory-hard, GPU-resistant Argon2id, issues short-lived access tokens paired with rotating refresh tokens in HTTP-only SameSite cookies, defends against user enumeration with constant-time dummy hashes, and supports live session revocation.",
  },
  {
    id: "faq-005",
    question: "Can I bind video meetings directly to Calendar events?",
    answer:
      "Yes. Orvexa Calendar supports Day, Week, and Month views, full RRULE recurrence (daily, weekly, monthly, yearly), PostgreSQL temporal invariants (start < end), and 1-click automatic generation of LiveKit Meet rooms.",
  },
  {
    id: "faq-006",
    question: "How is Orvexa built and deployed?",
    answer:
      "Orvexa is a TypeScript monorepo (@orvexa/web + @orvexa/api) built with React 19, Vite, Tailwind CSS v4, Express 5, Prisma 7, PostgreSQL 16+, Redis/BullMQ, Cloudinary CDN, and Resend/SMTP, ready for self-hosted or cloud deployment.",
  },
];

export interface FooterLinkItem {
  label: string;
  to?: string;
  href?: string;
}

export interface FooterSection {
  title: string;
  items: FooterLinkItem[];
}

export const FOOTER_COLUMNS: FooterSection[][] = [
  [
    {
      title: "Applications",
      items: [
        { label: "Home Dashboard", to: "/home" },
        { label: "Orvexa Mail", to: "/mail" },
        { label: "Orvexa Chat", to: "/chat" },
        { label: "Orvexa Meet", to: "/meet" },
        { label: "Orvexa Calendar", to: "/calendar" },
        { label: "Orvexa Drive", to: "/drive" },
      ],
    },
  ],
  [
    {
      title: "Drive & Files",
      items: [
        { label: "My Drive", to: "/drive" },
        { label: "Shared with me", to: "/drive/shared" },
        { label: "Recent files", to: "/drive/recent" },
        { label: "Starred files", to: "/drive/starred" },
        { label: "Trash", to: "/drive/trash" },
      ],
    },
  ],
  [
    {
      title: "Security & Identity",
      items: [
        { label: "Argon2id Hashing", href: "#faq" },
        { label: "Rotating Dual Tokens", href: "#faq" },
        { label: "Exclusive-Arc RBAC", href: "#features" },
        { label: "Session Revocation", to: "/profile" },
      ],
    },
  ],
  [
    {
      title: "Platform Stack",
      items: [
        { label: "React 19 & Tailwind v4", href: "#latest" },
        { label: "Express 5 & Prisma 7", href: "#latest" },
        { label: "Socket.io 4.x & LiveKit", href: "#features" },
        { label: "PostgreSQL, Redis & BullMQ", href: "#faq" },
        { label: "Cloudinary DAM & Resend", href: "#features" },
      ],
    },
  ],
  [
    {
      title: "Getting Started",
      items: [
        { label: "Sign In", to: "/authenticate" },
        { label: "Create Account", to: "/authenticate" },
        { label: "What's Included", href: "#included" },
        { label: "Platform Features", href: "#features" },
        { label: "All the Latest", href: "#latest" },
        { label: "FAQs", href: "#faq" },
      ],
    },
  ],
];

export const FOOTER_LEGAL_LINKS: FooterLinkItem[] = [
  { label: "Overview", href: "#included" },
  { label: "Features", href: "#features" },
  { label: "Latest", href: "#latest" },
  { label: "Security", href: "#faq" },
  { label: "FAQ", href: "#faq" },
];
