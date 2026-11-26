import React, { useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Minus,
  Paperclip,
  HardDrive,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { mailApi } from "../api/mail.api";
import { mailKeys } from "../hooks/use-mail.inbox";
import { formatFileSize } from "./thread/thread.utils";
import { DrivePickerModal, driveApi, type DriveFileItem } from "@/modules/drive";
import { cn } from "@/lib/utils";

export interface MailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MailComposeModal: React.FC<MailComposeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [bccRecipients, setBccRecipients] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<DriveFileItem[]>([]);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const commitRecipient = (type: "TO" | "CC" | "BCC", raw: string) => {
    const cleaned = raw.trim().replace(/,$/, "").trim();
    if (!cleaned) return;
    if (type === "TO") {
      if (!toRecipients.includes(cleaned)) {
        setToRecipients((prev) => [...prev, cleaned]);
      }
      setToInput("");
    } else if (type === "CC") {
      if (!ccRecipients.includes(cleaned)) {
        setCcRecipients((prev) => [...prev, cleaned]);
      }
      setCcInput("");
    } else {
      if (!bccRecipients.includes(cleaned)) {
        setBccRecipients((prev) => [...prev, cleaned]);
      }
      setBccInput("");
    }
  };

  const resetForm = () => {
    setToRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setToInput("");
    setCcInput("");
    setBccInput("");
    setShowCc(false);
    setShowBcc(false);
    setSubject("");
    setBody("");
    setSelectedFiles([]);
    setSelectedDriveFiles([]);
    setErrorMessage(null);
    setIsMinimized(false);
    setIsExpanded(false);
  };

  const handleDiscard = () => {
    resetForm();
    onClose();
  };

  const handleSend = async () => {
    const finalTo = [...toRecipients];
    if (toInput.trim() && !finalTo.includes(toInput.trim())) {
      finalTo.push(toInput.trim());
    }
    if (finalTo.length === 0) {
      setErrorMessage("Please specify at least one recipient.");
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

      if (selectedDriveFiles.length > 0) {
        for (const df of selectedDriveFiles) {
          try {
            await driveApi.batchShareRecipients(df.id, {
              recipientEmails: finalTo,
              role: "VIEWER",
            });
          } catch (shareErr) {
            console.warn("Could not batch share drive file with recipients:", shareErr);
          }
        }
      }

      await mailApi.sendReply({
        to: finalTo,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
        subject: subject.trim(),
        body,
        attachmentIds: uploadedAssetIds.length > 0 ? uploadedAssetIds : undefined,
      });

      await queryClient.invalidateQueries({ queryKey: mailKeys.all });
      resetForm();
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send message",
      );
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  return (
    <>
      {isExpanded && !isMinimized && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={cn(
          "fixed z-50 flex flex-col bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#3c4043] shadow-[0_8px_28px_rgba(0,0,0,0.22)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.65)] transition-all duration-200 overflow-hidden",
          isExpanded && !isMinimized
            ? "inset-6 md:inset-12 lg:inset-x-24 lg:inset-y-10 rounded-2xl"
            : isMinimized
              ? "bottom-0 right-4 md:right-8 w-72 rounded-t-xl"
              : "bottom-0 right-2 md:right-8 w-[min(560px,calc(100vw-16px))] h-[min(560px,calc(100vh-80px))] rounded-t-2xl",
        )}
      >
        {/* Gmail Dark/Tonal Compose Header */}
        <div
          onClick={() => isMinimized && setIsMinimized(false)}
          className={cn(
            "flex items-center justify-between px-4 py-2.5 bg-[#f2f6fc] dark:bg-[#282a2c] text-[#1f1f1f] dark:text-[#e3e3e3] select-none shrink-0",
            isMinimized && "cursor-pointer",
          )}
        >
          <span className="text-[13.5px] font-medium truncate">
            {subject.trim() ? subject : "New Message"}
          </span>

          <div
            className="flex items-center gap-0.5 text-[#444746] dark:text-[#c4c7c5]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              title={isMinimized ? "Restore" : "Minimize"}
              aria-label={isMinimized ? "Restore" : "Minimize"}
              className="p-1.5 rounded-full hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMinimized(false);
                setIsExpanded((prev) => !prev);
              }}
              title={isExpanded ? "Exit full screen" : "Full screen"}
              aria-label={isExpanded ? "Exit full screen" : "Full screen"}
              className="p-1.5 rounded-full hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Save & close"
              aria-label="Close"
              className="p-1.5 rounded-full hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Recipients & Subject */}
            <div className="px-4 divide-y divide-[#eceef2] dark:divide-[#303134] text-[13px] shrink-0">
              <div className="flex flex-wrap items-center gap-1.5 py-2">
                <span className="text-[#5e5e5e] dark:text-[#9aa0a6] w-7 shrink-0">
                  To
                </span>
                {toRecipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e8eef7] dark:bg-[#303134] border border-[#dadce0] dark:border-[#444746] text-xs font-medium text-[#1f1f1f] dark:text-[#e3e3e3]"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setToRecipients((prev) => prev.filter((e) => e !== email))
                      }
                      className="text-[#5e5e5e] hover:text-[#d93025] dark:text-[#9aa0a6] cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      commitRecipient("TO", toInput);
                    }
                  }}
                  onBlur={() => commitRecipient("TO", toInput)}
                  placeholder={toRecipients.length === 0 ? "Recipients" : ""}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-[#1f1f1f] dark:text-[#e3e3e3] placeholder:text-[#747775] dark:placeholder:text-[#8e918f]"
                />
                <div className="flex items-center gap-2 text-xs text-[#5e5e5e] dark:text-[#9aa0a6] ml-auto">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="hover:underline cursor-pointer"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="hover:underline cursor-pointer"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              </div>

              {showCc && (
                <div className="flex flex-wrap items-center gap-1.5 py-2">
                  <span className="text-[#5e5e5e] dark:text-[#9aa0a6] w-7 shrink-0">
                    Cc
                  </span>
                  {ccRecipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e8eef7] dark:bg-[#303134] border border-[#dadce0] dark:border-[#444746] text-xs font-medium text-[#1f1f1f] dark:text-[#e3e3e3]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCcRecipients((prev) => prev.filter((e) => e !== email))
                        }
                        className="text-[#5e5e5e] hover:text-[#d93025] dark:text-[#9aa0a6] cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitRecipient("CC", ccInput);
                      }
                    }}
                    onBlur={() => commitRecipient("CC", ccInput)}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-[#1f1f1f] dark:text-[#e3e3e3]"
                  />
                </div>
              )}

              {showBcc && (
                <div className="flex flex-wrap items-center gap-1.5 py-2">
                  <span className="text-[#5e5e5e] dark:text-[#9aa0a6] w-7 shrink-0">
                    Bcc
                  </span>
                  {bccRecipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e8eef7] dark:bg-[#303134] border border-[#dadce0] dark:border-[#444746] text-xs font-medium text-[#1f1f1f] dark:text-[#e3e3e3]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setBccRecipients((prev) => prev.filter((e) => e !== email))
                        }
                        className="text-[#5e5e5e] hover:text-[#d93025] dark:text-[#9aa0a6] cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitRecipient("BCC", bccInput);
                      }
                    }}
                    onBlur={() => commitRecipient("BCC", bccInput)}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-[#1f1f1f] dark:text-[#e3e3e3]"
                  />
                </div>
              )}

              <div className="py-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full bg-transparent outline-none text-[13.5px] text-[#1f1f1f] dark:text-[#e3e3e3] placeholder:text-[#747775] dark:placeholder:text-[#8e918f]"
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col min-h-0 px-4 py-3 overflow-y-auto">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email..."
                className="flex-1 w-full resize-none bg-transparent outline-none text-[14px] leading-relaxed text-[#1f1f1f] dark:text-[#e3e3e3] placeholder:text-[#747775] dark:placeholder:text-[#8e918f]"
              />

              {(selectedFiles.length > 0 || selectedDriveFiles.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-[#eceef2] dark:border-[#303134]">
                  {selectedFiles.map((file, idx) => (
                    <span
                      key={`${file.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f2f6fc] dark:bg-[#282a2c] border border-[#dadce0] dark:border-[#3c4043] text-xs text-[#1f1f1f] dark:text-[#e3e3e3]"
                    >
                      <Paperclip className="size-3 text-[#5e5e5e]" />
                      <span className="truncate max-w-[140px]">{file.name}</span>
                      <span className="text-[10px] text-[#747775]">
                        ({formatFileSize(file.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="hover:text-[#d93025] cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {selectedDriveFiles.map((df, idx) => (
                    <span
                      key={`${df.id}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f0fe] dark:bg-[#004a77]/60 border border-[#d2e3fc] dark:border-[#00639b] text-xs text-[#0b57d0] dark:text-[#c2e7ff]"
                    >
                      <HardDrive className="size-3" />
                      <span className="truncate max-w-[140px]">{df.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDriveFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="hover:text-[#d93025] cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {errorMessage && (
                <p className="mt-2 text-xs font-medium text-[#d93025] dark:text-[#f28b82]">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Footer Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#eceef2] dark:border-[#303134] bg-white dark:bg-[#1e1f20] shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] dark:bg-[#a8c7fa] dark:hover:bg-[#8ab4f8] dark:text-[#062e6f] text-white text-[13.5px] font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Send className="size-3.5" />
                  <span>
                    {isUploading ? "Uploading..." : isSending ? "Sending..." : "Send"}
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setSelectedFiles((prev) => [
                        ...prev,
                        ...Array.from(e.target.files as FileList),
                      ]);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                  aria-label="Attach files"
                  className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
                >
                  <Paperclip className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrivePickerOpen(true)}
                  title="Insert files using Drive"
                  aria-label="Insert files using Drive"
                  className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
                >
                  <HardDrive className="size-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleDiscard}
                title="Discard draft"
                aria-label="Discard draft"
                className="p-2 rounded-full text-[#444746] dark:text-[#c4c7c5] hover:text-[#d93025] dark:hover:text-[#f28b82] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </>
        )}
      </div>

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
            setBody((prev) => `${prev}${links}\n`);
          } else {
            setSelectedDriveFiles((prev) => {
              const existing = new Set(prev.map((d) => d.id));
              return [...prev, ...selected.filter((d) => !existing.has(d.id))];
            });
          }
        }}
      />
    </>
  );
};

export default MailComposeModal;
