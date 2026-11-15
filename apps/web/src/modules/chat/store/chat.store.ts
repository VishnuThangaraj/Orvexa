import { create } from "zustand";
import type { ChatMessage } from "../types/chat.types";

export type ChatShortcut = "HOME" | "MENTIONS" | "STARRED" | "ARCHIVED";

interface ChatState {
  activeConversationId: string | null;
  activeShortcut: ChatShortcut;
  searchQuery: string;
  unreadOnly: boolean;
  isNewChatModalOpen: boolean;
  isGroupInfoOpen: boolean;
  replyingToMessage: ChatMessage | null;
  typingUsers: Record<string, string[]>; // conversationId -> array of user display names

  // Actions
  setActiveConversationId: (id: string | null) => void;
  setActiveShortcut: (shortcut: ChatShortcut) => void;
  setSearchQuery: (query: string) => void;
  setUnreadOnly: (unreadOnly: boolean) => void;
  setIsNewChatModalOpen: (open: boolean) => void;
  setIsGroupInfoOpen: (open: boolean) => void;
  setReplyingToMessage: (message: ChatMessage | null) => void;
  setUserTyping: (
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean,
  ) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  activeShortcut: "HOME",
  searchQuery: "",
  unreadOnly: false,
  isNewChatModalOpen: false,
  isGroupInfoOpen: false,
  replyingToMessage: null,
  typingUsers: {},

  setActiveConversationId: (id) =>
    set({
      activeConversationId: id,
      replyingToMessage: null,
    }),

  setActiveShortcut: (shortcut) => set({ activeShortcut: shortcut }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setUnreadOnly: (unreadOnly) => set({ unreadOnly }),
  setIsNewChatModalOpen: (isNewChatModalOpen) => set({ isNewChatModalOpen }),
  setIsGroupInfoOpen: (isGroupInfoOpen) => set({ isGroupInfoOpen }),
  setReplyingToMessage: (message) => set({ replyingToMessage: message }),

  setUserTyping: (conversationId, _userId, userName, isTyping) =>
    set((state) => {
      const currentList = state.typingUsers[conversationId] || [];
      const updatedList = isTyping
        ? currentList.includes(userName)
          ? currentList
          : [...currentList, userName]
        : currentList.filter((name) => name !== userName);

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updatedList,
        },
      };
    }),
}));

export default useChatStore;
