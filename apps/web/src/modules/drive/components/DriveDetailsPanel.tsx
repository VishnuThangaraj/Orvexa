import React, { useState, useEffect } from "react";
import {
  X,
  Folder,
  FileText,
  Clock,
  Shield,
  UserPlus,
  Loader2,
} from "lucide-react";
import type { DriveItem, DriveActivityItem } from "../types/drive.types";
import { useDriveStore } from "../store/drive.store";
import { formatBytes, formatDate, getFileTypeInfo } from "../utils/drive.utils";
import { driveApi } from "../api/drive.api";
import { DriveThumbnail } from "./DriveThumbnail";
import { cn } from "@/lib/utils";

interface DriveDetailsPanelProps {
  selectedItem?: DriveItem | null;
  onItemUpdated?: (updated: DriveItem) => void;
  onOpenShare?: () => void;
}

export const DriveDetailsPanel: React.FC<DriveDetailsPanelProps> = ({
  selectedItem,
  onItemUpdated,
  onOpenShare,
}) => {
  const {
    isDetailsPanelOpen,
    toggleDetailsPanel,
    activeDetailsTab,
    setActiveDetailsTab,
    currentFolder,
  } = useDriveStore();

  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  const [activities, setActivities] = useState<DriveActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const targetItem = selectedItem || (currentFolder ? { ...currentFolder, type: "folder" as const } : null);
  const isFolder = targetItem?.type === "folder";

  useEffect(() => {
    if (activeDetailsTab === "activity" && targetItem) {
      setLoadingActivities(true);
      const params = isFolder ? { folderId: targetItem.id } : { fileId: targetItem.id };
      driveApi
        .getActivities(params)
        .then(setActivities)
        .catch(console.error)
        .finally(() => setLoadingActivities(false));
    }
  }, [activeDetailsTab, targetItem?.id, isFolder]);

  if (!isDetailsPanelOpen) return null;
  const typeInfo = targetItem && !isFolder
    ? getFileTypeInfo((targetItem as any).asset?.mimeType, targetItem.name)
    : null;

  const handleToggleRestriction = async (
    field: "preventDownload" | "preventEditorSharing",
    currentVal: boolean,
  ) => {
    if (!targetItem || isFolder) return;
    setIsUpdatingSecurity(true);
    try {
      const updated = await driveApi.updateFile(targetItem.id, {
        [field]: !currentVal,
      });
      onItemUpdated?.({ ...(targetItem as any), ...updated, type: "file" });
    } catch (err) {
      console.error("Failed to update security restrictions:", err);
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  return (
    <aside className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 flex flex-col shrink-0 z-20 select-none animate-in slide-in-from-right-10 duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1 font-medium text-sm text-slate-800 dark:text-slate-100 truncate pr-2">
          {targetItem ? (
            <span className="truncate">{targetItem.name}</span>
          ) : (
            <span>Drive Details</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleDetailsPanel(false)}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveDetailsTab("details")}
          className={cn(
            "flex-1 py-2.5 text-center cursor-pointer transition-colors border-b-2",
            activeDetailsTab === "details"
              ? "border-[#1a73e8] text-[#1a73e8] dark:text-[#8ab4f8] dark:border-[#8ab4f8]"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
          )}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setActiveDetailsTab("activity")}
          className={cn(
            "flex-1 py-2.5 text-center cursor-pointer transition-colors border-b-2",
            activeDetailsTab === "activity"
              ? "border-[#1a73e8] text-[#1a73e8] dark:text-[#8ab4f8] dark:border-[#8ab4f8]"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
          )}
        >
          Activity
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {targetItem ? (
          activeDetailsTab === "details" ? (
            <div className="space-y-5">
              {/* Preview Thumbnail / Icon */}
              <div className="w-full h-36 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                {isFolder ? (
                  <Folder
                    size={56}
                    style={{
                      color: (targetItem as any).color || "#5f6368",
                      fill: (targetItem as any).color || "#5f6368",
                    }}
                    className="fill-opacity-20"
                  />
                ) : typeInfo?.category === "image" ? (
                  <DriveThumbnail
                    fileId={targetItem.id}
                    alt={targetItem.name}
                    width={320}
                    height={200}
                    className="w-full h-full object-cover"
                    fallback={
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <FileText size={48} className={typeInfo?.color} />
                        <span className="text-xs uppercase font-semibold">
                          {typeInfo?.label || "IMAGE"}
                        </span>
                      </div>
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <FileText size={48} className={typeInfo?.color} />
                    <span className="text-xs uppercase font-semibold">
                      {typeInfo?.label || "FILE"}
                    </span>
                  </div>
                )}
              </div>

              {/* General Properties */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  General Information
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Type</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {isFolder ? "Folder" : typeInfo?.label || "File"}
                    </span>
                  </div>
                  {!isFolder && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Size</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {formatBytes((targetItem as any).asset?.bytes || 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Owner</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[160px]">
                      {targetItem.owner?.fullName || "Me"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Modified</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {formatDate(targetItem.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Created</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {formatDate(targetItem.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Who has access */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Who has access
                  </h4>
                  {onOpenShare && (
                    <button
                      type="button"
                      onClick={onOpenShare}
                      className="flex items-center gap-1 text-xs text-[#1a73e8] hover:underline cursor-pointer"
                    >
                      <UserPlus size={13} />
                      <span>Manage access</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                    {targetItem.owner?.fullName?.charAt(0) || "M"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {targetItem.owner?.fullName || "Me"} (Owner)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {targetItem.owner?.email || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Access Restrictions (Files only) */}
              {!isFolder && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Shield size={14} className="text-[#1a73e8]" />
                    <span>Access Restrictions</span>
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isUpdatingSecurity}
                        checked={(targetItem as any).preventDownload || false}
                        onChange={() =>
                          handleToggleRestriction(
                            "preventDownload",
                            (targetItem as any).preventDownload || false,
                          )
                        }
                        className="mt-0.5 w-4 h-4 rounded text-[#1a73e8] focus:ring-0 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          Disable download for viewers
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Viewers and commenters cannot download, print, or copy.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isUpdatingSecurity}
                        checked={(targetItem as any).preventEditorSharing || false}
                        onChange={() =>
                          handleToggleRestriction(
                            "preventEditorSharing",
                            (targetItem as any).preventEditorSharing || false,
                          )
                        }
                        className="mt-0.5 w-4 h-4 rounded text-[#1a73e8] focus:ring-0 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          Prevent editors from sharing
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Only you can change permissions and share.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Activity Tab
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Activity
              </h4>

              {loadingActivities ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 size={24} className="animate-spin text-[#1a73e8] mb-2" />
                  <p className="text-xs">Loading activity...</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {activities.map((act) => {
                    const details = act.details || {};
                    let actionDesc = act.action.replace(/_/g, " ").toLowerCase();
                    if (act.action === "UPLOADED") actionDesc = "uploaded an item";
                    else if (act.action === "CREATED") actionDesc = "created this folder";
                    else if (act.action === "VERSION_UPLOADED")
                      actionDesc = `uploaded version ${details.versionNumber ?? ""}`;
                    else if (act.action === "VERSION_RESTORED")
                      actionDesc = `restored version ${details.versionNumber ?? ""}`;
                    else if (act.action === "VERSION_DELETED")
                      actionDesc = `deleted version ${details.versionNumber ?? ""}`;
                    else if (act.action === "RENAMED")
                      actionDesc = details.newName ? `renamed to "${details.newName}"` : "renamed item";
                    else if (act.action === "MOVED") actionDesc = "moved item";
                    else if (act.action === "SHARED")
                      actionDesc = details.targetEmail ? `shared with ${details.targetEmail}` : "shared item";
                    else if (act.action === "PERMISSION_CHANGED")
                      actionDesc = details.targetEmail ? `updated access for ${details.targetEmail}` : "updated permissions";
                    else if (act.action === "PERMISSION_REMOVED")
                      actionDesc = details.targetEmail ? `removed access for ${details.targetEmail}` : "removed permissions";
                    else if (act.action === "DELETED") actionDesc = "moved item to trash";
                    else if (act.action === "RESTORED") actionDesc = "restored item from trash";
                    else if (act.action === "DOWNLOADED") actionDesc = "downloaded item";

                    return (
                      <div key={act.id} className="relative group">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#1a73e8] ring-4 ring-white dark:ring-slate-900" />
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-medium text-slate-700 dark:text-slate-300">
                            {(act.user?.fullName?.[0] || act.user?.email?.[0] || "U").toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {act.user?.fullName || act.user?.email || "Unknown user"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {actionDesc}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDate(act.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#1a73e8] ring-4 ring-white dark:ring-slate-900" />
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      Item created / uploaded
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDate(targetItem.createdAt)}
                    </p>
                  </div>
                  {targetItem.updatedAt !== targetItem.createdAt && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white dark:ring-slate-900" />
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        Item modified
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(targetItem.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center px-4">
            <Clock size={36} className="mb-2 stroke-1" />
            <p className="text-xs">Select an item to view details and activity.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
