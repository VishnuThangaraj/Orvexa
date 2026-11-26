import React from "react";
import { ChevronsUpDown, Printer, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MailThreadHeaderProps {
  className?: string;
  subject: string;
  labels?: Array<{ id: string; name: string; color?: string | null }>;
  showInboxBadge?: boolean;
  onRemoveInboxLabel?: () => void;
  messageCount?: number;
  allExpanded?: boolean;
  onToggleAllExpanded?: () => void;
  onPrint?: () => void;
  onOpenInNewWindow?: () => void;
}

export const MailThreadHeader: React.FC<MailThreadHeaderProps> = ({
  className,
  subject,
  labels = [],
  showInboxBadge = true,
  onRemoveInboxLabel,
  messageCount = 1,
  allExpanded = false,
  onToggleAllExpanded,
  onPrint,
  onOpenInNewWindow,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleOpenInNewWindow = () => {
    if (onOpenInNewWindow) {
      onOpenInNewWindow();
    } else {
      const url = window.location.href;
      window.open(url, "_blank", "width=900,height=750,noopener,noreferrer");
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 pt-5 pb-3.5 bg-white dark:bg-[#1e1f20] select-none gap-4 shrink-0",
        className,
      )}
    >
      {/* Subject and Category/Label badges */}
      <div className="flex items-center flex-wrap gap-2 min-w-0 flex-1">
        <h1 className="text-[22px] font-normal tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
          {subject || "(no subject)"}
        </h1>

        {/* Inbox badge with 'x' close button */}
        {showInboxBadge && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#e8eaed] dark:bg-[#303134] text-[#444746] dark:text-[#c4c7c5] text-xs font-medium select-none ml-1">
            <span>Inbox</span>
            <button
              type="button"
              onClick={onRemoveInboxLabel}
              title="Remove label 'Inbox'"
              aria-label="Remove label Inbox"
              className="hover:text-[#1f1f1f] dark:hover:text-white rounded-full p-0.5 -mr-0.5 cursor-pointer transition-colors"
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </span>
        )}

        {/* Custom Labels */}
        {labels.map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center px-2 py-0.5 rounded bg-[#e8f0fe] dark:bg-[#004a77]/60 text-[#0b57d0] dark:text-[#c2e7ff] text-xs font-medium"
          >
            {l.name}
          </span>
        ))}
      </div>

      {/* Right actions: Expand all (if thread > 1), Print all, In new window */}
      <div className="flex items-center gap-1 shrink-0 text-[#444746] dark:text-[#c4c7c5]">
        {messageCount > 1 && (
          <button
            type="button"
            onClick={onToggleAllExpanded}
            title={allExpanded ? "Collapse all" : "Expand all"}
            aria-label={allExpanded ? "Collapse all" : "Expand all"}
            className="p-2 rounded-full hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <ChevronsUpDown className="size-4" />
          </button>
        )}

        {/* Print icon */}
        <button
          type="button"
          onClick={handlePrint}
          title="Print all"
          aria-label="Print all"
          className="p-2 rounded-full hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
        >
          <Printer className="size-4" />
        </button>

        {/* In new window icon */}
        <button
          type="button"
          onClick={handleOpenInNewWindow}
          title="In new window"
          aria-label="In new window"
          className="p-2 rounded-full hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
        >
          <ExternalLink className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default MailThreadHeader;
