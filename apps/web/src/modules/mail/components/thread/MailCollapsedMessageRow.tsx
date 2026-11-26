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
        "group flex items-center justify-between px-6 py-3.5 bg-[#f8fafd]/70 dark:bg-[#17181a] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] cursor-pointer select-none transition-colors",
        className,
      )}
    >
      {/* Left: Avatar + Sender Name + Snippet */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
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
        <div className="w-40 md:w-52 shrink-0 truncate font-medium text-[13.5px] text-[#1f1f1f] dark:text-[#e3e3e3]">
          {senderDisplayName}
        </div>

        {/* Snippet Preview */}
        <div className="truncate text-[13.5px] text-[#5e5e5e] dark:text-[#9aa0a6] font-normal">
          {cleanSnippet}
        </div>
      </div>

      {/* Right: Date/Time + Star icon */}
      <div className="flex items-center gap-3 shrink-0 text-xs text-[#5e5e5e] dark:text-[#9aa0a6]">
        <span>{formatFullMessageDate(message.sentAt)}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar?.(e);
          }}
          title={message.isStarred ? "Starred" : "Not starred"}
          aria-label={message.isStarred ? "Starred" : "Not starred"}
          className="p-1.5 -m-1.5 rounded-full text-[#747775] hover:text-[#1f1f1f] dark:text-[#8e918f] dark:hover:text-[#e3e3e3] hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
        >
          <Star
            className={cn(
              "size-4 transition-colors",
              message.isStarred
                ? "text-[#f4b400] fill-[#f4b400]"
                : "text-[#9aa0a6] hover:text-[#444746] dark:text-[#8e918f] dark:hover:text-[#e3e3e3]",
            )}
            strokeWidth={message.isStarred ? 0 : 1.75}
          />
        </button>
      </div>
    </div>
  );
};

export default MailCollapsedMessageRow;
