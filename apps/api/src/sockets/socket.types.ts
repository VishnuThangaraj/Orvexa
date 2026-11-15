import type { Server as SocketIOServer, Socket } from "socket.io";
import type { Role } from "../common/types/roles.js";

export interface SocketUser {
  id: string;
  role: Role;
}

export interface SocketData {
  user: SocketUser;
}

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
    },
    callback?: (res: { success: boolean; data?: any; error?: string }) => void,
  ) => void;
  "typing:start": (data: { conversationId: string }) => void;
  "typing:stop": (data: { conversationId: string }) => void;
  "message:read": (
    data: { conversationId: string; messageId: string },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
}

export interface ServerToClientEvents {
  "message:received": (message: any) => void;
  "message:updated": (message: any) => void;
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
    reactions: any[];
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
    lastSeen?: string;
  }) => void;
  error: (err: { message: string; code?: string | number }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export type TypedServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
