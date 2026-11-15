import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  Conversation,
  ChatMessage,
  ChatUser,
  FetchConversationsOptions,
  FetchConversationsResult,
  CreateDirectConversationPayload,
  CreateGroupOrChannelPayload,
  UpdateConversationPayload,
  UpdateParticipantSettingsPayload,
  SendMessagePayload,
  FetchMessagesOptions,
  UploadChatAttachmentsResult,
} from "../types/chat.types";

export const chatApi = {
  getConversations: async (
    options?: FetchConversationsOptions,
  ): Promise<FetchConversationsResult> => {
    const res = await api.get<ApiResponse<FetchConversationsResult>>(
      "/chat/conversations",
      { params: options },
    );
    return res.data.data!;
  },

  getConversationDetails: async (
    conversationId: string,
  ): Promise<Conversation> => {
    const res = await api.get<ApiResponse<Conversation>>(
      `/chat/conversations/${conversationId}`,
    );
    return res.data.data!;
  },

  createDirectConversation: async (
    payload: CreateDirectConversationPayload,
  ): Promise<Conversation> => {
    const res = await api.post<ApiResponse<Conversation>>(
      "/chat/direct",
      payload,
    );
    return res.data.data!;
  },

  createGroupOrChannel: async (
    payload: CreateGroupOrChannelPayload,
  ): Promise<Conversation> => {
    const res = await api.post<ApiResponse<Conversation>>(
      "/chat/conversations",
      payload,
    );
    return res.data.data!;
  },

  updateConversation: async (
    conversationId: string,
    payload: UpdateConversationPayload,
  ): Promise<Conversation> => {
    const res = await api.patch<ApiResponse<Conversation>>(
      `/chat/conversations/${conversationId}`,
      payload,
    );
    return res.data.data!;
  },

  updateParticipantSettings: async (
    conversationId: string,
    payload: UpdateParticipantSettingsPayload,
  ): Promise<void> => {
    await api.patch(
      `/chat/conversations/${conversationId}/settings`,
      payload,
    );
  },

  addParticipants: async (
    conversationId: string,
    userIds: string[],
  ): Promise<void> => {
    await api.post(`/chat/conversations/${conversationId}/participants`, {
      userIds,
    });
  },

  removeParticipant: async (
    conversationId: string,
    userId: string,
  ): Promise<void> => {
    await api.delete(
      `/chat/conversations/${conversationId}/participants/${userId}`,
    );
  },

  // Messages API
  sendMessage: async (
    conversationId: string,
    payload: SendMessagePayload,
  ): Promise<ChatMessage> => {
    const res = await api.post<ApiResponse<ChatMessage>>(
      `/chat/conversations/${conversationId}/messages`,
      payload,
    );
    return res.data.data!;
  },

  getMessages: async (
    conversationId: string,
    options?: FetchMessagesOptions,
  ): Promise<ChatMessage[]> => {
    const res = await api.get<ApiResponse<ChatMessage[]>>(
      `/chat/conversations/${conversationId}/messages`,
      { params: options },
    );
    return res.data.data!;
  },

  editMessage: async (
    conversationId: string,
    messageId: string,
    content: string,
  ): Promise<ChatMessage> => {
    const res = await api.patch<ApiResponse<ChatMessage>>(
      `/chat/conversations/${conversationId}/messages/${messageId}`,
      { content },
    );
    return res.data.data!;
  },

  deleteMessage: async (
    conversationId: string,
    messageId: string,
  ): Promise<ChatMessage> => {
    const res = await api.delete<ApiResponse<ChatMessage>>(
      `/chat/conversations/${conversationId}/messages/${messageId}`,
    );
    return res.data.data!;
  },

  // Interactions API
  markAsRead: async (
    conversationId: string,
    messageId: string,
  ): Promise<void> => {
    await api.post(`/chat/conversations/${conversationId}/read`, { messageId });
  },

  toggleReaction: async (
    conversationId: string,
    messageId: string,
    emoji: string,
  ): Promise<unknown[]> => {
    const res = await api.post<ApiResponse<unknown[]>>(
      `/chat/conversations/${conversationId}/messages/${messageId}/reactions`,
      { emoji },
    );
    return res.data.data!;
  },

  togglePinMessage: async (
    conversationId: string,
    messageId: string,
  ): Promise<{ isPinned: boolean; pinnedBy: string }> => {
    const res = await api.post<
      ApiResponse<{ isPinned: boolean; pinnedBy: string }>
    >(`/chat/conversations/${conversationId}/messages/${messageId}/pin`);
    return res.data.data!;
  },

  getPinnedMessages: async (
    conversationId: string,
  ): Promise<unknown[]> => {
    const res = await api.get<ApiResponse<unknown[]>>(
      `/chat/conversations/${conversationId}/pins`,
    );
    return res.data.data!;
  },

  getOnlinePresence: async (): Promise<string[]> => {
    const res = await api.get<ApiResponse<{ onlineUserIds: string[] }>>(
      "/chat/presence",
    );
    return res.data.data!.onlineUserIds;
  },

  searchUsers: async (query?: string): Promise<ChatUser[]> => {
    const res = await api.get<ApiResponse<ChatUser[]>>("/chat/users", {
      params: { q: query },
    });
    return res.data.data!;
  },

  // Attachments API
  uploadAttachments: async (
    formData: FormData,
  ): Promise<UploadChatAttachmentsResult> => {
    const res = await api.post<ApiResponse<UploadChatAttachmentsResult>>(
      "/chat/attachments",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data.data!;
  },

  deleteAttachment: async (id: string): Promise<void> => {
    await api.delete(`/chat/attachments/${id}`);
  },
};

export default chatApi;
