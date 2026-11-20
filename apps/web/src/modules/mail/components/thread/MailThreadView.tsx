import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMailStore } from "../../store/mail.store";
import { mailApi } from "../../api/mail.api";
import { mailKeys } from "../../hooks/use-mail.inbox";
import MailThreadToolbar from "./MailThreadToolbar";
import MailThreadHeader from "./MailThreadHeader";
import MailCollapsedMessageRow from "./MailCollapsedMessageRow";
import MailExpandedMessageCard from "./MailExpandedMessageCard";
import MailThreadBottomBar from "./MailThreadBottomBar";
import MailInlineReplyComposer from "./MailInlineReplyComposer";
import { LoaderInPage } from "@/common/components/ui/Loader/Loader";
import { cn } from "@/lib/utils";

export interface MailThreadViewProps {
  className?: string;
  onBack?: () => void;
}

export const MailThreadView: React.FC<MailThreadViewProps> = ({
  className,
  onBack,
}) => {
  const queryClient = useQueryClient();
  const {
    activeThreadId,
    activeMessageId,
    closeThread,
    openedFromCategory,
    optimisticUpdateMessage,
  } = useMailStore();

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [reactionsMap, setReactionsMap] = useState<
    Record<string, Record<string, number>>
  >({});
  const [activeComposer, setActiveComposer] = useState<{
    messageId: string;
    mode: "reply" | "replyAll" | "forward";
  } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...mailKeys.all, "thread", activeThreadId],
    queryFn: () => mailApi.getThread(activeThreadId!),
    enabled: Boolean(activeThreadId),
  });

  // When thread loads, default: latest message is expanded, earlier messages are collapsed
  useEffect(() => {
    if (data?.messages && data.messages.length > 0) {
      const initialMap: Record<string, boolean> = {};
      const lastIndex = data.messages.length - 1;

      data.messages.forEach((msg, idx) => {
        // If it's the specifically clicked message or the latest message in thread, expand it
        if (msg.id === activeMessageId || idx === lastIndex) {
          initialMap[msg.id] = true;
        } else {
          initialMap[msg.id] = false;
        }
      });

      setExpandedMap(initialMap);
      setAllExpanded(
        data.messages.length === 1 ||
          Object.values(initialMap).every((v) => v === true),
      );
    }
  }, [data?.messages, activeMessageId]);

  const toggleMessageExpanded = (id: string) => {
    setExpandedMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setAllExpanded(Object.values(next).every((v) => v === true));
      return next;
    });
  };

  const handleToggleAllExpanded = () => {
    if (!data?.messages) return;
    const nextState = !allExpanded;
    const nextMap: Record<string, boolean> = {};
    data.messages.forEach((m) => {
      nextMap[m.id] = nextState;
    });
    setExpandedMap(nextMap);
    setAllExpanded(nextState);
  };

  const handleToggleStar = async (messageId: string, currentStarred: boolean) => {
    const nextStarred = !currentStarred;
    optimisticUpdateMessage(messageId, { isStarred: nextStarred });

    try {
      await mailApi.updateMessageState(messageId, { isStarred: nextStarred });
      queryClient.invalidateQueries({
        queryKey: [...mailKeys.all, "thread", activeThreadId],
      });
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const handleReactEmoji = (messageId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const currentMsgReactions = prev[messageId] || {};
      const currentCount = currentMsgReactions[emoji] || 0;
      return {
        ...prev,
        [messageId]: {
          ...currentMsgReactions,
          [emoji]: currentCount + 1,
        },
      };
    });
  };

  const handleRemoveInboxLabel = async () => {
    if (!data?.messages?.[0]) return;
    try {
      await mailApi.updateMessageState(data.messages[0].id, {
        isArchived: true,
      });
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
      closeThread();
    } catch (err) {
      console.error("Failed to archive:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
        <MailThreadToolbar onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <LoaderInPage />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
        <MailThreadToolbar onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-600 dark:text-slate-400">
          <p className="font-semibold text-base mb-2">Unable to load conversation</p>
          <p className="text-sm mb-4">
            {error instanceof Error ? error.message : "Conversation thread not found"}
          </p>
          <button
            type="button"
            onClick={closeThread}
            className="px-4 py-2 bg-[#0b57d0] text-white text-xs font-medium rounded-full hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Back to {openedFromCategory}
          </button>
        </div>
      </div>
    );
  }

  const { subject, messages } = data;
  const isInbox = openedFromCategory === "inbox";

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden",
        className,
      )}
    >
      {/* Top Action Toolbar */}
      <MailThreadToolbar onBack={onBack} />

      {/* Main Thread Content Scroll Container */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-200/80 dark:divide-slate-800/80">
        {/* Subject and Action Header */}
        <MailThreadHeader
          subject={subject}
          showInboxBadge={isInbox}
          onRemoveInboxLabel={handleRemoveInboxLabel}
          messageCount={messages.length}
          allExpanded={allExpanded}
          onToggleAllExpanded={handleToggleAllExpanded}
        />

        {/* Conversation Thread Messages */}
        <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
          {messages.map((message, idx) => {
            const isExpanded = expandedMap[message.id] ?? true;
            const isLastMessage = idx === messages.length - 1;
            const isComposingForThis =
              activeComposer?.messageId === message.id;

            if (!isExpanded) {
              return (
                <MailCollapsedMessageRow
                  key={message.id}
                  message={message}
                  onExpand={() => toggleMessageExpanded(message.id)}
                  onToggleStar={() =>
                    handleToggleStar(message.id, message.isStarred)
                  }
                />
              );
            }

            return (
              <MailExpandedMessageCard
                key={message.id}
                message={message}
                reactions={reactionsMap[message.id]}
                onReactEmoji={(emoji) => handleReactEmoji(message.id, emoji)}
                onToggleStar={() =>
                  handleToggleStar(message.id, message.isStarred)
                }
                onReply={() =>
                  setActiveComposer({
                    messageId: message.id,
                    mode: "reply",
                  })
                }
                onReplyAll={() =>
                  setActiveComposer({
                    messageId: message.id,
                    mode: "replyAll",
                  })
                }
                onForward={() =>
                  setActiveComposer({
                    messageId: message.id,
                    mode: "forward",
                  })
                }
                onDelete={() => {
                  mailApi
                    .updateMessageState(message.id, { isTrashed: true })
                    .then(() => {
                      queryClient.invalidateQueries({
                        queryKey: [...mailKeys.all, "thread", activeThreadId],
                      });
                      queryClient.invalidateQueries({
                        queryKey: mailKeys.all,
                      });
                    });
                }}
              >
                {/* Inline Composer if actively replying to this message */}
                {isComposingForThis && (
                  <MailInlineReplyComposer
                    message={message}
                    initialMode={activeComposer.mode}
                    onCancel={() => setActiveComposer(null)}
                    onSent={() => {
                      setActiveComposer(null);
                      queryClient.invalidateQueries({
                        queryKey: [...mailKeys.all, "thread", activeThreadId],
                      });
                      queryClient.invalidateQueries({
                        queryKey: mailKeys.all,
                      });
                    }}
                  />
                )}

                {/* Bottom Action Bar on the last message (when not already composing for this message) */}
                {isLastMessage && !isComposingForThis && (
                  <MailThreadBottomBar
                    onReply={() =>
                      setActiveComposer({
                        messageId: message.id,
                        mode: "reply",
                      })
                    }
                    onForward={() =>
                      setActiveComposer({
                        messageId: message.id,
                        mode: "forward",
                      })
                    }
                    onReactEmoji={(emoji) =>
                      handleReactEmoji(message.id, emoji)
                    }
                  />
                )}
              </MailExpandedMessageCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MailThreadView;
