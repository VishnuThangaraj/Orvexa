import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { CHAT_QUERY_KEYS } from "./use-conversations";
import type { ChatMessage, Conversation } from "../types/chat.types";

export const useChatSync = () => {
  const queryClient = useQueryClient();
  const { subscribe, emit, isConnected } = useSocket();
  const currentUser = useAuthStore((state) => state.user);
  const {
    activeConversationId,
    setActiveConversationId,
    setUserTyping,
  } = useChatStore();
  const {
    addOnlineUser,
    removeOnlineUser,
    myPresenceStatus,
    setMyPresenceStatus,
  } = useSocketStore();

  const wasConnectedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Task 5.2: Request browser notification permission on mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Task 5.4: Missed messages sync upon reconnect
  useEffect(() => {
    if (isConnected) {
      if (!wasConnectedRef.current) {
        // Reconnection occurred or fresh connection -> backfill missed data
        queryClient.invalidateQueries({
          queryKey: CHAT_QUERY_KEYS.conversations,
        });
        if (activeConversationId) {
          queryClient.invalidateQueries({
            queryKey: CHAT_QUERY_KEYS.messages(activeConversationId),
          });
          queryClient.invalidateQueries({
            queryKey: CHAT_QUERY_KEYS.conversation(activeConversationId),
          });
        }
      }
      wasConnectedRef.current = true;
    } else {
      wasConnectedRef.current = false;
    }
  }, [isConnected, activeConversationId, queryClient]);

  // Task 5.1: Idle detection (10 minutes) & presence status broadcast
  useEffect(() => {
    if (!isConnected) return;

    const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    const handleUserActivity = () => {
      if (myPresenceStatus === "AWAY") {
        setMyPresenceStatus("ACTIVE");
        emit("presence:update", { status: "ACTIVE" });
      }

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setMyPresenceStatus("AWAY");
        emit("presence:update", { status: "AWAY" });
      }, IDLE_TIMEOUT_MS);
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);

    // Initial activity heartbeat
    handleUserActivity();

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isConnected, myPresenceStatus, emit, setMyPresenceStatus]);

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

      // Task 5.2: Dispatch browser desktop notification if tab is unfocused
      const isIncoming = String(message.senderId) !== String(currentUser?.id);
      const isTabFocused =
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        document.hasFocus();

      if (isIncoming && !isTabFocused) {
        const conv = queryClient.getQueryData<Conversation>(
          CHAT_QUERY_KEYS.conversation(conversationId),
        );
        const myParticipant = conv?.participants?.find(
          (p) => String(p.userId) === String(currentUser?.id),
        );

        if (!myParticipant?.isMuted && typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            const notif = new Notification(
              message.sender?.fullName || conv?.name || "New chat message",
              {
                body: message.content,
                icon: message.sender?.profileImage?.secureUrl || "/favicon.ico",
                tag: `chat-${conversationId}`,
              },
            );
            notif.onclick = () => {
              window.focus();
              setActiveConversationId(conversationId);
            };
          }
        }
      }

      // Mark as read only if active conversation is opened and tab is focused
      if (activeConversationId === conversationId && isIncoming && isTabFocused) {
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
      // Optimistically advance the participant's read cursor in conversation cache
      queryClient.setQueryData<Conversation>(
        CHAT_QUERY_KEYS.conversation(data.conversationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            participants: old.participants.map((p) => {
              if (String(p.userId) === String(data.userId)) {
                return {
                  ...p,
                  lastReadMessageId: data.messageId,
                  lastReadAt: data.readAt,
                };
              }
              return p;
            }),
          };
        },
      );

      // Invalidate queries to ensure full consistency across views
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(data.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.messages(data.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
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
        addOnlineUser(data.userId, data.status);
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
    currentUser?.id,
    setUserTyping,
    addOnlineUser,
    removeOnlineUser,
    setActiveConversationId,
  ]);
};

export default useChatSync;
