import { create } from "zustand";
import type {
  DriveViewSection,
  DriveFolderItem,
  DriveFileItem,
  DriveBreadcrumb,
  DriveUploadItem,
  StorageUsageResult,
} from "../types/drive.types";

export interface DriveState {
  currentSection: DriveViewSection;
  currentFolderId: string | null;
  currentFolder: DriveFolderItem | null;
  breadcrumbs: DriveBreadcrumb[];
  viewMode: "list" | "grid";
  sortBy: "name" | "updatedAt" | "size" | "createdAt";
  sortOrder: "asc" | "desc";
  selectedItemIds: string[];
  lastSelectedId: string | null;
  searchQuery: string;
  searchFilters: {
    type?: string;
    owner?: string;
    modified?: string;
  };
  isDetailsPanelOpen: boolean;
  activeDetailsTab: "details" | "activity";
  previewFile: DriveFileItem | null;
  previewFolderFiles: DriveFileItem[];
  previewLinkToken: string | null;
  activeUploads: DriveUploadItem[];
  isUploadManagerCollapsed: boolean;
  storageUsage: StorageUsageResult | null;

  // Actions
  setCurrentSection: (section: DriveViewSection) => void;
  setCurrentFolderId: (folderId: string | null) => void;
  setCurrentFolder: (folder: DriveFolderItem | null, breadcrumbs?: DriveBreadcrumb[]) => void;
  setViewMode: (mode: "list" | "grid") => void;
  setSort: (
    sortBy: "name" | "updatedAt" | "size" | "createdAt",
    sortOrder?: "asc" | "desc",
  ) => void;
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: { type?: string; owner?: string; modified?: string }) => void;
  toggleSelectItem: (
    id: string,
    isMulti?: boolean,
    isRange?: boolean,
    allItemIds?: string[],
  ) => void;
  selectAllItems: (allItemIds: string[]) => void;
  clearSelection: () => void;
  toggleDetailsPanel: (force?: boolean) => void;
  setActiveDetailsTab: (tab: "details" | "activity") => void;
  setPreviewFile: (
    file: DriveFileItem | null,
    folderFiles?: DriveFileItem[],
    linkToken?: string | null,
  ) => void;
  navigatePreview: (direction: "prev" | "next") => void;
  addUpload: (upload: DriveUploadItem) => void;
  updateUploadProgress: (
    id: string,
    progress: number,
    status?: DriveUploadItem["status"],
    error?: string,
  ) => void;
  removeUpload: (id: string) => void;
  clearCompletedUploads: () => void;
  toggleUploadManager: (collapsed?: boolean) => void;
  setStorageUsage: (usage: StorageUsageResult) => void;
}

const getInitialViewMode = (): "list" | "grid" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("orvexa_drive_view_mode");
    if (saved === "list" || saved === "grid") return saved;
  }
  return "list";
};

export const useDriveStore = create<DriveState>((set, get) => ({
  currentSection: "my-drive",
  currentFolderId: null,
  currentFolder: null,
  breadcrumbs: [],
  viewMode: getInitialViewMode(),
  sortBy: "name",
  sortOrder: "asc",
  selectedItemIds: [],
  lastSelectedId: null,
  searchQuery: "",
  searchFilters: {},
  isDetailsPanelOpen: false,
  activeDetailsTab: "details",
  previewFile: null,
  previewFolderFiles: [],
  previewLinkToken: null,
  activeUploads: [],
  isUploadManagerCollapsed: false,
  storageUsage: null,

  setCurrentSection: (section) =>
    set({
      currentSection: section,
      currentFolderId: null,
      currentFolder: null,
      breadcrumbs: [],
      selectedItemIds: [],
      lastSelectedId: null,
    }),

  setCurrentFolderId: (folderId) =>
    set({
      currentFolderId: folderId,
      selectedItemIds: [],
      lastSelectedId: null,
    }),

  setCurrentFolder: (folder, breadcrumbs = []) =>
    set({
      currentFolder: folder,
      breadcrumbs,
    }),

  setViewMode: (mode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orvexa_drive_view_mode", mode);
    }
    set({ viewMode: mode });
  },

  setSort: (sortBy, sortOrder) =>
    set((state) => ({
      sortBy,
      sortOrder: sortOrder || (state.sortBy === sortBy && state.sortOrder === "asc" ? "desc" : "asc"),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchFilters: (filters) => set({ searchFilters: filters }),

  toggleSelectItem: (id, isMulti = false, isRange = false, allItemIds = []) =>
    set((state) => {
      if (isRange && state.lastSelectedId && allItemIds.length > 0) {
        const lastIdx = allItemIds.indexOf(state.lastSelectedId);
        const currIdx = allItemIds.indexOf(id);
        if (lastIdx !== -1 && currIdx !== -1) {
          const start = Math.min(lastIdx, currIdx);
          const end = Math.max(lastIdx, currIdx);
          const rangeIds = allItemIds.slice(start, end + 1);
          const unionSet = new Set([...state.selectedItemIds, ...rangeIds]);
          return { selectedItemIds: Array.from(unionSet), lastSelectedId: id };
        }
      }

      if (isMulti) {
        const exists = state.selectedItemIds.includes(id);
        const updated = exists
          ? state.selectedItemIds.filter((itemId) => itemId !== id)
          : [...state.selectedItemIds, id];
        return {
          selectedItemIds: updated,
          lastSelectedId: exists ? state.lastSelectedId : id,
        };
      }

      // Single select: replaces selection or deselects if clicking same item
      if (state.selectedItemIds.length === 1 && state.selectedItemIds[0] === id) {
        return { selectedItemIds: [], lastSelectedId: null };
      }
      return { selectedItemIds: [id], lastSelectedId: id };
    }),

  selectAllItems: (allItemIds) =>
    set({ selectedItemIds: [...allItemIds] }),

  clearSelection: () =>
    set({ selectedItemIds: [], lastSelectedId: null }),

  toggleDetailsPanel: (force) =>
    set((state) => ({
      isDetailsPanelOpen: force !== undefined ? force : !state.isDetailsPanelOpen,
    })),

  setActiveDetailsTab: (tab) =>
    set({ activeDetailsTab: tab }),

  setPreviewFile: (file, folderFiles = [], linkToken = null) =>
    set({
      previewFile: file,
      previewFolderFiles: folderFiles.length > 0 ? folderFiles : file ? [file] : [],
      previewLinkToken: file ? linkToken ?? null : null,
    }),

  navigatePreview: (direction) => {
    const { previewFile, previewFolderFiles } = get();
    if (!previewFile || previewFolderFiles.length <= 1) return;
    const currentIndex = previewFolderFiles.findIndex((f) => f.id === previewFile.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = previewFolderFiles.length - 1;
    if (nextIndex >= previewFolderFiles.length) nextIndex = 0;

    set({ previewFile: previewFolderFiles[nextIndex] });
  },

  addUpload: (upload) =>
    set((state) => ({
      activeUploads: [upload, ...state.activeUploads],
      isUploadManagerCollapsed: false,
    })),

  updateUploadProgress: (id, progress, status, error) =>
    set((state) => ({
      activeUploads: state.activeUploads.map((u) =>
        u.id === id
          ? {
              ...u,
              progress,
              ...(status ? { status } : {}),
              ...(error !== undefined ? { error } : {}),
            }
          : u,
      ),
    })),

  removeUpload: (id) =>
    set((state) => ({
      activeUploads: state.activeUploads.filter((u) => u.id !== id),
    })),

  clearCompletedUploads: () =>
    set((state) => ({
      activeUploads: state.activeUploads.filter(
        (u) => u.status !== "completed" && u.status !== "cancelled",
      ),
    })),

  toggleUploadManager: (collapsed) =>
    set((state) => ({
      isUploadManagerCollapsed:
        collapsed !== undefined ? collapsed : !state.isUploadManagerCollapsed,
    })),

  setStorageUsage: (usage) =>
    set({ storageUsage: usage }),
}));
