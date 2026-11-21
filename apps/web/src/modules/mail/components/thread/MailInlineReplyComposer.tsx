import React, { useState, useRef } from "react";
import {
  Reply,
  Forward,
  Trash2,
  Paperclip,
  Smile,
  Send,
  X,
  ChevronDown,
  HardDrive,
} from "lucide-react";
import type { FormattedThreadMessage } from "../../types";
import { mailApi } from "../../api/mail.api";
import { formatFullMessageDate, formatFileSize } from "./thread.utils";
import { DrivePickerModal, driveApi, type DriveFileItem } from "@/modules/drive";
import { cn } from "@/lib/utils";

export interface MailInlineReplyComposerProps {
  className?: string;
  message: FormattedThreadMessage;
  initialMode?: "reply" | "replyAll" | "forward";
  onCancel: () => void;
  onSent: () => void;
}

export const MailInlineReplyComposer: React.FC<MailInlineReplyComposerProps> = ({
  className,
  message,
  initialMode = "reply",
  onCancel,
  onSent,
}) => {
  const [mode, setMode] = useState<"reply" | "replyAll" | "forward">(initialMode);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // Recipients
  const senderEmail = message.sender?.email || "";
  const [toRecipients, setToRecipients] = useState<string[]>(() => {
    if (initialMode === "forward") return [];
    return senderEmail ? [senderEmail] : [];
  });
  const [ccRecipients, setCcRecipients] = useState<string[]>(() => {
    if (initialMode === "replyAll") {
      return (
        message.recipients
          ?.filter((r) => r.recipientType === "CC" || r.recipientType === "TO")
          .map((r) => r.user.email)
          .filter((email) => email !== senderEmail) || []
      );
    }
    return [];
  });
  const [newToInput, setNewToInput] = useState("");
  const [showCc, setShowCc] = useState(ccRecipients.length > 0);
  const [newCcInput, setNewCcInput] = useState("");

  // Content
  const [bodyText, setBodyText] = useState(() => {
    if (initialMode === "forward") {
      return `\n\n---------- Forwarded message ---------\nFrom: ${message.sender?.fullName || message.sender?.username} <${message.sender?.email}>\nDate: ${formatFullMessageDate(message.sentAt)}\nSubject: ${message.subject}\nTo: ${message.recipients?.map((r) => r.user.email).join(", ")}\n\n${message.body}`;
    }
    return "";
  });

  // Attachments
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<DriveFileItem[]>([]);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: "reply" | "replyAll" | "forward") => {
    setMode(newMode);
    setShowModeDropdown(false);
    if (newMode === "reply") {
      setToRecipients(senderEmail ? [senderEmail] : []);
      setCcRecipients([]);
    } else if (newMode === "replyAll") {
      setToRecipients(senderEmail ? [senderEmail] : []);
      const cc =
        message.recipients
          ?.filter((r) => r.recipientType === "CC" || r.recipientType === "TO")
          .map((r) => r.user.email)
          .filter((email) => email !== senderEmail) || [];
      setCcRecipients(cc);
      setShowCc(cc.length > 0);
    } else if (newMode === "forward") {
      setToRecipients([]);
      setCcRecipients([]);
      if (!bodyText.includes("---------- Forwarded message ---------")) {
        setBodyText(
          (prev) =>
            `${prev}\n\n---------- Forwarded message ---------\nFrom: ${message.sender?.fullName || message.sender?.username} <${message.sender?.email}>\nDate: ${formatFullMessageDate(message.sentAt)}\nSubject: ${message.subject}\nTo: ${message.recipients?.map((r) => r.user.email).join(", ")}\n\n${message.body}`,
        );
      }
    }
  };

  const handleAddRecipient = (type: "TO" | "CC", val: string) => {
    const cleaned = val.trim();
    if (!cleaned) return;
    if (type === "TO" && !toRecipients.includes(cleaned)) {
      setToRecipients((prev) => [...prev, cleaned]);
      setNewToInput("");
    } else if (type === "CC" && !ccRecipients.includes(cleaned)) {
      setCcRecipients((prev) => [...prev, cleaned]);
      setNewCcInput("");
    }
  };

  const handleRemoveRecipient = (type: "TO" | "CC", email: string) => {
    if (type === "TO") {
      setToRecipients((prev) => prev.filter((e) => e !== email));
    } else {
      setCcRecipients((prev) => prev.filter((e) => e !== email));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [
        ...prev,
        ...Array.from(e.target.files as FileList),
      ]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (toRecipients.length === 0) {
      setErrorMessage("Please specify at least one recipient");
      return;
    }

    if (!bodyText.trim() && selectedFiles.length === 0 && selectedDriveFiles.length === 0) {
      setErrorMessage("Please enter a message body");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      let uploadedAssetIds: string[] = selectedDriveFiles.map((df) => df.asset.id);

      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const uploadResult = await mailApi.uploadAttachments(selectedFiles);
        setIsUploading(false);
        if (uploadResult?.assets) {
          uploadedAssetIds = [...uploadedAssetIds, ...uploadResult.assets.map((a: any) => a.assetId)];
        } else if (uploadResult?.assetId) {
          uploadedAssetIds = [...uploadedAssetIds, uploadResult.assetId];
        }
      }

      // Automatically ensure recipients have access to any attached Drive files
      if (selectedDriveFiles.length > 0 && toRecipients.length > 0) {
        for (const df of selectedDriveFiles) {
          try {
            await driveApi.batchShareRecipients(df.id, {
              recipientEmails: toRecipients,
              role: "VIEWER",
            });
          } catch (shareErr) {
            console.warn("Could not batch share drive file with recipients:", shareErr);
          }
        }
      }

      const subjectPrefix = mode === "forward" ? "Fwd: " : "Re: ";
      const cleanSubject = message.subject.startsWith(subjectPrefix)
        ? message.subject
        : `${subjectPrefix}${message.subject}`;

      await mailApi.sendReply({
        to: toRecipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        subject: cleanSubject,
        body: bodyText,
        parentMessageId: message.id,
        attachmentIds:
          uploadedAssetIds.length > 0 ? uploadedAssetIds : undefined,
      });

      onSent();
    } catch (err) {
      console.error("Failed to send reply:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send message",
      );
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-in fade-in-50 duration-150",
        className,
      )}
    >
      {/* Header Bar with Mode selector and Recipient Chips */}
      <div className="p-3 bg-[#f8fafd] dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
        {/* Mode Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModeDropdown((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            {mode === "forward" ? (
              <Forward className="size-3.5 text-slate-600 dark:text-slate-300" />
            ) : (
              <Reply className="size-3.5 text-slate-600 dark:text-slate-300" />
            )}
            <span>
              {mode === "reply"
                ? "Reply"
                : mode === "replyAll"
                  ? "Reply all"
                  : "Forward"}
            </span>
            <ChevronDown className="size-3 text-slate-400" />
          </button>

          {showModeDropdown && (
            <div className="absolute left-0 top-8 z-30 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-xs">
              <button
                type="button"
                onClick={() => handleModeChange("reply")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
              >
                <Reply className="size-3.5" /> Reply
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("replyAll")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
              >
                <Reply className="size-3.5" /> Reply all
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("forward")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
              >
                <Forward className="size-3.5" /> Forward
              </button>
            </div>
          )}
        </div>

        {/* Recipients input area */}
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-[200px]">
          <span className="text-xs text-slate-500 font-medium">To:</span>
          {toRecipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/90 dark:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveRecipient("TO", email)}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={newToInput}
            onChange={(e) => setNewToInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddRecipient("TO", newToInput);
              }
            }}
            onBlur={() => handleAddRecipient("TO", newToInput)}
            placeholder={toRecipients.length === 0 ? "Add recipients..." : ""}
            className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
          />

          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer ml-auto"
            >
              Cc
            </button>
          )}
        </div>
      </div>

      {/* Optional CC line */}
      {showCc && (
        <div className="px-3 py-1.5 bg-[#f8fafd] dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Cc:</span>
          {ccRecipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/90 dark:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveRecipient("CC", email)}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newCcInput}
            onChange={(e) => setNewCcInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddRecipient("CC", newCcInput);
              }
            }}
            onBlur={() => handleAddRecipient("CC", newCcInput)}
            placeholder="Add Cc recipients..."
            className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
          />
        </div>
      )}

      {/* Main Textarea */}
      <div className="p-3">
        <textarea
          rows={6}
          autoFocus
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Type your reply here..."
          className="w-full resize-y bg-transparent text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 font-sans leading-relaxed min-h-[120px]"
        />

        {/* Selected File Chips (if any) */}
        {(selectedFiles.length > 0 || selectedDriveFiles.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {selectedFiles.map((file, idx) => (
              <div
                key={file.name + idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
              >
                <Paperclip className="size-3 text-slate-500" />
                <span className="truncate max-w-[150px] font-medium">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="p-0.5 hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {selectedDriveFiles.map((file, idx) => (
              <div
                key={file.id + idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-100"
              >
                <HardDrive className="size-3 text-[#1a73e8]" />
                <span className="truncate max-w-[150px] font-medium">
                  {file.name}
                </span>
                <span className="text-[10px] text-blue-500/80">
                  ({formatFileSize(Number(file.asset.bytes))})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDriveFiles((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  className="p-0.5 hover:text-red-500 cursor-pointer ml-1"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Bottom Action / Formatting Toolbar */}
      <div className="px-3 py-2 bg-[#f8fafd] dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
        {/* Left: Send Button + File Attachment + Emoji */}
        <div className="flex items-center gap-2">
          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || isUploading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0b57d0] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs active:scale-98"
          >
            <Send className="size-3.5" />
            <span>
              {isUploading
                ? "Uploading..."
                : isSending
                  ? "Sending..."
                  : "Send"}
            </span>
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attach File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            aria-label="Attach files"
            className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Paperclip className="size-4" />
          </button>

          {/* Insert from Google Drive */}
          <button
            type="button"
            onClick={() => setIsDrivePickerOpen(true)}
            title="Insert files using Drive"
            aria-label="Insert files using Drive"
            className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <HardDrive className="size-4 text-[#1a73e8]" />
          </button>

          {/* Quick Emoji Insert */}
          <button
            type="button"
            onClick={() => setBodyText((prev) => `${prev} 😊`)}
            title="Insert emoji"
            aria-label="Insert emoji"
            className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Smile className="size-4" />
          </button>
        </div>

        {/* Right: Discard Draft Trash Button */}
        <div>
          <button
            type="button"
            onClick={onCancel}
            title="Discard draft"
            aria-label="Discard draft"
            className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Google Drive Picker Modal */}
      <DrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={(selected, insertMode) => {
          if (insertMode === "link") {
            const links = selected
              .map(
                (f) =>
                  `\n📎 [${f.name} - Google Drive](${window.location.origin}/drive?preview=${f.id})`,
              )
              .join("");
            setBodyText((prev) => `${prev}${links}\n`);
          } else {
            setSelectedDriveFiles((prev) => {
              const existingIds = new Set(prev.map((d) => d.id));
              const newlyAdded = selected.filter((d) => !existingIds.has(d.id));
              return [...prev, ...newlyAdded];
            });
          }
        }}
      />
    </div>
  );
};

export default MailInlineReplyComposer;
