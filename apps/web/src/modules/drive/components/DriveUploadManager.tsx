import React from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { useDriveStore } from "../store/drive.store";
import { formatBytes } from "../utils/drive.utils";
import { cn } from "@/lib/utils";

export const DriveUploadManager: React.FC = () => {
  const {
    activeUploads,
    isUploadManagerCollapsed,
    toggleUploadManager,
    clearCompletedUploads,
    removeUpload,
  } = useDriveStore();

  if (activeUploads.length === 0) return null;

  const completedCount = activeUploads.filter((u) => u.status === "completed").length;
  const inProgressCount = activeUploads.filter(
    (u) => u.status === "uploading" || u.status === "pending",
  ).length;

  const headerTitle =
    inProgressCount > 0
      ? `Uploading ${inProgressCount} item${inProgressCount > 1 ? "s" : ""}`
      : `${completedCount} upload${completedCount > 1 ? "s" : ""} complete`;

  return (
    <div className="fixed bottom-4 right-6 w-84 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden select-none animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="h-12 px-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {inProgressCount > 0 ? (
            <Loader2 size={16} className="animate-spin text-[#8ab4f8]" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-400" />
          )}
          <span>{headerTitle}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleUploadManager()}
            className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
          >
            {isUploadManagerCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={clearCompletedUploads}
            className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Upload Item Rows */}
      {!isUploadManagerCollapsed && (
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
          {activeUploads.map((upload) => (
            <div key={upload.id} className="p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {upload.filename}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {upload.status === "completed" && (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  )}
                  {upload.status === "error" && (
                    <div title={upload.error}>
                      <AlertCircle size={16} className="text-rose-500" />
                    </div>
                  )}
                  {(upload.status === "uploading" || upload.status === "pending") && (
                    <button
                      type="button"
                      onClick={() => removeUpload(upload.id)}
                      className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar & Status Text */}
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-200 rounded-full",
                    upload.status === "error"
                      ? "bg-rose-500"
                      : upload.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-[#1a73e8] dark:bg-[#8ab4f8]",
                  )}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{formatBytes(upload.size)}</span>
                <span>
                  {upload.status === "completed"
                    ? "Uploaded"
                    : upload.status === "error"
                    ? upload.error || "Failed"
                    : `${upload.progress}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
