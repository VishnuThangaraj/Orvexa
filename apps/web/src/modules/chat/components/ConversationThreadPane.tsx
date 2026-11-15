import React, { useRef, useEffect, useState } from "react";
import { Pin } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import {
  useConversationDetails,
} from "../hooks/use-conversations";
import { useMessages, usePinnedMessages } from "../hooks/use-messages";
import ThreadHeader from "./ThreadHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import EmptyConversationView from "./EmptyConversationView";

interface ConversationThreadPaneProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ConversationThreadPane: React.FC<ConversationThreadPaneProps> = ({
  isFullscreen,
  onToggleFullscreen,
}) => {
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId,
  );
  const typingUsers = useChatStore((state) => state.typingUsers);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const { data: conversation, isLoading: isLoadingConv } =
    useConversationDetails(activeConversationId);
  const { data: messages = [], isLoading: isLoadingMessages } =
    useMessages(activeConversationId);
  const { data: pinnedMessages = [] } =
    usePinnedMessages(activeConversationId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll && scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = () => {
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShouldAutoScroll(isAtBottom);
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
    : "Type a message... (Type @ to mention)";

  const currentTypingUsers =
    (activeConversationId && typingUsers[activeConversationId]) || [];

  return (
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-900 min-w-0">
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
            {(pinnedMessages[0] as any).message?.content}
          </span>
          <span className="text-[10px] text-slate-400 shrink-0">
            ({pinnedMessages.length})
          </span>
        </div>
      )}

      {/* Messages Viewport */}
      <div
        ref={scrollViewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
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
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isGroup={isGroup}
              participantCount={conversation.participants.length}
            />
          ))
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
        conversationId={activeConversationId}
        placeholder={placeholder}
      />
    </div>
  );
};

export default ConversationThreadPane;
