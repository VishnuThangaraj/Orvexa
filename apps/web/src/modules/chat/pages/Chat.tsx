import React, { useState } from "react";
import ChatNavigationSidebar from "../components/ChatNavigationSidebar";
import ConversationListPane from "../components/ConversationListPane";
import ConversationThreadPane from "../components/ConversationThreadPane";
import NewChatModal from "../components/NewChatModal";
import GroupInfoDrawer from "../components/GroupInfoDrawer";
import { useChatSync } from "../hooks/use-chat-sync";

export const Chat: React.FC = () => {
  // Initialize real-time chat socket synchronization
  useChatSync();

  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f6f8fc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 relative">
      {/* 3-Pane Responsive Layout matching Screenshots 1, 2, 3 */}
      {!isFullscreen && (
        <>
          {/* Pane 1: Left Navigation Sidebar */}
          <ChatNavigationSidebar />

          {/* Pane 2: Middle Conversation List Feed */}
          <ConversationListPane />
        </>
      )}

      {/* Pane 3: Main Active Conversation Thread Viewport */}
      <ConversationThreadPane
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* New Chat / Space Modal */}
      <NewChatModal />

      {/* Group / Space Info Slide-over Drawer */}
      <GroupInfoDrawer />
    </div>
  );
};

export default Chat;
