import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Hash,
  Users,
  User,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { HomeChatData } from "../types/home.types";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  data?: HomeChatData;
  isLoading?: boolean;
  error?: string | null;
  size?: "full" | "half" | string;
  onResize?: (size: "full" | "half") => void;
  onRetry?: () => void;
}

function formatChatTime(isoString?: string): string {
  if (!isoString) return "";
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

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  data,
  isLoading = false,
  error = null,
  size = "half",
  onResize,
  onRetry,
}) => {
  const navigate = useNavigate();

  const conversations = data?.conversations || [];
  const unreadTotal = data?.unreadTotal ?? 0;

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/chat?new=true")}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
    >
      <Plus size={13} />
      <span>New Chat</span>
    </button>
  );

  return (
    <WidgetCard
      title="Chat"
      icon={MessageSquare}
      iconColor="text-[#0f9d58]"
      iconBg="bg-emerald-50 dark:bg-emerald-950/40"
      badge={unreadTotal > 0 ? `${unreadTotal} unread` : undefined}
      badgeColor="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40"
      openTo="/chat"
      openLabel="Open Chat"
      headerActions={headerActions}
      size={size}
      onResize={onResize}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      isEmpty={conversations.length === 0}
      emptyTitle="No conversations yet"
      emptyMessage="Connect with teammates and collaborate in direct chats or spaces."
      emptyIcon={MessageCircle}
      emptyAction={
        <button
          type="button"
          onClick={() => navigate("/chat?new=true")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={13} />
          <span>Start a new chat</span>
        </button>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-4">
        {/* Conversations list */}
        <div className="space-y-1">
          {conversations.slice(0, 5).map((conv) => (
            <div
              key={conv.id}
              onClick={() => navigate(`/chat?conversationId=${conv.id}`)}
              className={cn(
                "p-2.5 rounded-2xl flex items-center justify-between gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group",
                conv.unreadCount > 0 && "bg-emerald-50/50 dark:bg-emerald-950/20 font-medium"
              )}
            >
              {/* Left: Avatar / Type Icon + Presence + Name + Last Message */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-2xs",
                      conv.type === "CHANNEL"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        : conv.type === "GROUP"
                        ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                    )}
                  >
                    {conv.type === "CHANNEL" ? (
                      <Hash size={15} />
                    ) : conv.type === "GROUP" ? (
                      <Users size={15} />
                    ) : (
                      conv.name.charAt(0) || <User size={14} />
                    )}
                  </div>

                  {/* Presence dot for Direct Chats */}
                  {conv.type === "DIRECT" && (
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900",
                        conv.presenceStatus === "ACTIVE"
                          ? "bg-[#0f9d58]"
                          : conv.presenceStatus === "AWAY"
                          ? "bg-[#f9ab00]"
                          : "bg-slate-300 dark:bg-slate-600"
                      )}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs truncate",
                        conv.unreadCount > 0
                          ? "font-bold text-slate-900 dark:text-slate-100"
                          : "font-medium text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {conv.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatChatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                    {conv.lastMessage ? (
                      <>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                          {conv.lastMessage.senderName}:
                        </span>
                        <span className="truncate opacity-80">{conv.lastMessage.content}</span>
                      </>
                    ) : (
                      <span className="italic text-slate-400">No messages yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Unread Badge or Arrow */}
              <div className="flex items-center gap-1.5 shrink-0">
                {conv.unreadCount > 0 ? (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {conv.unreadCount}
                  </span>
                ) : (
                  <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Link */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="text-[11px]">
            {conversations.length} active spaces & chats
          </span>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Go to conversations
          </button>
        </div>
      </div>
    </WidgetCard>
  );
};

export default ChatWidget;
