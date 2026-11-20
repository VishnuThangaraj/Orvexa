import React, { useEffect } from "react";
import { X, Download, Printer, ExternalLink } from "lucide-react";
import type { FormattedInboxAttachment } from "../../types";
import { formatFileSize } from "./thread.utils";

export interface MailAttachmentModalProps {
  attachment: FormattedInboxAttachment | null;
  onClose: () => void;
}

export const MailAttachmentModal: React.FC<MailAttachmentModalProps> = ({
  attachment,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!attachment) return null;

  const isImage =
    attachment.mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(
      (attachment.format || "").toLowerCase(),
    );

  const isPdf =
    attachment.mimeType.includes("pdf") ||
    (attachment.format || "").toLowerCase() === "pdf";

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attachment.secureUrl) return;
    const a = document.createElement("a");
    a.href = attachment.secureUrl;
    a.download = attachment.originalFilename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      {/* Top Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between px-6 py-3 bg-black/60 text-white border-b border-white/10 shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-sm truncate max-w-md">
            {attachment.originalFilename}
          </span>
          <span className="text-xs text-white/60">
            ({formatFileSize(attachment.bytes)})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download"
            aria-label="Download attachment"
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="size-4.5" />
          </button>

          {/* Open in new tab */}
          {attachment.secureUrl && (
            <a
              href={attachment.secureUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open original"
              aria-label="Open original"
              className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <ExternalLink className="size-4.5" />
            </a>
          )}

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            title="Print"
            aria-label="Print"
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <Printer className="size-4.5" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer ml-2"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-center justify-center p-6 overflow-hidden"
      >
        {isImage && attachment.secureUrl ? (
          <img
            src={attachment.secureUrl}
            alt={attachment.originalFilename}
            className="max-h-full max-w-full object-contain rounded shadow-2xl"
          />
        ) : isPdf && attachment.secureUrl ? (
          <iframe
            src={attachment.secureUrl}
            title={attachment.originalFilename}
            className="w-full h-full max-w-5xl rounded shadow-2xl bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-white/10 rounded-2xl text-center text-white max-w-sm">
            <p className="font-semibold text-base mb-2">
              {attachment.originalFilename}
            </p>
            <p className="text-xs text-white/70 mb-4">
              Preview is not available for this file type.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="size-4" /> Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MailAttachmentModal;
