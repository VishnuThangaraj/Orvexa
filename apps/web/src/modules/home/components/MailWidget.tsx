import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  PenSquare,
  Star,
  Paperclip,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { HomeMailData } from "../types/home.types";
import { cn } from "@/lib/utils";

interface MailWidgetProps {
  data?: HomeMailData;
  isLoading?: boolean;
  error?: string | null;
  size?: "full" | "half" | string;
  onResize?: (size: "full" | "half") => void;
  onRetry?: () => void;
}

function formatMailDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

const AVATAR_COLORS = [
  "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
];

export const MailWidget: React.FC<MailWidgetProps> = ({
  data,
  isLoading = false,
  error = null,
  size = "half",
  onResize,
  onRetry,
}) => {
  const navigate = useNavigate();

  const threads = data?.recentThreads || [];
  const unreadCount = data?.counts.inboxUnread ?? 0;
  const starredCount = data?.counts.starred ?? 0;
  const draftsCount = data?.counts.drafts ?? 0;

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/mail?compose=true")}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#c2e7ff] hover:bg-[#b3dbf7] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
    >
      <PenSquare size={13} />
      <span>Compose</span>
    </button>
  );

  return (
    <WidgetCard
      title="Mail"
      icon={Mail}
      iconColor="text-[#ea4335]"
      iconBg="bg-red-50 dark:bg-red-950/40"
      badge={unreadCount > 0 ? `${unreadCount} unread` : undefined}
      badgeColor="bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200/60 dark:border-red-900/40"
      openTo="/mail"
      openLabel="Open Mail"
      headerActions={headerActions}
      size={size}
      onResize={onResize}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      isEmpty={threads.length === 0}
      emptyTitle="Inbox Zero"
      emptyMessage="You're all caught up! No recent messages in your inbox."
      emptyIcon={CheckCircle2}
      emptyAction={
        <button
          type="button"
          onClick={() => navigate("/mail?compose=true")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-all cursor-pointer"
        >
          <PenSquare size={13} />
          <span>Send an email</span>
        </button>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-4">
        {/* Thread list */}
        <div className="space-y-1">
          {threads.slice(0, 5).map((thread, index) => {
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const senderInitial =
              thread.sender.fullName?.charAt(0) ||
              thread.sender.email?.charAt(0) ||
              "M";

            return (
              <div
                key={thread.id}
                onClick={() => navigate(`/mail?threadId=${thread.threadId}`)}
                className={cn(
                  "p-2.5 rounded-2xl flex items-center justify-between gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group",
                  !thread.isRead
                    ? "bg-slate-50/80 dark:bg-slate-800/40 font-semibold"
                    : "text-slate-600 dark:text-slate-300"
                )}
              >
                {/* Left: Avatar + Sender + Snippet */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-2xs",
                        !thread.isRead
                          ? "bg-red-600 text-white"
                          : avatarColor
                      )}
                    >
                      {senderInitial}
                    </div>
                    {!thread.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs truncate",
                          !thread.isRead
                            ? "font-bold text-slate-900 dark:text-slate-100"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {thread.sender.fullName}
                      </span>
                      {thread.hasAttachments && (
                        <Paperclip size={12} className="text-slate-400 shrink-0" />
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                      <span
                        className={cn(
                          "truncate",
                          !thread.isRead
                            ? "font-semibold text-slate-800 dark:text-slate-200"
                            : "font-normal"
                        )}
                      >
                        {thread.subject}
                      </span>
                      {thread.snippet && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                          <span className="truncate opacity-75 font-normal">
                            {thread.snippet}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Star + Timestamp */}
                <div className="flex items-center gap-2 shrink-0 text-right">
                  {thread.isStarred && (
                    <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {formatMailDate(thread.createdAt)}
                  </span>
                  <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Quick Chips */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/mail/starred")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span>{starredCount} Starred</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/mail/drafts")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
            >
              <span>{draftsCount} Drafts</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/mail")}
            className="text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>
      </div>
    </WidgetCard>
  );
};

export default MailWidget;
