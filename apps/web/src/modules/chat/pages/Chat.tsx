import React, { useState, useEffect } from "react";
import ChatNavigationSidebar from "../components/ChatNavigationSidebar";
import ConversationListPane from "../components/ConversationListPane";
import ConversationThreadPane from "../components/ConversationThreadPane";
import NewChatModal from "../components/NewChatModal";
import BrowseSpacesModal from "../components/BrowseSpacesModal";
import GroupInfoDrawer from "../components/GroupInfoDrawer";
import { useChatSync } from "../hooks/use-chat-sync";
import { useChatStore } from "../store/chat.store";
import { useConversations } from "../hooks/use-conversations";
import { cn } from "@/lib/utils";

export const Chat: React.FC = () => {
  // Initialize real-time chat socket synchronization
  useChatSync();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    activeConversationId,
    setActiveConversationId,
    isBrowseSpacesOpen,
    setIsBrowseSpacesOpen,
    isNewChatModalOpen,
    setIsNewChatModalOpen,
    isGroupInfoOpen,
    setIsGroupInfoOpen,
  } = useChatStore();

  const { data } = useConversations();
  const conversations = data?.conversations || [];

  // Keyboard navigation shortcuts: Escape and ArrowUp / ArrowDown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      if (e.key === "Escape") {
        if (isGroupInfoOpen) {
          setIsGroupInfoOpen(false);
          return;
        }
        if (isBrowseSpacesOpen) {
          setIsBrowseSpacesOpen(false);
          return;
        }
        if (isNewChatModalOpen) {
          setIsNewChatModalOpen(false);
          return;
        }
        if (activeConversationId) {
          setActiveConversationId(null);
          return;
        }
      }

      if (isInput) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!conversations.length) return;
        e.preventDefault();
        const currentIndex = conversations.findIndex(
          (c) => c.id === activeConversationId,
        );

        if (e.key === "ArrowDown") {
          const nextIndex =
            currentIndex < conversations.length - 1 ? currentIndex + 1 : 0;
          setActiveConversationId(conversations[nextIndex].id);
        } else {
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : conversations.length - 1;
          setActiveConversationId(conversations[prevIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isGroupInfoOpen,
    isBrowseSpacesOpen,
    isNewChatModalOpen,
    activeConversationId,
    conversations,
    setIsGroupInfoOpen,
    setIsBrowseSpacesOpen,
    setIsNewChatModalOpen,
    setActiveConversationId,
  ]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f6f8fc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 relative chat-no-scrollbar no-scrollbar">
      {/* 3-Pane Responsive Layout matching Screenshots 1, 2, 3 */}
      {!isFullscreen && (
        <>
          {/* Pane 1: Left Navigation Sidebar */}
          <div
            className={cn(
              "h-full shrink-0",
              activeConversationId ? "hidden lg:flex" : "hidden md:flex",
            )}
          >
            <ChatNavigationSidebar />
          </div>

          {/* Pane 2: Middle Conversation List Feed */}
          <div
            className={cn(
              "h-full shrink-0 md:w-80 lg:w-84",
              activeConversationId ? "hidden md:flex" : "flex w-full",
            )}
          >
            <ConversationListPane />
          </div>
        </>
      )}

      {/* Pane 3: Main Active Conversation Thread Viewport */}
      <div
        className={cn(
          "flex-1 h-full min-w-0",
          !activeConversationId ? "hidden md:flex" : "flex",
        )}
      >
        <ConversationThreadPane
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      </div>

      {/* New Chat / Space Modal */}
      <NewChatModal />

      {/* Browse Public Spaces Modal */}
      <BrowseSpacesModal
        isOpen={isBrowseSpacesOpen}
        onClose={() => setIsBrowseSpacesOpen(false)}
      />

      {/* Group / Space Info Slide-over Drawer */}
      <GroupInfoDrawer />
    </div>
  );
};

export default Chat;
