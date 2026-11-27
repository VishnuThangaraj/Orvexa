import type { Conversation, FetchConversationsResult } from "../types/chat.types";

export type PresenceStatus = "ACTIVE" | "AWAY" | "DND" | "OFFLINE";

export interface PresenceDisplayInfo {
  status: PresenceStatus;
  label: string;
  dotClass: string;
  isOnline: boolean;
}

export function resolvePresenceInfo(
  userId: string | number | undefined | null,
  onlineUsers: Record<string, boolean>,
  presenceStatuses: Record<string, "ACTIVE" | "AWAY" | "DND">,
): PresenceDisplayInfo {
  if (userId === undefined || userId === null) {
    return {
      status: "OFFLINE",
      label: "Offline",
      dotClass: "bg-slate-300 dark:bg-slate-600",
      isOnline: false,
    };
  }

  const key = String(userId);
  const explicitStatus = presenceStatuses[key];
  const isOnline = Boolean(onlineUsers[key]);

  const status: PresenceStatus = explicitStatus
    ? explicitStatus
    : isOnline
      ? "ACTIVE"
      : "OFFLINE";

  switch (status) {
    case "ACTIVE":
      return {
        status,
        label: "Active now",
        dotClass: "bg-[#137333]",
        isOnline: true,
      };
    case "AWAY":
      return {
        status,
        label: "Away",
        dotClass: "bg-[#ea8600]",
        isOnline: true,
      };
    case "DND":
      return {
        status,
        label: "Do not disturb",
        dotClass: "bg-[#d93025]",
        isOnline: true,
      };
    default:
      return {
        status: "OFFLINE",
        label: "Offline",
        dotClass: "bg-slate-300 dark:bg-slate-600",
        isOnline: false,
      };
  }
}

export function isConversationUnread(
  conv: Conversation,
  currentUserId?: string | number | null,
): boolean {
  const lastMsg = conv.messages?.[0];
  if (!lastMsg) return false;
  if (currentUserId !== undefined && currentUserId !== null) {
    if (String(lastMsg.senderId) === String(currentUserId)) return false;
  }

  const userParticipant = conv.participants.find(
    (p) => String(p.userId) === String(currentUserId),
  );
  if (!userParticipant) return false;

  if (userParticipant.lastReadMessageId && /^\d+$/.test(String(lastMsg.id))) {
    try {
      return BigInt(lastMsg.id) > BigInt(userParticipant.lastReadMessageId);
    } catch {
      // Fallback to timestamp comparison below
    }
  }

  if (!userParticipant.lastReadAt) return true;
  return new Date(lastMsg.createdAt) > new Date(userParticipant.lastReadAt);
}

export function applyReadReceiptToConversation(
  conv: Conversation,
  readerUserId: string,
  messageId: string,
  readAt: string,
): Conversation {
  return {
    ...conv,
    participants: conv.participants.map((p) => {
      if (String(p.userId) !== String(readerUserId)) return p;

      let shouldUpdate = !p.lastReadMessageId;
      if (p.lastReadMessageId && /^\d+$/.test(String(messageId))) {
        try {
          shouldUpdate = BigInt(messageId) >= BigInt(p.lastReadMessageId);
        } catch {
          shouldUpdate = true;
        }
      }

      if (!shouldUpdate) return p;

      return {
        ...p,
        lastReadMessageId: messageId,
        lastReadAt: readAt,
      };
    }),
  };
}

export function applyReadReceiptToConversationsResult(
  old: FetchConversationsResult | undefined,
  conversationId: string,
  readerUserId: string,
  messageId: string,
  readAt: string,
): FetchConversationsResult | undefined {
  if (!old) return old;
  return {
    ...old,
    conversations: old.conversations.map((conv) =>
      String(conv.id) === String(conversationId)
        ? applyReadReceiptToConversation(conv, readerUserId, messageId, readAt)
        : conv,
    ),
  };
}
