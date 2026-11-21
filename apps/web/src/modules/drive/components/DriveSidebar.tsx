import React, { useRef, useState, useEffect } from "react";
import {
  Plus,
  FolderPlus,
  Upload,
  FolderUp,
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Cloud,
} from "lucide-react";
import { useDriveStore } from "../store/drive.store";
import { driveApi } from "../api/drive.api";
import { formatBytes } from "../utils/drive.utils";
import { cn } from "@/lib/utils";

interface DriveSidebarProps {
  onOpenNewFolderDialog: () => void;
  onFilesSelected: (files: FileList | File[], relativePaths?: string[]) => void;
}

export const DriveSidebar: React.FC<DriveSidebarProps> = ({
  onOpenNewFolderDialog,
  onFilesSelected,
}) => {
  const {
    currentSection,
    setCurrentSection,
    storageUsage,
    setStorageUsage,
  } = useDriveStore();

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Close "+ New" dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    if (isNewMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isNewMenuOpen]);

  // Fetch real storage quota on mount
  useEffect(() => {
    driveApi
      .getStorageUsage()
      .then((usage) => setStorageUsage(usage))
      .catch((err) => console.error("Failed to load storage usage:", err));
  }, [setStorageUsage]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = ""; // Reset for re-selection
    }
    setIsNewMenuOpen(false);
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const relativePaths = files.map(
        (f) => (f as any).webkitRelativePath || f.name,
      );
      onFilesSelected(files, relativePaths);
      e.target.value = "";
    }
    setIsNewMenuOpen(false);
  };

  const navItems = [
    { id: "my-drive" as const, label: "My Drive", icon: HardDrive },
    { id: "shared" as const, label: "Shared with me", icon: Users },
    { id: "recent" as const, label: "Recent", icon: Clock },
    { id: "starred" as const, label: "Starred", icon: Star },
    { id: "trash" as const, label: "Trash", icon: Trash2 },
  ];

  const usedBytes = storageUsage ? BigInt(storageUsage.usedBytes) : 0n;
  const totalBytes = storageUsage
    ? BigInt(storageUsage.totalBytes)
    : 15n * 1024n * 1024n * 1024n;
  const usagePercentage = storageUsage
    ? Math.min(Math.max(storageUsage.usagePercentage, 0), 100)
    : 0;

  return (
    <aside className="w-64 h-full bg-[#f8fafd] dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-3 shrink-0 select-none">
      {/* Hidden File and Folder Upload Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        type="file"
        ref={folderInputRef}
        multiple
        className="hidden"
        onChange={handleFolderInputChange}
        {...({ webkitdirectory: "", directory: "" } as any)}
      />

      {/* + New Button & Dropdown */}
      <div className="relative mb-5 pt-1" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsNewMenuOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer transition-all duration-200",
            "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100",
            "shadow-xs hover:shadow-md border border-slate-200/80 dark:border-slate-700 font-medium text-sm",
            isNewMenuOpen && "shadow-md bg-slate-50 dark:bg-slate-750",
          )}
        >
          <Plus size={20} className="text-[#1a73e8] dark:text-[#8ab4f8] stroke-[2.5]" />
          <span>New</span>
        </button>

        {/* Dropdown Menu */}
        {isNewMenuOpen && (
          <div className="absolute top-14 left-0 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => {
                setIsNewMenuOpen(false);
                onOpenNewFolderDialog();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
            >
              <FolderPlus size={18} className="text-slate-500 dark:text-slate-400" />
              <span>New folder</span>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button
              type="button"
              onClick={() => {
                setIsNewMenuOpen(false);
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
            >
              <Upload size={18} className="text-slate-500 dark:text-slate-400" />
              <span>File upload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNewMenuOpen(false);
                folderInputRef.current?.click();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
            >
              <FolderUp size={18} className="text-slate-500 dark:text-slate-400" />
              <span>Folder upload</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors text-left cursor-pointer",
                isActive
                  ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60",
              )}
            >
              <Icon
                size={18}
                className={cn(
                  isActive
                    ? "text-[#001d35] dark:text-[#c2e7ff]"
                    : "text-slate-500 dark:text-slate-400",
                )}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Storage Quota Meter */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
          <Cloud size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium">Storage</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              usagePercentage > 90
                ? "bg-rose-500"
                : usagePercentage > 75
                ? "bg-amber-500"
                : "bg-[#1a73e8] dark:bg-[#8ab4f8]",
            )}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatBytes(usedBytes)} of {formatBytes(totalBytes)} used
        </p>
      </div>
    </aside>
  );
};
