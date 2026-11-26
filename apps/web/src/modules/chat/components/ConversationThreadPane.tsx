import React, { useRef, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Pin, UploadCloud } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSocket } from "../hooks/use-socket";
import { useConversationDetails } from "../hooks/use-conversations";
import { useMessages, usePinnedMessages } from "../hooks/use-messages";
import ThreadHeader from "./ThreadHeader";
import MessageBubble from "./MessageBubble";
import MessageInput, { type MessageInputHandle } from "./MessageInput";
import ThreadReplyPanel from "./ThreadReplyPanel";
import EmptyConversationView from "./EmptyConversationView";

const parseNumericId = (id?: string | null): bigint | null => {
  if (!id || !/^\d+$/.test(String(id))) return null;
  return BigInt(id);
};

interface ConversationThreadPaneProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ConversationThreadPane: React.FC<ConversationThreadPaneProps> = ({
  isFullscreen,
  onToggleFullscreen,
}) => {
  const {
    activeConversationId,
    activeThreadRootMessage,
    setActiveThreadRootMessage,
    highlightedMessageId,
    setHighlightedMessageId,
  } = useChatStore();
  const typingUsers = useChatStore((state) => state.typingUsers);
  const currentUser = useAuthStore((state) => state.user);
  const { emit } = useSocket();
  const [searchParams] = useSearchParams();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputHandle>(null);
  const shouldAutoScrollRef = useRef(true);
  const hasScrolledToInitialRef = useRef<string | null>(null);

  // Task 4.1: Drag-and-drop file upload handling (hooks declared at top level)
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      messageInputRef.current?.handleDroppedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const { data: conversation, isLoading: isLoadingConv } =
    useConversationDetails(activeConversationId);
  const { data: messages = [], isLoading: isLoadingMessages } =
    useMessages(activeConversationId);
  const { data: pinnedMessages = [] } =
    usePinnedMessages(activeConversationId);

  // Compute reply counts per parent message
  const replyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((m) => {
      if (m.parentMessageId) {
        const pId = String(m.parentMessageId);
        map[pId] = (map[pId] || 0) + 1;
      }
    });
    return map;
  }, [messages]);

  // Find user's last read message cursor to position the unread divider
  const myParticipant = conversation?.participants.find(
    (p) => String(p.userId) === String(currentUser?.id),
  );
  const currentReadId = parseNumericId(myParticipant?.lastReadMessageId) ?? BigInt(0);

  // Find the first unread incoming message (guarded against temp/non-numeric IDs)
  const firstUnreadMessageId = useMemo(() => {
    if (!messages.length) return null;
    const incomingUnread = messages.find((m) => {
      if (String(m.senderId) === String(currentUser?.id)) return false;
      const msgNumericId = parseNumericId(m.id);
      return msgNumericId !== null && msgNumericId > currentReadId;
    });
    return incomingUnread?.id || null;
  }, [messages, currentReadId, currentUser?.id]);

  // Initial scroll: scroll to first unread divider if present, else scroll to bottom
  useEffect(() => {
    if (!activeConversationId || !messages.length) return;
    if (hasScrolledToInitialRef.current === activeConversationId) return;

    hasScrolledToInitialRef.current = activeConversationId;

    if (firstUnreadMessageId && unreadDividerRef.current) {
      unreadDividerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [activeConversationId, messages.length, firstUnreadMessageId]);

  // Deep linking to specific message: /chat?c={convId}&m={messageId}
  useEffect(() => {
    const linkedMsgId = searchParams.get("m");
    if (linkedMsgId && messages.length > 0) {
      setHighlightedMessageId(linkedMsgId);
      const targetEl = document.getElementById(`msg-${linkedMsgId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        const timer = setTimeout(() => {
          setHighlightedMessageId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, messages, setHighlightedMessageId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollViewportRef.current || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const isLatestOutgoing =
      lastMessage &&
      (String(lastMessage.senderId) === String(currentUser?.id) ||
        lastMessage.isOptimistic ||
        lastMessage.status === "sending");

    // Task 4.2: Guarantee auto-scroll to bottom when the current user sends a message
    if (isLatestOutgoing) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
      shouldAutoScrollRef.current = true;
      return;
    }

    // For incoming messages, auto-scroll if user is pinned to bottom and not reviewing unread divider
    if (shouldAutoScrollRef.current && !firstUnreadMessageId) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages, firstUnreadMessageId, currentUser?.id]);

  // Mandatory Fix 2: Mark incoming messages read only when viewport is actively viewed in focused tab
  useEffect(() => {
    if (!activeConversationId || !conversation || !messages.length) return;

    const markVisibleIncomingAsRead = () => {
      if (
        typeof document === "undefined" ||
        document.visibilityState !== "visible" ||
        !document.hasFocus()
      ) {
        return;
      }

      const myPart = conversation.participants.find(
        (p) => String(p.userId) === String(currentUser?.id),
      );
      const incomingMessages = messages.filter(
        (m) =>
          String(m.senderId) !== String(currentUser?.id) &&
          parseNumericId(m.id) !== null,
      );
      if (!incomingMessages.length) return;

      const latestIncoming = incomingMessages[incomingMessages.length - 1];
      const latestId = parseNumericId(latestIncoming.id);
      const readCursor = parseNumericId(myPart?.lastReadMessageId) ?? BigInt(0);

      if (latestId !== null && latestId > readCursor) {
        emit("message:read", {
          conversationId: activeConversationId,
          messageId: latestIncoming.id,
        });
      }
    };

    markVisibleIncomingAsRead();

    window.addEventListener("focus", markVisibleIncomingAsRead);
    document.addEventListener("visibilitychange", markVisibleIncomingAsRead);

    return () => {
      window.removeEventListener("focus", markVisibleIncomingAsRead);
      document.removeEventListener("visibilitychange", markVisibleIncomingAsRead);
    };
  }, [activeConversationId, conversation, messages, currentUser?.id, emit]);

  // Date Label Helper for date separators matching Orvexa Chat
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const handleScroll = () => {
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    shouldAutoScrollRef.current = isAtBottom;
  };

  if (!activeConversationId) {
    return <EmptyConversationView />;
  }

  if (isLoadingConv || !conversation) {
    return (
      <div className="flex-1 h-full flex items-center justify-center text-xs text-slate-400 bg-white dark:bg-slate-950">
        Loading conversation...
      </div>
    );
  }

  const isGroup =
    conversation.type === "GROUP" || conversation.type === "CHANNEL";
  const placeholder = isGroup
    ? `Message ${conversation.name || "Space"}... (Type @ to mention)`
    : "Type a message...";

  const currentTypingUsers =
    (activeConversationId && typingUsers[activeConversationId]) || [];

  return (
    <div className="flex-1 h-full flex overflow-hidden min-w-0">
      {/* Main Conversation Feed Viewport */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex-1 h-full flex flex-col bg-white dark:bg-slate-900 min-w-0 relative"
      >
        {/* Task 4.1: Drag & Drop Visual Backdrop Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 bg-[#c2e7ff]/75 dark:bg-[#001d35]/85 backdrop-blur-xs border-2 border-dashed border-[#0b57d0] dark:border-[#a8c7fa] flex flex-col items-center justify-center pointer-events-none transition-all animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center mb-3">
              <UploadCloud size={32} className="text-[#0b57d0] dark:text-[#a8c7fa] animate-bounce" />
            </div>
            <p className="text-base font-bold text-[#001d35] dark:text-[#c2e7ff]">
              Drop files here to upload
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Maximum 25MB per file • Images, documents, and media
            </p>
          </div>
        )}

        {/* Header matching Screenshots 2 & 3 */}
        <ThreadHeader
          conversation={conversation}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />

        {/* Pinned Messages Banner */}
        {pinnedMessages.length > 0 && (
          <div className="px-6 py-2 bg-[#eaf1fb] dark:bg-[#004a77]/30 border-b border-[#c2e7ff] dark:border-[#004a77] flex items-center gap-2 text-xs text-[#001d35] dark:text-[#c2e7ff] shrink-0">
            <Pin size={13} className="text-[#0b57d0] fill-[#0b57d0] shrink-0" />
            <span className="font-semibold shrink-0">Pinned message:</span>
            <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
              {pinnedMessages[0]?.message?.content}
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">
              ({pinnedMessages.length})
            </span>
          </div>
        )}

        {/* Messages Viewport with accessible live region */}
        <div
          ref={scrollViewportRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Conversation messages"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-1 no-scrollbar"
        >
          {isLoadingMessages ? (
            <div className="text-center text-xs text-slate-400 py-8">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-16 flex flex-col items-center">
              <span className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Start a new conversation
              </span>
              <span>Send a message or share an attachment below.</span>
            </div>
          ) : (
            messages.map((message, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;

              // Task 3.2: Date separator check
              const showDateSeparator =
                !prevMsg ||
                new Date(message.createdAt).toDateString() !==
                  new Date(prevMsg.createdAt).toDateString();
              const dateLabel = showDateSeparator
                ? getDateLabel(message.createdAt)
                : null;

              // Task 3.2: Message clustering check (same sender within 5 mins)
              const isSameSender =
                prevMsg && String(prevMsg.senderId) === String(message.senderId);
              const timeDiff = prevMsg
                ? Math.abs(
                    new Date(message.createdAt).getTime() -
                      new Date(prevMsg.createdAt).getTime(),
                  )
                : Infinity;
              const isClustered =
                isSameSender && !showDateSeparator && timeDiff < 5 * 60 * 1000;
              const isFirstInCluster = !isClustered;

              // Task 3.5: Unread divider check
              const isFirstUnread = message.id === firstUnreadMessageId;

              return (
                <React.Fragment key={message.id}>
                  {/* Date separator pill matching Orvexa Chat */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-3 select-none">
                      <span className="px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                        {dateLabel}
                      </span>
                    </div>
                  )}

                  {/* Task 3.5: "New messages" divider */}
                  {isFirstUnread && (
                    <div
                      ref={unreadDividerRef}
                      className="flex items-center gap-3 my-3 select-none"
                    >
                      <div className="flex-1 h-px bg-[#ea4335]/70" />
                      <span className="px-3 py-0.5 rounded-full bg-[#ea4335] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                        New messages
                      </span>
                      <div className="flex-1 h-px bg-[#ea4335]/70" />
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    isGroup={isGroup}
                    participants={conversation.participants}
                    isFirstInCluster={isFirstInCluster}
                    showAvatar={isFirstInCluster}
                    threadReplyCount={message._count?.replies ?? replyCounts[message.id] ?? 0}
                    onReplyInThread={(msg) => setActiveThreadRootMessage(msg)}
                    isHighlighted={highlightedMessageId === message.id}
                  />
                </React.Fragment>
              );
            })
          )}

          {/* Typing indicator */}
          {currentTypingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-1 italic animate-pulse">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0b57d0] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0b57d0] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0b57d0] animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>
                {currentTypingUsers.join(", ")} {currentTypingUsers.length > 1 ? "are" : "is"} typing...
              </span>
            </div>
          )}
        </div>

        {/* Input area */}
        <MessageInput
          key={activeConversationId}
          ref={messageInputRef}
          conversationId={activeConversationId}
          placeholder={placeholder}
          isGroup={isGroup}
          participants={conversation.participants}
          currentUserRole={myParticipant?.memberRole}
        />
      </div>

      {/* Task 3.4: In-Line Thread Reply Collapsible Panel */}
      {activeThreadRootMessage && (
        <ThreadReplyPanel
          key={activeThreadRootMessage.id}
          conversationId={activeConversationId}
          isGroup={isGroup}
          participants={conversation.participants}
        />
      )}
    </div>
  );
};

export default ConversationThreadPane;
