import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  HardDrive,
  Users,
  Clock,
  Star,
  Folder,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Archive,
  File as FileGeneric,
  Loader2,
  Check,
  ChevronRight,
  Link as LinkIcon,
  Paperclip,
} from "lucide-react";
import { driveApi } from "../api/drive.api";
import type { DriveFileItem, DriveFolderItem } from "../types/drive.types";
import { formatBytes, formatDate, getFileTypeInfo } from "../utils/drive.utils";
import { cn } from "@/lib/utils";

export interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: DriveFileItem[], mode: "attachment" | "link") => void;
  title?: string;
  allowMultiple?: boolean;
  allowedTypes?: string[];
  initialMode?: "attachment" | "link";
  showModeToggle?: boolean;
}

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Select files from Orvexa Drive",
  allowMultiple = true,
  allowedTypes,
  initialMode = "attachment",
  showModeToggle = true,
}) => {
  const [activeTab, setActiveTab] = useState<"my-drive" | "shared" | "recent" | "starred">(
    "my-drive",
  );
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([
    { id: "root", name: "My Drive" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  const renderFileIcon = (file: DriveFileItem) => {
    const typeInfo = getFileTypeInfo(file.asset.mimeType, file.name);
    switch (typeInfo.category) {
      case "image":
        return <ImageIcon size={18} className={cn("shrink-0", typeInfo.color)} />;
      case "video":
        return <Film size={18} className={cn("shrink-0", typeInfo.color)} />;
      case "audio":
        return <Music size={18} className={cn("shrink-0", typeInfo.color)} />;
      case "pdf":
      case "document":
        return <FileText size={18} className={cn("shrink-0", typeInfo.color)} />;
      case "code":
        return <FileCode size={18} className={cn("shrink-0", typeInfo.color)} />;
      case "archive":
        return <Archive size={18} className={cn("shrink-0", typeInfo.color)} />;
      default:
        return <FileGeneric size={18} className="shrink-0 text-slate-400" />;
    }
  };
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [folders, setFolders] = useState<DriveFolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFilesMap, setSelectedFilesMap] = useState<Map<string, DriveFileItem>>(
    new Map(),
  );
  const [insertMode, setInsertMode] = useState<"attachment" | "link">(initialMode);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFileIds(new Set());
      setSelectedFilesMap(new Map());
      setSearchQuery("");
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: "root", name: "My Drive" }]);
      setActiveTab("my-drive");
    }
  }, [isOpen]);

  // Fetch items based on active tab and current folder
  const loadItems = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await driveApi.searchItems({ q: searchQuery.trim(), limit: 100 });
        setFiles(res.files);
        setFolders(res.folders);
      } else if (activeTab === "my-drive") {
        const res = await driveApi.getItems({
          folderId: currentFolderId,
          limit: 100,
          sortBy: "updatedAt",
          sortOrder: "desc",
        });
        setFiles(res.files);
        setFolders(res.folders);
        if (res.breadcrumbs && res.breadcrumbs.length > 0) {
          setBreadcrumbs([{ id: "root", name: "My Drive" }, ...res.breadcrumbs]);
        }
      } else if (activeTab === "shared") {
        const res = await driveApi.getSharedWithMe();
        setFiles(res.files);
        setFolders(res.folders);
      } else if (activeTab === "recent") {
        const res = await driveApi.getRecent(100);
        setFiles(res);
        setFolders([]);
      } else if (activeTab === "starred") {
        const res = await driveApi.getStarred();
        setFiles(res.files);
        setFolders(res.folders);
      }
    } catch (err) {
      console.error("Failed to load picker items:", err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, activeTab, currentFolderId, searchQuery]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleToggleFile = (file: DriveFileItem) => {
    const nextIds = new Set(selectedFileIds);
    const nextMap = new Map(selectedFilesMap);

    if (nextIds.has(file.id)) {
      nextIds.delete(file.id);
      nextMap.delete(file.id);
    } else {
      if (!allowMultiple) {
        nextIds.clear();
        nextMap.clear();
      }
      nextIds.add(file.id);
      nextMap.set(file.id, file);
    }

    setSelectedFileIds(nextIds);
    setSelectedFilesMap(nextMap);
  };

  const handleOpenFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const handleBreadcrumbClick = (id: string, index: number) => {
    if (id === "root") {
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: "root", name: "My Drive" }]);
    } else {
      setCurrentFolderId(id);
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
    }
  };

  const handleConfirmSelect = () => {
    const selectedList = Array.from(selectedFilesMap.values());
    if (selectedList.length === 0) return;
    onSelect(selectedList, insertMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[640px] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden select-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-[#1a73e8]">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {title}
              </h2>
              <p className="text-xs text-slate-500">
                Choose files to insert into your message or event
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files in Drive..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        {!searchQuery && (
          <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab("my-drive");
                setCurrentFolderId(null);
                setBreadcrumbs([{ id: "root", name: "My Drive" }]);
              }}
              className={cn(
                "py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer",
                activeTab === "my-drive"
                  ? "border-[#1a73e8] text-[#1a73e8] font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              <HardDrive size={15} />
              <span>My Drive</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("shared");
                setCurrentFolderId(null);
              }}
              className={cn(
                "py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer",
                activeTab === "shared"
                  ? "border-[#1a73e8] text-[#1a73e8] font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              <Users size={15} />
              <span>Shared with me</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("recent");
                setCurrentFolderId(null);
              }}
              className={cn(
                "py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer",
                activeTab === "recent"
                  ? "border-[#1a73e8] text-[#1a73e8] font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              <Clock size={15} />
              <span>Recent</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("starred");
                setCurrentFolderId(null);
              }}
              className={cn(
                "py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer",
                activeTab === "starred"
                  ? "border-[#1a73e8] text-[#1a73e8] font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              <Star size={15} />
              <span>Starred</span>
            </button>
          </div>
        )}

        {/* Breadcrumb line (when inside a folder in My Drive) */}
        {activeTab === "my-drive" && !searchQuery && breadcrumbs.length > 1 && (
          <div className="px-6 py-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <ChevronRight size={13} className="text-slate-400 shrink-0" />}
                <button
                  type="button"
                  onClick={() => handleBreadcrumbClick(b.id, i)}
                  className={cn(
                    "hover:underline cursor-pointer truncate max-w-[140px]",
                    i === breadcrumbs.length - 1
                      ? "font-semibold text-slate-800 dark:text-slate-200"
                      : "text-slate-500",
                  )}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-[#1a73e8] mb-2" />
              <p className="text-xs">Loading Drive items...</p>
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
              <HardDrive size={40} className="mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                No items found
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery
                  ? "No files matched your search."
                  : "This section does not contain any files."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Folders row (if any) */}
              {folders.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Folders
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        onDoubleClick={() => handleOpenFolder(folder.id, folder.name)}
                        onClick={() => handleOpenFolder(folder.id, folder.name)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer select-none group"
                      >
                        <Folder
                          size={18}
                          className="shrink-0 text-slate-600 dark:text-slate-300 group-hover:text-[#1a73e8]"
                          style={{ color: folder.color || undefined }}
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                          {folder.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Table / List */}
              {files.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Files
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {(allowedTypes && allowedTypes.length > 0
                      ? files.filter((f) => allowedTypes.includes(f.asset.mimeType))
                      : files
                    ).map((file) => {
                      const isSelected = selectedFileIds.has(file.id);

                      return (
                        <div
                          key={file.id}
                          onClick={() => handleToggleFile(file)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer select-none group",
                            isSelected
                              ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200",
                          )}
                        >
                          {/* Selection Checkbox indicator */}
                          <div
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                              isSelected
                                ? "bg-[#1a73e8] border-[#1a73e8] text-white"
                                : "border-slate-300 dark:border-slate-600 group-hover:border-slate-400",
                            )}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>

                          {/* File Icon */}
                          {renderFileIcon(file)}

                          {/* File Name & details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{file.name}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              {formatBytes(file.asset.bytes)} • {formatDate(file.updatedAt)}
                            </p>
                          </div>

                          {/* Owner badge */}
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[120px] hidden sm:block">
                            {file.owner.fullName || file.owner.email}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {/* Mode Selector (Attachment vs Link) */}
          {showModeToggle ? (
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-500">Insert as:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="picker_insert_mode"
                  value="attachment"
                  checked={insertMode === "attachment"}
                  onChange={() => setInsertMode("attachment")}
                  className="text-[#1a73e8] focus:ring-0 cursor-pointer"
                />
                <Paperclip size={13} className="text-slate-500" />
                <span>Attachment</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="picker_insert_mode"
                  value="link"
                  checked={insertMode === "link"}
                  onChange={() => setInsertMode("link")}
                  className="text-[#1a73e8] focus:ring-0 cursor-pointer"
                />
                <LinkIcon size={13} className="text-slate-500" />
                <span>Drive link</span>
              </label>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {selectedFileIds.size > 0
                ? `${selectedFileIds.size} file${selectedFileIds.size > 1 ? "s" : ""} selected`
                : "Select a file to continue"}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={selectedFileIds.size === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full shadow-xs transition-all cursor-pointer"
            >
              {selectedFileIds.size > 1
                ? `Insert (${selectedFileIds.size})`
                : "Insert"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrivePickerModal;
