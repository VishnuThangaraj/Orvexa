import { AccessToken, RoomServiceClient, WebhookReceiver } from "livekit-server-sdk";
import AppError from "../../common/errors/AppError.js";
import env from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { getIO } from "../../sockets/socket.instance.js";
import MeetRepository from "./meet.repository.js";
import { generateMeetingCode, normalizeMeetingCode } from "./meet.code.js";
import type {
  CreateMeetingDto,
  UpdateMeetingSettingsDto,
  MeetingResponse,
  MeetingMessageResponse,
  LiveKitTokenResponse,
  MeetingRole,
  InvitationStatus,
  PostMeetSignalDto,
  MeetSignalItem,
  MeetSignalsPollResponse,
} from "./meet.types.js";

export class MeetService {
  private meetRepository: MeetRepository;
  private roomService: RoomServiceClient;
  private webhookReceiver: WebhookReceiver;

  constructor() {
    this.meetRepository = new MeetRepository();
    this.roomService = new RoomServiceClient(
      env.LIVEKIT_URL.replace(/^ws/, "http"),
      env.LIVEKIT_API_KEY,
      env.LIVEKIT_API_SECRET,
    );
    this.webhookReceiver = new WebhookReceiver(
      env.LIVEKIT_API_KEY,
      env.LIVEKIT_WEBHOOK_SECRET,
    );
  }

  private formatMeeting(meeting: any, currentUserId?: bigint): MeetingResponse {
    let myRole: MeetingRole | null = null;
    let myStatus: InvitationStatus | null = null;

    if (currentUserId) {
      if (meeting.hostId === currentUserId) {
        myRole = "HOST";
        myStatus = "ACCEPTED";
      } else if (meeting.participants) {
        const p = meeting.participants.find(
          (part: any) => part.userId === currentUserId,
        );
        if (p) {
          myRole = p.meetingRole;
          myStatus = p.invitationStatus;
        }
      }
    }

    return {
      id: String(meeting.id),
      title: meeting.title,
      description: meeting.description ?? null,
      hostId: String(meeting.hostId),
      host: {
        id: String(meeting.host.id),
        fullName: meeting.host.fullName,
        username: meeting.host.username,
        email: meeting.host.email,
        profileImage: meeting.host.profileImage
          ? { secureUrl: meeting.host.profileImage.secureUrl }
          : null,
      },
      meetingCode: meeting.meetingCode,
      roomName: meeting.roomName,
      conversationId: meeting.conversationId ? String(meeting.conversationId) : null,
      scheduledStart: meeting.scheduledStart
        ? meeting.scheduledStart instanceof Date
          ? meeting.scheduledStart.toISOString()
          : String(meeting.scheduledStart)
        : null,
      scheduledEnd: meeting.scheduledEnd
        ? meeting.scheduledEnd instanceof Date
          ? meeting.scheduledEnd.toISOString()
          : String(meeting.scheduledEnd)
        : null,
      startedAt: meeting.startedAt
        ? meeting.startedAt instanceof Date
          ? meeting.startedAt.toISOString()
          : String(meeting.startedAt)
        : null,
      endedAt: meeting.endedAt
        ? meeting.endedAt instanceof Date
          ? meeting.endedAt.toISOString()
          : String(meeting.endedAt)
        : null,
      status: meeting.status,
      isLocked: Boolean(meeting.isLocked),
      requireApproval: Boolean(meeting.requireApproval),
      allowScreenShare: Boolean(meeting.allowScreenShare),
      allowChat: Boolean(meeting.allowChat),
      allowReactions: Boolean(meeting.allowReactions),
      createdAt:
        meeting.createdAt instanceof Date
          ? meeting.createdAt.toISOString()
          : String(meeting.createdAt),
      updatedAt:
        meeting.updatedAt instanceof Date
          ? meeting.updatedAt.toISOString()
          : String(meeting.updatedAt),
      participantsCount: meeting.participants ? meeting.participants.length : 0,
      participants: meeting.participants
        ? meeting.participants.map((p: any) => ({
            id: String(p.id),
            meetingId: String(p.meetingId),
            userId: String(p.userId),
            user: {
              id: String(p.user.id),
              fullName: p.user.fullName,
              username: p.user.username,
              email: p.user.email,
              profileImage: p.user.profileImage
                ? { secureUrl: p.user.profileImage.secureUrl }
                : null,
            },
            meetingRole: p.meetingRole,
            invitationStatus: p.invitationStatus,
            joinedAt: p.joinedAt
              ? p.joinedAt instanceof Date
                ? p.joinedAt.toISOString()
                : String(p.joinedAt)
              : null,
            leftAt: p.leftAt
              ? p.leftAt instanceof Date
                ? p.leftAt.toISOString()
                : String(p.leftAt)
              : null,
            createdAt:
              p.createdAt instanceof Date
                ? p.createdAt.toISOString()
                : String(p.createdAt),
          }))
        : [],
      myRole,
      myStatus,
    };
  }

  // Create meeting (Instant, for-later, or scheduled)
  async createMeeting(userId: bigint, dto: CreateMeetingDto) {
    let meetingCode = generateMeetingCode();
    // Ensure uniqueness
    let existing = await this.meetRepository.findByCode(meetingCode);
    let attempts = 0;
    while (existing && attempts < 5) {
      meetingCode = generateMeetingCode();
      existing = await this.meetRepository.findByCode(meetingCode);
      attempts++;
    }

    const roomName = `meet-${meetingCode}`;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    const title = dto.title?.trim() || `${user?.fullName || "User"}'s Meeting`;
    const scheduledStart = dto.scheduledStart ? new Date(dto.scheduledStart) : null;
    const scheduledEnd = dto.scheduledEnd ? new Date(dto.scheduledEnd) : null;
    const conversationId = dto.conversationId ? BigInt(dto.conversationId) : null;

    const meeting = await this.meetRepository.createMeeting({
      title,
      description: dto.description ?? null,
      hostId: userId,
      meetingCode,
      roomName,
      conversationId,
      scheduledStart,
      scheduledEnd,
      isLocked: dto.isLocked ?? false,
      requireApproval: dto.requireApproval ?? true,
      allowScreenShare: dto.allowScreenShare ?? true,
      allowChat: dto.allowChat ?? true,
      allowReactions: dto.allowReactions ?? true,
    });

    return this.formatMeeting(meeting, userId);
  }

  // Get meeting details by meeting code or URL
  async getMeetingByCode(userId: bigint, rawCode: string) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) {
      throw new AppError("Invalid meeting code format", 400);
    }

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }

    return this.formatMeeting(meeting, userId);
  }

  // List recent and upcoming meetings for user
  async listUserMeetings(userId: bigint) {
    const meetings = await this.meetRepository.listUserMeetings(userId);
    return meetings.map((m: any) => this.formatMeeting(m, userId));
  }

  // Generate LiveKit token for authenticated, authorized participant
  async generateLiveKitToken(
    userId: bigint,
    rawCode: string,
  ): Promise<LiveKitTokenResponse> {
    const code = normalizeMeetingCode(rawCode);
    if (!code) {
      throw new AppError("Invalid meeting code format", 400);
    }

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }

    if (meeting.status === "ENDED" || meeting.status === "CANCELLED") {
      throw new AppError("This meeting has ended", 410);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        profileImage: { select: { secureUrl: true } },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isHost = meeting.hostId === userId;
    const participant = meeting.participants.find((p: any) => p.userId === userId);

    // If meeting is locked, only the host can join
    if (meeting.isLocked && !isHost) {
      throw new AppError("This meeting is locked by the host", 423);
    }

    // If meeting requires approval, verify that non-host participant was admitted
    if (meeting.requireApproval && !isHost) {
      if (!participant || participant.invitationStatus !== "ACCEPTED") {
        throw new AppError(
          "You must be admitted by the host before joining this meeting",
          403,
        );
      }
    }

    const role: MeetingRole = isHost
      ? "HOST"
      : participant?.meetingRole || "PARTICIPANT";

    // Record or update join status
    await this.meetRepository.recordParticipantJoin(meeting.id, userId);

    // If meeting was scheduled, transition to LIVE upon host or attendee entry
    if (meeting.status === "SCHEDULED") {
      await this.meetRepository.updateMeeting(meeting.id, {
        status: "LIVE",
        startedAt: meeting.startedAt || new Date(),
      });
    }

    // Build LiveKit AccessToken
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: String(user.id),
      name: user.fullName,
      ttl: "2h", // 2 hours token TTL
      metadata: JSON.stringify({
        userId: String(user.id),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.profileImage?.secureUrl || null,
        role,
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: meeting.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost || role === "CO_HOST",
    });

    const token = await at.toJwt();

    return {
      token,
      url: env.isLiveKitConfigured ? env.LIVEKIT_URL : "",
      mode: env.isLiveKitConfigured ? "livekit" : "webrtc",
      roomName: meeting.roomName,
      meetingCode: meeting.meetingCode,
      participantId: String(user.id),
      participantName: user.fullName,
      role,
    };
  }

  // Update meeting host controls
  async updateSettings(
    userId: bigint,
    rawCode: string,
    dto: UpdateMeetingSettingsDto,
  ) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    if (meeting.hostId !== userId) {
      throw new AppError("Only the meeting host can change settings", 403);
    }

    const updated = await this.meetRepository.updateMeeting(meeting.id, dto);
    return this.formatMeeting(updated, userId);
  }

  // Admit participant from waiting room (Host only)
  async admitParticipant(
    hostId: bigint,
    rawCode: string,
    targetUserId: bigint,
  ) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    if (meeting.hostId !== hostId) {
      throw new AppError("Only the host can admit participants", 403);
    }

    await this.meetRepository.upsertParticipant(meeting.id, targetUserId, {
      invitationStatus: "ACCEPTED",
    });

    try {
      const io = getIO();
      io.to(`user:${String(targetUserId)}`).emit("meet:admitted", {
        meetingCode: code,
      });
    } catch {
      // Socket.IO unavailable on serverless runtimes
    }

    return { success: true, message: "Participant admitted" };
  }

  // Deny participant from waiting room (Host only)
  async denyParticipant(
    hostId: bigint,
    rawCode: string,
    targetUserId: bigint,
  ) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    if (meeting.hostId !== hostId) {
      throw new AppError("Only the host can deny participants", 403);
    }

    await this.meetRepository.upsertParticipant(meeting.id, targetUserId, {
      invitationStatus: "DECLINED",
    });

    try {
      const io = getIO();
      io.to(`user:${String(targetUserId)}`).emit("meet:denied", {
        meetingCode: code,
      });
    } catch {
      // Socket.IO unavailable on serverless runtimes
    }

    return { success: true, message: "Participant denied" };
  }

  // End meeting for everyone (Host only)
  async endMeeting(hostId: bigint, rawCode: string) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    if (meeting.hostId !== hostId) {
      throw new AppError("Only the host can end the meeting", 403);
    }

    const updated = await this.meetRepository.updateMeeting(meeting.id, {
      status: "ENDED",
      endedAt: new Date(),
    });

    // Notify all participants in the meeting room
    try {
      const io = getIO();
      io.to(`meet:${code}`).emit("meet:ended", { meetingCode: code });
    } catch (err) {
      console.warn("[SOCKET] Failed to emit meet:ended:", err);
    }

    // Attempt to delete room from LiveKit server when configured
    if (env.isLiveKitConfigured) {
      try {
        await this.roomService.deleteRoom(meeting.roomName);
      } catch (err) {
        console.warn("[LIVEKIT] deleteRoom error (may already be empty):", err);
      }
    }

    return this.formatMeeting(updated, hostId);
  }

  // HTTP fallback: Waiting room knock
  async knockMeeting(userId: bigint, rawCode: string) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    if (meeting.status === "ENDED" || meeting.status === "CANCELLED") {
      throw new AppError("This meeting has already ended", 410);
    }

    if (meeting.isLocked && meeting.hostId !== userId) {
      throw new AppError("This meeting is locked by the host", 423);
    }

    const existing = meeting.participants.find((p: any) => p.userId === userId);
    if (
      meeting.hostId === userId ||
      !meeting.requireApproval ||
      existing?.invitationStatus === "ACCEPTED"
    ) {
      return { status: "ACCEPTED" as const };
    }

    const participant = await this.meetRepository.upsertParticipant(
      meeting.id,
      userId,
      { invitationStatus: "PENDING" },
    );

    try {
      const io = getIO();
      io.to(`meet:${code}:host`).emit("meet:knock_received", {
        meetingCode: code,
        userId: String(userId),
        displayName: participant.user?.fullName || "Participant",
        avatarUrl: participant.user?.profileImage?.secureUrl || undefined,
      });
    } catch {
      // Socket.IO unavailable on serverless runtimes
    }

    return { status: "PENDING" as const };
  }

  // HTTP fallback: Cancel waiting room knock
  async cancelKnock(userId: bigint, rawCode: string) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    const existing = meeting.participants.find((p: any) => p.userId === userId);
    if (existing && existing.invitationStatus === "PENDING") {
      await this.meetRepository.deleteParticipant(meeting.id, userId);
    }

    try {
      const io = getIO();
      io.to(`meet:${code}:host`).emit("meet:knock_cancelled", {
        meetingCode: code,
        userId: String(userId),
      });
    } catch {
      // Socket.IO unavailable on serverless runtimes
    }

    return { success: true };
  }

  // Record participant exit and broadcast leave signal for WebRTC peers
  async leaveMeeting(userId: bigint, rawCode: string) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    await this.meetRepository.recordParticipantLeave(meeting.id, userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, profileImage: { select: { secureUrl: true } } },
    });

    const leaveRow = await prisma.auditLog.create({
      data: {
        userId,
        action: "leave",
        entityType: "MEET_SIGNAL",
        entityId: meeting.id,
        details: {
          toUserId: null,
          fromUserId: String(userId),
          fromName: user?.fullName || "Participant",
          avatarUrl: user?.profileImage?.secureUrl || null,
          payload: {},
        },
      },
    });

    try {
      const io = getIO();
      io.to(`meet:${code}`).emit("meet:signal", {
        id: String(leaveRow.id),
        fromUserId: String(userId),
        fromName: user?.fullName || "Participant",
        avatarUrl: user?.profileImage?.secureUrl || null,
        toUserId: null,
        kind: "leave",
        payload: {},
        createdAt: leaveRow.createdAt.toISOString(),
      });
    } catch {
      // Socket.IO unavailable on serverless runtimes
    }

    return { success: true };
  }

  // Post WebRTC SDP/ICE or in-call state signal (stored in audit_logs, no extra schema migration needed)
  async postSignal(
    userId: bigint,
    rawCode: string,
    dto: PostMeetSignalDto,
  ): Promise<MeetSignalItem> {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    if (meeting.status === "ENDED" || meeting.status === "CANCELLED") {
      throw new AppError("Meeting has ended", 410);
    }

    const isHost = meeting.hostId === userId;
    const participant = meeting.participants.find((p: any) => p.userId === userId);
    if (meeting.isLocked && !isHost) {
      throw new AppError("This meeting is locked by the host", 423);
    }
    if (meeting.requireApproval && !isHost) {
      if (!participant || participant.invitationStatus !== "ACCEPTED") {
        throw new AppError("You must be admitted before signaling", 403);
      }
    }

    let fromName = participant?.user?.fullName;
    let avatarUrl: string | null = participant?.user?.profileImage?.secureUrl || null;
    if (!fromName) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, profileImage: { select: { secureUrl: true } } },
      });
      fromName = u?.fullName || "Participant";
      avatarUrl = u?.profileImage?.secureUrl || null;
    }

    const toUserIdStr = dto.toUserId ? String(dto.toUserId) : null;
    const row = await prisma.auditLog.create({
      data: {
        userId,
        action: dto.kind,
        entityType: "MEET_SIGNAL",
        entityId: meeting.id,
        details: {
          toUserId: toUserIdStr,
          fromUserId: String(userId),
          fromName,
          avatarUrl,
          payload: (dto.payload || {}) as any,
        },
      },
    });

    // Opportunistically prune old transient signals (> 5 minutes) for this meeting
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    prisma.auditLog
      .deleteMany({
        where: {
          entityType: "MEET_SIGNAL",
          entityId: meeting.id,
          createdAt: { lt: cutoff },
        },
      })
      .catch(() => {});

    const item: MeetSignalItem = {
      id: String(row.id),
      fromUserId: String(userId),
      fromName,
      avatarUrl,
      toUserId: toUserIdStr,
      kind: dto.kind,
      payload: (dto.payload || {}) as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
    };

    try {
      const io = getIO();
      io.to(`meet:${code}`).emit("meet:signal", item);
    } catch {
      // Socket.IO unavailable on serverless runtimes
    }

    return item;
  }

  // Poll pending WebRTC signals + active/waiting participant roster
  async getSignals(
    userId: bigint,
    rawCode: string,
    afterId?: string,
  ): Promise<MeetSignalsPollResponse> {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    const isHost = meeting.hostId === userId;
    const participant = meeting.participants.find((p: any) => p.userId === userId);
    if (meeting.requireApproval && !isHost) {
      if (!participant || participant.invitationStatus !== "ACCEPTED") {
        throw new AppError("You must be admitted before reading signals", 403);
      }
    }

    let afterBigInt: bigint | undefined;
    if (afterId && /^\d+$/.test(afterId)) {
      afterBigInt = BigInt(afterId);
    }

    const recentCutoff = new Date(Date.now() - 2 * 60 * 1000);
    const rows = await prisma.auditLog.findMany({
      where: {
        entityType: "MEET_SIGNAL",
        entityId: meeting.id,
        createdAt: { gte: recentCutoff },
        ...(afterBigInt ? { id: { gt: afterBigInt } } : {}),
      },
      orderBy: { id: "asc" },
      take: 150,
    });

    const userIdStr = String(userId);
    let latestId = afterId && /^\d+$/.test(afterId) ? afterId : null;
    const signals: MeetSignalItem[] = [];

    for (const row of rows) {
      latestId = String(row.id);
      if (row.userId === userId) continue;

      const details = (row.details || {}) as Record<string, any>;
      const toUserId = details.toUserId ? String(details.toUserId) : null;
      if (toUserId !== null && toUserId !== userIdStr) continue;

      signals.push({
        id: String(row.id),
        fromUserId: details.fromUserId ? String(details.fromUserId) : String(row.userId),
        fromName: String(details.fromName || "Participant"),
        avatarUrl: details.avatarUrl ? String(details.avatarUrl) : null,
        toUserId,
        kind: row.action as any,
        payload: (details.payload || {}) as Record<string, unknown>,
        createdAt: row.createdAt.toISOString(),
      });
    }

    const activeParticipants = meeting.participants
      .filter(
        (p: any) =>
          p.invitationStatus === "ACCEPTED" &&
          p.joinedAt !== null &&
          p.leftAt === null,
      )
      .map((p: any) => ({
        userId: String(p.userId),
        fullName: p.user?.fullName || "Participant",
        avatarUrl: p.user?.profileImage?.secureUrl || null,
        role: p.meetingRole as MeetingRole,
      }));

    const waitingParticipants = isHost
      ? meeting.participants
          .filter((p: any) => p.invitationStatus === "PENDING")
          .map((p: any) => ({
            userId: String(p.userId),
            displayName: p.user?.fullName || "Participant",
            avatarUrl: p.user?.profileImage?.secureUrl || undefined,
          }))
      : [];

    return {
      latestId,
      signals,
      activeParticipants,
      waitingParticipants,
      meetingStatus: meeting.status,
    };
  }

  // In-call messages
  async sendMessage(userId: bigint, rawCode: string, content: string) {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    if (meeting.status === "ENDED" || meeting.status === "CANCELLED") {
      throw new AppError("Meeting has ended", 410);
    }

    if (!meeting.allowChat && meeting.hostId !== userId) {
      throw new AppError("In-call chat is disabled by the host", 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    const msg = await this.meetRepository.createMessage({
      meetingId: meeting.id,
      senderId: userId,
      senderName: user?.fullName || "User",
      content: content.trim(),
    });

    const payload = {
      id: String(msg.id),
      meetingId: String(msg.meetingId),
      senderId: msg.senderId ? String(msg.senderId) : null,
      senderName: msg.senderName,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    };

    try {
      const io = getIO();
      io.to(`meet:${code}`).emit("meet:chat_message", payload);
    } catch {
      // Socket.IO unavailable on serverless runtimes
    }

    return payload;
  }

  async getMessages(
    userId: bigint,
    rawCode: string,
  ): Promise<MeetingMessageResponse[]> {
    const code = normalizeMeetingCode(rawCode);
    if (!code) throw new AppError("Invalid meeting code format", 400);

    const meeting = await this.meetRepository.findByCode(code);
    if (!meeting) throw new AppError("Meeting not found", 404);

    const messages = await this.meetRepository.listMessages(meeting.id);
    return messages.map((m: any) => ({
      id: String(m.id),
      meetingId: String(m.meetingId),
      senderId: m.senderId ? String(m.senderId) : null,
      senderName: m.senderName,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  // LiveKit Webhook Handler
  async handleWebhook(body: string | Buffer, authHeader?: string) {
    try {
      const bodyStr = typeof body === "string" ? body : body.toString("utf-8");
      const event = await this.webhookReceiver.receive(bodyStr, authHeader);
      console.log(`[LIVEKIT WEBHOOK] Received event: ${event.event} for room: ${event.room?.name}`);

      if (!event.room?.name) return { received: true };

      const meeting = await this.meetRepository.findByRoomName(event.room.name);
      if (!meeting) return { received: true };

      switch (event.event) {
        case "room_started":
          if (meeting.status === "SCHEDULED") {
            await this.meetRepository.updateMeeting(meeting.id, {
              status: "LIVE",
              startedAt: new Date(),
            });
          }
          break;

        case "room_finished":
          await this.meetRepository.updateMeeting(meeting.id, {
            status: "ENDED",
            endedAt: new Date(),
          });
          break;

        case "participant_joined":
          if (event.participant?.identity) {
            try {
              const uId = BigInt(event.participant.identity);
              await this.meetRepository.recordParticipantJoin(meeting.id, uId);
            } catch {}
          }
          break;

        case "participant_left":
          if (event.participant?.identity) {
            try {
              const uId = BigInt(event.participant.identity);
              await this.meetRepository.recordParticipantLeave(meeting.id, uId);
            } catch {}
          }
          break;
      }

      return { received: true };
    } catch (err: any) {
      console.error("[LIVEKIT WEBHOOK] Verification failed:", err?.message || err);
      throw new AppError("Invalid webhook signature", 401);
    }
  }
}

export default MeetService;
