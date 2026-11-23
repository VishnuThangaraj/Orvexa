import { prisma } from "../../config/prisma.js";
import { normalizeMeetingCode } from "../../modules/meet/meet.code.js";
import type {
  TypedServer,
  AuthenticatedSocket,
} from "../socket.types.js";

export const registerMeetHandlers = (
  io: TypedServer,
  socket: AuthenticatedSocket,
) => {
  const currentUserId = BigInt(socket.data.user.id);

  // Client enters the meet room
  socket.on("meet:join_room", async ({ meetingCode }, callback) => {
    try {
      const code = normalizeMeetingCode(meetingCode);
      if (!code) {
        callback?.({ success: false, error: "Invalid meeting code" });
        return;
      }

      const meeting = await prisma.meeting.findUnique({
        where: { meetingCode: code },
        select: { id: true, meetingCode: true, hostId: true },
      });

      if (!meeting) {
        callback?.({ success: false, error: "Meeting not found" });
        return;
      }

      const roomName = `meet:${meeting.meetingCode}`;
      socket.join(roomName);

      // If user is host, also join the host notification room
      if (meeting.hostId === currentUserId) {
        socket.join(`${roomName}:host`);
      }

      callback?.({ success: true });
    } catch (err: unknown) {
      console.warn("[SOCKET] meet:join_room error:", err);
      callback?.({ success: false, error: "Failed to join meet room" });
    }
  });

  // Client leaves the meet room
  socket.on("meet:leave_room", ({ meetingCode }) => {
    const code = normalizeMeetingCode(meetingCode);
    if (!code) return;

    socket.leave(`meet:${code}`);
    socket.leave(`meet:${code}:host`);
  });

  // Non-host knocks to be admitted
  socket.on("meet:knock", async ({ meetingCode, displayName }, callback) => {
    try {
      const code = normalizeMeetingCode(meetingCode);
      if (!code) {
        callback?.({ success: false, error: "Invalid meeting code" });
        return;
      }

      const meeting = await prisma.meeting.findUnique({
        where: { meetingCode: code },
        select: { id: true, meetingCode: true, isLocked: true, requireApproval: true, hostId: true },
      });

      if (!meeting) {
        callback?.({ success: false, error: "Meeting not found" });
        return;
      }

      if (meeting.isLocked) {
        callback?.({ success: false, error: "Meeting is locked by the host" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: { select: { secureUrl: true } },
        },
      });

      if (!user) {
        callback?.({ success: false, error: "User not found" });
        return;
      }

      // Upsert participant record with PENDING status
      await prisma.meetingParticipant.upsert({
        where: {
          meetingId_userId: {
            meetingId: meeting.id,
            userId: currentUserId,
          },
        },
        update: {
          invitationStatus: "PENDING",
        },
        create: {
          meetingId: meeting.id,
          userId: currentUserId,
          meetingRole: "PARTICIPANT",
          invitationStatus: "PENDING",
        },
      });

      // Notify host room
      io.to(`meet:${code}:host`).emit("meet:knock_received", {
        meetingCode: code,
        userId: String(user.id),
        displayName: displayName || user.fullName,
        avatarUrl: user.profileImage?.secureUrl || undefined,
      });

      callback?.({ success: true });
    } catch (err: unknown) {
      console.warn("[SOCKET] meet:knock error:", err);
      callback?.({ success: false, error: "Failed to request to join" });
    }
  });

  // Cancel knock
  socket.on("meet:cancel_knock", ({ meetingCode }) => {
    const code = normalizeMeetingCode(meetingCode);
    if (!code) return;

    io.to(`meet:${code}:host`).emit("meet:knock_cancelled", {
      meetingCode: code,
      userId: socket.data.user.id,
    });
  });

  // Host admits participant
  socket.on("meet:admit", async ({ meetingCode, userId }, callback) => {
    try {
      const code = normalizeMeetingCode(meetingCode);
      if (!code) {
        callback?.({ success: false, error: "Invalid meeting code" });
        return;
      }

      const meeting = await prisma.meeting.findUnique({
        where: { meetingCode: code },
        select: { id: true, hostId: true },
      });

      if (!meeting) {
        callback?.({ success: false, error: "Meeting not found" });
        return;
      }

      if (meeting.hostId !== currentUserId) {
        callback?.({ success: false, error: "Only the host can admit participants" });
        return;
      }

      const targetUserId = BigInt(userId);
      await prisma.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          userId: targetUserId,
        },
        data: {
          invitationStatus: "ACCEPTED",
        },
      });

      // Notify admitted participant
      io.to(`user:${userId}`).emit("meet:admitted", {
        meetingCode: code,
      });

      callback?.({ success: true });
    } catch (err: unknown) {
      console.warn("[SOCKET] meet:admit error:", err);
      callback?.({ success: false, error: "Failed to admit participant" });
    }
  });

  // Host denies participant
  socket.on("meet:deny", async ({ meetingCode, userId }, callback) => {
    try {
      const code = normalizeMeetingCode(meetingCode);
      if (!code) {
        callback?.({ success: false, error: "Invalid meeting code" });
        return;
      }

      const meeting = await prisma.meeting.findUnique({
        where: { meetingCode: code },
        select: { id: true, hostId: true },
      });

      if (!meeting) {
        callback?.({ success: false, error: "Meeting not found" });
        return;
      }

      if (meeting.hostId !== currentUserId) {
        callback?.({ success: false, error: "Only the host can deny participants" });
        return;
      }

      const targetUserId = BigInt(userId);
      await prisma.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          userId: targetUserId,
        },
        data: {
          invitationStatus: "DECLINED",
        },
      });

      // Notify denied participant
      io.to(`user:${userId}`).emit("meet:denied", {
        meetingCode: code,
      });

      callback?.({ success: true });
    } catch (err: unknown) {
      console.warn("[SOCKET] meet:deny error:", err);
      callback?.({ success: false, error: "Failed to deny participant" });
    }
  });

  // Host admits all waiting participants
  socket.on("meet:admit_all", async ({ meetingCode }, callback) => {
    try {
      const code = normalizeMeetingCode(meetingCode);
      if (!code) {
        callback?.({ success: false, error: "Invalid meeting code" });
        return;
      }

      const meeting = await prisma.meeting.findUnique({
        where: { meetingCode: code },
        include: {
          participants: {
            where: { invitationStatus: "PENDING" },
            select: { userId: true },
          },
        },
      });

      if (!meeting) {
        callback?.({ success: false, error: "Meeting not found" });
        return;
      }

      if (meeting.hostId !== currentUserId) {
        callback?.({ success: false, error: "Only the host can admit participants" });
        return;
      }

      await prisma.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          invitationStatus: "PENDING",
        },
        data: {
          invitationStatus: "ACCEPTED",
        },
      });

      // Notify all admitted users
      meeting.participants.forEach((p: any) => {
        io.to(`user:${p.userId}`).emit("meet:admitted", {
          meetingCode: code,
        });
      });

      callback?.({ success: true });
    } catch (err: unknown) {
      console.warn("[SOCKET] meet:admit_all error:", err);
      callback?.({ success: false, error: "Failed to admit all participants" });
    }
  });

  // Send in-meeting chat message
  socket.on("meet:send_chat", async ({ meetingCode, content }, callback) => {
    try {
      const code = normalizeMeetingCode(meetingCode);
      if (!code || !content.trim()) {
        callback?.({ success: false, error: "Invalid meeting code or content" });
        return;
      }

      const meeting = await prisma.meeting.findUnique({
        where: { meetingCode: code },
        select: { id: true, allowChat: true, hostId: true },
      });

      if (!meeting) {
        callback?.({ success: false, error: "Meeting not found" });
        return;
      }

      if (!meeting.allowChat && meeting.hostId !== currentUserId) {
        callback?.({ success: false, error: "Host has disabled in-call chat" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          profileImage: { select: { secureUrl: true } },
        },
      });

      if (!user) {
        callback?.({ success: false, error: "User not found" });
        return;
      }

      const message = await prisma.meetingMessage.create({
        data: {
          meetingId: meeting.id,
          senderId: currentUserId,
          senderName: user.fullName,
          content: content.trim(),
        },
      });

      const formatted = {
        id: String(message.id),
        meetingId: String(message.meetingId),
        senderId: String(message.senderId),
        senderName: message.senderName,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        sender: {
          id: String(user.id),
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
        },
      };

      io.to(`meet:${code}`).emit("meet:chat_message", formatted);

      callback?.({ success: true, data: formatted });
    } catch (err: unknown) {
      console.warn("[SOCKET] meet:send_chat error:", err);
      callback?.({ success: false, error: "Failed to send chat message" });
    }
  });
};
