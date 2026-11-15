import React, { useState } from "react";
import {
  Plus,
  Home,
  AtSign,
  Star,
  Archive,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useSocketStore } from "../store/socket.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useConversations } from "../hooks/use-conversations";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types/chat.types";

export const ChatNavigationSidebar: React.FC = () => {
  const {
    activeConversationId,
    setActiveConversationId,
    activeShortcut,
    setActiveShortcut,
    setIsNewChatModalOpen,
  } = useChatStore();

  const currentUser = useAuthStore((state) => state.user);
  const onlineUsers = useSocketStore((state) => state.onlineUsers);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
  const [isSpacesOpen, setIsSpacesOpen] = useState(true);
  const [showAllDms, setShowAllDms] = useState(false);

  const { data } = useConversations();
  const conversations = data?.conversations || [];

  // Extract direct conversations
  const directConversations = conversations.filter((c) => c.type === "DIRECT");

  // Extract spaces/groups/channels
  const spaceConversations = conversations.filter(
    (c) => c.type === "GROUP" || c.type === "CHANNEL",
  );

  // Helper to extract other participant in direct chat
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(
      (p) => String(p.userId) !== String(currentUser?.id),
    )?.user;
  };

  const visibleDms = showAllDms
    ? directConversations
    : directConversations.slice(0, 8);

  const handleSelectDm = (conv: Conversation) => {
    setActiveConversationId(conv.id);
  };

  const handleSelectSpace = (conv: Conversation) => {
    setActiveConversationId(conv.id);
  };

  return (
    <div className="w-64 h-full border-r border-slate-200/80 dark:border-slate-800 bg-[#f6f8fc] dark:bg-slate-950 flex flex-col shrink-0 select-none">
      {/* Top "+ New chat" Button matching Material 3 / Mail page */}
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => setIsNewChatModalOpen(true)}
          className="w-full py-2.5 px-4 rounded-full bg-[#c2e7ff] hover:bg-[#b3dbf7] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] flex items-center justify-center gap-2 text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus size={18} className="text-[#001d35] dark:text-[#c2e7ff] stroke-[2.5]" />
          <span>New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs font-medium">
        {/* SECTION 1: SHORTCUTS */}
        <div>
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              {isShortcutsOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              SHORTCUTS
            </span>
          </button>

          {isShortcutsOpen && (
            <div className="mt-1 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveShortcut("HOME");
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                  activeShortcut === "HOME"
                    ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                    : "text-[#202124] dark:text-slate-300 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                )}
              >
                <Home size={17} className="shrink-0" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveShortcut("MENTIONS")}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                  activeShortcut === "MENTIONS"
                    ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                    : "text-[#202124] dark:text-slate-300 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                )}
              >
                <AtSign size={17} className="shrink-0" />
                <span>Mentions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveShortcut("STARRED")}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                  activeShortcut === "STARRED"
                    ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                    : "text-[#202124] dark:text-slate-300 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                )}
              >
                <Star size={17} className="shrink-0" />
                <span>Starred</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveShortcut("ARCHIVED")}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                  activeShortcut === "ARCHIVED"
                    ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                    : "text-[#202124] dark:text-slate-300 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                )}
              >
                <Archive size={17} className="shrink-0" />
                <span>Archived</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: DIRECT MESSAGES */}
        <div>
          <div className="w-full flex items-center justify-between px-2 py-1 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <button
              type="button"
              onClick={() => setIsDmsOpen(!isDmsOpen)}
              className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {isDmsOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <span>DIRECT MESSAGES</span>
              <span className="text-slate-400 font-normal">
                {directConversations.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              title="New direct message"
              className="hover:text-[#0b57d0] dark:hover:text-[#c2e7ff]"
            >
              <Plus size={14} />
            </button>
          </div>

          {isDmsOpen && (
            <div className="mt-1 space-y-0.5">
              {visibleDms.map((conv) => {
                const other = getOtherParticipant(conv);
                const isOnline = other?.id
                  ? Boolean(onlineUsers[String(other.id)])
                  : false;
                const isSelected = activeConversationId === conv.id;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectDm(conv)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm transition-colors text-left",
                      isSelected
                        ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                        : "text-[#202124] dark:text-slate-300 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                    )}
                  >
                    {/* Avatar with online dot */}
                    <div className="relative shrink-0">
                      {other?.profileImage?.secureUrl ? (
                        <img
                          src={other.profileImage.secureUrl}
                          alt={other.fullName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                          {other?.fullName?.charAt(0) || "U"}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#137333] ring-2 ring-white dark:ring-slate-950" />
                      )}
                    </div>

                    <span className="truncate flex-1">
                      {other?.fullName || "Direct Message"}
                    </span>
                  </button>
                );
              })}

              {directConversations.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllDms(!showAllDms)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  {showAllDms
                    ? "Show less"
                    : `Show all (${directConversations.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: SPACES */}
        <div>
          <div className="w-full flex items-center justify-between px-2 py-1 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <button
              type="button"
              onClick={() => setIsSpacesOpen(!isSpacesOpen)}
              className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {isSpacesOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <span>SPACES</span>
              <span className="text-slate-400 font-normal">
                {spaceConversations.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              title="Create space"
              className="hover:text-[#0b57d0] dark:hover:text-[#c2e7ff]"
            >
              <Plus size={14} />
            </button>
          </div>

          {isSpacesOpen && (
            <div className="mt-1 space-y-0.5">
              {spaceConversations.map((space) => {
                const isSelected = activeConversationId === space.id;
                const initials = space.name
                  ? space.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "SP";

                return (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => handleSelectSpace(space)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm transition-colors text-left",
                      isSelected
                        ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                        : "text-[#202124] dark:text-slate-300 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center font-bold text-xs shrink-0">
                      {initials}
                    </div>
                    <span className="truncate flex-1 font-medium">
                      {space.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatNavigationSidebar;
