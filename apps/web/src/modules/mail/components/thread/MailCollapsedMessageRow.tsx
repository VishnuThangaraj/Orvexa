import React from "react";
import { Star } from "lucide-react";
import type { FormattedThreadMessage } from "../../types";
import { formatFullMessageDate, getAvatarColor, getAvatarInitial } from "./thread.utils";
import { cn } from "@/lib/utils";

export interface MailCollapsedMessageRowProps {
  className?: string;
  message: FormattedThreadMessage;
  onExpand: () => void;
  onToggleStar?: (e: React.MouseEvent) => void;
}

export const MailCollapsedMessageRow: React.FC<MailCollapsedMessageRowProps> = ({
  className,
  message,
  onExpand,
  onToggleStar,
}) => {
  const senderDisplayName =
    message.sender?.fullName ||
    message.sender?.username ||
    message.sender?.email ||
    "Unknown Sender";

  const cleanSnippet = message.snippet || message.body || "";

  return (
    <div
      onClick={onExpand}
      className={cn(
        "group flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 hover:bg-[#f6f8fc] dark:hover:bg-slate-800/60 cursor-pointer select-none transition-colors",
        className,
      )}
    >
      {/* Left: Avatar + Sender Name + Snippet */}
      <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
        {/* Avatar */}
        <div
          className={cn(
            "size-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-2xs",
            getAvatarColor(message.sender?.email || senderDisplayName),
          )}
        >
          {getAvatarInitial(senderDisplayName)}
        </div>

        {/* Sender Display Name */}
        <div className="w-44 md:w-56 shrink-0 truncate font-semibold text-sm text-slate-800 dark:text-slate-100">
          {senderDisplayName}
        </div>

        {/* Snippet Preview */}
        <div className="truncate text-sm text-slate-600 dark:text-slate-400 font-normal">
          {cleanSnippet}
        </div>
      </div>

      {/* Right: Date/Time + Star icon */}
      <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500 dark:text-slate-400">
        <span>{formatFullMessageDate(message.sentAt)}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar?.(e);
          }}
          title={message.isStarred ? "Starred" : "Not starred"}
          aria-label={message.isStarred ? "Starred" : "Not starred"}
          className="p-1 -m-1 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
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
      </div>
    </div>
  );
};

export default MailCollapsedMessageRow;
