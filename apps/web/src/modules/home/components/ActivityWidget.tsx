import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Video,
  HardDrive,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { HomeActivityItem } from "../types/home.types";
import { cn } from "@/lib/utils";

interface ActivityWidgetProps {
  data?: HomeActivityItem[];
  isLoading?: boolean;
  error?: string | null;
  size?: "full" | "half" | string;
  onResize?: (size: "full" | "half") => void;
  onRetry?: () => void;
}

export const ActivityWidget: React.FC<ActivityWidgetProps> = ({
  data,
  isLoading = false,
  error = null,
  size = "full",
  onResize,
  onRetry,
}) => {
  const navigate = useNavigate();
  const activities = data || [];

  const renderModuleBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "MAIL":
        return <Mail className="w-2.5 h-2.5 text-[#ea4335]" />;
      case "CHAT":
        return <MessageSquare className="w-2.5 h-2.5 text-[#0f9d58]" />;
      case "CALENDAR":
        return <Calendar className="w-2.5 h-2.5 text-[#1a73e8]" />;
      case "MEET":
        return <Video className="w-2.5 h-2.5 text-[#00897b]" />;
      case "DRIVE":
        return <HardDrive className="w-2.5 h-2.5 text-[#f9ab00]" />;
      default:
        return <Bell className="w-2.5 h-2.5 text-purple-500" />;
    }
  };

  const getActorBadgeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "MAIL":
        return "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300";
      case "CHAT":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
      case "CALENDAR":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";
      case "MEET":
        return "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300";
      case "DRIVE":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
      default:
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300";
    }
  };

  const formatActivityTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return isoString;
    }
  };

  const handleActivityClick = (activity: HomeActivityItem) => {
    if (activity.actionUrl) {
      navigate(activity.actionUrl);
    }
  };

  return (
    <WidgetCard
      id="activity"
      title="Recent Activity"
      icon={Bell}
      iconColor="text-[#1a73e8]"
      iconBg="bg-[#e8f0fe] dark:bg-blue-950/50"
      badge={activities.length > 0 ? `${activities.length} new` : undefined}
      badgeColor="bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-900/40 dark:text-blue-300 font-medium"
      size={size}
      onResize={onResize}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div className="space-y-2">
        {activities.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {activities.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleActivityClick(item)}
                className={cn(
                  "flex items-start gap-3.5 py-3 px-2.5 rounded-2xl transition-all",
                  item.actionUrl
                    ? "hover:bg-slate-50/90 dark:hover:bg-slate-800/40 cursor-pointer group"
                    : ""
                )}
              >
                {/* Actor Avatar / Module Icon */}
                <div className="relative shrink-0 mt-0.5">
                  {item.actor?.avatarUrl ? (
                    <img
                      src={item.actor.avatarUrl}
                      alt={item.actor.fullName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ring-2 ring-white dark:ring-slate-900",
                        getActorBadgeColor(item.type)
                      )}
                    >
                      {item.actor?.fullName
                        ? item.actor.fullName[0].toUpperCase()
                        : "O"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    {renderModuleBadge(item.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1a73e8] dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                      {formatActivityTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {item.actionUrl && (
                  <div className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all text-slate-400 group-hover:text-[#1a73e8] dark:group-hover:text-blue-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-2xl bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-400 flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                No recent activity
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-0.5">
                Notifications and collaboration updates from Mail, Chat, and Drive will stream here in real time.
              </p>
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

export default ActivityWidget;
