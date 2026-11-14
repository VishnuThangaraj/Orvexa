import React, { useState } from "react";
import { Star, Image, FileText, Paperclip } from "lucide-react";
import type { FormattedInboxAttachment, FormattedInboxMessage } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { cn } from "@/lib/utils";

export interface MailLayoutProps {
  mail: FormattedInboxMessage;
  onClick?: (mail: FormattedInboxMessage) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const GMAIL_MONTHS = [
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

const formatGmailDate = (timestamp: string | Date | number): string => {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const month = GMAIL_MONTHS[d.getMonth()];
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
  const user = useAuthStore((state) => state.user);
  const [internalSelected, setInternalSelected] = useState(false);
  const [starred, setStarred] = useState(mail.isStarred);

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

  const isSenderMe = Boolean(user && mail.sender?.id === user.id.toString());
  const displaySender =
    isSenderMe && mail.recipients && mail.recipients.length > 0
      ? `To: ${mail.recipients[0]?.user.fullName || mail.recipients[0]?.user.username}`
      : mail.sender?.fullName || mail.sender?.username || "Unknown";

  return (
    <div
      onClick={() => onClick?.(mail)}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-2.5 text-sm border-b border-slate-200/80 dark:border-slate-800/80 cursor-pointer select-none transition-colors",
        isSelected
          ? "bg-[#c2e7ff]/50 dark:bg-blue-950/30"
          : isUnread
            ? "bg-white dark:bg-slate-900"
            : "bg-[#f2f6fc]/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400",
        "hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-xs",
      )}
    >
      {/* Selection & Star Controls */}
      <div
        className="flex items-center gap-2.5 shrink-0 pt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          size="sm"
          checked={isSelected}
          onCheckedChange={handleSelectToggle}
        />
        <button
          type="button"
          onClick={() => setStarred((prev) => !prev)}
          aria-label={starred ? "Starred" : "Not starred"}
          className="p-1 -m-1 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
        >
          <Star
            className={cn(
              "size-4.5 transition-colors",
              starred
                ? "text-[#1a73e8] fill-[#1a73e8]"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
            )}
            strokeWidth={starred ? 0 : 1.75}
          />
        </button>
      </div>

      {/* Sender / Recipient Name */}
      <div
        className={cn(
          "w-44 md:w-52 shrink-0 truncate pt-0.5",
          isUnread
            ? "font-bold text-slate-900 dark:text-white"
            : "font-normal text-slate-700 dark:text-slate-300",
        )}
      >
        {displaySender}
      </div>

      {/* Middle Column: Label Badge + Subject + Snippet and Attachment Chips */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="truncate text-sm flex items-center">
          {labelBadge && (
            <span className="shrink-0 px-2 py-0.5 rounded text-xs bg-[#dddddd]/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium mr-1.5 select-none">
              {labelBadge}
            </span>
          )}
          <span
            className={cn(
              "truncate",
              isUnread
                ? "font-bold text-slate-900 dark:text-white"
                : "font-normal text-slate-800 dark:text-slate-200",
            )}
          >
            {displaySubject}
          </span>
          <span className="text-slate-400 dark:text-slate-500 mx-1.5 shrink-0">-</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal truncate">
            {mail.snippet || mail.body}
          </span>
        </div>

        {/* Attachment Chips */}
        {hasAttachments && (
          <div className="flex flex-wrap items-center gap-2 mt-1.5 pb-0.5">
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
                className="inline-flex items-center gap-1.5 h-6 max-w-45 px-2.5 py-0.5 rounded-full border border-slate-300/90 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                {getAttachmentBadge(att)}
                <span className="truncate text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {att.originalFilename}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
      <div
        className={cn(
          "shrink-0 ml-auto pl-4 text-right text-xs whitespace-nowrap pt-1",
          isUnread
            ? "font-bold text-slate-900 dark:text-white"
            : "font-medium text-slate-500 dark:text-slate-400",
        )}
      >
        {formatGmailDate(mail.sentAt)}
      </div>
    </div>
  );
};

export default MailLayout;
