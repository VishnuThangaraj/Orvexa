import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./use-socket";
import { chatApi } from "../api/chat.api";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { CHAT_QUERY_KEYS } from "./use-conversations";
import {
  applyReadReceiptToConversation,
  applyReadReceiptToConversationsResult,
} from "../utils/chat.utils";
import type {
  ChatMessage,
  ChatReactionItem,
  Conversation,
  FetchMessagesOptions,
  FetchConversationsResult,
} from "../types/chat.types";

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
    setPresenceSnapshot,
    myPresenceStatus,
    setMyPresenceStatus,
  } = useSocketStore();

  const wasConnectedRef = useRef(false);
  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(0);
  const myPresenceRef = useRef(myPresenceStatus);
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    myPresenceRef.current = myPresenceStatus;
  }, [myPresenceStatus]);

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

  // Task 5.4: Missed messages & initial online presence sync upon mount & connect/reconnect
  useEffect(() => {
    const syncPresenceSnapshot = () => {
      chatApi
        .getOnlinePresence()
        .then(({ onlineUserIds, presenceMap }) => {
          setPresenceSnapshot(onlineUserIds, presenceMap);
        })
        .catch(() => {});
    };

    syncPresenceSnapshot();

    if (isConnected) {
      if (!wasConnectedRef.current) {
        queryClient.invalidateQueries({
          queryKey: CHAT_QUERY_KEYS.conversations,
        });
        const currentConvoId = activeConversationIdRef.current;
        if (currentConvoId) {
          queryClient.invalidateQueries({
            queryKey: CHAT_QUERY_KEYS.messages(currentConvoId),
          });
          queryClient.invalidateQueries({
            queryKey: CHAT_QUERY_KEYS.conversation(currentConvoId),
          });
        }
      }
      wasConnectedRef.current = true;
    } else {
      wasConnectedRef.current = false;
    }
  }, [isConnected, queryClient, setPresenceSnapshot]);

  // Fallback real-time sync when WebSocket is disconnected (e.g. serverless Vercel deployments)
  useEffect(() => {
    if (isConnected) return;

    let tick = 0;
    const syncNow = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      });

      const currentConvoId = activeConversationIdRef.current;
      if (currentConvoId) {
        queryClient.invalidateQueries({
          queryKey: CHAT_QUERY_KEYS.messages(currentConvoId),
        });
        queryClient.invalidateQueries({
          queryKey: CHAT_QUERY_KEYS.conversation(currentConvoId),
        });
      }

      if (tick % 3 === 0) {
        chatApi
          .getOnlinePresence()
          .then(({ onlineUserIds, presenceMap }) => {
            setPresenceSnapshot(onlineUserIds, presenceMap);
          })
          .catch(() => {});
      }
      tick += 1;
    };

    const interval = setInterval(syncNow, 3000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncNow();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isConnected, queryClient, setPresenceSnapshot]);

  // Task 5.1: Idle detection (10 minutes) & presence status broadcast
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    const pushPresence = (status: "ACTIVE" | "AWAY" | "DND") => {
      setMyPresenceStatus(status);
      if (isConnected) {
        emit("presence:update", { status });
      }
      chatApi.updatePresence(status).catch(() => {});
    };

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        // Never overwrite manual Do Not Disturb status with AWAY
        if (myPresenceRef.current === "ACTIVE") {
          pushPresence("AWAY");
        }
      }, IDLE_TIMEOUT_MS);
    };

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < 5000 && idleTimerRef.current) {
        return;
      }
      lastActivityRef.current = now;

      if (myPresenceRef.current === "AWAY") {
        pushPresence("ACTIVE");
      }

      resetIdleTimer();
    };

    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity, { passive: true });
    window.addEventListener("scroll", handleUserActivity, { passive: true });

    resetIdleTimer();

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isConnected, emit, setMyPresenceStatus]);

  // Join active conversation room on socket connect or room switch
  useEffect(() => {
    if (!isConnected || !activeConversationId) return;

    emit("chat:join", { conversationId: activeConversationId });

    return () => {
      emit("chat:leave", { conversationId: activeConversationId });
    };
  }, [isConnected, activeConversationId, emit]);

  // Listen to incoming real-time socket events (stable across room switches)
  useEffect(() => {
    if (!isConnected) return;

    const resolveParticipantName = (
      conversationId: string,
      userId: string,
    ): string => {
      const convDetail = queryClient.getQueryData<Conversation>(
        CHAT_QUERY_KEYS.conversation(conversationId),
      );
      const fromDetail = convDetail?.participants?.find(
        (p) => String(p.userId) === String(userId),
      )?.user?.fullName;
      if (fromDetail) return fromDetail;

      const convListQueries = queryClient.getQueriesData<FetchConversationsResult>(
        { queryKey: CHAT_QUERY_KEYS.conversations },
      );
      for (const [, listData] of convListQueries) {
        const conv = listData?.conversations?.find(
          (c) => String(c.id) === String(conversationId),
        );
        const fromList = conv?.participants?.find(
          (p) => String(p.userId) === String(userId),
        )?.user?.fullName;
        if (fromList) return fromList;
      }

      return `User ${userId}`;
    };

    // 1. New message received
    const unsubMessage = subscribe("message:received", (rawMessage) => {
      const message = rawMessage as ChatMessage;
      const conversationId = String(message.conversationId);

      // Reconcile incoming real-time message with optimistic cache across all message queries
      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: CHAT_QUERY_KEYS.messages(conversationId) });

      queries.forEach((q) => {
        const queryOptions = q.queryKey[3] as FetchMessagesOptions | undefined;
        const targetParentId = queryOptions?.parentMessageId;

        if (targetParentId && targetParentId !== "all") {
          if (String(message.parentMessageId) !== String(targetParentId)) {
            return;
          }
        } else if (!targetParentId) {
          if (message.parentMessageId) {
            return;
          }
        }

        queryClient.setQueryData<ChatMessage[]>(q.queryKey, (old = []) => {
          const matchIndex = old.findIndex(
            (m) =>
              (message.clientMessageId &&
                m.clientMessageId === message.clientMessageId) ||
              String(m.id) === String(message.id),
          );

          if (matchIndex !== -1) {
            const next = [...old];
            next[matchIndex] = message;
            return next;
          }

          if (old.some((m) => String(m.id) === String(message.id))) return old;
          return [...old, message];
        });
      });

      // Update conversation list preview & immediately move chat to top across all conversation views
      queryClient.setQueriesData<FetchConversationsResult>(
        { queryKey: CHAT_QUERY_KEYS.conversations },
        (old) => {
          if (!old) return old;
          const exists = old.conversations.some(
            (c) => String(c.id) === conversationId,
          );
          if (!exists) {
            queryClient.invalidateQueries({
              queryKey: CHAT_QUERY_KEYS.conversations,
            });
            return old;
          }

          const targetConv = old.conversations.find(
            (c) => String(c.id) === conversationId,
          )!;
          const updatedTarget: Conversation = {
            ...targetConv,
            lastMessageAt: message.createdAt,
            messages: [message],
          };

          const others = old.conversations.filter(
            (c) => String(c.id) !== conversationId,
          );
          const updatedConversations = [updatedTarget, ...others];

          updatedConversations.sort((a, b) => {
            const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
            const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
            return timeB - timeA;
          });

          return { ...old, conversations: updatedConversations };
        },
      );

      // Clear typing indicator for sender upon receiving their message
      const senderName = resolveParticipantName(
        conversationId,
        String(message.senderId),
      );
      setUserTyping(conversationId, String(message.senderId), senderName, false);

      const isIncoming = String(message.senderId) !== String(currentUser?.id);
      const isTabVisible =
        typeof document !== "undefined" &&
        document.visibilityState === "visible";
      const isTabFocused = isTabVisible && document.hasFocus();

      if (isIncoming && !isTabFocused) {
        const conv = queryClient.getQueryData<Conversation>(
          CHAT_QUERY_KEYS.conversation(conversationId),
        );
        const myParticipant = conv?.participants?.find(
          (p) => String(p.userId) === String(currentUser?.id),
        );

        if (
          !myParticipant?.isMuted &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
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

      if (
        activeConversationIdRef.current === conversationId &&
        isIncoming &&
        isTabVisible
      ) {
        const readAtIso = new Date().toISOString();
        if (currentUser?.id) {
          queryClient.setQueryData<Conversation>(
            CHAT_QUERY_KEYS.conversation(conversationId),
            (old) =>
              old
                ? applyReadReceiptToConversation(
                    old,
                    String(currentUser.id),
                    String(message.id),
                    readAtIso,
                  )
                : old,
          );
          queryClient.setQueriesData<FetchConversationsResult>(
            { queryKey: CHAT_QUERY_KEYS.conversations },
            (old) =>
              applyReadReceiptToConversationsResult(
                old,
                conversationId,
                String(currentUser.id),
                String(message.id),
                readAtIso,
              ),
          );
        }
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

      queryClient.setQueriesData<ChatMessage[]>(
        { queryKey: CHAT_QUERY_KEYS.messages(conversationId) },
        (old = []) =>
          old.map((m) => (String(m.id) === String(updated.id) ? updated : m)),
      );
    });

    // 3. Message deleted
    const unsubDeleted = subscribe("message:deleted", (data) => {
      queryClient.setQueriesData<ChatMessage[]>(
        { queryKey: CHAT_QUERY_KEYS.messages(data.conversationId) },
        (old = []) =>
          old.map((m) =>
            String(m.id) === String(data.messageId)
              ? {
                  ...m,
                  deletedAt: new Date().toISOString(),
                  content: "This message was deleted",
                }
              : m,
          ),
      );
    });

    // 4. Typing indicator with real participant name & auto-expire
    const unsubTyping = subscribe("typing:user_typing", (data) => {
      if (String(data.userId) === String(currentUser?.id)) return;

      const displayName = resolveParticipantName(
        data.conversationId,
        data.userId,
      );
      const timerKey = `${data.conversationId}:${data.userId}`;
      if (typingTimersRef.current[timerKey]) {
        clearTimeout(typingTimersRef.current[timerKey]);
        delete typingTimersRef.current[timerKey];
      }

      setUserTyping(data.conversationId, data.userId, displayName, data.isTyping);

      if (data.isTyping) {
        typingTimersRef.current[timerKey] = setTimeout(() => {
          setUserTyping(data.conversationId, data.userId, displayName, false);
          delete typingTimersRef.current[timerKey];
        }, 4000);
      }
    });

    // 5. Read receipt
    const unsubReceipt = subscribe("message:read_receipt", (data) => {
      queryClient.setQueryData<Conversation>(
        CHAT_QUERY_KEYS.conversation(data.conversationId),
        (old) =>
          old
            ? applyReadReceiptToConversation(
                old,
                data.userId,
                data.messageId,
                data.readAt,
              )
            : old,
      );

      queryClient.setQueriesData<FetchConversationsResult>(
        { queryKey: CHAT_QUERY_KEYS.conversations },
        (old) =>
          applyReadReceiptToConversationsResult(
            old,
            data.conversationId,
            data.userId,
            data.messageId,
            data.readAt,
          ),
      );
    });

    // 6. Reaction updated
    const unsubReactions = subscribe("message:reaction_updated", (data) => {
      queryClient.setQueriesData<ChatMessage[]>(
        { queryKey: CHAT_QUERY_KEYS.messages(data.conversationId) },
        (old = []) =>
          old.map((m) =>
            String(m.id) === String(data.messageId)
              ? { ...m, reactions: data.reactions as ChatReactionItem[] }
              : m,
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

    const timersMap = typingTimersRef.current;

    return () => {
      unsubMessage();
      unsubUpdated();
      unsubDeleted();
      unsubTyping();
      unsubReceipt();
      unsubReactions();
      unsubPinned();
      unsubPresence();
      Object.values(timersMap).forEach(clearTimeout);
    };
  }, [
    isConnected,
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
