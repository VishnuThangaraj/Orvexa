import type {
  ConversationType,
  ChannelVisibility,
  ConversationMemberRole,
  ChatMessageType,
  CloudinaryResourceType,
  CloudinaryDeliveryType,
} from "../../generated/prisma/enums.js";

export type {
  ConversationType,
  ChannelVisibility,
  ConversationMemberRole,
  ChatMessageType,
  CloudinaryResourceType,
  CloudinaryDeliveryType,
};

export interface CreateAssetData {
  publicId: string;
  cloudinaryAssetId?: string | null;
  resourceType: CloudinaryResourceType;
  deliveryType?: CloudinaryDeliveryType;
  version?: number | null;
  format?: string | null;
  originalFilename: string;
  mimeType: string;
  bytes: bigint;
  secureUrl?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  uploadedBy?: bigint | null;
}

export interface UploadedAssetResponse {
  assetId: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  bytes: string;
  secureUrl: string | null;
  resourceType: string;
  format: string | null;
  width?: number | null;
  height?: number | null;
}

export interface UploadAttachmentsResponse {
  assetId?: string;
  assets: UploadedAssetResponse[];
}

export interface CreateDirectConversationDto {
  recipientId: bigint | string;
}

export interface CreateGroupOrChannelDto {
  name: string;
  description?: string;
  type: "GROUP" | "CHANNEL";
  visibility?: "PUBLIC" | "PRIVATE";
  participantIds?: (bigint | string)[];
}

export interface UpdateConversationDto {
  name?: string;
  description?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  imageId?: bigint | string | null;
  isArchived?: boolean;
}

export interface AddParticipantsDto {
  userIds: (bigint | string)[];
}

export interface UpdateParticipantRoleDto {
  memberRole: "ADMIN" | "MEMBER";
}

export interface UpdateParticipantSettingsDto {
  isMuted?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
}

export interface FetchConversationsQueryDto {
  type?: ConversationType;
  isArchived?: boolean;
  isPinned?: boolean;
  hasMentions?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SendMessageDto {
  conversationId: bigint | string;
  content: string;
  clientMessageId?: string;
  messageType?: ChatMessageType;
  parentMessageId?: bigint | string | null;
  attachmentIds?: (bigint | string)[];
  mentionedUserIds?: (bigint | string)[];
  isMentionAll?: boolean;
}

export interface EditMessageDto {
  content: string;
  mentionedUserIds?: (bigint | string)[];
  isMentionAll?: boolean;
}

export interface FetchMessagesQueryDto {
  cursor?: bigint | string;
  limit?: number;
  parentMessageId?: bigint | string | null;
}

export interface GlobalSearchQueryDto {
  q: string;
  type?: "ALL" | "MESSAGES" | "PEOPLE" | "SPACES";
  limit?: number;
}

export interface GlobalSearchResult {
  messages: any[];
  people: any[];
  spaces: any[];
}
