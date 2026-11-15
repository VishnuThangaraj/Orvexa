import React, { useState } from "react";
import {
  CheckCheck,
  Ban,
  MoreVertical,
  Reply,
  Pin,
  Copy,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useChatStore } from "../store/chat.store";
import {
  useToggleReaction,
  useTogglePin,
  useDeleteMessage,
} from "../hooks/use-messages";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../types/chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isGroup: boolean;
  participantCount?: number;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isGroup,
  participantCount = 1,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const { setReplyingToMessage } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const toggleReaction = useToggleReaction(message.conversationId);
  const togglePin = useTogglePin(message.conversationId);
  const deleteMessage = useDeleteMessage(message.conversationId);

  const isOutgoing = String(message.senderId) === String(currentUser?.id);
  const isDeleted = Boolean(message.deletedAt);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleToggleReaction = (emoji: string) => {
    toggleReaction.mutate({ messageId: message.id, emoji });
    setShowEmojiPicker(false);
    setShowMenu(false);
  };

  // Group reactions by emoji
  const reactionsList = (message.reactions as any[]) || [];
  const reactionCounts: Record<string, { count: number; userReacted: boolean }> =
    {};
  reactionsList.forEach((r) => {
    if (!reactionCounts[r.emoji]) {
      reactionCounts[r.emoji] = { count: 0, userReacted: false };
    }
    reactionCounts[r.emoji].count += 1;
    if (String(r.userId) === String(currentUser?.id)) {
      reactionCounts[r.emoji].userReacted = true;
    }
  });

  // Calculate seen status
  const seenCount = Math.max(0, participantCount - 1);

  if (isDeleted) {
    return (
      <div
        className={cn(
          "flex items-end gap-2.5 my-2.5",
          isOutgoing ? "justify-end" : "justify-start",
        )}
      >
        {!isOutgoing && (
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs uppercase font-bold shrink-0">
            {message.sender?.fullName?.charAt(0) || "U"}
          </div>
        )}

        <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 select-none">
          <Ban size={15} className="text-slate-400" />
          <span className="text-xs text-slate-400 italic font-medium">
            This message was deleted
          </span>
          <span className="text-[10px] text-slate-400 ml-1">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex my-2 items-end gap-2.5",
        isOutgoing ? "justify-end" : "justify-start",
      )}
      onMouseLeave={() => {
        setShowMenu(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Sender Avatar for incoming group messages */}
      {!isOutgoing && (
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs uppercase font-bold shrink-0 mb-1">
          {message.sender?.profileImage?.secureUrl ? (
            <img
              src={message.sender.profileImage.secureUrl}
              alt={message.sender.fullName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            message.sender?.fullName?.charAt(0) || "U"
          )}
        </div>
      )}

      {/* Main Bubble Column */}
      <div className={cn("max-w-xl min-w-40 flex flex-col", isOutgoing && "items-end")}>
        {/* Sender Name in group chats for incoming messages */}
        {!isOutgoing && isGroup && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 truncate">
            {message.sender?.fullName}
          </span>
        )}

        {/* Replying Banner */}
        {message.parentMessage && (
          <div
            className={cn(
              "px-3 py-1.5 mb-1 rounded-xl text-xs border-l-2 flex flex-col",
              isOutgoing
                ? "border-[#0b57d0] self-end bg-[#c2e7ff]/30 dark:bg-[#004a77]/30"
                : "border-slate-400 self-start bg-slate-100/70 dark:bg-slate-800/50",
            )}
          >
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px]">
              {message.parentMessage.sender?.fullName}
            </span>
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {message.parentMessage.content}
            </span>
          </div>
        )}

        {/* Message Bubble matching uploaded Google Chat theme */}
        <div
          className={cn(
            "p-3.5 rounded-2xl text-sm shadow-2xs relative transition-all",
            isOutgoing
              ? "bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] border border-transparent rounded-tr-xs"
              : "bg-[#f1f3f4] dark:bg-slate-800 text-[#1f1f1f] dark:text-slate-100 border border-transparent rounded-tl-xs",
          )}
        >
          {/* Attachments rendering */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {message.attachments.map((att: any) => {
                const asset = att.asset;
                if (!asset) return null;
                const isImg =
                  asset.resourceType === "IMAGE" ||
                  asset.mimeType?.startsWith("image/");

                if (isImg && asset.secureUrl) {
                  return (
                    <div key={att.id} className="rounded-xl overflow-hidden max-h-72">
                      <img
                        src={asset.secureUrl}
                        alt={asset.originalFilename}
                        className="w-full h-auto object-cover rounded-xl hover:opacity-95 cursor-pointer"
                        onClick={() => window.open(asset.secureUrl, "_blank")}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  >
                    <FileText size={20} className="text-[#0b57d0] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                        {asset.originalFilename}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(Number(asset.bytes) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {asset.secureUrl && (
                      <a
                        href={asset.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-[#0b57d0] transition-colors"
                        title="Download file"
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Content */}
          <p className="whitespace-pre-wrap leading-relaxed select-text">
            {message.content}
          </p>

          {/* Footer Metadata: Timestamp & Seen Status */}
          <div className="flex items-center justify-end gap-1.5 mt-1.5 select-none">
            {message.isEdited && (
              <span className="text-[10px] opacity-70 italic">edited</span>
            )}
            <span className={cn(
              "text-[11px]",
              isOutgoing ? "text-[#001d35]/70 dark:text-[#c2e7ff]/80" : "text-slate-400"
            )}>
              {formatTime(message.createdAt)}
            </span>

            {/* Seen indicator matching Screenshots 2 & 3 */}
            {isOutgoing && (
              isGroup ? (
                /* Seen by group members indicator (Screenshot 3) */
                <div className="flex items-center gap-1 ml-1" title="Seen by members">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-300 ring-1 ring-white" />
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-400 ring-1 ring-white" />
                  </div>
                  <span className="text-[10px] font-bold text-[#001d35]/80 dark:text-[#c2e7ff]/80">
                    {seenCount}
                  </span>
                </div>
              ) : (
                /* Seen checkmark (Screenshot 2) */
                <span className="flex items-center gap-0.5 text-[#137333] font-semibold text-[11px] ml-1">
                  <CheckCheck size={13} className="stroke-[2.5]" />
                  <span>Seen</span>
                </span>
              )
            )}
          </div>
        </div>

        {/* Reactions underneath */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionCounts).map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggleReaction(emoji)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all",
                  data.userReacted
                    ? "bg-[#d3e3fd] border-[#c2e7ff] text-[#041e49] dark:bg-[#004a77] dark:border-[#005a8f] dark:text-[#c2e7ff]"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200",
                )}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover Action Menu Trigger */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 mb-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="React"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          😊
        </button>
        <button
          type="button"
          onClick={() => setReplyingToMessage(message)}
          title="Reply"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Reply size={15} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            title="More"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <MoreVertical size={15} />
          </button>

          {/* Context Popover */}
          {showMenu && (
            <div className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 z-30 space-y-0.5 text-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
              >
                <Copy size={13} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  togglePin.mutate(message.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
              >
                <Pin size={13} />
                <span>Pin Message</span>
              </button>
              {isOutgoing && (
                <button
                  type="button"
                  onClick={() => {
                    deleteMessage.mutate(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Quick Emoji Picker */}
      {showEmojiPicker && (
        <div
          className={cn(
            "absolute bottom-full mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg px-2 py-1 flex items-center gap-1 z-30",
            isOutgoing ? "right-0" : "left-8",
          )}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleToggleReaction(emoji)}
              className="p-1 hover:scale-125 transition-transform text-base"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
