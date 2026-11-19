import React, { useState } from "react";
import { Copy, Check, X, Link2 } from "lucide-react";
import { formatMeetingUrl } from "../utils/meet.utils";

interface CreateLaterModalProps {
  meetingCode: string;
  onClose: () => void;
}

export const CreateLaterModal: React.FC<CreateLaterModalProps> = ({
  meetingCode,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const meetingUrl = formatMeetingUrl(meetingCode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-normal text-slate-800 dark:text-slate-100">
            Here's the link to your meeting
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Copy this link and send it to people you want to meet with. Be sure to
          save it so you can use it later, too.
        </p>

        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <Link2 size={18} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-800 dark:text-slate-200 font-mono truncate select-all flex-1">
            {meetingUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer shrink-0"
            title="Copy link"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLaterModal;
