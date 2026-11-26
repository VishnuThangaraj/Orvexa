import React, { useState } from "react";
import {
  ArrowLeft,
  Archive,
  OctagonAlert,
  Trash2,
  Mail,
  Clock,
  SquareCheck,
  FolderInput,
  Tag,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMailStore } from "../../store/mail.store";
import { mailApi } from "../../api/mail.api";
import { mailKeys } from "../../hooks/use-mail.inbox";
import { cn } from "@/lib/utils";

export interface MailThreadToolbarProps {
  className?: string;
  onBack?: () => void;
  messageId?: string;
}

export const MailThreadToolbar: React.FC<MailThreadToolbarProps> = ({
  className,
  onBack,
  messageId,
}) => {
  const queryClient = useQueryClient();
  const {
    activeMessageId,
    closeThread,
    currentMessageIndex,
    currentCategoryList,
    totalCategoryCount,
    navigateThread,
  } = useMailStore();

  const [activeMenu, setActiveMenu] = useState<
    "more" | "labels" | "move" | "snooze" | null
  >(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const targetMsgId = messageId || activeMessageId;

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      closeThread();
    }
  };

  const handleArchive = async () => {
    if (!targetMsgId) return;
    try {
      await mailApi.updateMessageState(targetMsgId, { isArchived: true });
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
      showToast("Conversation archived");
      handleBack();
    } catch (err) {
      console.error("Failed to archive conversation:", err);
    }
  };

  const handleReportSpam = async () => {
    if (!targetMsgId) return;
    try {
      await mailApi.updateMessageState(targetMsgId, { isTrashed: true });
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
      showToast("Marked as spam");
      handleBack();
    } catch (err) {
      console.error("Failed to report spam:", err);
    }
  };

  const handleDelete = async () => {
    if (!targetMsgId) return;
    try {
      await mailApi.updateMessageState(targetMsgId, { isTrashed: true });
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
      showToast("Conversation moved to Trash");
      handleBack();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleMarkUnread = async () => {
    if (!targetMsgId) return;
    try {
      await mailApi.updateMessageState(targetMsgId, { isRead: false });
      queryClient.invalidateQueries({ queryKey: mailKeys.all });
      showToast("Conversation marked as unread");
      handleBack();
    } catch (err) {
      console.error("Failed to mark unread:", err);
    }
  };

  const handleSnooze = async (hours: number) => {
    setActiveMenu(null);
    showToast(`Snoozed for ${hours} hours`);
  };

  const handleAddToTasks = () => {
    showToast("Added to Orvexa Tasks");
  };

  // Pagination bounds
  const total = totalCategoryCount || currentCategoryList.length || 1;
  const current1Based = Math.min(currentMessageIndex + 1, total);
  const hasPrev = currentMessageIndex > 0;
  const hasNext = currentMessageIndex < currentCategoryList.length - 1;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between px-4 bg-white dark:bg-[#1e1f20] border-b border-[#eceef2] dark:border-[#303134] text-sm select-none shrink-0 h-12 z-20 transition-colors",
        className,
      )}
    >
      {/* Toast Feedback Notification Banner */}
      {feedbackToast && (
        <div className="absolute bottom-[-44px] left-6 z-50 px-4 py-2 bg-[#303134] dark:bg-[#e3e3e3] text-white dark:text-[#1f1f1f] text-xs font-medium rounded-xl shadow-lg flex items-center gap-3 transition-opacity duration-200">
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Left Action Buttons */}
      <div className="flex items-center gap-0.5">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          title="Back to inbox"
          aria-label="Back to inbox"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer mr-1"
        >
          <ArrowLeft className="size-4.5" />
        </button>

        {/* Archive */}
        <button
          type="button"
          onClick={handleArchive}
          title="Archive"
          aria-label="Archive"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
        >
          <Archive className="size-4.5" />
        </button>

        {/* Report Spam */}
        <button
          type="button"
          onClick={handleReportSpam}
          title="Report spam"
          aria-label="Report spam"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
        >
          <OctagonAlert className="size-4.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          title="Delete"
          aria-label="Delete"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#d93025] dark:hover:text-[#f28b82] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
        >
          <Trash2 className="size-4.5" />
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-[#dadce0] dark:bg-[#3c4043] mx-1.5" />

        {/* Mark as Unread */}
        <button
          type="button"
          onClick={handleMarkUnread}
          title="Mark as unread"
          aria-label="Mark as unread"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
        >
          <Mail className="size-4.5" />
        </button>

        {/* Snooze */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setActiveMenu((prev) => (prev === "snooze" ? null : "snooze"))
            }
            title="Snooze"
            aria-label="Snooze"
            className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <Clock className="size-4.5" />
          </button>
          {activeMenu === "snooze" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-[#282a2c] border border-[#e1e3e1] dark:border-[#3c4043] rounded-xl shadow-lg py-1.5 z-30 text-xs text-[#1f1f1f] dark:text-[#e3e3e3]">
              <div className="px-3 py-1 font-semibold text-[#747775] dark:text-[#9aa0a6] uppercase tracking-wider text-[10px]">
                Snooze until...
              </div>
              <button
                type="button"
                onClick={() => handleSnooze(4)}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Later today (4 hours)
              </button>
              <button
                type="button"
                onClick={() => handleSnooze(24)}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Tomorrow morning
              </button>
              <button
                type="button"
                onClick={() => handleSnooze(168)}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Next week
              </button>
            </div>
          )}
        </div>

        {/* Add to Tasks */}
        <button
          type="button"
          onClick={handleAddToTasks}
          title="Add to tasks"
          aria-label="Add to tasks"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
        >
          <SquareCheck className="size-4.5" />
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-[#dadce0] dark:bg-[#3c4043] mx-1.5" />

        {/* Move to */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setActiveMenu((prev) => (prev === "move" ? null : "move"))
            }
            title="Move to"
            aria-label="Move to"
            className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <FolderInput className="size-4.5" />
          </button>
          {activeMenu === "move" && (
            <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-[#282a2c] border border-[#e1e3e1] dark:border-[#3c4043] rounded-xl shadow-lg py-1.5 z-30 text-xs text-[#1f1f1f] dark:text-[#e3e3e3]">
              <div className="px-3 py-1 font-semibold text-[#747775] dark:text-[#9aa0a6] uppercase tracking-wider text-[10px]">
                Move to
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  showToast("Moved to Spam");
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Spam
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  showToast("Moved to Trash");
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Trash
              </button>
            </div>
          )}
        </div>

        {/* Labels */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setActiveMenu((prev) => (prev === "labels" ? null : "labels"))
            }
            title="Labels"
            aria-label="Labels"
            className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <Tag className="size-4.5" />
          </button>
          {activeMenu === "labels" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-[#282a2c] border border-[#e1e3e1] dark:border-[#3c4043] rounded-xl shadow-lg py-1.5 z-30 text-xs text-[#1f1f1f] dark:text-[#e3e3e3]">
              <div className="px-3 py-1 font-semibold text-[#747775] dark:text-[#9aa0a6] uppercase tracking-wider text-[10px]">
                Labels
              </div>
              {["Work", "Personal", "Important", "Receipts"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    showToast(`Label applied: ${label}`);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer flex items-center justify-between"
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* More options menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setActiveMenu((prev) => (prev === "more" ? null : "more"))
            }
            title="More"
            aria-label="More options"
            className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
          >
            <MoreVertical className="size-4.5" />
          </button>
          {activeMenu === "more" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-[#282a2c] border border-[#e1e3e1] dark:border-[#3c4043] rounded-xl shadow-lg py-1.5 z-30 text-xs text-[#1f1f1f] dark:text-[#e3e3e3]">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  handleMarkUnread();
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Mark as unread
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  showToast("Marked as important");
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Mark as important
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  showToast("Filter created");
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Filter messages like these
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  showToast("Conversation muted");
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer"
              >
                Mute
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Range indicator & Navigation Arrows */}
      <div className="flex items-center gap-1 text-xs text-[#444746] dark:text-[#c4c7c5] font-normal tabular-nums">
        <span className="mr-2 tracking-normal">
          {total > 0 ? `${current1Based} of ${total}` : "1 of 1"}
        </span>

        {/* Older / Prev message */}
        <button
          type="button"
          onClick={() => navigateThread("prev")}
          disabled={!hasPrev}
          title="Newer"
          aria-label="Previous message"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Newer / Next message */}
        <button
          type="button"
          onClick={() => navigateThread("next")}
          disabled={!hasNext}
          title="Older"
          aria-label="Next message"
          className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default MailThreadToolbar;
