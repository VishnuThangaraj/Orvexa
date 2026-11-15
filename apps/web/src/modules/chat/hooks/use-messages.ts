import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chat.api";
import { CHAT_QUERY_KEYS } from "./use-conversations";
import type {
  ChatMessage,
  FetchMessagesOptions,
  SendMessagePayload,
} from "../types/chat.types";

export const useMessages = (
  conversationId: string | null,
  options?: FetchMessagesOptions,
) => {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEYS.messages(conversationId || ""), options],
    queryFn: () => chatApi.getMessages(conversationId!, options),
    enabled: Boolean(conversationId),
    staleTime: 1000 * 10,
  });
};

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      chatApi.sendMessage(conversationId, payload),
    onSuccess: (newMessage) => {
      // Optimistically append new message to cache
      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(conversationId), undefined],
        (old = []) => {
          if (old.some((m) => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        },
      );

      // Invalidate conversation list so lastMessageAt and preview update
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
    },
  });
};

export const useEditMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => chatApi.editMessage(conversationId, messageId, content),
    onSuccess: (updated) => {
      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(conversationId), undefined],
        (old = []) => old.map((m) => (m.id === updated.id ? updated : m)),
      );
    },
  });
};

export const useDeleteMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      chatApi.deleteMessage(conversationId, messageId),
    onSuccess: (deleted) => {
      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(conversationId), undefined],
        (old = []) => old.map((m) => (m.id === deleted.id ? deleted : m)),
      );
    },
  });
};

export const useToggleReaction = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => chatApi.toggleReaction(conversationId, messageId, emoji),
    onSuccess: (reactions, { messageId }) => {
      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(conversationId), undefined],
        (old = []) =>
          old.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
      );
    },
  });
};

export const useTogglePin = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      chatApi.togglePinMessage(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.pins(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.messages(conversationId),
      });
    },
  });
};

export const usePinnedMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.pins(conversationId || ""),
    queryFn: () => chatApi.getPinnedMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
};

export const useMarkAsRead = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      chatApi.markAsRead(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });
    },
  });
};
