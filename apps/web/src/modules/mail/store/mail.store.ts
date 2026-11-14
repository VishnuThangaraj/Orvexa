import { create } from "zustand";

export interface MailStoreState {
  page: number;
  limit: number;
  selectedIds: string[];

  // Actions
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setLimit: (limit: number) => void;

  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;
}

export const useMailStore = create<MailStoreState>((set) => ({
  page: 1,
  limit: 20,
  selectedIds: [],

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
}));

export default useMailStore;
