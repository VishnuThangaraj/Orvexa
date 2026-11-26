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
          uploadedAssetIds = [
            ...uploadedAssetIds,
            ...uploadResult.assets.map((a) => a.assetId),
          ];
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
        "mt-5 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#1e1f20] shadow-[0_1px_3px_0_rgba(60,64,67,0.16),0_2px_6px_2px_rgba(60,64,67,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.45)] overflow-hidden animate-in fade-in-50 duration-150",
        className,
      )}
    >
      {/* Header Bar with Mode selector and Recipient Chips */}
      <div className="p-3 bg-[#f8fafd] dark:bg-[#282a2c] border-b border-[#eceef2] dark:border-[#303134] flex flex-wrap items-center gap-2">
        {/* Mode Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModeDropdown((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#444746] text-[#1f1f1f] dark:text-[#e3e3e3] hover:bg-[#f2f6fc] dark:hover:bg-[#3c4043] cursor-pointer transition-colors"
          >
            {mode === "forward" ? (
              <Forward className="size-3.5 text-[#444746] dark:text-[#c4c7c5]" />
            ) : (
              <Reply className="size-3.5 text-[#444746] dark:text-[#c4c7c5]" />
            )}
            <span>
              {mode === "reply"
                ? "Reply"
                : mode === "replyAll"
                  ? "Reply all"
                  : "Forward"}
            </span>
            <ChevronDown className="size-3 text-[#747775] dark:text-[#9aa0a6]" />
          </button>

          {showModeDropdown && (
            <div className="absolute left-0 top-8 z-30 w-36 bg-white dark:bg-[#282a2c] border border-[#e1e3e1] dark:border-[#3c4043] rounded-xl shadow-lg py-1 text-xs text-[#1f1f1f] dark:text-[#e3e3e3]">
              <button
                type="button"
                onClick={() => handleModeChange("reply")}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer flex items-center gap-2"
              >
                <Reply className="size-3.5" /> Reply
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("replyAll")}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer flex items-center gap-2"
              >
                <Reply className="size-3.5" /> Reply all
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("forward")}
                className="w-full text-left px-3 py-2 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] cursor-pointer flex items-center gap-2"
              >
                <Forward className="size-3.5" /> Forward
              </button>
            </div>
          )}
        </div>

        {/* Recipients input area */}
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-[200px]">
          <span className="text-xs text-[#5e5e5e] dark:text-[#9aa0a6] font-medium">
            To:
          </span>
          {toRecipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e8eef7] dark:bg-[#303134] border border-[#dadce0] dark:border-[#444746] text-xs font-medium text-[#1f1f1f] dark:text-[#e3e3e3]"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveRecipient("TO", email)}
                className="hover:text-[#d93025] cursor-pointer"
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
            className="flex-1 min-w-[120px] bg-transparent text-xs text-[#1f1f1f] dark:text-[#e3e3e3] outline-none placeholder:text-[#747775] dark:placeholder:text-[#8e918f]"
          />

          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-xs text-[#5e5e5e] hover:text-[#1f1f1f] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] font-medium cursor-pointer ml-auto"
            >
              Cc
            </button>
          )}
        </div>
      </div>

      {/* Optional CC line */}
      {showCc && (
        <div className="px-3 py-2 bg-[#f8fafd] dark:bg-[#282a2c]/70 border-b border-[#eceef2] dark:border-[#303134] flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#5e5e5e] dark:text-[#9aa0a6] font-medium">
            Cc:
          </span>
          {ccRecipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e8eef7] dark:bg-[#303134] border border-[#dadce0] dark:border-[#444746] text-xs font-medium text-[#1f1f1f] dark:text-[#e3e3e3]"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveRecipient("CC", email)}
                className="hover:text-[#d93025] cursor-pointer"
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
            className="flex-1 min-w-[120px] bg-transparent text-xs text-[#1f1f1f] dark:text-[#e3e3e3] outline-none placeholder:text-[#747775] dark:placeholder:text-[#8e918f]"
          />
        </div>
      )}

      {/* Main Textarea */}
      <div className="p-4">
        <textarea
          rows={6}
          autoFocus
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Type your reply here..."
          className="w-full resize-y bg-transparent text-[14px] text-[#1f1f1f] dark:text-[#e3e3e3] outline-none placeholder:text-[#747775] dark:placeholder:text-[#8e918f] font-sans leading-relaxed min-h-[120px]"
        />

        {/* Selected File Chips (if any) */}
        {(selectedFiles.length > 0 || selectedDriveFiles.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-[#eceef2] dark:border-[#303134]">
            {selectedFiles.map((file, idx) => (
              <div
                key={file.name + idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f2f6fc] dark:bg-[#282a2c] border border-[#dadce0] dark:border-[#3c4043] text-xs text-[#1f1f1f] dark:text-[#e3e3e3]"
              >
                <Paperclip className="size-3 text-[#5e5e5e]" />
                <span className="truncate max-w-[150px] font-medium">
                  {file.name}
                </span>
                <span className="text-[10px] text-[#747775]">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="p-0.5 hover:text-[#d93025] cursor-pointer ml-1"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {selectedDriveFiles.map((file, idx) => (
              <div
                key={file.id + idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f0fe] dark:bg-[#004a77]/60 border border-[#d2e3fc] dark:border-[#00639b] text-xs text-[#0b57d0] dark:text-[#c2e7ff]"
              >
                <HardDrive className="size-3" />
                <span className="truncate max-w-[150px] font-medium">
                  {file.name}
                </span>
                <span className="text-[10px] opacity-80">
                  ({formatFileSize(Number(file.asset.bytes))})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDriveFiles((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  className="p-0.5 hover:text-[#d93025] cursor-pointer ml-1"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-2 text-xs text-[#d93025] dark:text-[#f28b82] font-medium">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Bottom Action / Formatting Toolbar */}
      <div className="px-4 py-2.5 bg-[#f8fafd] dark:bg-[#282a2c] border-t border-[#eceef2] dark:border-[#303134] flex items-center justify-between select-none">
        {/* Left: Send Button + File Attachment + Emoji */}
        <div className="flex items-center gap-1.5">
          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || isUploading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] dark:bg-[#a8c7fa] dark:hover:bg-[#8ab4f8] dark:text-[#062e6f] disabled:opacity-50 text-white text-xs font-medium cursor-pointer transition-all shadow-xs active:scale-98"
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
            className="p-2 rounded-full hover:bg-black/8 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c7c5] transition-colors cursor-pointer"
          >
            <Paperclip className="size-4" />
          </button>

          {/* Insert from Google Drive */}
          <button
            type="button"
            onClick={() => setIsDrivePickerOpen(true)}
            title="Insert files using Drive"
            aria-label="Insert files using Drive"
            className="p-2 rounded-full hover:bg-black/8 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c7c5] transition-colors cursor-pointer"
          >
            <HardDrive className="size-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
          </button>

          {/* Quick Emoji Insert */}
          <button
            type="button"
            onClick={() => setBodyText((prev) => `${prev} 😊`)}
            title="Insert emoji"
            aria-label="Insert emoji"
            className="p-2 rounded-full hover:bg-black/8 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c7c5] transition-colors cursor-pointer"
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
            className="p-2 rounded-full hover:bg-black/8 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c7c5] hover:text-[#d93025] dark:hover:text-[#f28b82] transition-colors cursor-pointer"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Orvexa Drive Picker Modal */}
      <DrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={(selected, insertMode) => {
          if (insertMode === "link") {
            const links = selected
              .map(
                (f) =>
                  `\n📎 [${f.name} - Orvexa Drive](${window.location.origin}/drive?preview=${f.id})`,
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
