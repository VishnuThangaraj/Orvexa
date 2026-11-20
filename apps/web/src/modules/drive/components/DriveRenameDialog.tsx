import React, { useState, useEffect } from "react";
import { Edit3, X } from "lucide-react";

interface DriveRenameDialogProps {
  isOpen: boolean;
  item: { id: string; name: string; type: "file" | "folder" } | null;
  onClose: () => void;
  onRename: (id: string, newName: string, type: "file" | "folder") => Promise<void>;
}

export const DriveRenameDialog: React.FC<DriveRenameDialogProps> = ({
  isOpen,
  item,
  onClose,
  onRename,
}) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === item.name) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    try {
      await onRename(item.id, name.trim(), item.type);
      onClose();
    } catch (err) {
      console.error("Failed to rename item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Edit3 size={18} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              Rename
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 transition-all"
            />
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
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-xs font-semibold bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Saving..." : "OK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
