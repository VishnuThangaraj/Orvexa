export interface ClientToServerEvents {
  "chat:join": (
    data: { conversationId: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "chat:leave": (
    data: { conversationId: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "chat:send": (
    data: {
      conversationId: string;
      content: string;
      messageType?: string;
      parentMessageId?: string;
      attachmentIds?: string[];
      clientMessageId?: string;
    },
    callback?: (res: { success: boolean; data?: unknown; error?: string }) => void,
  ) => void;
  "typing:start": (data: { conversationId: string }) => void;
  "typing:stop": (data: { conversationId: string }) => void;
  "message:read": (
    data: { conversationId: string; messageId: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "presence:update": (
    data: { status: "ACTIVE" | "AWAY" | "DND" },
    callback?: (res: { success: boolean }) => void,
  ) => void;
}

export interface ServerToClientEvents {
  "message:received": (message: unknown) => void;
  "message:updated": (message: unknown) => void;
  "message:deleted": (data: {
    conversationId: string;
    messageId: string;
  }) => void;
  "typing:user_typing": (data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
  "message:read_receipt": (data: {
    conversationId: string;
    userId: string;
    messageId: string;
    readAt: string;
  }) => void;
  "message:reaction_updated": (data: {
    conversationId: string;
    messageId: string;
    reactions: unknown[];
  }) => void;
  "message:pinned_updated": (data: {
    conversationId: string;
    messageId: string;
    isPinned: boolean;
    pinnedBy?: string;
  }) => void;
  "presence:state": (data: {
    userId: string;
    isOnline: boolean;
    status?: "ACTIVE" | "AWAY" | "DND";
    lastSeen?: string;
  }) => void;
  error: (err: { message: string; code?: string | number }) => void;
}

export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
}
