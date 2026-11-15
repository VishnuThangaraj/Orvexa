import React from "react";
import { Search, SlidersHorizontal, Pin } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useConversations } from "../hooks/use-conversations";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types/chat.types";

export const ConversationListPane: React.FC = () => {
  const {
    activeConversationId,
    setActiveConversationId,
    activeShortcut,
    searchQuery,
    setSearchQuery,
    unreadOnly,
    setUnreadOnly,
  } = useChatStore();

  const currentUser = useAuthStore((state) => state.user);
  const onlineUsers = useSocketStore((state) => state.onlineUsers);

  const { data, isLoading } = useConversations({
    search: searchQuery || undefined,
  });

  const allConversations = data?.conversations || [];

  // Filter conversations according to active shortcut and unread toggle
  const filteredConversations = allConversations.filter((conv) => {
    const userParticipant = conv.participants.find(
      (p) => String(p.userId) === String(currentUser?.id),
    );

    if (activeShortcut === "ARCHIVED") {
      return userParticipant?.isArchived;
    }
    if (activeShortcut === "STARRED") {
      return userParticipant?.isPinned;
    }
    if (userParticipant?.isArchived) {
      return false; // Don't show archived in Home
    }

    if (unreadOnly) {
      // Check if last message is newer than user lastReadAt
      const lastMsg = conv.messages?.[0];
      if (!lastMsg) return false;
      if (String(lastMsg.senderId) === String(currentUser?.id)) return false;
      if (!userParticipant?.lastReadAt) return true;
      return new Date(lastMsg.createdAt) > new Date(userParticipant.lastReadAt);
    }

    return true;
  });

  const formatTimestamp = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getDisplayDetails = (conv: Conversation) => {
    if (conv.type === "GROUP" || conv.type === "CHANNEL") {
      const initials = conv.name
        ? conv.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "SP";
      return {
        title: conv.name || "Space",
        isGroup: true,
        initials,
        avatarUrl: conv.image?.secureUrl,
        isOnline: false,
      };
    }

    const other = conv.participants.find(
      (p) => String(p.userId) !== String(currentUser?.id),
    )?.user;

    const isOnline = other?.id
      ? Boolean(onlineUsers[String(other.id)])
      : false;

    return {
      title: other?.fullName || "Direct Message",
      isGroup: false,
      initials: other?.fullName?.charAt(0) || "U",
      avatarUrl: other?.profileImage?.secureUrl,
      isOnline,
    };
  };

  const getTitle = () => {
    switch (activeShortcut) {
      case "MENTIONS":
        return "Mentions";
      case "STARRED":
        return "Starred";
      case "ARCHIVED":
        return "Archived";
      case "HOME":
      default:
        return "Home";
    }
  };

  return (
    <div className="w-80 md:w-96 h-full border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
      {/* Header matching Screenshot 1: Title, Unread Toggle, Filter Icon */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {getTitle()}
        </h1>

        <div className="flex items-center gap-3">
          {/* Unread Switch */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Unread</span>
            <div
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={cn(
                "w-9 h-5 rounded-full p-0.5 transition-colors relative",
                unreadOnly ? "bg-[#0b57d0]" : "bg-slate-200 dark:bg-slate-700",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform",
                  unreadOnly ? "translate-x-4" : "translate-x-0",
                )}
              />
            </div>
          </label>

          {/* Filter/Sort Icon */}
          <button
            type="button"
            title="Filter conversations"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3">
        <div className="relative flex items-center">
          <Search
            size={16}
            className="absolute left-3 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat or people..."
            className="w-full pl-9 pr-3 py-2 bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-full text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 focus:border-[#0b57d0]/50 transition-all"
          />
        </div>
      </div>

      {/* Conversation Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const { title, isGroup, initials, avatarUrl, isOnline } =
              getDisplayDetails(conv);
            const isSelected = activeConversationId === conv.id;
            const lastMessage = conv.messages?.[0];
            const timestamp = formatTimestamp(
              lastMessage?.createdAt || conv.lastMessageAt || conv.createdAt,
            );

            const userParticipant = conv.participants.find(
              (p) => String(p.userId) === String(currentUser?.id),
            );
            const isPinned = userParticipant?.isPinned;

            // Check if unread
            const isUnread =
              lastMessage &&
              String(lastMessage.senderId) !== String(currentUser?.id) &&
              (!userParticipant?.lastReadAt ||
                new Date(lastMessage.createdAt) >
                  new Date(userParticipant.lastReadAt));

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  "p-3 cursor-pointer transition-all flex items-start gap-3 relative select-none",
                  isSelected
                    ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900",
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  {isGroup ? (
                    <div className="w-10 h-10 rounded-full bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center font-bold text-xs uppercase">
                      {initials}
                    </div>
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={title}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                      {initials}
                    </div>
                  )}

                  {!isGroup && isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#137333] ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {isPinned && (
                        <Pin
                          size={13}
                          className="text-[#0b57d0] fill-[#0b57d0] shrink-0 transform rotate-45"
                        />
                      )}
                      <h4
                        className={cn(
                          "truncate text-sm font-semibold",
                          isSelected
                            ? "text-[#001d35] dark:text-[#c2e7ff] font-bold"
                            : isUnread
                              ? "text-slate-900 dark:text-slate-50 font-bold"
                              : "text-slate-800 dark:text-slate-200",
                        )}
                      >
                        {title}
                      </h4>
                    </div>
                    <span className={cn(
                      "text-[11px] shrink-0",
                      isSelected ? "text-[#001d35]/70 dark:text-[#c2e7ff]/80" : "text-slate-400"
                    )}>
                      {timestamp}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-xs truncate flex-1",
                        isSelected
                          ? "text-[#001d35]/90 dark:text-[#c2e7ff]/90"
                          : isUnread
                            ? "text-slate-900 dark:text-slate-100 font-semibold"
                            : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {lastMessage ? (
                        lastMessage.deletedAt ? (
                          <span className="italic opacity-60">
                            This message was deleted
                          </span>
                        ) : (
                          lastMessage.content
                        )
                      ) : (
                        <span className="italic opacity-60">
                          No messages yet
                        </span>
                      )}
                    </p>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#0b57d0] shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationListPane;
