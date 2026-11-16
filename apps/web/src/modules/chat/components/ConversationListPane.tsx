import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Pin,
  X,
  MessageSquare,
  Users,
  Hash,
  Loader2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useConversations } from "../hooks/use-conversations";
import { chatApi } from "../api/chat.api";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types/chat.types";

type HomeFilterTab = "ALL" | "UNREAD" | "STARRED" | "MENTIONS";
type SearchFilterTab = "ALL" | "MESSAGES" | "PEOPLE" | "SPACES";

export const ConversationListPane: React.FC = () => {
  const {
    activeConversationId,
    setActiveConversationId,
    activeShortcut,
    searchQuery,
    setSearchQuery,
    unreadOnly,
    setUnreadOnly,
    setHighlightedMessageId,
  } = useChatStore();

  const [homeFilter, setHomeFilter] = useState<HomeFilterTab>("ALL");
  const [searchTab, setSearchTab] = useState<SearchFilterTab>("ALL");

  const currentUser = useAuthStore((state) => state.user);
  const onlineUsers = useSocketStore((state) => state.onlineUsers);
  const queryClient = useQueryClient();

  const isSearching = searchQuery.trim().length > 0;

  // Conversations query (used when not in search mode)
  const { data, isLoading } = useConversations({
    hasMentions:
      activeShortcut === "MENTIONS" || homeFilter === "MENTIONS"
        ? true
        : undefined,
  });

  // Task 4.2: Global search query (searches messages, people, spaces)
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["chat-global-search", searchQuery, searchTab],
    queryFn: () => chatApi.searchGlobal(searchQuery, searchTab),
    enabled: isSearching,
    staleTime: 1000 * 15,
  });

  const allConversations = data?.conversations || [];

  // Filter conversations according to active shortcut, home filter tab, and unread toggle
  const filteredConversations = allConversations.filter((conv) => {
    const userParticipant = conv.participants.find(
      (p) => String(p.userId) === String(currentUser?.id),
    );

    if (activeShortcut === "ARCHIVED") {
      return userParticipant?.isArchived;
    }
    if (activeShortcut === "STARRED" || homeFilter === "STARRED") {
      return userParticipant?.isPinned;
    }
    if (activeShortcut === "MENTIONS" || homeFilter === "MENTIONS") {
      return conv.type !== "DIRECT";
    }
    if (userParticipant?.isArchived) {
      return false; // Don't show archived in Home
    }

    if (unreadOnly || homeFilter === "UNREAD") {
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

  // Task 4.2: Direct action handlers for search result clicks
  const handleSelectMessageResult = (message: any) => {
    const convId = String(message.conversationId);
    const msgId = String(message.id);
    setActiveConversationId(convId);
    setHighlightedMessageId(msgId);
    window.history.pushState({}, "", `/chat?c=${convId}&m=${msgId}`);
    setSearchQuery("");
  };

  const handleSelectPersonResult = async (person: any) => {
    try {
      const directConv = await chatApi.createDirectConversation({
        recipientId: String(person.id),
      });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      setActiveConversationId(directConv.id);
      setSearchQuery("");
    } catch (err) {
      console.error("Failed to start direct conversation:", err);
    }
  };

  const handleSelectSpaceResult = async (space: any) => {
    try {
      if (!space.isMember && space.visibility === "PUBLIC") {
        await chatApi.joinPublicSpace(String(space.id));
        queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      }
      setActiveConversationId(String(space.id));
      setSearchQuery("");
    } catch (err) {
      console.error("Failed to navigate to space:", err);
    }
  };

  return (
    <div className="w-full h-full border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
      {/* Header matching Screenshot 1 & 4 */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {isSearching ? "Search" : getTitle()}
        </h1>

        <div className="flex items-center gap-3">
          {/* Unread Switch */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Unread</span>
            <div
              onClick={() => {
                const next = !unreadOnly;
                setUnreadOnly(next);
                setHomeFilter(next ? "UNREAD" : "ALL");
              }}
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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 pb-2">
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
            aria-label="Search chat or people"
            className="w-full pl-9 pr-8 py-2 bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-full text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 focus:border-[#0b57d0]/50 transition-all"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Task 4.3: Home Filter Pills (Shown when NOT searching) */}
      {!isSearching && (
        <div role="tablist" aria-label="Conversation filters" className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(["ALL", "UNREAD", "STARRED", "MENTIONS"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={homeFilter === tab}
              onClick={() => {
                setHomeFilter(tab);
                setUnreadOnly(tab === "UNREAD");
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs cursor-pointer transition-colors whitespace-nowrap",
                homeFilter === tab
                  ? "bg-[#c2e7ff] text-[#001d35] font-semibold dark:bg-[#004a77] dark:text-[#c2e7ff]"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium",
              )}
            >
              {tab === "ALL" && "All"}
              {tab === "UNREAD" && "Unread"}
              {tab === "STARRED" && "Starred"}
              {tab === "MENTIONS" && "Mentions"}
            </button>
          ))}
        </div>
      )}

      {/* Task 4.2: Search Result Type Filter Chips (Shown when searching) */}
      {isSearching && (
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
          {(["ALL", "MESSAGES", "PEOPLE", "SPACES"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSearchTab(tab)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors whitespace-nowrap",
                searchTab === tab
                  ? "bg-[#0b57d0] text-white font-medium"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {tab === "ALL" && "All"}
              {tab === "MESSAGES" && "Messages"}
              {tab === "PEOPLE" && "People"}
              {tab === "SPACES" && "Spaces"}
            </button>
          ))}
        </div>
      )}

      {/* Main Content: Global Search Results OR Standard Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {isSearching ? (
          isSearchLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Loader2 size={18} className="animate-spin text-[#0b57d0]" />
              <span>Searching conversations, people, and spaces...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Messages Result Group */}
              {(searchTab === "ALL" || searchTab === "MESSAGES") &&
                searchResults?.messages &&
                searchResults.messages.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-[#0b57d0]" />
                      <span>Messages ({searchResults.messages.length})</span>
                    </div>
                    {searchResults.messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectMessageResult(msg)}
                        className="px-3 py-2 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/70 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {msg.sender?.fullName || "User"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatTimestamp(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {msg.content}
                        </p>
                        <div className="mt-1 text-[10px] text-[#0b57d0] dark:text-[#a8c7fa] truncate font-medium">
                          in {msg.conversation?.name || "Direct Message"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* People Result Group */}
              {(searchTab === "ALL" || searchTab === "PEOPLE") &&
                searchResults?.people &&
                searchResults.people.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={13} className="text-[#0b57d0]" />
                      <span>People ({searchResults.people.length})</span>
                    </div>
                    {searchResults.people.map((person: any) => (
                      <div
                        key={person.id}
                        onClick={() => handleSelectPersonResult(person)}
                        className="px-3 py-2 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/70 cursor-pointer transition-colors flex items-center gap-2.5"
                      >
                        {person.profileImage?.secureUrl ? (
                          <img
                            src={person.profileImage.secureUrl}
                            alt={person.fullName}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-xs flex items-center justify-center shrink-0">
                            {person.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {person.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            @{person.username} • {person.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Spaces Result Group */}
              {(searchTab === "ALL" || searchTab === "SPACES") &&
                searchResults?.spaces &&
                searchResults.spaces.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Hash size={13} className="text-[#0b57d0]" />
                      <span>Spaces ({searchResults.spaces.length})</span>
                    </div>
                    {searchResults.spaces.map((space: any) => (
                      <div
                        key={space.id}
                        onClick={() => handleSelectSpaceResult(space)}
                        className="px-3 py-2 hover:bg-[#f0f4f9] dark:hover:bg-slate-800/70 cursor-pointer transition-colors flex items-center gap-2.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-xs flex items-center justify-center shrink-0">
                          {space.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {space.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              {space.memberCount} members
                            </span>
                          </div>
                          {space.description && (
                            <p className="text-[11px] text-slate-400 truncate">
                              {space.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* No Search Results */}
              {(!searchResults?.messages?.length &&
                !searchResults?.people?.length &&
                !searchResults?.spaces?.length) && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching messages, people, or spaces found
                </div>
              )}
            </div>
          )
        ) : isLoading ? (
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
                  "px-3.5 py-3 cursor-pointer transition-all flex items-start gap-3 relative select-none pr-4",
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
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
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
                    <span
                      className={cn(
                        "text-[11px] shrink-0 whitespace-nowrap tabular-nums text-right ml-1",
                        isSelected
                          ? "text-[#001d35]/70 dark:text-[#c2e7ff]/80"
                          : "text-slate-400",
                      )}
                    >
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
