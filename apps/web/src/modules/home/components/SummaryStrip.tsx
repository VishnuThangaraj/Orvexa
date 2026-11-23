import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  MessageSquare,
  Calendar,
  Video,
  HardDrive,
  ArrowUpRight,
} from "lucide-react";
import type { HomeSummary } from "../types/home.types";
import { cn } from "@/lib/utils";

interface SummaryStripProps {
  summary?: HomeSummary;
  isLoading?: boolean;
}

function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr || 0);
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  summary,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`summary-skeleton-${i}`}
            className="h-[76px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 animate-pulse p-3.5 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="w-16 h-3 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="w-10 h-5 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const chips = [
    {
      id: "mail",
      label: "Unread Mail",
      value: summary.unreadMailCount,
      hasBadge: summary.unreadMailCount > 0,
      badgeText: "Inbox",
      icon: Mail,
      iconColor: "text-[#ea4335]",
      iconBg: "bg-[#fce8e6] dark:bg-red-950/50",
      accentLine: "bg-[#ea4335]",
      hoverBorder: "hover:border-red-200 dark:hover:border-red-900/60",
      to: "/mail",
    },
    {
      id: "chat",
      label: "Unread Chats",
      value: summary.unreadChatCount,
      hasBadge: summary.unreadChatCount > 0,
      badgeText: "Spaces",
      icon: MessageSquare,
      iconColor: "text-[#0f9d58]",
      iconBg: "bg-[#e6f4ea] dark:bg-emerald-950/50",
      accentLine: "bg-[#0f9d58]",
      hoverBorder: "hover:border-emerald-200 dark:hover:border-emerald-900/60",
      to: "/chat",
    },
    {
      id: "calendar",
      label: "Events Today",
      value: summary.todayEventsCount,
      hasBadge: false,
      icon: Calendar,
      iconColor: "text-[#1a73e8]",
      iconBg: "bg-[#e8f0fe] dark:bg-blue-950/50",
      accentLine: "bg-[#1a73e8]",
      hoverBorder: "hover:border-blue-200 dark:hover:border-blue-900/60",
      to: "/calendar",
    },
    {
      id: "meet",
      label: "Meetings Today",
      value: summary.todayMeetingsCount,
      hasBadge: summary.todayMeetingsCount > 0,
      badgeText: "Live/Upcoming",
      icon: Video,
      iconColor: "text-[#00897b]",
      iconBg: "bg-[#e0f2f1] dark:bg-teal-950/50",
      accentLine: "bg-[#00897b]",
      hoverBorder: "hover:border-teal-200 dark:hover:border-teal-900/60",
      to: "/meet",
    },
    {
      id: "drive",
      label: "Storage Used",
      value: formatBytes(summary.storageUsedBytes),
      subValue: `of ${formatBytes(summary.storageTotalBytes)}`,
      hasBadge: false,
      icon: HardDrive,
      iconColor: "text-[#f9ab00]",
      iconBg: "bg-[#fef7e0] dark:bg-amber-950/50",
      accentLine: "bg-[#f9ab00]",
      hoverBorder: "hover:border-amber-200 dark:hover:border-amber-900/60",
      to: "/drive",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 py-1">
      {chips.map((chip) => {
        const Icon = chip.icon;

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => navigate(chip.to)}
            className={cn(
              "group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 text-left shadow-[0_1px_3px_0_rgba(60,64,67,0.06),0_1px_2px_0_rgba(60,64,67,0.04)] hover:shadow-[0_4px_12px_0_rgba(60,64,67,0.1)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex items-center justify-between gap-3",
              chip.hoverBorder
            )}
          >
            {/* Left side: Icon + Metric info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105",
                  chip.iconBg
                )}
              >
                <Icon size={20} className={chip.iconColor} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate block">
                    {chip.label}
                  </span>
                  {chip.hasBadge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea4335] shrink-0 animate-pulse" />
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                    {chip.value}
                  </span>
                  {chip.subValue && (
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                      {chip.subValue}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Top arrow cue */}
            <div className="shrink-0 self-start mt-0.5">
              <ArrowUpRight
                size={15}
                className="text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
              />
            </div>

            {/* Bottom accent glow on hover */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                chip.accentLine
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default SummaryStrip;
