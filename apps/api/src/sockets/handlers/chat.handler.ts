import ChatService from "../../modules/chat/chat.service.js";
import type { AuthenticatedSocket, TypedServer } from "../socket.types.js";

let chatServiceInstance: ChatService | null = null;
const getChatService = (): ChatService => {
  if (!chatServiceInstance) {
    chatServiceInstance = new ChatService();
  }
  return chatServiceInstance;
};

// In-memory sliding window rate limiter: max 15 messages per 3000ms per user
const userMessageTimestamps = new Map<string, number[]>();

const isMessageRateLimited = (userId: string): boolean => {
  const now = Date.now();
  const windowMs = 3000;
  const maxMessages = 15;

  const timestamps = (userMessageTimestamps.get(userId) || []).filter(
    (ts) => now - ts < windowMs,
  );

  if (timestamps.length >= maxMessages) {
    return true;
  }

  timestamps.push(now);
  userMessageTimestamps.set(userId, timestamps);
  return false;
};

export const registerChatHandlers = (
  _io: TypedServer,
  socket: AuthenticatedSocket,
) => {
  const user = socket.data.user;

  // Join a conversation room
  socket.on("chat:join", async (data, callback) => {
    try {
      if (!data?.conversationId) {
        callback?.({ success: false, error: "conversationId is required" });
        return;
      }

      const conversationId = BigInt(data.conversationId);
      const userId = BigInt(user.id);

      // Verify membership / access
      await getChatService().getConversationDetails(conversationId, userId);

      const roomName = `conversation:${data.conversationId}`;
      socket.join(roomName);

      console.log(
        `[SOCKET] User ${user.id} joined conversation room: ${roomName}`,
      );

      callback?.({ success: true });
    } catch (err: any) {
      console.error(
        `[SOCKET] Error joining conversation ${data?.conversationId}:`,
        err.message,
      );
      callback?.({ success: false, error: err.message || "Failed to join room" });
    }
  });

  // Leave a conversation room
  socket.on("chat:leave", (data, callback) => {
    try {
      if (data?.conversationId) {
        const roomName = `conversation:${data.conversationId}`;
        socket.leave(roomName);
        console.log(
          `[SOCKET] User ${user.id} left conversation room: ${roomName}`,
        );
      }
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ success: false, error: err.message });
    }
  });

  // Real-time message send
  socket.on("chat:send", async (data, callback) => {
    try {
      if (!data?.conversationId || !data?.content?.trim()) {
        callback?.({
          success: false,
          error: "conversationId and content are required",
        });
        return;
      }

      // Check socket message rate limit
      if (isMessageRateLimited(user.id)) {
        callback?.({
          success: false,
          error: "Rate limit exceeded. Please wait a moment before sending more messages.",
        });
        return;
      }

      const senderId = BigInt(user.id);
      const message = await getChatService().sendMessage(senderId, {
        conversationId: data.conversationId,
        content: data.content,
        clientMessageId: data.clientMessageId,
        messageType: data.messageType as any,
        parentMessageId: data.parentMessageId,
        attachmentIds: data.attachmentIds,
      });

      callback?.({ success: true, data: message });
    } catch (err: any) {
      console.error("[SOCKET] Error sending message via socket:", err.message);
      callback?.({
        success: false,
        error: err.message || "Failed to send message",
      });
    }
  });

  // Typing indicators
  socket.on("typing:start", (data) => {
    if (data?.conversationId) {
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("typing:user_typing", {
          conversationId: data.conversationId,
          userId: user.id,
          isTyping: true,
        });
    }
  });

  socket.on("typing:stop", (data) => {
    if (data?.conversationId) {
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("typing:user_typing", {
          conversationId: data.conversationId,
          userId: user.id,
          isTyping: false,
        });
    }
  });

  // Read receipts
  socket.on("message:read", async (data, callback) => {
    try {
      if (!data?.conversationId || !data?.messageId) {
        callback?.({
          success: false,
          error: "conversationId and messageId are required",
        });
        return;
      }

      await getChatService().markMessageAsRead(
        BigInt(data.conversationId),
        BigInt(user.id),
        BigInt(data.messageId),
      );

      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ success: false, error: err.message });
    }
  });
};
