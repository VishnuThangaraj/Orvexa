import React, { useEffect, useRef } from "react";
import {
  Eye,
  Download,
  Edit3,
  Copy,
  FolderInput,
  Star,
  Trash2,
  RotateCcw,
  Info,
  UserPlus,
  CornerUpRight,
  History,
} from "lucide-react";
import type { DriveItem, DriveFileItem } from "../types/drive.types";
import { useDriveStore } from "../store/drive.store";

interface DriveContextMenuProps {
  x: number;
  y: number;
  item: DriveItem;
  onClose: () => void;
  onOpenItem: (item: DriveItem) => void;
  onDownloadItem: (item: DriveItem) => void;
  onRenameItem: (item: DriveItem) => void;
  onCopyItem: (item: DriveItem) => void;
  onMoveItem: (item: DriveItem) => void;
  onToggleStarItem: (item: DriveItem) => void;
  onDeleteItem: (item: DriveItem) => void;
  onRestoreItem?: (item: DriveItem) => void;
  onPermanentDeleteItem?: (item: DriveItem) => void;
  onShareItem?: (item: DriveItem) => void;
  onAddShortcut?: (item: DriveItem) => void;
  onManageVersions?: (item: DriveFileItem) => void;
}

export const DriveContextMenu: React.FC<DriveContextMenuProps> = ({
  x,
  y,
  item,
  onClose,
  onOpenItem,
  onDownloadItem,
  onRenameItem,
  onCopyItem,
  onMoveItem,
  onToggleStarItem,
  onDeleteItem,
  onRestoreItem,
  onPermanentDeleteItem,
  onShareItem,
  onAddShortcut,
  onManageVersions,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentSection, toggleDetailsPanel } = useDriveStore();
  const isTrash = currentSection === "trash" || !!item.deletedAt;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates if menu would render off-screen
  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-700 dark:text-slate-200 text-sm"
    >
      {isTrash ? (
        <>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRestoreItem?.(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
          >
            <RotateCcw size={16} className="text-slate-500" />
            <span>Restore</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onPermanentDeleteItem?.(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Delete forever</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenItem(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
          >
            <Eye size={16} className="text-slate-500" />
            <span>{item.type === "folder" ? "Open folder" : "Preview"}</span>
          </button>

          {onShareItem && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onShareItem(item);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
            >
              <UserPlus size={16} className="text-slate-500" />
              <span>Share</span>
            </button>
          )}

          {onAddShortcut && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddShortcut(item);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
            >
              <CornerUpRight size={16} className="text-slate-500" />
              <span>Add shortcut to Drive</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onDownloadItem(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
          >
            <Download size={16} className="text-slate-500" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onRenameItem(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
          >
            <Edit3 size={16} className="text-slate-500" />
            <span>Rename</span>
          </button>

          {item.type === "file" && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCopyItem(item);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
            >
              <Copy size={16} className="text-slate-500" />
              <span>Make a copy</span>
            </button>
          )}

          {item.type === "file" && onManageVersions && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onManageVersions(item as DriveFileItem);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
            >
              <History size={16} className="text-slate-500" />
              <span>Version history</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onMoveItem(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
          >
            <FolderInput size={16} className="text-slate-500" />
            <span>Move to</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleStarItem(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
          >
            <Star
              size={16}
              className={item.isStarred ? "fill-amber-400 text-amber-400" : "text-slate-500"}
            />
            <span>{item.isStarred ? "Remove from Starred" : "Add to Starred"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              toggleDetailsPanel(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
          >
            <Info size={16} className="text-slate-500" />
            <span>File information</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteItem(item);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Move to trash</span>
          </button>
        </>
      )}
    </div>
  );
};
