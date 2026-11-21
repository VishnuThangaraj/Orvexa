import React, { useState, useEffect } from "react";
import { FolderInput, Folder, ChevronRight, X, ArrowLeft } from "lucide-react";
import type { DriveFolderItem } from "../types/drive.types";
import { driveApi } from "../api/drive.api";

interface DriveMoveDialogProps {
  isOpen: boolean;
  itemIds: Array<{ id: string; type: "file" | "folder" }>;
  onClose: () => void;
  onMoveSuccess: () => void;
}

export const DriveMoveDialog: React.FC<DriveMoveDialogProps> = ({
  isOpen,
  itemIds,
  onClose,
  onMoveSuccess,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<DriveFolderItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [availableFolders, setAvailableFolders] = useState<DriveFolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch folders for current location in the picker
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    driveApi
      .getItems({ folderId: currentFolderId, limit: 100 })
      .then((res) => {
        // Filter out folders that are in the items to move (cannot move folder into itself)
        const movingFolderIds = new Set(
          itemIds.filter((i) => i.type === "folder").map((i) => i.id),
        );
        const filtered = res.folders.filter((f) => !movingFolderIds.has(f.id));
        setAvailableFolders(filtered);
        setCurrentFolder(res.currentFolder);
        setBreadcrumbs(res.breadcrumbs);
      })
      .catch((err) => console.error("Failed to load picker folders:", err))
      .finally(() => setLoading(false));
  }, [isOpen, currentFolderId, itemIds]);

  if (!isOpen) return null;

  const handleMove = async () => {
    setIsSubmitting(true);
    try {
      await driveApi.moveItems({
        items: itemIds,
        destinationFolderId: currentFolderId,
      });
      onMoveSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to move items");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col h-[480px] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderInput size={20} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              Move {itemIds.length} item{itemIds.length > 1 ? "s" : ""}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Breadcrumb Path in Picker */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
          {currentFolderId && (
            <button
              type="button"
              onClick={() => {
                if (breadcrumbs.length > 1) {
                  setCurrentFolderId(breadcrumbs[breadcrumbs.length - 2].id);
                } else {
                  setCurrentFolderId(null);
                }
              }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 mr-1"
            >
              <ArrowLeft size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className="hover:underline font-medium"
          >
            My Drive
          </button>

          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={12} className="text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={() => setCurrentFolderId(crumb.id)}
                className="hover:underline font-medium truncate max-w-[120px]"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-xs text-slate-400">
              Loading folders...
            </div>
          ) : availableFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
              <Folder size={36} className="mb-2 stroke-1" />
              <p className="text-xs">No subfolders here</p>
            </div>
          ) : (
            availableFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 truncate">
                  <Folder
                    size={20}
                    style={{ color: folder.color || "#5f6368" }}
                    className="shrink-0"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {folder.name}
                  </span>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="h-16 px-6 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
            Target: {currentFolder ? currentFolder.name : "My Drive"}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleMove}
              className="px-4 py-2 text-xs font-semibold bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Moving..." : "Move here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
