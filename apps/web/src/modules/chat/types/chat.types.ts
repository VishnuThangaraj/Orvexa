export type ConversationType = "DIRECT" | "GROUP" | "CHANNEL";
export type ChannelVisibility = "PUBLIC" | "PRIVATE";
export type ConversationMemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type ChatMessageType = "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "SYSTEM";

export interface ChatUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  profileImage?: {
    id: string;
    secureUrl: string;
  } | null;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  memberRole: ConversationMemberRole;
  joinedAt: string;
  leftAt?: string | null;
  isMuted: boolean;
  isArchived: boolean;
  isPinned: boolean;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  user: ChatUser;
}

export interface ChatAttachmentAsset {
  id: string;
  originalFilename: string;
  mimeType: string;
  bytes: string;
  secureUrl: string | null;
  format?: string | null;
  resourceType: string;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  assetId: string;
  createdAt: string;
  asset: ChatAttachmentAsset;
}

export interface ChatMention {
  id: string;
  messageId: string;
  conversationId: string;
  userId?: string | null;
  isAll: boolean;
  createdAt: string;
  user?: ChatUser | null;
}

export interface ChatReactionItem {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt?: string;
  user?: ChatUser | null;
}

export interface PinnedMessageItem {
  id: string;
  conversationId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt?: string;
  message?: ChatMessage | null;
  pinnedByUser?: ChatUser | null;
}

export interface ChatSearchMessageResult extends ChatMessage {
  conversation?: {
    id: string;
    name?: string | null;
    type: ConversationType;
  } | null;
}

export interface ChatGlobalSearchResult {
  messages: ChatSearchMessageResult[];
  people: ChatUser[];
  spaces: DiscoveredSpace[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId?: string | null;
  parentMessageId?: string | null;
  content: string;
  messageType: ChatMessageType;
  isEdited: boolean;
  editedAt?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
  attachments?: ChatAttachment[];
  reactions?: ChatReactionItem[];
  mentions?: ChatMention[];
  parentMessage?: {
    id: string;
    content: string;
    messageType: ChatMessageType;
    sender: ChatUser;
  } | null;
  _count?: {
    replies: number;
  };
  isOptimistic?: boolean;
  status?: "sending" | "sent" | "error";
}

export interface Conversation {
  id: string;
  type: ConversationType;
  visibility?: ChannelVisibility | null;
  name?: string | null;
  description?: string | null;
  imageId?: string | null;
  directUserLowId?: string | null;
  directUserHighId?: string | null;
  createdBy: string;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  participants: ConversationParticipant[];
  image?: {
    id: string;
    secureUrl: string;
  } | null;
  messages?: ChatMessage[];
  _count?: {
    messages: number;
    pinnedMessages: number;
  };
}

export interface FetchConversationsOptions {
  type?: ConversationType;
  isArchived?: boolean;
  isPinned?: boolean;
  hasMentions?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface FetchConversationsResult {
  conversations: Conversation[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface CreateDirectConversationPayload {
  recipientId: string;
}

export interface CreateGroupOrChannelPayload {
  name: string;
  description?: string;
  type: "GROUP" | "CHANNEL";
  visibility?: "PUBLIC" | "PRIVATE";
  participantIds?: string[];
}

export interface UpdateConversationPayload {
  name?: string;
  description?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  imageId?: string | null;
  isArchived?: boolean;
}

export interface DiscoveredSpace {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  visibility: string;
  image?: { id: string; secureUrl: string } | null;
  memberCount: number;
  isMember: boolean;
  createdAt: string;
  lastMessageAt?: string | null;
}

export interface UpdateParticipantSettingsPayload {
  isMuted?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
}

export interface SendMessagePayload {
  content: string;
  clientMessageId?: string;
  messageType?: ChatMessageType;
  parentMessageId?: string | null;
  attachmentIds?: string[];
  mentionedUserIds?: string[];
  isMentionAll?: boolean;
}

export interface FetchMessagesOptions {
  cursor?: string;
  limit?: number;
  parentMessageId?: string;
}

export interface UploadedChatAsset {
  assetId: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  bytes: string;
  secureUrl: string | null;
  resourceType: string;
  format: string | null;
}

export interface UploadChatAttachmentsResult {
  assetId?: string;
  assets: UploadedChatAsset[];
}
