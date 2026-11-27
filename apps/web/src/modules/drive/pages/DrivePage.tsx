import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FolderUp, HardDrive, Inbox } from "lucide-react";
import { DriveSidebar } from "../components/DriveSidebar";
import { DriveToolbar } from "../components/DriveToolbar";
import { DriveBreadcrumbs } from "../components/DriveBreadcrumbs";
import { DriveFileList } from "../components/DriveFileList";
import { DriveFileGrid } from "../components/DriveFileGrid";
import { DriveDetailsPanel } from "../components/DriveDetailsPanel";
import { DriveContextMenu } from "../components/DriveContextMenu";
import { DrivePreviewModal } from "../components/DrivePreviewModal";
import { DriveUploadManager } from "../components/DriveUploadManager";
import { DriveNewFolderDialog } from "../components/DriveNewFolderDialog";
import { DriveRenameDialog } from "../components/DriveRenameDialog";
import { DriveMoveDialog } from "../components/DriveMoveDialog";
import { DriveShareDialog } from "../components/DriveShareDialog";
import { DriveVersionHistoryDialog } from "../components/DriveVersionHistoryDialog";
import { useDriveStore } from "../store/drive.store";
import { driveApi } from "../api/drive.api";
import type { DriveItem, DriveFileItem } from "../types/drive.types";

export const DrivePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: folderParamId } = useParams<{ id?: string }>();

  const {
    currentSection,
    setCurrentSection,
    currentFolderId,
    setCurrentFolderId,
    setCurrentFolder,
    viewMode,
    sortBy,
    sortOrder,
    selectedItemIds,
    searchQuery,
    searchFilters,
    setPreviewFile,
    addUpload,
    updateUploadProgress,
    clearSelection,
    setStorageUsage,
  } = useDriveStore();

  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dialog & Menu states
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [moveTargetItems, setMoveTargetItems] = useState<
    Array<{ id: string; type: "file" | "folder" }> | null
  >(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: DriveItem;
  } | null>(null);
  const [shareTargetItem, setShareTargetItem] = useState<DriveItem | null>(null);
  const [versionHistoryTarget, setVersionHistoryTarget] = useState<DriveFileItem | null>(null);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync URL route with Drive section/folder state
  useEffect(() => {
    const path = location.pathname;
    if (path === "/drive/shared") {
      setCurrentSection("shared");
    } else if (path === "/drive/recent") {
      setCurrentSection("recent");
    } else if (path === "/drive/starred") {
      setCurrentSection("starred");
    } else if (path === "/drive/trash") {
      setCurrentSection("trash");
    } else if (folderParamId) {
      setCurrentSection("my-drive");
      setCurrentFolderId(folderParamId);
    } else {
      setCurrentSection("my-drive");
      if (currentFolderId && !path.startsWith("/drive/folders")) {
        setCurrentFolderId(null);
      }
    }
  }, [location.pathname, folderParamId, setCurrentSection, setCurrentFolderId]);

  // Load items from API
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const isSearchActive =
        Boolean(debouncedSearchQuery.trim()) ||
        Boolean(searchFilters.type) ||
        Boolean(searchFilters.modified) ||
        Boolean(searchFilters.owner);

      if (isSearchActive) {
        const res = await driveApi.searchItems({
          q: debouncedSearchQuery.trim() || undefined,
          type: searchFilters.type || undefined,
          modified: searchFilters.modified || undefined,
          owner: searchFilters.owner || undefined,
        });
        const combined: DriveItem[] = [
          ...res.folders.map((f) => ({ ...f, type: "folder" as const })),
          ...res.files.map((f) => ({ ...f, type: "file" as const })),
        ];
        setItems(combined);
        setCurrentFolder(null, [
          {
            id: "search",
            name: debouncedSearchQuery.trim()
              ? `Search results for "${debouncedSearchQuery.trim()}"`
              : "Search results",
          },
        ]);
      } else if (currentSection === "shared") {
        const res = await driveApi.getSharedWithMe();
        const combined: DriveItem[] = [
          ...res.folders.map((f) => ({ ...f, type: "folder" as const })),
          ...res.files.map((f) => ({ ...f, type: "file" as const })),
        ];
        setItems(combined);
        setCurrentFolder(null, [{ id: "shared", name: "Shared with me" }]);
      } else if (currentSection === "recent") {
        const recentFiles = await driveApi.getRecent(100);
        const combined: DriveItem[] = recentFiles.map((f) => ({
          ...f,
          type: "file" as const,
        }));
        setItems(combined);
        setCurrentFolder(null, [{ id: "recent", name: "Recent" }]);
      } else if (currentSection === "starred") {
        const res = await driveApi.getStarred();
        const combined: DriveItem[] = [
          ...res.folders.map((f) => ({ ...f, type: "folder" as const })),
          ...res.files.map((f) => ({ ...f, type: "file" as const })),
        ];
        setItems(combined);
        setCurrentFolder(null, [{ id: "starred", name: "Starred" }]);
      } else if (currentSection === "trash") {
        const res = await driveApi.getItems({
          isTrash: true,
          sortBy,
          sortOrder,
          limit: 200,
        });
        const combined: DriveItem[] = [
          ...res.folders.map((f) => ({ ...f, type: "folder" as const })),
          ...res.files.map((f) => ({ ...f, type: "file" as const })),
        ];
        setItems(combined);
        setCurrentFolder(null, [{ id: "trash", name: "Trash" }]);
      } else {
        const res = await driveApi.getItems({
          folderId: currentFolderId,
          sortBy,
          sortOrder,
          limit: 200,
        });

        const combined: DriveItem[] = [
          ...res.folders.map((f) => ({ ...f, type: "folder" as const })),
          ...res.files.map((f) => ({ ...f, type: "file" as const })),
        ];

        setItems(combined);
        setCurrentFolder(res.currentFolder, res.breadcrumbs);
      }

      // Refresh storage quota
      driveApi.getStorageUsage().then(setStorageUsage).catch(() => {});
    } catch (err) {
      console.error("Failed to load drive items:", err);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchQuery,
    searchFilters,
    currentSection,
    currentFolderId,
    sortBy,
    sortOrder,
    setCurrentFolder,
    setStorageUsage,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle preview query param from share links or external links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const previewId = params.get("preview");
    const linkToken = params.get("token") || undefined;
    if (previewId) {
      driveApi
        .getFile(previewId, linkToken)
        .then((file) => {
          setPreviewFile(file, [file], linkToken ?? null);
        })
        .catch(console.error);
    }
  }, [location.search, setPreviewFile]);

  // Global keyboard shortcuts (e.g. '/' focuses search bar)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.getElementById(
          "drive-search-input",
        ) as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  // Items are already filtered/queried by the API per section or search parameters
  const filteredItems = useMemo(() => {
    return items;
  }, [items]);

  const handleEmptyTrash = async () => {
    if (
      !window.confirm(
        "Empty trash? All items in the trash will be permanently deleted. This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await driveApi.emptyTrash();
      fetchItems();
    } catch (err) {
      console.error("Failed to empty trash:", err);
    }
  };

  // File & Folder upload execution
  const handleUploadFiles = async (
    filesToUpload: FileList | File[],
    relativePaths?: string[],
  ) => {
    const fileArray = Array.from(filesToUpload);
    if (fileArray.length === 0) return;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadId = `upload_${Date.now()}_${i}`;
      const relPath = relativePaths ? relativePaths[i] : undefined;

      addUpload({
        id: uploadId,
        file,
        filename: file.name,
        size: file.size,
        progress: 0,
        status: "pending",
        relativePath: relPath,
      });

      try {
        updateUploadProgress(uploadId, 20, "uploading");

        // Small files (<= 3.5MB): standard multipart upload (fits within Vercel's 4.5MB payload limit)
        const DIRECT_UPLOAD_LIMIT = 3.5 * 1024 * 1024;
        if (file.size <= DIRECT_UPLOAD_LIMIT) {
          await driveApi.uploadFiles(
            [file],
            currentFolderId,
            relPath ? [relPath] : undefined,
            (pct) => updateUploadProgress(uploadId, pct, "uploading"),
          );
        } else {
          // Larger files (> 3.5MB): chunked / resumable upload with 3MB chunks
          const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB
          const session = await driveApi.initUploadSession({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            totalBytes: file.size,
            folderId: currentFolderId,
            chunkSize: CHUNK_SIZE,
          });

          const totalChunks = session.totalChunks;
          for (let c = 0; c < totalChunks; c++) {
            const start = c * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunkBlob = file.slice(start, end);

            await driveApi.uploadChunk(
              session.sessionId,
              c,
              chunkBlob,
              (chunkPct) => {
                const overallPct = Math.round(
                  ((c + chunkPct / 100) / totalChunks) * 100,
                );
                updateUploadProgress(uploadId, overallPct, "uploading");
              },
            );
          }

          await driveApi.completeUploadSession(session.sessionId);
        }

        updateUploadProgress(uploadId, 100, "completed");
      } catch (err: any) {
        console.error("Upload failed for file:", file.name, err);
        const errMsg =
          err.response?.data?.message || err.message || "Upload failed";
        updateUploadProgress(uploadId, 0, "error", errMsg);
      }
    }

    // Refresh directory contents
    fetchItems();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Item actions
  const handleOpenItem = (item: DriveItem) => {
    if (item.type === "folder") {
      navigate(`/drive/folders/${item.id}`);
      setCurrentFolderId(item.id);
    } else {
      const folderFiles = filteredItems.filter((i) => i.type === "file") as any[];
      setPreviewFile(item as any, folderFiles);
    }
  };

  const handleDownloadItem = async (item: DriveItem) => {
    if (item.type === "file") {
      try {
        await driveApi.downloadFile(item.id, item.name);
      } catch (err: unknown) {
        console.error("Failed to download file:", err);
        alert(err instanceof Error ? err.message : "Failed to download file");
      }
    } else {
      try {
        await driveApi.downloadZip([{ id: item.id, type: "folder" }]);
      } catch (err: unknown) {
        console.error("Failed to download folder as ZIP:", err);
        alert(err instanceof Error ? err.message : "Failed to download folder as ZIP");
      }
    }
  };

  const handleToggleStarItem = async (item: DriveItem) => {
    try {
      const res = await driveApi.toggleStar({
        id: item.id,
        type: item.type,
        isStarred: !item.isStarred,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isStarred: res.isStarred } : i)),
      );
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const handleDeleteItem = async (item: DriveItem) => {
    try {
      if (item.type === "folder") {
        await driveApi.deleteFolder(item.id);
      } else {
        await driveApi.deleteFile(item.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      clearSelection();
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleRestoreItem = async (item: DriveItem) => {
    try {
      if (item.type === "folder") {
        await driveApi.restoreFolder(item.id);
      } else {
        await driveApi.restoreFile(item.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      clearSelection();
    } catch (err) {
      console.error("Failed to restore item:", err);
    }
  };

  const handlePermanentDeleteItem = async (item: DriveItem) => {
    if (
      !confirm(
        `Are you sure you want to delete "${item.name}" forever? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      if (item.type === "folder") {
        await driveApi.permanentDeleteFolder(item.id);
      } else {
        await driveApi.permanentDeleteFile(item.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      clearSelection();
    } catch (err) {
      console.error("Failed to permanently delete item:", err);
    }
  };

  const handleCopyItem = async (item: DriveItem) => {
    if (item.type !== "file") return;
    try {
      const copy = await driveApi.copyItem({ fileId: item.id });
      setItems((prev) => [...prev, { ...copy, type: "file" as const }]);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to copy file");
    }
  };

  const handleCreateShortcut = async (item: DriveItem) => {
    try {
      const res = await driveApi.createShortcut({
        fileId: item.type === "file" ? item.id : undefined,
        folderId: item.type === "folder" ? item.id : undefined,
      });
      alert(`Shortcut "${res.name}" added to My Drive!`);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to create shortcut");
    }
  };

  // Bulk actions from toolbar
  const handleDownloadSelected = async () => {
    const selected = items.filter((i) => selectedItemIds.includes(i.id));
    if (selected.length === 0) return;

    if (selected.length === 1 && selected[0].type === "file") {
      handleDownloadItem(selected[0]);
    } else {
      try {
        await driveApi.downloadZip(
          selected.map((i) => ({ id: i.id, type: i.type })),
        );
      } catch (err) {
        console.error("Failed to download selected as ZIP:", err);
      }
    }
  };

  const handleDeleteSelected = async () => {
    const selected = items.filter((i) => selectedItemIds.includes(i.id));
    for (const item of selected) {
      await handleDeleteItem(item);
    }
  };

  const handleStarSelected = async () => {
    const selected = items.filter((i) => selectedItemIds.includes(i.id));
    for (const item of selected) {
      await handleToggleStarItem(item);
    }
  };

  const activeSelectedItem =
    selectedItemIds.length === 1
      ? items.find((i) => i.id === selectedItemIds[0]) || null
      : null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-full w-full bg-[#f8fafd] dark:bg-slate-950 overflow-hidden"
    >
      {/* Full-window Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-[#1a73e8]/20 dark:bg-[#1a73e8]/30 backdrop-blur-xs border-4 border-dashed border-[#1a73e8] flex flex-col items-center justify-center pointer-events-none select-none animate-in fade-in duration-100">
          <div className="w-20 h-20 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-xl mb-4 animate-bounce">
            <FolderUp size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Drop files to upload
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
            Files will be stored securely in this folder.
          </p>
        </div>
      )}

      {/* Left Sidebar */}
      <DriveSidebar
        onOpenNewFolderDialog={() => setIsNewFolderOpen(true)}
        onFilesSelected={handleUploadFiles}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-900">
        {/* Top Search & Action Toolbar */}
        <DriveToolbar
          onDownloadSelected={handleDownloadSelected}
          onMoveSelected={() => {
            const selected = items.filter((i) => selectedItemIds.includes(i.id));
            setMoveTargetItems(selected.map((i) => ({ id: i.id, type: i.type })));
          }}
          onDeleteSelected={handleDeleteSelected}
          onStarSelected={handleStarSelected}
          onShareSelected={() => {
            if (activeSelectedItem) setShareTargetItem(activeSelectedItem);
          }}
        />

        {/* Breadcrumb Navigation Header */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <DriveBreadcrumbs
            onOpenNewFolderDialog={() => setIsNewFolderOpen(true)}
            onOpenRenameDialog={(f) => setRenameTarget({ ...f, type: "folder" })}
          />
        </div>

        {/* Trash Reminder & Empty Trash Banner */}
        {currentSection === "trash" && (
          <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <span>Items in trash are deleted forever after 30 days.</span>
            <button
              type="button"
              onClick={handleEmptyTrash}
              disabled={items.length === 0}
              className="px-3 py-1 font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Empty trash
            </button>
          </div>
        )}

        {/* File and Folder View Container */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a73e8]" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8 select-none">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  {currentSection === "trash" ? (
                    <Inbox size={36} className="text-slate-400 stroke-1" />
                  ) : (
                    <HardDrive size={36} className="text-slate-400 stroke-1" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {currentSection === "trash"
                    ? "Trash is empty"
                    : currentSection === "starred"
                    ? "No starred items"
                    : currentSection === "recent"
                    ? "No recent files"
                    : "This folder is empty"}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  {currentSection === "trash"
                    ? "Items moved to trash will appear here."
                    : currentSection === "starred"
                    ? "Add stars to files and folders to easily find them later."
                    : "Drag and drop files here, or use the '+ New' button to get started."}
                </p>
              </div>
            ) : viewMode === "list" ? (
              <DriveFileList
                items={filteredItems}
                onOpenItem={handleOpenItem}
                onContextMenu={(e, item) => {
                  setContextMenu({ x: e.clientX, y: e.clientY, item });
                }}
                onToggleStar={handleToggleStarItem}
                onOpenRenameDialog={(item) =>
                  setRenameTarget({ id: item.id, name: item.name, type: item.type })
                }
                onDeleteItem={handleDeleteItem}
              />
            ) : (
              <DriveFileGrid
                items={filteredItems}
                onOpenItem={handleOpenItem}
                onContextMenu={(e, item) => {
                  setContextMenu({ x: e.clientX, y: e.clientY, item });
                }}
                onToggleStar={handleToggleStarItem}
                onOpenRenameDialog={(item) =>
                  setRenameTarget({ id: item.id, name: item.name, type: item.type })
                }
                onDeleteItem={handleDeleteItem}
              />
            )}
          </div>

          {/* Right Sliding Details / Activity Panel */}
          <DriveDetailsPanel
            selectedItem={activeSelectedItem}
            onOpenShare={() => {
              if (activeSelectedItem) setShareTargetItem(activeSelectedItem);
            }}
            onItemUpdated={(updated) => {
              setItems((prev) =>
                prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)),
              );
            }}
          />
        </div>
      </div>

      {/* Floating Bottom-Right Upload Manager */}
      <DriveUploadManager />

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <DriveContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onOpenItem={handleOpenItem}
          onDownloadItem={handleDownloadItem}
          onRenameItem={(item) =>
            setRenameTarget({ id: item.id, name: item.name, type: item.type })
          }
          onCopyItem={handleCopyItem}
          onMoveItem={(item) =>
            setMoveTargetItems([{ id: item.id, type: item.type }])
          }
          onToggleStarItem={handleToggleStarItem}
          onDeleteItem={handleDeleteItem}
          onRestoreItem={handleRestoreItem}
          onPermanentDeleteItem={handlePermanentDeleteItem}
          onShareItem={(item) => setShareTargetItem(item)}
          onAddShortcut={handleCreateShortcut}
          onManageVersions={(item) => setVersionHistoryTarget(item)}
        />
      )}

      {/* Fullscreen Multi-format File Previewer Modal */}
      <DrivePreviewModal />

      {/* New Folder Modal */}
      <DriveNewFolderDialog
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onCreate={async (name, color) => {
          const created = await driveApi.createFolder({
            name,
            color,
            parentFolderId: currentFolderId,
          });
          setItems((prev) => [{ ...created, type: "folder" as const }, ...prev]);
        }}
      />

      {/* Rename Modal */}
      <DriveRenameDialog
        isOpen={!!renameTarget}
        item={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={async (id, newName, type) => {
          if (type === "folder") {
            const updated = await driveApi.updateFolder(id, { name: newName });
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, ...updated, type: "folder" } : i)),
            );
          } else {
            const updated = await driveApi.updateFile(id, { name: newName });
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, ...updated, type: "file" } : i)),
            );
          }
        }}
      />

      {/* Move Modal */}
      {moveTargetItems && (
        <DriveMoveDialog
          isOpen={true}
          itemIds={moveTargetItems}
          onClose={() => setMoveTargetItems(null)}
          onMoveSuccess={() => {
            fetchItems();
            clearSelection();
          }}
        />
      )}

      {/* Share Dialog */}
      <DriveShareDialog
        isOpen={!!shareTargetItem}
        item={shareTargetItem}
        onClose={() => setShareTargetItem(null)}
        onItemUpdated={(updated) => {
          if (shareTargetItem) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === shareTargetItem.id ? ({ ...i, ...updated } as DriveItem) : i,
              ),
            );
          }
        }}
      />

      {/* Version History Modal */}
      <DriveVersionHistoryDialog
        isOpen={!!versionHistoryTarget}
        item={versionHistoryTarget}
        onClose={() => setVersionHistoryTarget(null)}
        onVersionChanged={() => {
          fetchItems();
        }}
      />
    </div>
  );
};

export default DrivePage;
