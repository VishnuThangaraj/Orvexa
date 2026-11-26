import React, { useState } from "react";
import {
  Archive,
  FileText,
  Image,
  Mail as MailUnreadIcon,
  MailOpen,
  Paperclip,
  Star,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { FormattedInboxAttachment, FormattedInboxMessage } from "../types";
import { mailApi } from "../api/mail.api";
import { mailKeys } from "../hooks/use-mail.inbox";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { cn } from "@/lib/utils";

export interface MailLayoutProps {
  mail: FormattedInboxMessage;
  onClick?: (mail: FormattedInboxMessage) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const ORVEXA_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

const formatMailDate = (timestamp: string | Date | number): string => {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const month = ORVEXA_MONTHS[d.getMonth()];
  return `${day} ${month}`;
};

const KNOWN_LABELS = ["Shnoor International LLC", "Education", "KPR"];

const getAttachmentBadge = (att: FormattedInboxAttachment) => {
  const ext = (
    att.format ||
    att.originalFilename.split(".").pop() ||
    ""
  ).toLowerCase();
  const mime = (att.mimeType || "").toLowerCase();

  if (ext === "pdf" || mime.includes("pdf")) {
    return (
      <span className="shrink-0 px-1 py-0.5 rounded-xs bg-[#d93025] text-white text-[9px] font-bold leading-none select-none">
        PDF
      </span>
    );
  }

  if (
    ["doc", "docx"].includes(ext) ||
    mime.includes("word") ||
    mime.includes("document")
  ) {
    return <FileText className="size-3.5 text-[#1a73e8] shrink-0" />;
  }

  if (
    ["xls", "xlsx", "csv"].includes(ext) ||
    mime.includes("sheet") ||
    mime.includes("csv")
  ) {
    return (
      <span className="shrink-0 px-1 py-0.5 rounded-xs bg-[#188038] text-white text-[9px] font-bold leading-none select-none">
        XLS
      </span>
    );
  }

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)
  ) {
    return <Image className="size-3.5 text-[#1a73e8] shrink-0" />;
  }

  return <Paperclip className="size-3.5 text-slate-500 shrink-0" />;
};

const MailLayout: React.FC<MailLayoutProps> = ({
  mail,
  onClick,
  selected: controlledSelected,
  onToggleSelect,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [internalSelected, setInternalSelected] = useState(false);
  const [optimisticStar, setOptimisticStar] = useState<boolean | null>(null);

  const starred = optimisticStar ?? mail.isStarred;
  const isSelected = controlledSelected ?? internalSelected;
  const isUnread = !mail.isRead;
  const hasAttachments = Boolean(
    mail.hasAttachments && mail.attachments && mail.attachments.length > 0,
  );

  // Extract label if present in subject (e.g. Shnoor International LLC)
  let labelBadge: string | null = null;
  let displaySubject = mail.subject || "(no subject)";

  for (const label of KNOWN_LABELS) {
    if (displaySubject.startsWith(`${label} `)) {
      labelBadge = label;
      displaySubject = displaySubject.slice(label.length + 1);
      break;
    }
  }

  const handleSelectToggle = () => {
    if (onToggleSelect) {
      onToggleSelect(mail.id);
    } else {
      setInternalSelected((prev) => !prev);
    }
  };

  const handleToggleStar = async () => {
    const nextStarred = !starred;
    setOptimisticStar(nextStarred);
    try {
      await mailApi.updateMessageState(mail.id, { isStarred: nextStarred });
      await queryClient.invalidateQueries({ queryKey: mailKeys.all });
    } catch (err) {
      console.error("Failed to toggle star:", err);
      setOptimisticStar(null);
    }
  };

  const handleQuickState = async (
    e: React.MouseEvent,
    updates: { isArchived?: boolean; isTrashed?: boolean; isRead?: boolean },
  ) => {
    e.stopPropagation();
    try {
      await mailApi.updateMessageState(mail.id, updates);
      await queryClient.invalidateQueries({ queryKey: mailKeys.all });
    } catch (err) {
      console.error("Failed to update mail state:", err);
    }
  };

  const isSenderMe = Boolean(user && mail.sender?.id === user.id.toString());
  const displaySender =
    isSenderMe && mail.recipients && mail.recipients.length > 0
      ? `To: ${mail.recipients[0]?.user.fullName || mail.recipients[0]?.user.username}`
      : mail.sender?.fullName || mail.sender?.username || "Unknown";

  return (
    <div
      onClick={() => onClick?.(mail)}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-2.5 text-[13.5px] border-b border-[#eceef2] dark:border-[#2a2b2e] cursor-pointer select-none transition-all",
        isSelected
          ? "bg-[#c2dbff]/75 dark:bg-[#004a77]/45"
          : isUnread
            ? "bg-white dark:bg-[#1e1f20]"
            : "bg-[#f2f6fc]/80 dark:bg-[#17181a] text-[#444746] dark:text-[#c4c7c5]",
        !isSelected &&
          "hover:z-10 hover:bg-white dark:hover:bg-[#282a2c] hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,0.28),0_1px_3px_1px_rgba(60,64,67,0.12)] dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
      )}
    >
      {/* Unread subtle dot indicator */}
      {isUnread && !isSelected && (
        <span
          aria-hidden="true"
          className="absolute left-1.5 top-[18px] size-1.5 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa]"
        />
      )}

      {/* Selection & Star Controls */}
      <div
        className="flex items-center gap-2.5 shrink-0 pt-0.5 pl-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          size="sm"
          checked={isSelected}
          onCheckedChange={handleSelectToggle}
        />
        <button
          type="button"
          onClick={handleToggleStar}
          title={starred ? "Starred" : "Not starred"}
          aria-label={starred ? "Starred" : "Not starred"}
          className="p-1 -m-1 rounded-full text-[#747775] hover:text-[#1f1f1f] dark:text-[#8e918f] dark:hover:text-[#e3e3e3] transition-colors focus:outline-none cursor-pointer"
        >
          <Star
            className={cn(
              "size-4 transition-colors",
              starred
                ? "text-[#f4b400] fill-[#f4b400]"
                : "text-[#9aa0a6] hover:text-[#444746] dark:text-[#8e918f] dark:hover:text-[#e3e3e3]",
            )}
            strokeWidth={starred ? 0 : 1.75}
          />
        </button>
      </div>

      {/* Sender / Recipient Name */}
      <div
        className={cn(
          "w-40 md:w-52 shrink-0 truncate pt-0.5",
          isUnread
            ? "font-semibold text-[#1f1f1f] dark:text-[#f1f3f4]"
            : "font-normal text-[#444746] dark:text-[#c4c7c5]",
        )}
      >
        {displaySender}
      </div>

      {/* Middle Column: Label Badge + Subject + Snippet and Attachment Chips */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="truncate flex items-center">
          {labelBadge && (
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#e8eaed] dark:bg-[#303134] text-[#444746] dark:text-[#c4c7c5] text-[11px] font-medium mr-2 select-none">
              {labelBadge}
            </span>
          )}
          <span
            className={cn(
              "truncate",
              isUnread
                ? "font-semibold text-[#1f1f1f] dark:text-[#f1f3f4]"
                : "font-normal text-[#1f1f1f] dark:text-[#e3e3e3]",
            )}
          >
            {displaySubject}
          </span>
          {(mail.snippet || mail.body) && (
            <>
              <span className="text-[#747775] dark:text-[#8e918f] mx-1.5 shrink-0">
                –
              </span>
              <span className="text-[#5e5e5e] dark:text-[#9aa0a6] font-normal truncate">
                {mail.snippet || mail.body}
              </span>
            </>
          )}
        </div>

        {/* Attachment Chips */}
        {hasAttachments && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pb-0.5">
            {mail.attachments.map((att) => (
              <div
                key={att.id}
                onClick={(e) => {
                  if (att.secureUrl) {
                    e.stopPropagation();
                    window.open(att.secureUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                title={att.originalFilename}
                className="inline-flex items-center gap-1.5 h-6 max-w-45 px-2.5 py-0.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] bg-[#f8fafd] dark:bg-[#282a2c] hover:bg-[#edf2fa] dark:hover:bg-[#333639] transition-colors cursor-pointer shrink-0"
              >
                {getAttachmentBadge(att)}
                <span className="truncate text-[11.5px] text-[#444746] dark:text-[#e3e3e3] font-medium">
                  {att.originalFilename}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Date normally, Quick Hover Actions on desktop hover */}
      <div className="shrink-0 ml-auto pl-3 flex items-center justify-end min-w-[72px]">
        <span
          className={cn(
            "text-right text-xs whitespace-nowrap pt-0.5 md:group-hover:hidden",
            isUnread
              ? "font-semibold text-[#1f1f1f] dark:text-[#e3e3e3]"
              : "font-normal text-[#5e5e5e] dark:text-[#9aa0a6]",
          )}
        >
          {formatMailDate(mail.sentAt)}
        </span>

        <div
          className="hidden md:group-hover:flex items-center gap-0.5 -my-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Archive"
            aria-label="Archive"
            onClick={(e) => handleQuickState(e, { isArchived: true })}
            className="p-1.5 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Archive className="size-4" />
          </button>
          <button
            type="button"
            title="Delete"
            aria-label="Delete"
            onClick={(e) => handleQuickState(e, { isTrashed: true })}
            className="p-1.5 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#d93025] dark:hover:text-[#f28b82] hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            type="button"
            title={isUnread ? "Mark as read" : "Mark as unread"}
            aria-label={isUnread ? "Mark as read" : "Mark as unread"}
            onClick={(e) => handleQuickState(e, { isRead: isUnread })}
            className="p-1.5 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isUnread ? (
              <MailOpen className="size-4" />
            ) : (
              <MailUnreadIcon className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MailLayout;
