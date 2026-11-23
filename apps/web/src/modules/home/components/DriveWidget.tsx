import React from "react";
import { useNavigate } from "react-router-dom";
import {
  HardDrive,
  Upload,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Archive,
  File as FileGeneric,
  Star,
  ExternalLink,
} from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { HomeDriveData } from "../types/home.types";
import { formatBytes, formatDate, getFileTypeInfo } from "@/modules/drive/utils/drive.utils";
import { cn } from "@/lib/utils";

interface DriveWidgetProps {
  data?: HomeDriveData;
  isLoading?: boolean;
  error?: string | null;
  size?: "full" | "half" | string;
  onResize?: (size: "full" | "half") => void;
  onRetry?: () => void;
}

export const DriveWidget: React.FC<DriveWidgetProps> = ({
  data,
  isLoading = false,
  error = null,
  size = "half",
  onResize,
  onRetry,
}) => {
  const navigate = useNavigate();

  const storage = data?.storage;
  const recentFiles = data?.recentFiles || [];

  const usedBytes = storage?.usedBytes ? BigInt(storage.usedBytes) : BigInt(0);
  const totalBytes = storage?.totalBytes ? BigInt(storage.totalBytes) : BigInt(15 * 1024 * 1024 * 1024);
  const usagePercentage = storage?.usagePercentage ?? 0;

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 75) return "bg-amber-500";
    return "bg-[#1a73e8]";
  };

  const renderFileIcon = (mimeType?: string, filename?: string) => {
    const info = getFileTypeInfo(mimeType, filename);
    const iconClass = cn("w-4 h-4", info.color);

    switch (info.category) {
      case "image":
        return <ImageIcon className={iconClass} />;
      case "video":
        return <Film className={iconClass} />;
      case "audio":
        return <Music className={iconClass} />;
      case "pdf":
      case "document":
        return <FileText className={iconClass} />;
      case "code":
        return <FileCode className={iconClass} />;
      case "archive":
        return <Archive className={iconClass} />;
      default:
        return <FileGeneric className={iconClass} />;
    }
  };

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/drive")}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#f9ab00] hover:bg-[#e37400] text-slate-900 font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
    >
      <Upload className="w-3.5 h-3.5" />
      <span>Upload</span>
    </button>
  );

  return (
    <WidgetCard
      id="drive"
      title="Drive"
      icon={HardDrive}
      iconColor="text-[#f9ab00]"
      iconBg="bg-amber-50 dark:bg-amber-950/40"
      openTo="/drive"
      openLabel="Open Drive"
      badge={storage ? `${storage.fileCount} files` : undefined}
      badgeColor="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40"
      headerActions={headerActions}
      size={size}
      onResize={onResize}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div className="space-y-4">
        {/* Storage Usage Meter Card */}
        <div className="p-4 rounded-[22px] border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Storage
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                {usagePercentage.toFixed(1)}% used
              </span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">
              {formatBytes(usedBytes)} <span className="font-normal text-slate-400">/ {formatBytes(totalBytes)}</span>
            </span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden bg-slate-200/70 dark:bg-slate-800">
            <div
              className={cn("h-full transition-all duration-500 rounded-full", getProgressColor(usagePercentage))}
              style={{ width: `${Math.min(100, Math.max(0, usagePercentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/drive")}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>New folder</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/drive")}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>Add files</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate("/drive")}
              className="text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage storage</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Suggested & Recent Files */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Recent Files
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              {recentFiles.length} item{recentFiles.length === 1 ? "" : "s"}
            </span>
          </div>

          {recentFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recentFiles.slice(0, 6).map((file) => {
                const info = getFileTypeInfo(file.mimeType, file.name);

                return (
                  <div
                    key={file.id}
                    onClick={() => navigate(`/drive`)}
                    className="group flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-200 dark:hover:border-amber-900/60 hover:shadow-2xs cursor-pointer transition-all"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                        info.bgLight
                      )}
                    >
                      {renderFileIcon(file.mimeType, file.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {file.name}
                        </p>
                        {file.isStarred && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate font-medium">
                        {formatDate(file.updatedAt)} • {file.ownerName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-[#f9ab00] flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/40">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  No files uploaded yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                  Upload spreadsheets, presentations, PDFs, or photos to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
};

export default DriveWidget;
