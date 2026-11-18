import React, { useState } from "react";

interface RecurringActionModalProps {
  isOpen: boolean;
  actionType: "edit" | "delete";
  onConfirm: (mode: "SINGLE" | "ALL") => void;
  onCancel: () => void;
}

export const RecurringActionModal: React.FC<RecurringActionModalProps> = ({
  isOpen,
  actionType,
  onConfirm,
  onCancel,
}) => {
  const [selectedMode, setSelectedMode] = useState<"SINGLE" | "ALL">("SINGLE");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs select-none"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-100">
          {actionType === "delete" ? "Delete recurring event" : "Edit recurring event"}
        </h3>

        <div className="space-y-3 py-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="recurringMode"
              checked={selectedMode === "SINGLE"}
              onChange={() => setSelectedMode("SINGLE")}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              This event
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="recurringMode"
              checked={selectedMode === "ALL"}
              onChange={() => setSelectedMode("ALL")}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              All events
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedMode)}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-2xs transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringActionModal;
