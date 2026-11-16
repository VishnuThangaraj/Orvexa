import { create } from "zustand";
import type { ChatMessage } from "../types/chat.types";

export type ChatShortcut = "HOME" | "MENTIONS" | "STARRED" | "ARCHIVED";

interface ChatState {
  activeConversationId: string | null;
  activeShortcut: ChatShortcut;
  searchQuery: string;
  unreadOnly: boolean;
  isNewChatModalOpen: boolean;
  isBrowseSpacesOpen: boolean;
  isGroupInfoOpen: boolean;
  replyingToMessage: ChatMessage | null;
  activeThreadRootMessage: ChatMessage | null;
  highlightedMessageId: string | null;
  typingUsers: Record<string, string[]>; // conversationId -> array of user display names

  // Actions
  setActiveConversationId: (id: string | null) => void;
  setActiveShortcut: (shortcut: ChatShortcut) => void;
  setSearchQuery: (query: string) => void;
  setUnreadOnly: (unreadOnly: boolean) => void;
  setIsNewChatModalOpen: (open: boolean) => void;
  setIsBrowseSpacesOpen: (open: boolean) => void;
  setIsGroupInfoOpen: (open: boolean) => void;
  setReplyingToMessage: (message: ChatMessage | null) => void;
  setActiveThreadRootMessage: (message: ChatMessage | null) => void;
  setHighlightedMessageId: (id: string | null) => void;
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
  isBrowseSpacesOpen: false,
  isGroupInfoOpen: false,
  replyingToMessage: null,
  activeThreadRootMessage: null,
  highlightedMessageId: null,
  typingUsers: {},

  setActiveConversationId: (id) =>
    set({
      activeConversationId: id,
      replyingToMessage: null,
      activeThreadRootMessage: null,
    }),

  setActiveShortcut: (shortcut) => set({ activeShortcut: shortcut }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setUnreadOnly: (unreadOnly) => set({ unreadOnly }),
  setIsNewChatModalOpen: (isNewChatModalOpen) => set({ isNewChatModalOpen }),
  setIsBrowseSpacesOpen: (isBrowseSpacesOpen) => set({ isBrowseSpacesOpen }),
  setIsGroupInfoOpen: (isGroupInfoOpen) => set({ isGroupInfoOpen }),
  setReplyingToMessage: (message) => set({ replyingToMessage: message }),
  setActiveThreadRootMessage: (activeThreadRootMessage) =>
    set({ activeThreadRootMessage }),
  setHighlightedMessageId: (highlightedMessageId) =>
    set({ highlightedMessageId }),

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
