import React, { useState } from "react";
import {
  Star,
  Paperclip,
  Smile,
  Reply,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import type { FormattedThreadMessage } from "../../types";
import {
  formatDetailHeaderDate,
  formatFullMessageDate,
  getAvatarColor,
  getAvatarInitial,
  splitMessageQuotes,
} from "./thread.utils";
import MailAttachmentList from "./MailAttachmentList";
import { cn } from "@/lib/utils";

export interface MailExpandedMessageCardProps {
  className?: string;
  message: FormattedThreadMessage;
  onToggleStar?: () => void;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onReactEmoji?: (emoji: string) => void;
  reactions?: Record<string, number>;
  children?: React.ReactNode;
}

export const MailExpandedMessageCard: React.FC<MailExpandedMessageCardProps> = ({
  className,
  message,
  onToggleStar,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onPrint,
  onReactEmoji,
  reactions = {},
  children,
}) => {
  const [showRecipientDetails, setShowRecipientDetails] = useState(false);
  const [showTrimmedContent, setShowTrimmedContent] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const senderName =
    message.sender?.fullName || message.sender?.username || "Unknown";
  const senderEmail = message.sender?.email || "";

  // Recipient summary label: "to Vishnu ▼" or "to bcc: user ▼"
  const hasBcc = message.recipients?.some((r) => r.recipientType === "BCC");
  const firstTo = message.recipients?.find((r) => r.recipientType === "TO");
  const recipientSummary = hasBcc
    ? `to bcc: ${firstTo?.user.fullName || firstTo?.user.username || message.recipients?.[0]?.user.username || "me"}`
    : `to ${firstTo?.user.fullName || firstTo?.user.username || "me"}`;

  const { main, quoted } = splitMessageQuotes(message.body || "");

  const quickEmojis = ["👍", "❤️", "🎉", "👏", "😄", "🚀"];

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors",
        className,
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 select-none">
        {/* Left: Avatar + Sender + Recipient dropdown */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Avatar */}
          <div
            className={cn(
              "size-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-2xs mt-0.5",
              getAvatarColor(senderEmail || senderName),
            )}
          >
            {getAvatarInitial(senderName)}
          </div>

          {/* Sender & Recipient Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5 leading-tight">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {senderName}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                &lt;{senderEmail}&gt;
              </span>
            </div>

            {/* Recipient Dropdown Toggle */}
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setShowRecipientDetails((prev) => !prev)}
                className="inline-flex items-center gap-0.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-normal cursor-pointer transition-colors"
              >
                <span>{recipientSummary}</span>
                {showRecipientDetails ? (
                  <ChevronUp className="size-3 text-slate-500" />
                ) : (
                  <ChevronDown className="size-3 text-slate-500" />
                )}
              </button>

              {/* Detailed Headers Dropdown */}
              {showRecipientDetails && (
                <div className="absolute left-0 top-6 z-30 w-80 md:w-96 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-[68px_1fr] gap-x-2">
                    <span className="text-slate-400 text-right">from:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {senderName} &lt;{senderEmail}&gt;
                    </span>
                  </div>

                  <div className="grid grid-cols-[68px_1fr] gap-x-2">
                    <span className="text-slate-400 text-right">to:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {message.recipients
                        ?.filter((r) => r.recipientType === "TO")
                        .map((r) => `${r.user.fullName || r.user.username} <${r.user.email}>`)
                        .join(", ") || "me"}
                    </span>
                  </div>

                  {message.recipients?.some((r) => r.recipientType === "CC") && (
                    <div className="grid grid-cols-[68px_1fr] gap-x-2">
                      <span className="text-slate-400 text-right">cc:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {message.recipients
                          ?.filter((r) => r.recipientType === "CC")
                          .map((r) => `${r.user.fullName || r.user.username} <${r.user.email}>`)
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  {message.recipients?.some((r) => r.recipientType === "BCC") && (
                    <div className="grid grid-cols-[68px_1fr] gap-x-2">
                      <span className="text-slate-400 text-right">bcc:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {message.recipients
                          ?.filter((r) => r.recipientType === "BCC")
                          .map((r) => `${r.user.fullName || r.user.username} <${r.user.email}>`)
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-[68px_1fr] gap-x-2">
                    <span className="text-slate-400 text-right">date:</span>
                    <span>{formatDetailHeaderDate(message.sentAt)}</span>
                  </div>

                  <div className="grid grid-cols-[68px_1fr] gap-x-2">
                    <span className="text-slate-400 text-right">subject:</span>
                    <span className="truncate">{message.subject}</span>
                  </div>

                  <div className="grid grid-cols-[68px_1fr] gap-x-2">
                    <span className="text-slate-400 text-right">mailed-by:</span>
                    <span>orvexa.com</span>
                  </div>

                  <div className="grid grid-cols-[68px_1fr] gap-x-2">
                    <span className="text-slate-400 text-right">signed-by:</span>
                    <span>orvexa.com</span>
                  </div>

                  <div className="grid grid-cols-[68px_1fr] gap-x-2 items-center">
                    <span className="text-slate-400 text-right">security:</span>
                    <span className="inline-flex items-center gap-1 text-[#188038] font-medium">
                      <Lock className="size-3" /> Standard encryption (TLS)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Paperclip (if attached), Date/Time, Star, Emoji, Reply, More */}
        <div className="flex items-center gap-1.5 shrink-0 text-slate-500 dark:text-slate-400 pt-0.5">
          {message.hasAttachments && (
            <span title="Has attachments">
              <Paperclip className="size-4 text-slate-400 dark:text-slate-500 mr-1" />
            </span>
          )}

          <span className="text-xs mr-2 font-normal">
            {formatFullMessageDate(message.sentAt)}
          </span>

          {/* Star Button */}
          <button
            type="button"
            onClick={onToggleStar}
            title={message.isStarred ? "Starred" : "Not starred"}
            aria-label={message.isStarred ? "Starred" : "Not starred"}
            className="p-1.5 rounded-full hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Star
              className={cn(
                "size-4 transition-colors",
                message.isStarred
                  ? "text-[#1a73e8] fill-[#1a73e8]"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
              )}
              strokeWidth={message.isStarred ? 0 : 1.75}
            />
          </button>

          {/* Emoji Reaction Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              title="Add reaction"
              aria-label="Add reaction"
              className="p-1.5 rounded-full hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Smile className="size-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute right-0 top-8 z-30 flex items-center gap-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReactEmoji?.(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-base transition-transform hover:scale-125 cursor-pointer leading-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply Button */}
          <button
            type="button"
            onClick={onReply}
            title="Reply"
            aria-label="Reply"
            className="p-1.5 rounded-full hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Reply className="size-4" />
          </button>

          {/* More Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              title="More"
              aria-label="More options"
              className="p-1.5 rounded-full hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="size-4" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1.5 text-xs text-slate-700 dark:text-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onReply?.();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onReplyAll?.();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Reply all
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onForward?.();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Forward
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onPrint?.();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onDelete?.();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-600 dark:text-red-400 cursor-pointer"
                >
                  Delete this message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quoted Reply History Toggle ("..." pill) */}
      {quoted && (
        <div className="my-2 select-none">
          <button
            type="button"
            onClick={() => setShowTrimmedContent((prev) => !prev)}
            title="Show trimmed content"
            className="px-2 py-0.5 rounded-full bg-slate-200/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold leading-none cursor-pointer tracking-wider"
          >
            •••
          </button>
        </div>
      )}

      {/* Trimmed content (if expanded) */}
      {quoted && showTrimmedContent && (
        <div className="pl-3 border-l-2 border-slate-300 dark:border-slate-700 my-2 text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap font-sans">
          {quoted}
        </div>
      )}

      {/* Formatted Message Body */}
      <div className="mt-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
        {main}
      </div>

      {/* Reaction Chips (if any) */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 select-none">
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReactEmoji?.(emoji)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <span>{emoji}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Attachments Section */}
      {message.attachments && message.attachments.length > 0 && (
        <MailAttachmentList attachments={message.attachments} />
      )}

      {/* Children Slot (e.g. Reply Composer or Action Bar) */}
      {children}
    </div>
  );
};

export default MailExpandedMessageCard;
