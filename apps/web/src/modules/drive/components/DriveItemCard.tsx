import React, { useState } from "react";
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
import { driveApi } from "../api/drive.api";
import { cn } from "@/lib/utils";

interface DriveItemCardProps {
  item: DriveItem;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onMenuClick: (e: React.MouseEvent) => void;
}

export const DriveItemCard: React.FC<DriveItemCardProps> = ({
  item,
  isSelected,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onToggleStar,
  onMenuClick,
}) => {
  const [thumbError, setThumbError] = useState(false);
  const isFolder = item.type === "folder";
  const typeInfo = !isFolder
    ? getFileTypeInfo((item as any).asset?.mimeType, item.name)
    : null;

  const isImage = typeInfo?.category === "image";
  const thumbnailUrl = !isFolder && isImage
    ? driveApi.getThumbnailUrl(item.id, 320, 200)
    : null;

  const renderIcon = () => {
    if (isFolder) {
      const folderColor = (item as any).color || "#5f6368";
      return (
        <Folder
          size={24}
          style={{ color: folderColor, fill: folderColor }}
          className="fill-opacity-20 shrink-0"
        />
      );
    }

    switch (typeInfo?.category) {
      case "image":
        return <ImageIcon size={24} className={cn("shrink-0", typeInfo.color)} />;
      case "video":
        return <Film size={24} className={cn("shrink-0", typeInfo.color)} />;
      case "audio":
        return <Music size={24} className={cn("shrink-0", typeInfo.color)} />;
      case "pdf":
      case "document":
        return <FileText size={24} className={cn("shrink-0", typeInfo.color)} />;
      case "code":
        return <FileCode size={24} className={cn("shrink-0", typeInfo.color)} />;
      case "archive":
        return <Archive size={24} className={cn("shrink-0", typeInfo.color)} />;
      default:
        return <FileGeneric size={24} className="shrink-0 text-slate-400" />;
    }
  };

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      tabIndex={0}
      aria-label={item.name}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl p-3 border transition-all duration-150 cursor-pointer select-none",
        isSelected
          ? "bg-[#c2e7ff]/30 dark:bg-[#004a77]/30 border-[#1a73e8] dark:border-[#8ab4f8] shadow-xs"
          : "bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-xs",
      )}
    >
      {/* Header: Icon, Name, More button */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {renderIcon()}
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onToggleStar}
            title={item.isStarred ? "Starred" : "Star"}
            className={cn(
              "p-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-opacity",
              item.isStarred
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 text-slate-400",
            )}
          >
            <Star
              size={15}
              className={
                item.isStarred ? "fill-amber-400 text-amber-400" : "hover:text-amber-400"
              }
            />
          </button>

          <button
            type="button"
            onClick={onMenuClick}
            title="More actions"
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Middle Preview Box */}
      <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden mb-3">
        {thumbnailUrl && !thumbError ? (
          <img
            src={thumbnailUrl}
            alt={item.name}
            onError={() => setThumbError(true)}
            className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-105"
          />
        ) : isFolder ? (
          <Folder
            size={48}
            style={{
              color: (item as any).color || "#5f6368",
              fill: (item as any).color || "#5f6368",
            }}
            className="fill-opacity-15"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-slate-400">
            {renderIcon()}
            <span className="text-xs uppercase font-semibold tracking-wider">
              {typeInfo?.label || "FILE"}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Owner and Modified Date */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate">
          {isFolder ? "Folder" : formatBytes((item as any).asset?.bytes || 0)}
        </span>
        <span>{formatDate(item.updatedAt)}</span>
      </div>
    </div>
  );
};
