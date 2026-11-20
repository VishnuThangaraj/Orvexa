import { create } from "zustand";
import type { FormattedInboxMessage } from "../types";

export interface MailStoreState {
  page: number;
  limit: number;
  selectedIds: string[];

  // Thread viewing state
  activeThreadId: string | null;
  activeMessageId: string | null;
  openedFromCategory: string;
  currentCategoryList: FormattedInboxMessage[];
  currentMessageIndex: number;
  totalCategoryCount: number;

  // Pagination Actions
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setLimit: (limit: number) => void;

  // Selection Actions
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;

  // Thread Actions
  openThread: (
    message: FormattedInboxMessage,
    list?: FormattedInboxMessage[],
    index?: number,
    totalCount?: number,
    category?: string,
  ) => void;
  closeThread: () => void;
  navigateThread: (direction: "prev" | "next") => void;
  setCurrentList: (list: FormattedInboxMessage[], totalCount?: number) => void;
  optimisticUpdateMessage: (
    messageId: string,
    updates: Partial<FormattedInboxMessage>,
  ) => void;
}

export const useMailStore = create<MailStoreState>((set, get) => ({
  page: 1,
  limit: 20,
  selectedIds: [],

  activeThreadId: null,
  activeMessageId: null,
  openedFromCategory: "inbox",
  currentCategoryList: [],
  currentMessageIndex: 0,
  totalCategoryCount: 0,

  setPage: (page: number) => set({ page, selectedIds: [] }),
  nextPage: () => set((state) => ({ page: state.page + 1, selectedIds: [] })),
  prevPage: () =>
    set((state) => ({ page: Math.max(1, state.page - 1), selectedIds: [] })),
  setLimit: (limit: number) => set({ limit, page: 1, selectedIds: [] }),

  toggleSelect: (id: string) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((item) => item !== id)
        : [...state.selectedIds, id],
    })),

  selectAll: (ids: string[]) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  setSelectedIds: (ids: string[]) => set({ selectedIds: ids }),

  openThread: (
    message: FormattedInboxMessage,
    list?: FormattedInboxMessage[],
    index?: number,
    totalCount?: number,
    category?: string,
  ) => {
    const activeList = list ?? get().currentCategoryList;
    const computedIndex =
      index !== undefined
        ? index
        : activeList.findIndex((m) => m.id === message.id);

    set({
      activeThreadId: message.threadId || message.id,
      activeMessageId: message.id,
      currentCategoryList: activeList,
      currentMessageIndex: Math.max(0, computedIndex),
      totalCategoryCount: totalCount ?? activeList.length,
      openedFromCategory: category ?? get().openedFromCategory,
    });
  },

  closeThread: () =>
    set({
      activeThreadId: null,
      activeMessageId: null,
      selectedIds: [],
    }),

  navigateThread: (direction: "prev" | "next") => {
    const { currentCategoryList, currentMessageIndex } = get();
    if (!currentCategoryList || currentCategoryList.length === 0) return;

    const newIndex =
      direction === "prev"
        ? Math.max(0, currentMessageIndex - 1)
        : Math.min(currentCategoryList.length - 1, currentMessageIndex + 1);

    if (newIndex === currentMessageIndex) return;

    const targetMessage = currentCategoryList[newIndex];
    if (targetMessage) {
      set({
        currentMessageIndex: newIndex,
        activeMessageId: targetMessage.id,
        activeThreadId: targetMessage.threadId || targetMessage.id,
      });
    }
  },

  setCurrentList: (list: FormattedInboxMessage[], totalCount?: number) =>
    set({
      currentCategoryList: list,
      totalCategoryCount: totalCount ?? list.length,
    }),

  optimisticUpdateMessage: (
    messageId: string,
    updates: Partial<FormattedInboxMessage>,
  ) => {
    set((state) => ({
      currentCategoryList: state.currentCategoryList.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m,
      ),
    }));
  },
}));

export default useMailStore;
