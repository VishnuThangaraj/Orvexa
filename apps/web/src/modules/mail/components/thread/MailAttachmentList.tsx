import React, { useState } from "react";
import {
  Download,
  FileText,
  Image,
  Info,
  FolderPlus,
  Loader2,
  Check,
} from "lucide-react";
import type { FormattedInboxAttachment } from "../../types";
import { formatFileSize } from "./thread.utils";
import MailAttachmentModal from "./MailAttachmentModal";
import { driveApi } from "@/modules/drive";
import { cn } from "@/lib/utils";

export interface MailAttachmentListProps {
  className?: string;
  attachments: FormattedInboxAttachment[];
  onAddToDrive?: () => void;
}

export const MailAttachmentList: React.FC<MailAttachmentListProps> = ({
  className,
  attachments,
  onAddToDrive,
}) => {
  const [selectedAttachment, setSelectedAttachment] =
    useState<FormattedInboxAttachment | null>(null);
  const [driveAdded, setDriveAdded] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  if (!attachments || attachments.length === 0) return null;

  const countLabel =
    attachments.length === 1
      ? "One attachment"
      : `${attachments.length} attachments`;

  const handleAddToDrive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSavingAll) return;
    setIsSavingAll(true);
    try {
      for (const att of attachments) {
        await driveApi.saveAssetToDrive({
          assetId: att.id,
          filename: att.originalFilename,
        });
      }
      setSavedIds(new Set(attachments.map((a) => a.id)));
      setDriveAdded(true);
      onAddToDrive?.();
      setTimeout(() => {
        setDriveAdded(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save attachments to Drive", err);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSaveOneToDrive = async (
    e: React.MouseEvent,
    att: FormattedInboxAttachment,
  ) => {
    e.stopPropagation();
    if (savingIds.has(att.id) || savedIds.has(att.id)) return;
    setSavingIds((prev) => new Set(prev).add(att.id));
    try {
      await driveApi.saveAssetToDrive({
        assetId: att.id,
        filename: att.originalFilename,
      });
      setSavedIds((prev) => new Set(prev).add(att.id));
    } catch (err) {
      console.error("Failed to save attachment to Drive", err);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(att.id);
        return next;
      });
    }
  };

  const handleDownloadAttachment = (
    e: React.MouseEvent,
    att: FormattedInboxAttachment,
  ) => {
    e.stopPropagation();
    if (!att.secureUrl) return;
    const a = document.createElement("a");
    a.href = att.secureUrl;
    a.download = att.originalFilename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImageAttachment = (att: FormattedInboxAttachment) => {
    const ext = (
      att.format ||
      att.originalFilename.split(".").pop() ||
      ""
    ).toLowerCase();
    const mime = (att.mimeType || "").toLowerCase();
    return (
      mime.startsWith("image/") ||
      ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)
    );
  };

  const isPdfAttachment = (att: FormattedInboxAttachment) => {
    const ext = (
      att.format ||
      att.originalFilename.split(".").pop() ||
      ""
    ).toLowerCase();
    const mime = (att.mimeType || "").toLowerCase();
    return ext === "pdf" || mime.includes("pdf");
  };

  return (
    <>
      <div
        className={cn(
          "mt-6 pt-3 border-t border-dashed border-slate-200/90 dark:border-slate-800/90 select-none",
          className,
        )}
      >
        {/* Header Row: Count • Scanned by Orvexa Mail ⓘ and Add to Drive */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {countLabel}
            </span>
            <span>•</span>
            <span>Scanned by Orvexa Mail</span>
            <span
              title="All attachments are scanned for malware and viruses by Orvexa Security"
              className="cursor-help"
            >
              <Info className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
            </span>
          </div>

          {/* Add to Drive button */}
          <button
            type="button"
            disabled={isSavingAll}
            onClick={handleAddToDrive}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-60"
          >
            {isSavingAll ? (
              <Loader2 className="size-4 animate-spin text-[#1a73e8]" />
            ) : driveAdded ? (
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FolderPlus className="size-4 text-[#1a73e8]" />
            )}
            <span>
              {isSavingAll
                ? "Saving..."
                : driveAdded
                  ? "Saved to Drive"
                  : "Add to Drive"}
            </span>
          </button>
        </div>

        {/* Attachment Preview Cards Grid */}
        <div className="flex flex-wrap gap-3">
          {attachments.map((att) => {
            const isImg = isImageAttachment(att);
            const isPdf = isPdfAttachment(att);

            return (
              <div
                key={att.id}
                onClick={() => setSelectedAttachment(att)}
                className="group relative w-52 md:w-56 bg-[#f2f6fc]/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/90 dark:border-slate-700/80 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col shrink-0"
              >
                {/* Preview Thumbnail Area with classic Dog-Ear Fold */}
                <div className="relative h-28 w-full bg-[#f8fafd] dark:bg-slate-900/60 overflow-hidden flex items-center justify-center border-b border-slate-200/60 dark:border-slate-700/60">
                  {isImg && att.secureUrl ? (
                    <img
                      src={att.secureUrl}
                      alt={att.originalFilename}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                    />
                  ) : isPdf ? (
                    <div className="flex flex-col items-center justify-center text-center p-3">
                      <span className="px-2 py-0.5 rounded bg-[#d93025] text-white text-[10px] font-bold leading-none select-none mb-1 shadow-2xs">
                        PDF
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Document
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3">
                      <FileText className="size-7 text-[#1a73e8] mb-1" />
                      <span className="text-[11px] text-slate-500 font-medium uppercase">
                        {att.format || "FILE"}
                      </span>
                    </div>
                  )}

                  {/* Corner dog-ear fold decoration in bottom-right */}
                  <div className="absolute bottom-0 right-0 w-0 h-0 border-t-8 border-l-8 border-t-transparent border-l-transparent border-r-8 border-b-8 border-r-white dark:border-r-slate-800 border-b-white dark:border-b-slate-800 shadow-2xs pointer-events-none" />
                </div>

                {/* Bottom Metadata & Download Action */}
                <div className="p-2.5 bg-white dark:bg-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isImg ? (
                        <Image className="size-3.5 text-[#1a73e8] shrink-0" />
                      ) : (
                        <FileText className="size-3.5 text-slate-500 shrink-0" />
                      )}
                      <p
                        title={att.originalFilename}
                        className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight"
                      >
                        {att.originalFilename}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal ml-5">
                      {formatFileSize(att.bytes)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick Save to Drive icon */}
                    <button
                      type="button"
                      onClick={(e) => handleSaveOneToDrive(e, att)}
                      title={savedIds.has(att.id) ? "Saved to Drive" : "Save to Drive"}
                      aria-label="Save attachment to Drive"
                      disabled={savingIds.has(att.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                    >
                      {savingIds.has(att.id) ? (
                        <Loader2 className="size-4 animate-spin text-[#1a73e8]" />
                      ) : savedIds.has(att.id) ? (
                        <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <FolderPlus className="size-4" />
                      )}
                    </button>

                    {/* Quick Download icon */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadAttachment(e, att)}
                      title="Download"
                      aria-label="Download attachment"
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <MailAttachmentModal
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
      />
    </>
  );
};

export default MailAttachmentList;
