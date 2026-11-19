import React from "react";
import { PhoneOff, X, LogOut, ShieldAlert } from "lucide-react";

interface LeaveCallModalProps {
  isOpen: boolean;
  isHost: boolean;
  onClose: () => void;
  onLeaveOnly: () => void;
  onEndForEveryone: () => void;
}

export const LeaveCallModal: React.FC<LeaveCallModalProps> = ({
  isOpen,
  isHost,
  onClose,
  onLeaveOnly,
  onEndForEveryone,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#202124] text-neutral-900 dark:text-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm overflow-hidden p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <PhoneOff className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-medium">Leave call?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {isHost
            ? "As the host, you can leave the call or end it for everyone in the room."
            : "Are you sure you want to leave this call?"}
        </p>

        <div className="flex flex-col gap-2.5 pt-2">
          {isHost && (
            <button
              onClick={onEndForEveryone}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full shadow-xs transition flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>End meeting for everyone</span>
            </button>
          )}
          <button
            onClick={onLeaveOnly}
            className={`w-full py-2.5 px-4 text-sm font-medium rounded-full transition flex items-center justify-center gap-2 ${
              isHost
                ? "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>{isHost ? "Just leave call" : "Leave call"}</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveCallModal;
