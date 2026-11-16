import React from "react";
import {
  ArrowLeft,
  Info,
  Maximize2,
  Minimize2,
  X,
  Star,
  Bell,
  BellOff,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { chatApi } from "../api/chat.api";
import { CHAT_QUERY_KEYS } from "../hooks/use-conversations";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types/chat.types";

interface ThreadHeaderProps {
  conversation: Conversation;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({
  conversation,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { setActiveConversationId, setIsGroupInfoOpen } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);
  const { onlineUsers, presenceStatuses } = useSocketStore();
  const queryClient = useQueryClient();

  const isGroup =
    conversation.type === "GROUP" || conversation.type === "CHANNEL";

  const other = conversation.participants.find(
    (p) => String(p.userId) !== String(currentUser?.id),
  )?.user;

  const isOnline = other?.id ? Boolean(onlineUsers[String(other.id)]) : false;
  const otherPresence = other?.id
    ? presenceStatuses[String(other.id)] || (isOnline ? "ACTIVE" : "OFFLINE")
    : "OFFLINE";

  const title = isGroup
    ? conversation.name || "Space"
    : other?.fullName || "Direct Message";

  const subtitle = isGroup
    ? `${conversation.participants.length} Members`
    : otherPresence === "ACTIVE"
      ? "Active now"
      : otherPresence === "AWAY"
        ? "Away"
        : otherPresence === "DND"
          ? "Do not disturb"
          : "Offline";

  const initials = isGroup
    ? conversation.name
        ? conversation.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "SP"
    : other?.fullName?.charAt(0) || "U";

  const myParticipant = conversation.participants.find(
    (p) => String(p.userId) === String(currentUser?.id),
  );
  const isStarred = Boolean(myParticipant?.isPinned);
  const isMuted = Boolean(myParticipant?.isMuted);

  // Task 5.3: Star / Pin conversation
  const handleToggleStar = async () => {
    try {
      await chatApi.updateParticipantSettings(conversation.id, {
        isPinned: !isStarred,
      });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversation.id),
      });
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  // Task 5.3: Notification settings / Mute toggle
  const handleToggleMute = async () => {
    try {
      await chatApi.updateParticipantSettings(conversation.id, {
        isMuted: !isMuted,
      });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversation.id),
      });
    } catch (err) {
      console.error("Failed to toggle notification mute:", err);
    }
  };

  return (
    <div className="h-16 px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 select-none relative">
      {/* Left: Avatar & Details */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile back button to conversation list */}
        <button
          type="button"
          onClick={() => setActiveConversationId(null)}
          className="md:hidden p-1.5 -ml-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Back to conversation list"
          aria-label="Back to conversation list"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="relative shrink-0">
          {isGroup ? (
            <div className="w-10 h-10 rounded-lg bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
          ) : other?.profileImage?.secureUrl ? (
            <img
              src={other.profileImage.secureUrl}
              alt={title}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm uppercase">
              {initials}
            </div>
          )}

          {/* Presence Indicator Dot matching Google Chat */}
          {!isGroup && (
            <span
              className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900",
                otherPresence === "ACTIVE" && "bg-[#137333]",
                otherPresence === "AWAY" && "bg-[#ea8600]",
                otherPresence === "DND" && "bg-[#d93025]",
                otherPresence === "OFFLINE" && "bg-slate-300 dark:bg-slate-600",
              )}
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {title}
            </h2>

            {/* Star Conversation Button */}
            <button
              type="button"
              onClick={handleToggleStar}
              title={isStarred ? "Unstar conversation" : "Star conversation"}
              aria-label={isStarred ? "Unstar conversation" : "Star conversation"}
              className="text-slate-400 hover:text-amber-500 cursor-pointer transition-colors p-0.5 rounded"
            >
              <Star
                size={15}
                className={cn(
                  isStarred && "fill-amber-400 text-amber-500 stroke-[1.5]",
                )}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Task 5.3: Notification Mute Toggle Button */}
        <button
          type="button"
          onClick={handleToggleMute}
          title={isMuted ? "Unmute conversation notifications" : "Mute conversation notifications"}
          aria-label={isMuted ? "Unmute conversation notifications" : "Mute conversation notifications"}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            isMuted
              ? "text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
        </button>

        {/* Group Info Button (if Space/Group) */}
        {isGroup && (
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            aria-label="View group info"
            className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info size={14} />
            <span>Group Info</span>
          </button>
        )}

        {/* Fullscreen / Expand Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Expand"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Expand"}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveConversationId(null)}
          title="Close conversation"
          aria-label="Close conversation"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ThreadHeader;
