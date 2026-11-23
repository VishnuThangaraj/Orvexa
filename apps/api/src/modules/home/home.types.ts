export interface HomeSummary {
  unreadMailCount: number;
  unreadChatCount: number;
  todayEventsCount: number;
  todayMeetingsCount: number;
  storageUsedBytes: string;
  storageTotalBytes: string;
}

export interface HomeMailData {
  counts: {
    inboxUnread: number;
    starred: number;
    drafts: number;
  };
  recentThreads: Array<{
    id: string;
    threadId: string;
    subject: string;
    snippet: string;
    createdAt: string;
    isRead: boolean;
    isStarred: boolean;
    hasAttachments: boolean;
    sender: {
      fullName: string;
      email: string;
      username: string;
      avatarUrl?: string | null;
    };
  }>;
}

export interface HomeChatData {
  unreadTotal: number;
  conversations: Array<{
    id: string;
    name: string;
    type: "DIRECT" | "GROUP" | "CHANNEL";
    lastMessage?: {
      content: string;
      createdAt: string;
      senderName: string;
    } | null;
    unreadCount: number;
    avatarUrl?: string | null;
    isOnline?: boolean;
    presenceStatus?: "ACTIVE" | "AWAY" | "DND";
    updatedAt: string;
  }>;
}

export interface HomeCalendarData {
  nextUp?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    color?: string | null;
    location?: string | null;
    meetUrl?: string | null;
    attendeeCount: number;
  } | null;
  todayEvents: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    color?: string | null;
    location?: string | null;
    meetUrl?: string | null;
    isAllDay: boolean;
  }>;
  monthEventDates: string[];
}

export interface HomeMeetData {
  activeMeetings: Array<{
    id: string;
    title: string;
    code: string;
    hostName: string;
    hostAvatarUrl?: string | null;
    participantCount: number;
  }>;
  upcomingMeetings: Array<{
    id: string;
    title: string;
    code: string;
    scheduledStart: string;
    scheduledEnd?: string | null;
    hostName: string;
  }>;
  recentMeetings: Array<{
    id: string;
    title: string;
    code: string;
    endedAt: string;
  }>;
}

export interface HomeDriveData {
  storage: {
    usedBytes: string;
    totalBytes: string;
    usagePercentage: number;
    fileCount: number;
  };
  recentFiles: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: string;
    updatedAt: string;
    thumbnailUrl?: string | null;
    ownerName: string;
    isStarred?: boolean;
  }>;
}

export interface HomeTaskItem {
  id: string;
  title: string;
  details?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
}

export interface HomeActivityItem {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl?: string | null;
  } | null;
}

export interface ModuleSection<T> {
  status: "success" | "error";
  data?: T;
  error?: string;
}

export interface HomeOverviewResult {
  summary: HomeSummary;
  mail: ModuleSection<HomeMailData>;
  chat: ModuleSection<HomeChatData>;
  calendar: ModuleSection<HomeCalendarData>;
  meet: ModuleSection<HomeMeetData>;
  drive: ModuleSection<HomeDriveData>;
  tasks: ModuleSection<HomeTaskItem[]>;
  activity: ModuleSection<HomeActivityItem[]>;
}

export interface UserDashboardPreferencesDto {
  widgetOrder?: string[];
  hiddenWidgets?: string[];
  collapsedWidgets?: string[];
  summaryStrip?: boolean;
}

export interface GlobalSearchResultItem {
  id: string;
  title: string;
  snippet?: string;
  module: "mail" | "chat" | "calendar" | "drive";
  deepLink: string;
  metadata?: Record<string, any>;
  updatedAt?: string;
}

export interface GlobalSearchResponse {
  query: string;
  totalHits: number;
  results: {
    mail: GlobalSearchResultItem[];
    chat: GlobalSearchResultItem[];
    calendar: GlobalSearchResultItem[];
    drive: GlobalSearchResultItem[];
  };
}
