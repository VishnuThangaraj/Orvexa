import React, { useEffect } from "react";
import type { DriveItem } from "../types/drive.types";
import { DriveItemCard } from "./DriveItemCard";
import { useDriveStore } from "../store/drive.store";

interface DriveFileGridProps {
  items: DriveItem[];
  onOpenItem: (item: DriveItem) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
  onToggleStar: (item: DriveItem) => void;
  onOpenRenameDialog?: (item: DriveItem) => void;
  onDeleteItem?: (item: DriveItem) => void;
}

export const DriveFileGrid: React.FC<DriveFileGridProps> = ({
  items,
  onOpenItem,
  onContextMenu,
  onToggleStar,
  onOpenRenameDialog,
  onDeleteItem,
}) => {
  const { selectedItemIds, toggleSelectItem, selectAllItems, clearSelection } =
    useDriveStore();
  const itemIds = items.map((i) => i.id);

  const folders = items.filter((i) => i.type === "folder");
  const files = items.filter((i) => i.type === "file");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        if (items.length === 0) return;
        let nextIndex = 0;
        if (selectedItemIds.length > 0) {
          const currentIndex = items.findIndex((i) => i.id === selectedItemIds[0]);
          if (currentIndex !== -1) {
            const step =
              e.key === "ArrowDown"
                ? 4
                : e.key === "ArrowUp"
                ? -4
                : e.key === "ArrowRight"
                ? 1
                : -1;
            nextIndex = Math.max(0, Math.min(currentIndex + step, items.length - 1));
          }
        }
        toggleSelectItem(items[nextIndex].id, false, false, itemIds);
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
  ]);

  const renderSection = (title: string, sectionItems: DriveItem[]) => {
    if (sectionItems.length === 0) return null;

    return (
      <div className="mb-6" role="region" aria-label={title}>
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
          {title} ({sectionItems.length})
        </h3>
        <div
          role="grid"
          aria-label={title}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {sectionItems.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);

            return (
              <DriveItemCard
                key={item.id}
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
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 select-none">
      {renderSection("Folders", folders)}
      {renderSection("Files", files)}
    </div>
  );
};
