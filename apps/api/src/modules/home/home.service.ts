import MailService from "../mail/mail.service.js";
import ChatService from "../chat/chat.service.js";
import CalendarService from "../calendar/calendar.service.js";
import MeetService from "../meet/meet.service.js";
import driveService from "../drive/drive.service.js";
import presenceService from "../../sockets/presence.service.js";
import HomeRepository from "./home.repository.js";
import type {
  HomeOverviewResult,
  HomeMailData,
  HomeChatData,
  HomeCalendarData,
  HomeMeetData,
  HomeDriveData,
  HomeTaskItem,
  HomeActivityItem,
  GlobalSearchResponse,
  GlobalSearchResultItem,
} from "./home.types.js";
import type { UpdateDashboardPreferencesDto } from "./home.validation.js";

export class HomeService {
  private mailService: MailService;
  private chatService: ChatService;
  private calendarService: CalendarService;
  private meetService: MeetService;
  private driveService: typeof driveService;
  private homeRepository: HomeRepository;

  constructor() {
    this.mailService = new MailService();
    this.chatService = new ChatService();
    this.calendarService = new CalendarService();
    this.meetService = new MeetService();
    this.driveService = driveService;
    this.homeRepository = new HomeRepository();
  }

  // --- 1. Mail Overview Slice ---
  async getMailSummary(userId: bigint): Promise<HomeMailData> {
    const [counts, inboxRes] = await Promise.all([
      this.mailService.fetchCounts(userId),
      this.mailService.fetchInbox(userId, { page: 1, limit: 5 }),
    ]);

    const recentThreads = inboxRes.messages.map((m: any) => {
      const userState = m.userStates?.[0] || {};
      const snippet = m.body ? m.body.replace(/<[^>]*>?/gm, "").slice(0, 140) : "";

      return {
        id: String(m.id),
        threadId: String(m.threadId || m.id),
        subject: m.subject || "(No Subject)",
        snippet,
        createdAt: m.sentAt?.toISOString() || m.createdAt?.toISOString() || new Date().toISOString(),
        isRead: Boolean(userState.isRead),
        isStarred: Boolean(userState.isStarred),
        hasAttachments: Boolean(m.attachments && m.attachments.length > 0),
        sender: {
          fullName: m.sender?.fullName || "Unknown Sender",
          email: m.sender?.email || "",
          username: m.sender?.username || "",
          avatarUrl: null,
        },
      };
    });

    return {
      counts: {
        inboxUnread: counts.inboxUnread,
        starred: counts.starred,
        drafts: counts.drafts,
      },
      recentThreads,
    };
  }

  // --- 2. Chat Overview Slice ---
  async getChatSummary(userId: bigint): Promise<HomeChatData> {
    const [unreadTotal, convResult, presenceMap] = await Promise.all([
      this.chatService.getUnreadCount(userId),
      this.chatService.getUserConversations(userId, { limit: 5 }),
      presenceService.getHydratedPresenceMap(),
    ]);

    const conversations = convResult.conversations.map((c: any) => {
      const otherParticipant = c.participants.find(
        (p: any) => p.userId !== userId,
      );
      const myParticipant = c.participants.find(
        (p: any) => p.userId === userId,
      );

      const lastMsg = c.messages?.[0];
      const displayName =
        c.type === "DIRECT"
          ? otherParticipant?.user?.fullName || otherParticipant?.user?.username || "Chat"
          : c.name || "Space";

      let isUnread = false;
      if (lastMsg && lastMsg.senderId !== userId) {
        if (
          myParticipant?.lastReadMessageId !== null &&
          myParticipant?.lastReadMessageId !== undefined &&
          lastMsg.id !== undefined
        ) {
          isUnread = BigInt(myParticipant.lastReadMessageId) < BigInt(lastMsg.id);
        } else if (!myParticipant?.lastReadAt) {
          isUnread = true;
        } else {
          isUnread = new Date(lastMsg.createdAt) > new Date(myParticipant.lastReadAt);
        }
      }

      const avatarUrl =
        c.type === "DIRECT"
          ? otherParticipant?.user?.profileImage?.secureUrl || null
          : c.image?.secureUrl || null;

      const presenceStatus =
        c.type === "DIRECT" && otherParticipant?.userId
          ? presenceMap[String(otherParticipant.userId)]?.status
          : undefined;

      return {
        id: String(c.id),
        name: displayName,
        type: c.type,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content || (lastMsg.attachment ? "Attachment" : ""),
              createdAt: lastMsg.createdAt?.toISOString() || new Date().toISOString(),
              senderName:
                lastMsg.sender?.fullName ||
                (lastMsg.senderId === userId ? "You" : "Participant"),
            }
          : null,
        unreadCount: isUnread ? 1 : 0,
        avatarUrl,
        presenceStatus,
        updatedAt: c.lastMessageAt?.toISOString() || c.createdAt?.toISOString(),
      };
    });

    return {
      unreadTotal,
      conversations,
    };
  }

  // --- 3. Calendar Overview Slice ---
  async getCalendarSummary(userId: bigint, _timezone?: string): Promise<HomeCalendarData> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthEvents = await this.calendarService.getEvents(userId, {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString(),
      includeDeclined: false,
    });

    const monthEventDateSet = new Set<string>();
    const todayEvents: HomeCalendarData["todayEvents"] = [];

    for (const evt of monthEvents) {
      const eStart = new Date(evt.startTime);
      const eEnd = new Date(evt.endTime);

      // Collect YYYY-MM-DD for dot indicators
      const dateKey = `${eStart.getFullYear()}-${String(eStart.getMonth() + 1).padStart(2, "0")}-${String(eStart.getDate()).padStart(2, "0")}`;
      monthEventDateSet.add(dateKey);

      // Check if event overlaps with today
      if (eStart <= endOfDay && eEnd >= startOfDay) {
        const meetUrl = (evt as any).meeting?.meetingCode
          ? `/meet/${(evt as any).meeting.meetingCode}`
          : null;

        todayEvents.push({
          id: String(evt.id),
          title: evt.title || "Untitled event",
          startTime: evt.startTime,
          endTime: evt.endTime,
          color: evt.color || evt.calendar?.color || "#0b57d0",
          location: evt.location || null,
          meetUrl,
          isAllDay: Boolean(evt.isAllDay),
        });
      }
    }

    // Sort today events by start time
    todayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Calculate "Next up" event: earliest today or upcoming that hasn't ended yet
    let nextUp: HomeCalendarData["nextUp"] = null;
    const upcomingCandidate = todayEvents.find((evt) => new Date(evt.endTime).getTime() > now.getTime());

    if (upcomingCandidate) {
      const fullEvt = monthEvents.find((e: any) => String(e.id) === upcomingCandidate.id);
      nextUp = {
        id: upcomingCandidate.id,
        title: upcomingCandidate.title,
        startTime: upcomingCandidate.startTime,
        endTime: upcomingCandidate.endTime,
        color: upcomingCandidate.color,
        location: upcomingCandidate.location,
        meetUrl: upcomingCandidate.meetUrl,
        attendeeCount: fullEvt?.participants?.length || 1,
      };
    }

    return {
      nextUp,
      todayEvents,
      monthEventDates: Array.from(monthEventDateSet),
    };
  }

  // --- 4. Meet Overview Slice ---
  async getMeetSummary(userId: bigint): Promise<HomeMeetData> {
    const rawMeetings = await this.meetService.listUserMeetings(userId);
    const now = new Date();

    const activeMeetings: HomeMeetData["activeMeetings"] = [];
    const upcomingMeetings: HomeMeetData["upcomingMeetings"] = [];
    const recentMeetings: HomeMeetData["recentMeetings"] = [];

    for (const m of rawMeetings) {
      const sStart = m.scheduledStart ? new Date(m.scheduledStart) : null;
      const hostName = m.host?.fullName || m.host?.username || "Host";

      if (m.status === "LIVE") {
        activeMeetings.push({
          id: String(m.id),
          title: m.title || "Instant Meeting",
          code: m.meetingCode,
          hostName,
          hostAvatarUrl: m.host?.profileImage?.secureUrl || null,
          participantCount: m.participants?.length || 1,
        });
      } else if (m.status === "SCHEDULED" && sStart && sStart.getTime() >= now.getTime() - 15 * 60000) {
        upcomingMeetings.push({
          id: String(m.id),
          title: m.title || "Scheduled Meeting",
          code: m.meetingCode,
          scheduledStart: m.scheduledStart!,
          scheduledEnd: m.scheduledEnd || null,
          hostName,
        });
      } else if (m.status === "ENDED" || (sStart && sStart.getTime() < now.getTime() - 15 * 60000)) {
        recentMeetings.push({
          id: String(m.id),
          title: m.title || "Meeting",
          code: m.meetingCode,
          endedAt: m.endedAt || m.scheduledEnd || m.createdAt || new Date().toISOString(),
        });
      }
    }

    return {
      activeMeetings: activeMeetings.slice(0, 3),
      upcomingMeetings: upcomingMeetings.slice(0, 5),
      recentMeetings: recentMeetings.slice(0, 5),
    };
  }

  // --- 5. Drive Overview Slice ---
  async getDriveSummary(userId: bigint): Promise<HomeDriveData> {
    const [storage, recentFilesList] = await Promise.all([
      this.driveService.getUserStorage(userId),
      this.driveService.listRecent(userId, 8),
    ]);

    const recentFiles = recentFilesList.map((f: any) => ({
      id: String(f.id),
      name: f.name,
      mimeType: f.mimeType || "application/octet-stream",
      sizeBytes: String(f.sizeBytes || f.currentAsset?.bytes || 0),
      updatedAt: f.updatedAt?.toISOString() || new Date().toISOString(),
      thumbnailUrl: f.currentAsset?.secureUrl || null,
      ownerName: f.owner?.fullName || f.owner?.username || "You",
      isStarred: Boolean(f.isStarred),
    }));

    return {
      storage,
      recentFiles,
    };
  }

  // --- 6. Tasks Slice ---
  async getTasksSummary(userId: bigint): Promise<HomeTaskItem[]> {
    const tasks = await this.calendarService.getTasks(userId, {
      includeCompleted: false,
    });

    return tasks.slice(0, 6).map((t: any) => ({
      id: String(t.id),
      title: t.title,
      details: t.details || null,
      dueDate: t.dueDate || null,
      isCompleted: Boolean(t.isCompleted),
    }));
  }

  // --- 7. Activity / Notifications Slice ---
  async getActivitySummary(userId: bigint): Promise<HomeActivityItem[]> {
    const notifications = await this.homeRepository.getRecentNotifications(userId, 8);

    return notifications.map((n) => ({
      id: String(n.id),
      title: n.title,
      message: n.message,
      type: n.type,
      actionUrl: n.actionUrl || null,
      createdAt: n.createdAt.toISOString(),
      actor: n.actor
        ? {
            id: String(n.actor.id),
            fullName: n.actor.fullName,
            username: n.actor.username,
            avatarUrl: n.actor.profileImage?.secureUrl || null,
          }
        : null,
    }));
  }

  // --- 8. Comprehensive Aggregation Endpoint: GET /home/overview ---
  async getOverview(userId: bigint, timezone?: string): Promise<HomeOverviewResult> {
    const [
      mailRes,
      chatRes,
      calendarRes,
      meetRes,
      driveRes,
      tasksRes,
      activityRes,
    ] = await Promise.allSettled([
      this.getMailSummary(userId),
      this.getChatSummary(userId),
      this.getCalendarSummary(userId, timezone),
      this.getMeetSummary(userId),
      this.getDriveSummary(userId),
      this.getTasksSummary(userId),
      this.getActivitySummary(userId),
    ]);

    const mail =
      mailRes.status === "fulfilled"
        ? { status: "success" as const, data: mailRes.value }
        : { status: "error" as const, error: mailRes.reason?.message || "Failed to load mail overview" };

    const chat =
      chatRes.status === "fulfilled"
        ? { status: "success" as const, data: chatRes.value }
        : { status: "error" as const, error: chatRes.reason?.message || "Failed to load chat overview" };

    const calendar =
      calendarRes.status === "fulfilled"
        ? { status: "success" as const, data: calendarRes.value }
        : { status: "error" as const, error: calendarRes.reason?.message || "Failed to load calendar overview" };

    const meet =
      meetRes.status === "fulfilled"
        ? { status: "success" as const, data: meetRes.value }
        : { status: "error" as const, error: meetRes.reason?.message || "Failed to load meet overview" };

    const drive =
      driveRes.status === "fulfilled"
        ? { status: "success" as const, data: driveRes.value }
        : { status: "error" as const, error: driveRes.reason?.message || "Failed to load drive overview" };

    const tasks =
      tasksRes.status === "fulfilled"
        ? { status: "success" as const, data: tasksRes.value }
        : { status: "error" as const, error: tasksRes.reason?.message || "Failed to load tasks" };

    const activity =
      activityRes.status === "fulfilled"
        ? { status: "success" as const, data: activityRes.value }
        : { status: "error" as const, error: activityRes.reason?.message || "Failed to load activity" };

    // Compute live summary figures
    const unreadMailCount = mail.data?.counts.inboxUnread ?? 0;
    const unreadChatCount = chat.data?.unreadTotal ?? 0;
    const todayEventsCount = calendar.data?.todayEvents.length ?? 0;
    const todayMeetingsCount =
      (meet.data?.activeMeetings.length ?? 0) + (meet.data?.upcomingMeetings.length ?? 0);
    const storageUsedBytes = drive.data?.storage.usedBytes ?? "0";
    const storageTotalBytes = drive.data?.storage.totalBytes ?? "16106127360";

    return {
      summary: {
        unreadMailCount,
        unreadChatCount,
        todayEventsCount,
        todayMeetingsCount,
        storageUsedBytes,
        storageTotalBytes,
      },
      mail,
      chat,
      calendar,
      meet,
      drive,
      tasks,
      activity,
    };
  }

  // --- 9. Cross-Module Federated Search ---
  async searchCrossModule(
    userId: bigint,
    query: string,
    limit = 5,
  ): Promise<GlobalSearchResponse> {
    const q = query.trim();
    if (!q) {
      return {
        query: "",
        totalHits: 0,
        results: { mail: [], chat: [], calendar: [], drive: [] },
      };
    }

    const now = new Date();
    const [mailRes, chatRes, calRes, driveRes] = await Promise.allSettled([
      this.mailService.fetchInbox(userId, { search: q, limit }),
      this.chatService.searchGlobal(userId, { q, limit }),
      this.calendarService.getEvents(userId, {
        search: q,
        start: new Date(now.getTime() - 60 * 86400000).toISOString(),
        end: new Date(now.getTime() + 90 * 86400000).toISOString(),
        includeDeclined: true,
      }),
      this.driveService.searchItems(userId, { q }),
    ]);

    // Format Mail Results
    const mailHits: GlobalSearchResultItem[] =
      mailRes.status === "fulfilled" && mailRes.value?.messages
        ? mailRes.value.messages.slice(0, limit).map((m: any) => ({
            id: String(m.id),
            title: m.subject || "(No Subject)",
            snippet: m.body ? m.body.replace(/<[^>]*>?/gm, "").slice(0, 120) : "",
            module: "mail" as const,
            deepLink: `/mail?threadId=${m.threadId || m.id}`,
            metadata: {
              sender: m.sender?.fullName || m.sender?.email,
              sentAt: m.sentAt,
            },
            updatedAt: m.sentAt?.toISOString?.() || m.createdAt?.toISOString?.(),
          }))
        : [];

    // Format Chat Results
    const chatHits: GlobalSearchResultItem[] = [];
    if (chatRes.status === "fulfilled" && chatRes.value) {
      const messages = chatRes.value.messages || [];
      const spaces = chatRes.value.spaces || [];

      for (const m of messages.slice(0, limit)) {
        chatHits.push({
          id: String(m.id),
          title: `Message in ${m.conversation?.name || "Chat"}`,
          snippet: m.content?.slice(0, 120) || "",
          module: "chat" as const,
          deepLink: `/chat?conversationId=${m.conversationId}`,
          metadata: { sender: m.sender?.fullName },
          updatedAt: m.createdAt?.toISOString?.() || m.createdAt,
        });
      }

      for (const s of spaces.slice(0, Math.max(0, limit - chatHits.length))) {
        chatHits.push({
          id: String(s.id),
          title: s.name,
          snippet: s.description || "Chat space",
          module: "chat" as const,
          deepLink: `/chat?conversationId=${s.id}`,
          metadata: { type: s.type },
          updatedAt: s.lastMessageAt?.toISOString?.() || s.lastMessageAt,
        });
      }
    }

    // Format Calendar Results
    const calendarHits: GlobalSearchResultItem[] =
      calRes.status === "fulfilled" && Array.isArray(calRes.value)
        ? calRes.value.slice(0, limit).map((e: any) => ({
            id: String(e.id),
            title: e.title || "Calendar Event",
            snippet: e.description || `${e.startTime} - ${e.endTime}`,
            module: "calendar" as const,
            deepLink: `/calendar?eventId=${e.id}`,
            metadata: {
              location: e.location,
              meetUrl: (e as any).meeting?.meetingCode
                ? `/meet/${(e as any).meeting.meetingCode}`
                : null,
            },
            updatedAt: e.startTime,
          }))
        : [];

    // Format Drive Results
    const driveHits: GlobalSearchResultItem[] = [];
    if (driveRes.status === "fulfilled" && driveRes.value) {
      const files = driveRes.value.files || [];
      const folders = driveRes.value.folders || [];

      for (const f of files.slice(0, limit)) {
        driveHits.push({
          id: String(f.id),
          title: f.name,
          snippet: f.asset?.mimeType ? `${f.asset.mimeType}` : "File",
          module: "drive" as const,
          deepLink: `/drive?fileId=${f.id}`,
          metadata: { sizeBytes: f.asset?.bytes, mimeType: f.asset?.mimeType },
          updatedAt:
            f.updatedAt instanceof Date
              ? f.updatedAt.toISOString()
              : String(f.updatedAt || ""),
        });
      }

      for (const folder of folders.slice(0, Math.max(0, limit - driveHits.length))) {
        driveHits.push({
          id: String(folder.id),
          title: folder.name,
          snippet: "Folder",
          module: "drive" as const,
          deepLink: `/drive/folders/${folder.id}`,
          metadata: { isFolder: true },
          updatedAt:
            folder.updatedAt instanceof Date
              ? folder.updatedAt.toISOString()
              : String(folder.updatedAt || ""),
        });
      }
    }

    const totalHits =
      mailHits.length + chatHits.length + calendarHits.length + driveHits.length;

    return {
      query: q,
      totalHits,
      results: {
        mail: mailHits,
        chat: chatHits,
        calendar: calendarHits,
        drive: driveHits,
      },
    };
  }

  // --- 10. Dashboard Preferences ---
  async getPreferences(userId: bigint) {
    return this.homeRepository.getPreferences(userId);
  }

  async updatePreferences(userId: bigint, dto: UpdateDashboardPreferencesDto) {
    return this.homeRepository.upsertPreferences(userId, dto);
  }
}

export default HomeService;
