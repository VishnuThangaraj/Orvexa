import React, { useState } from "react";
import { FolderPlus, X } from "lucide-react";

interface DriveNewFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color?: string) => Promise<void>;
}

const FOLDER_COLORS = [
  "#5f6368", // default grey
  "#4285f4", // blue
  "#ea4335", // red
  "#fbbc04", // yellow
  "#34a853", // green
  "#a142f4", // purple
  "#ff7043", // orange
  "#00acc1", // cyan
];

export const DriveNewFolderDialog: React.FC<DriveNewFolderDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [folderName, setFolderName] = useState("Untitled folder");
  const [selectedColor, setSelectedColor] = useState("#5f6368");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate(folderName.trim(), selectedColor);
      onClose();
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <FolderPlus size={20} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              New folder
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Folder color
            </label>
            <div className="flex items-center gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    selectedColor === c ? "scale-125 ring-2 ring-offset-2 ring-[#1a73e8]" : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className="px-4 py-2 text-xs font-semibold bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
