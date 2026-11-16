import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chat.api";
import type {
  FetchConversationsOptions,
  CreateDirectConversationPayload,
  CreateGroupOrChannelPayload,
  UpdateParticipantSettingsPayload,
  UpdateConversationPayload,
} from "../types/chat.types";

export const CHAT_QUERY_KEYS = {
  conversations: ["chat", "conversations"] as const,
  conversation: (id: string) => ["chat", "conversation", id] as const,
  messages: (id: string) => ["chat", "messages", id] as const,
  pins: (id: string) => ["chat", "pins", id] as const,
  presence: ["chat", "presence"] as const,
  users: (query?: string) => ["chat", "users", query] as const,
  discoverSpaces: (search?: string) => ["chat", "spaces", "discover", search] as const,
};

export const useConversations = (options?: FetchConversationsOptions) => {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEYS.conversations, options],
    queryFn: () => chatApi.getConversations(options),
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useConversationDetails = (id: string | null) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.conversation(id || ""),
    queryFn: () => chatApi.getConversationDetails(id!),
    enabled: Boolean(id),
  });
};

export const useCreateDirectConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDirectConversationPayload) =>
      chatApi.createDirectConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
    },
  });
};

export const useCreateGroupOrChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupOrChannelPayload) =>
      chatApi.createGroupOrChannel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
    },
  });
};

export const useUpdateParticipantSettings = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateParticipantSettingsPayload) =>
      chatApi.updateParticipantSettings(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
      });
    },
  });
};

export const useSearchUsers = (query?: string) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.users(query),
    queryFn: () => chatApi.searchUsers(query),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useOnlinePresence = () => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.presence,
    queryFn: () => chatApi.getOnlinePresence(),
    refetchInterval: 1000 * 60, // Periodic fallback poll every 60s
  });
};

export const useUpdateConversation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateConversationPayload) =>
      chatApi.updateConversation(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
      });
    },
  });
};

export const useRemoveParticipant = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      chatApi.removeParticipant(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
      });
    },
  });
};

export const useUpdateParticipantRole = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      memberRole,
    }: {
      userId: string;
      memberRole: "ADMIN" | "MEMBER";
    }) => chatApi.updateParticipantRole(conversationId, userId, memberRole),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
      });
    },
  });
};

export const useDiscoverPublicSpaces = (search?: string) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.discoverSpaces(search),
    queryFn: () => chatApi.discoverPublicSpaces(search),
    staleTime: 1000 * 30,
  });
};

export const useJoinPublicSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      chatApi.joinPublicSpace(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
    },
  });
};
