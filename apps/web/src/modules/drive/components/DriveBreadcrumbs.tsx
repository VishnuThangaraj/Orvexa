import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FolderPlus, Download, Edit3 } from "lucide-react";
import { useDriveStore } from "../store/drive.store";
import { driveApi } from "../api/drive.api";

interface DriveBreadcrumbsProps {
  onOpenNewFolderDialog?: () => void;
  onOpenRenameDialog?: (folder: { id: string; name: string }) => void;
}

export const DriveBreadcrumbs: React.FC<DriveBreadcrumbsProps> = ({
  onOpenNewFolderDialog,
  onOpenRenameDialog,
}) => {
  const {
    currentSection,
    currentFolder,
    breadcrumbs,
    setCurrentFolderId,
  } = useDriveStore();

  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsFolderMenuOpen(false);
      }
    };
    if (isFolderMenuOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isFolderMenuOpen]);

  const getSectionTitle = () => {
    switch (currentSection) {
      case "my-drive":
        return "My Drive";
      case "shared":
        return "Shared with me";
      case "recent":
        return "Recent";
      case "starred":
        return "Starred";
      case "trash":
        return "Trash";
      default:
        return "Drive";
    }
  };

  const handleDownloadFolderZip = async () => {
    if (!currentFolder) return;
    setIsFolderMenuOpen(false);
    try {
      await driveApi.downloadZip([{ id: currentFolder.id, type: "folder" }]);
    } catch (err) {
      console.error("Failed to download folder:", err);
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-lg font-medium text-slate-800 dark:text-slate-100 select-none">
      {/* Root Section */}
      <button
        type="button"
        onClick={() => setCurrentFolderId(null)}
        className="px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        {getSectionTitle()}
      </button>

      {/* Breadcrumb Hierarchy */}
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        return (
          <React.Fragment key={crumb.id}>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
            {isLast ? (
              <div className="relative inline-flex items-center" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsFolderMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-semibold text-slate-900 dark:text-white cursor-pointer"
                >
                  <span className="max-w-[200px] truncate">{crumb.name}</span>
                  <ChevronDown size={16} className="text-slate-500" />
                </button>

                {/* Current folder dropdown menu */}
                {isFolderMenuOpen && currentFolder && (
                  <div className="absolute top-10 left-0 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFolderMenuOpen(false);
                        onOpenNewFolderDialog?.();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
                    >
                      <FolderPlus size={16} className="text-slate-500" />
                      <span>New folder</span>
                    </button>
                    {onOpenRenameDialog && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsFolderMenuOpen(false);
                          onOpenRenameDialog({ id: currentFolder.id, name: currentFolder.name });
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
                      >
                        <Edit3 size={16} className="text-slate-500" />
                        <span>Rename</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDownloadFolderZip}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
                    >
                      <Download size={16} className="text-slate-500" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentFolderId(crumb.id)}
                className="px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 max-w-[160px] truncate cursor-pointer"
              >
                {crumb.name}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
