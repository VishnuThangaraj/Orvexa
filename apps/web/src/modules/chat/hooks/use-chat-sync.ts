import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { CHAT_QUERY_KEYS } from "./use-conversations";
import type { ChatMessage, Conversation } from "../types/chat.types";

export const useChatSync = () => {
  const queryClient = useQueryClient();
  const { subscribe, emit, isConnected } = useSocket();
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId,
  );
  const setUserTyping = useChatStore((state) => state.setUserTyping);
  const addOnlineUser = useSocketStore((state) => state.addOnlineUser);
  const removeOnlineUser = useSocketStore((state) => state.removeOnlineUser);

  // Join active conversation room on socket connect or room switch
  useEffect(() => {
    if (!isConnected || !activeConversationId) return;

    emit("chat:join", { conversationId: activeConversationId });

    return () => {
      emit("chat:leave", { conversationId: activeConversationId });
    };
  }, [isConnected, activeConversationId, emit]);

  // Listen to incoming real-time socket events
  useEffect(() => {
    if (!isConnected) return;

    // 1. New message received
    const unsubMessage = subscribe("message:received", (rawMessage) => {
      const message = rawMessage as ChatMessage;
      const conversationId = String(message.conversationId);

      // Append to message list cache
      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(conversationId), undefined],
        (old = []) => {
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        },
      );

      // Update conversation list preview
      queryClient.setQueryData<{
        conversations: Conversation[];
        totalCount: number;
      }>([...CHAT_QUERY_KEYS.conversations, undefined], (old) => {
        if (!old) return old;
        const updatedConversations = old.conversations.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessageAt: message.createdAt,
              messages: [message],
            };
          }
          return conv;
        });

        // Sort by latest message first
        updatedConversations.sort((a, b) => {
          const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
          const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
          return timeB - timeA;
        });

        return { ...old, conversations: updatedConversations };
      });

      // If active conversation, mark as read
      if (activeConversationId === conversationId) {
        emit("message:read", {
          conversationId,
          messageId: message.id,
        });
      }
    });

    // 2. Message updated (edited)
    const unsubUpdated = subscribe("message:updated", (rawMessage) => {
      const updated = rawMessage as ChatMessage;
      const conversationId = String(updated.conversationId);

      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(conversationId), undefined],
        (old = []) => old.map((m) => (m.id === updated.id ? updated : m)),
      );
    });

    // 3. Message deleted
    const unsubDeleted = subscribe("message:deleted", (data) => {
      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(data.conversationId), undefined],
        (old = []) =>
          old.map((m) =>
            m.id === data.messageId
              ? { ...m, deletedAt: new Date().toISOString() }
              : m,
          ),
      );
    });

    // 4. Typing indicator
    const unsubTyping = subscribe("typing:user_typing", (data) => {
      setUserTyping(
        data.conversationId,
        data.userId,
        `User ${data.userId}`,
        data.isTyping,
      );
    });

    // 5. Read receipt
    const unsubReceipt = subscribe("message:read_receipt", (data) => {
      // Invalidate conversation details / messages to refresh seen status
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(data.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.messages(data.conversationId),
      });
    });

    // 6. Reaction updated
    const unsubReactions = subscribe("message:reaction_updated", (data) => {
      queryClient.setQueryData<ChatMessage[]>(
        [...CHAT_QUERY_KEYS.messages(data.conversationId), undefined],
        (old = []) =>
          old.map((m) =>
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m,
          ),
      );
    });

    // 7. Pinned updated
    const unsubPinned = subscribe("message:pinned_updated", (data) => {
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.pins(data.conversationId),
      });
    });

    // 8. Presence state
    const unsubPresence = subscribe("presence:state", (data) => {
      if (data.isOnline) {
        addOnlineUser(data.userId);
      } else {
        removeOnlineUser(data.userId);
      }
    });

    return () => {
      unsubMessage();
      unsubUpdated();
      unsubDeleted();
      unsubTyping();
      unsubReceipt();
      unsubReactions();
      unsubPinned();
      unsubPresence();
    };
  }, [
    isConnected,
    activeConversationId,
    subscribe,
    emit,
    queryClient,
    setUserTyping,
    addOnlineUser,
    removeOnlineUser,
  ]);
};

export default useChatSync;
