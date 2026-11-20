import React from "react";
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Archive,
  File as FileGeneric,
  MoreVertical,
  Star,
} from "lucide-react";
import type { DriveItem } from "../types/drive.types";
import { formatBytes, formatDate, getFileTypeInfo } from "../utils/drive.utils";
import { cn } from "@/lib/utils";

interface DriveItemRowProps {
  item: DriveItem;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onMenuClick: (e: React.MouseEvent) => void;
}

export const DriveItemRow: React.FC<DriveItemRowProps> = ({
  item,
  isSelected,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onToggleStar,
  onMenuClick,
}) => {
  const isFolder = item.type === "folder";
  const typeInfo = !isFolder
    ? getFileTypeInfo((item as any).asset?.mimeType, item.name)
    : null;

  const renderIcon = () => {
    if (isFolder) {
      const folderColor = (item as any).color || "#5f6368";
      return (
        <Folder
          size={20}
          style={{ color: folderColor, fill: folderColor }}
          className="shrink-0 fill-opacity-20"
        />
      );
    }

    switch (typeInfo?.category) {
      case "image":
        return <ImageIcon size={20} className={cn("shrink-0", typeInfo.color)} />;
      case "video":
        return <Film size={20} className={cn("shrink-0", typeInfo.color)} />;
      case "audio":
        return <Music size={20} className={cn("shrink-0", typeInfo.color)} />;
      case "pdf":
      case "document":
        return <FileText size={20} className={cn("shrink-0", typeInfo.color)} />;
      case "code":
        return <FileCode size={20} className={cn("shrink-0", typeInfo.color)} />;
      case "archive":
        return <Archive size={20} className={cn("shrink-0", typeInfo.color)} />;
      default:
        return <FileGeneric size={20} className="shrink-0 text-slate-400" />;
    }
  };

  const sizeString = isFolder
    ? "—"
    : formatBytes((item as any).asset?.bytes || 0);

  return (
    <div
      role="row"
      aria-selected={isSelected}
      tabIndex={0}
      aria-label={item.name}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={cn(
        "group flex items-center h-12 px-4 border-b border-slate-100 dark:border-slate-800/80 text-sm cursor-pointer select-none transition-colors",
        isSelected
          ? "bg-[#c2e7ff]/40 dark:bg-[#004a77]/30 hover:bg-[#c2e7ff]/50 dark:hover:bg-[#004a77]/40"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
      )}
    >
      {/* Selection Checkbox */}
      <div className="w-8 shrink-0 flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          aria-label={`Select ${item.name}`}
          onChange={() => {}}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-4 h-4 rounded-sm border-slate-300 dark:border-slate-600 text-[#1a73e8] focus:ring-0 cursor-pointer transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        />
      </div>

      {/* Name & Icon */}
      <div className="flex-1 min-w-0 flex items-center gap-3 pr-4">
        {renderIcon()}
        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
          {item.name}
        </span>
        {item.isStarred && (
          <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />
        )}
      </div>

      {/* Owner */}
      <div className="w-44 shrink-0 hidden md:flex items-center gap-2 pr-4 text-slate-600 dark:text-slate-400 truncate">
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0">
          {item.owner?.fullName?.charAt(0) || "U"}
        </div>
        <span className="truncate text-xs">{item.owner?.fullName || "me"}</span>
      </div>

      {/* Last Modified */}
      <div className="w-36 shrink-0 hidden sm:block text-xs text-slate-500 dark:text-slate-400 pr-4">
        {formatDate(item.updatedAt)}
      </div>

      {/* File Size */}
      <div className="w-24 shrink-0 text-xs text-slate-500 dark:text-slate-400 pr-2 text-right">
        {sizeString}
      </div>

      {/* Star button on hover & Three-dot Actions */}
      <div className="w-16 shrink-0 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={onToggleStar}
          title={item.isStarred ? "Starred" : "Star"}
          className={cn(
            "p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-opacity",
            item.isStarred
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 text-slate-400",
          )}
        >
          <Star
            size={16}
            className={
              item.isStarred ? "fill-amber-400 text-amber-400" : "hover:text-amber-400"
            }
          />
        </button>

        <button
          type="button"
          onClick={onMenuClick}
          title="More actions"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
};
