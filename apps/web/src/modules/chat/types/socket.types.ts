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
  // Meet Events
  "meet:join_room": (
    data: { meetingCode: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "meet:leave_room": (
    data: { meetingCode: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "meet:knock": (
    data: { meetingCode: string; displayName?: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "meet:cancel_knock": (data: { meetingCode: string }) => void;
  "meet:admit": (
    data: { meetingCode: string; userId: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "meet:deny": (
    data: { meetingCode: string; userId: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "meet:admit_all": (
    data: { meetingCode: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  "meet:send_chat": (
    data: { meetingCode: string; content: string },
    callback?: (res: { success: boolean; data?: unknown; error?: string }) => void,
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
  // Meet Events
  "meet:knock_received": (data: {
    meetingCode: string;
    userId: string;
    displayName: string;
    avatarUrl?: string;
  }) => void;
  "meet:knock_cancelled": (data: {
    meetingCode: string;
    userId: string;
  }) => void;
  "meet:admitted": (data: { meetingCode: string }) => void;
  "meet:denied": (data: { meetingCode: string }) => void;
  "meet:chat_message": (message: unknown) => void;
  "meet:settings_updated": (data: {
    meetingCode: string;
    settings: unknown;
  }) => void;
  "meet:ended": (data: { meetingCode: string }) => void;
  "meet:signal": (data: {
    id: string;
    fromUserId: string;
    fromName: string;
    avatarUrl: string | null;
    toUserId: string | null;
    kind:
      | "offer"
      | "answer"
      | "ice"
      | "media_state"
      | "reaction"
      | "hand_raise"
      | "leave";
    payload: Record<string, unknown>;
    createdAt: string;
  }) => void;
  error: (err: { message: string; code?: string | number }) => void;
}

export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
}
