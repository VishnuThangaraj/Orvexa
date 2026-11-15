import React from "react";
import { Info, Maximize2, Minimize2, X } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
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
  const onlineUsers = useSocketStore((state) => state.onlineUsers);

  const isGroup =
    conversation.type === "GROUP" || conversation.type === "CHANNEL";

  const other = conversation.participants.find(
    (p) => String(p.userId) !== String(currentUser?.id),
  )?.user;

  const isOnline = other?.id ? Boolean(onlineUsers[String(other.id)]) : false;

  const title = isGroup
    ? conversation.name || "Space"
    : other?.fullName || "Direct Message";

  const subtitle = isGroup
    ? `${conversation.participants.length} Members`
    : other?.role === "ADMIN"
      ? "Administrator"
      : isOnline
        ? "Online"
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

  return (
    <div className="h-16 px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 select-none">
      {/* Left: Avatar & Details matching Screenshots 2 & 3 */}
      <div className="flex items-center gap-3 min-w-0">
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

          {!isGroup && isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#137333] ring-2 ring-white dark:ring-slate-900" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions matching Screenshots 2 & 3 */}
      <div className="flex items-center gap-2">
        {/* Select Button */}
        <button
          type="button"
          className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
        >
          Select
        </button>

        {/* Group Info Button (if Space/Group) */}
        {isGroup && (
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
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
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveConversationId(null)}
          title="Close conversation"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ThreadHeader;
