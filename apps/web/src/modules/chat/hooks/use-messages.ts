import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chat.api";
import { CHAT_QUERY_KEYS } from "./use-conversations";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useChatStore } from "../store/chat.store";
import type {
  ChatMessage,
  Conversation,
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
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      chatApi.sendMessage(conversationId, payload),

    onMutate: async (payload: SendMessagePayload) => {
      // 1. Cancel outgoing queries for messages of this conversation
      await queryClient.cancelQueries({
        queryKey: CHAT_QUERY_KEYS.messages(conversationId),
      });

      // 2. Snapshot previous queries for rollback
      const previousMessages = queryClient.getQueriesData<ChatMessage[]>({
        queryKey: CHAT_QUERY_KEYS.messages(conversationId),
      });

      // 3. Resolve parent message relation if replying
      const chatState = useChatStore.getState();
      const replyingMsg =
        chatState.replyingToMessage?.id === payload.parentMessageId
          ? chatState.replyingToMessage
          : chatState.activeThreadRootMessage?.id === payload.parentMessageId
          ? chatState.activeThreadRootMessage
          : null;

      const tempId = `temp-${payload.clientMessageId || crypto.randomUUID()}`;

      // 4. Construct optimistic message
      const optimisticMessage: ChatMessage = {
        id: tempId,
        conversationId,
        senderId: String(currentUser?.id || "0"),
        clientMessageId: payload.clientMessageId || tempId,
        parentMessageId: payload.parentMessageId ? String(payload.parentMessageId) : null,
        content: payload.content,
        messageType: payload.messageType || "TEXT",
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: currentUser
          ? {
              id: String(currentUser.id),
              fullName: currentUser.fullName,
              username: currentUser.username,
              email: currentUser.email,
              role: currentUser.role,
              profileImage: (currentUser as any).profileImage || null,
            }
          : {
              id: "0",
              fullName: "You",
              username: "you",
              email: "",
              role: "MEMBER",
            },
        attachments: [],
        reactions: [],
        mentions: [],
        parentMessage: replyingMsg
          ? {
              id: replyingMsg.id,
              content: replyingMsg.content,
              messageType: replyingMsg.messageType,
              sender: replyingMsg.sender,
            }
          : null,
        isOptimistic: true,
        status: "sending",
      };

      // 5. Optimistically update message queries matching conversationId
      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: CHAT_QUERY_KEYS.messages(conversationId) });

      queries.forEach((q) => {
        const queryOptions = q.queryKey[3] as FetchMessagesOptions | undefined;
        const targetParentId = queryOptions?.parentMessageId;

        // If query is for a specific thread, only add if message matches parentMessageId
        if (targetParentId && targetParentId !== "all") {
          if (String(optimisticMessage.parentMessageId) !== String(targetParentId)) {
            return;
          }
        } else if (!targetParentId) {
          // Root messages query: only add if parentMessageId is null
          if (optimisticMessage.parentMessageId) {
            return;
          }
        }

        queryClient.setQueryData<ChatMessage[]>(q.queryKey, (old = []) => {
          if (
            old.some(
              (m) =>
                (m.clientMessageId &&
                  m.clientMessageId === optimisticMessage.clientMessageId) ||
                m.id === optimisticMessage.id,
            )
          ) {
            return old;
          }
          return [...old, optimisticMessage];
        });
      });

      // 6. Optimistically update conversation list preview and move chat to top
      queryClient.setQueriesData<{
        conversations: Conversation[];
        totalCount: number;
      }>({ queryKey: CHAT_QUERY_KEYS.conversations }, (old) => {
        if (!old) return old;
        const targetConv = old.conversations.find(
          (c) => String(c.id) === String(conversationId),
        );
        if (!targetConv) return old;

        const updatedTarget: Conversation = {
          ...targetConv,
          lastMessageAt: optimisticMessage.createdAt,
          messages: [optimisticMessage],
        };

        const others = old.conversations.filter(
          (c) => String(c.id) !== String(conversationId),
        );
        const updatedConversations = [updatedTarget, ...others];

        updatedConversations.sort((a, b) => {
          const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
          const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
          return timeB - timeA;
        });

        return { ...old, conversations: updatedConversations };
      });

      return {
        previousMessages,
        tempId,
        clientMessageId: payload.clientMessageId,
      };
    },

    onError: (_err, _payload, context) => {
      // Rollback to previous queries snapshot
      if (context?.previousMessages) {
        context.previousMessages.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSuccess: (newMessage, _payload, context) => {
      // Replace optimistic message with server response
      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: CHAT_QUERY_KEYS.messages(conversationId) });

      queries.forEach((q) => {
        queryClient.setQueryData<ChatMessage[]>(q.queryKey, (old = []) => {
          const index = old.findIndex(
            (m) =>
              (context?.clientMessageId &&
                m.clientMessageId === context.clientMessageId) ||
              m.id === context?.tempId ||
              (newMessage.clientMessageId &&
                m.clientMessageId === newMessage.clientMessageId) ||
              m.id === newMessage.id,
          );

          if (index !== -1) {
            const next = [...old];
            next[index] = newMessage;
            return next;
          }

          if (old.some((m) => m.id === newMessage.id)) return old;
          return old;
        });
      });

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
