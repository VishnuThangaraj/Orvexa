import React, { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { DriveItem } from "../types/drive.types";
import { DriveItemRow } from "./DriveItemRow";
import { useDriveStore } from "../store/drive.store";

interface DriveFileListProps {
  items: DriveItem[];
  onOpenItem: (item: DriveItem) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
  onToggleStar: (item: DriveItem) => void;
  onOpenRenameDialog?: (item: DriveItem) => void;
  onDeleteItem?: (item: DriveItem) => void;
}

export const DriveFileList: React.FC<DriveFileListProps> = ({
  items,
  onOpenItem,
  onContextMenu,
  onToggleStar,
  onOpenRenameDialog,
  onDeleteItem,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const {
    sortBy,
    sortOrder,
    setSort,
    selectedItemIds,
    toggleSelectItem,
    selectAllItems,
    clearSelection,
  } = useDriveStore();

  const itemIds = items.map((i) => i.id);
  const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAllItems(itemIds);
      } else if (e.key === "Escape") {
        clearSelection();
      } else if (e.key === "Enter" && selectedItemIds.length === 1) {
        const item = items.find((i) => i.id === selectedItemIds[0]);
        if (item) onOpenItem(item);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedItemIds.length === 1 && onDeleteItem) {
          const item = items.find((i) => i.id === selectedItemIds[0]);
          if (item) onDeleteItem(item);
        }
      } else if (e.key === "F2" && selectedItemIds.length === 1 && onOpenRenameDialog) {
        e.preventDefault();
        const item = items.find((i) => i.id === selectedItemIds[0]);
        if (item) onOpenRenameDialog(item);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length === 0) return;
        let nextIndex = 0;
        if (selectedItemIds.length > 0) {
          const currentIndex = items.findIndex((i) => i.id === selectedItemIds[0]);
          if (currentIndex !== -1) {
            nextIndex =
              e.key === "ArrowDown"
                ? Math.min(currentIndex + 1, items.length - 1)
                : Math.max(currentIndex - 1, 0);
          }
        }
        toggleSelectItem(items[nextIndex].id, false, false, itemIds);
        rowVirtualizer.scrollToIndex(nextIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    items,
    itemIds,
    selectedItemIds,
    selectAllItems,
    clearSelection,
    onOpenItem,
    onDeleteItem,
    onOpenRenameDialog,
    toggleSelectItem,
    rowVirtualizer,
  ]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllItems(itemIds);
    }
  };

  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
    ) : (
      <ArrowDown size={14} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
    );
  };

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Sticky Table Header */}
      <div className="h-10 px-4 flex items-center border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="w-8 shrink-0 flex items-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded-sm border-slate-300 dark:border-slate-600 text-[#1a73e8] focus:ring-0 cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={() => setSort("name")}
          className="flex-1 min-w-0 flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 text-left pr-4 cursor-pointer"
        >
          <span>Name</span>
          {renderSortIndicator("name")}
        </button>

        <div className="w-44 shrink-0 hidden md:block pr-4">Owner</div>

        <button
          type="button"
          onClick={() => setSort("updatedAt")}
          className="w-36 shrink-0 hidden sm:flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 text-left pr-4 cursor-pointer"
        >
          <span>Last modified</span>
          {renderSortIndicator("updatedAt")}
        </button>

        <button
          type="button"
          onClick={() => setSort("size")}
          className="w-24 shrink-0 flex items-center justify-end gap-1 hover:text-slate-800 dark:hover:text-slate-200 pr-2 cursor-pointer"
        >
          <span>File size</span>
          {renderSortIndicator("size")}
        </button>

        <div className="w-16 shrink-0" />
      </div>

      {/* Virtualized List Container */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            const isSelected = selectedItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <DriveItemRow
                  item={item}
                  isSelected={isSelected}
                  onSelect={(e) => {
                    const isMulti = e.ctrlKey || e.metaKey;
                    const isRange = e.shiftKey;
                    toggleSelectItem(item.id, isMulti, isRange, itemIds);
                  }}
                  onDoubleClick={() => onOpenItem(item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isSelected) {
                      toggleSelectItem(item.id, false, false, itemIds);
                    }
                    onContextMenu(e, item);
                  }}
                  onToggleStar={(e) => {
                    e.stopPropagation();
                    onToggleStar(item);
                  }}
                  onMenuClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected) {
                      toggleSelectItem(item.id, false, false, itemIds);
                    }
                    onContextMenu(e, item);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
