import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  Plus,
  Send,
  Smile,
  X,
  FileText,
  Loader2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  Link as LinkIcon,
  Type,
  HardDrive,
} from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSendMessage } from "../hooks/use-messages";
import { useSocket } from "../hooks/use-socket";
import { chatApi } from "../api/chat.api";
import { DrivePickerModal, driveApi, type DriveFileItem } from "@/modules/drive";
import { cn } from "@/lib/utils";
import type {
  UploadedChatAsset,
  ConversationParticipant,
  ConversationMemberRole,
} from "../types/chat.types";

export interface MessageInputHandle {
  handleDroppedFiles: (files: File[]) => void;
}

interface MessageInputProps {
  conversationId: string;
  placeholder?: string;
  isGroup?: boolean;
  participants?: ConversationParticipant[];
  currentUserRole?: ConversationMemberRole;
}

interface MentionCandidate {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
  isAll?: boolean;
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(({
  conversationId,
  placeholder = "Type a message...",
  isGroup = false,
  participants = [],
  currentUserRole = "MEMBER",
}, ref) => {
  const [content, setContent] = useState(
    () => localStorage.getItem(`chat_draft_${conversationId}`) || "",
  );
  const [attachments, setAttachments] = useState<UploadedChatAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showFormattingBar, setShowFormattingBar] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<DriveFileItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Mention autocomplete state (Mandatory Fix 3: strictly for Spaces)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [selectedMentionUserIds, setSelectedMentionUserIds] = useState<string[]>([]);
  const [isMentionAllSelected, setIsMentionAllSelected] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = useAuthStore((state) => state.user);
  const { replyingToMessage, setReplyingToMessage } = useChatStore();
  const sendMessage = useSendMessage(conversationId);
  const { emit } = useSocket();

  const isManager = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  // Filter mention candidates
  const mentionCandidates: MentionCandidate[] = useMemo(() => {
    if (!isGroup || mentionQuery === null) return [];

    const query = mentionQuery.toLowerCase();
    const list: MentionCandidate[] = [];

    // If space manager, offer @all / @everyone
    if (
      isManager &&
      ("all".startsWith(query) ||
        "everyone".startsWith(query) ||
        query === "")
    ) {
      list.push({
        id: "all",
        fullName: "Everyone in this space",
        username: "all",
        isAll: true,
      });
    }

    // Active space members except currentUser
    const spaceMembers = (participants || []).filter(
      (p) => !p.leftAt && String(p.userId) !== String(currentUser?.id),
    );

    spaceMembers.forEach((p) => {
      const matchName = p.user.fullName?.toLowerCase().includes(query);
      const matchUsername = p.user.username?.toLowerCase().includes(query);
      if (matchName || matchUsername || query === "") {
        list.push({
          id: String(p.userId),
          fullName: p.user.fullName,
          username: p.user.username,
          avatarUrl: p.user.profileImage?.secureUrl,
          isAll: false,
        });
      }
    });

    return list.slice(0, 8);
  }, [isGroup, mentionQuery, isManager, participants, currentUser?.id]);

  // Apply formatting to selection
  const applyFormat = (
    prefix: string,
    suffix: string = prefix,
    placeholderText: string = "",
  ) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? content.length;
    const end = input.selectionEnd ?? content.length;
    const selected = content.slice(start, end) || placeholderText;
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent = content.slice(0, start) + replacement + content.slice(end);
    setContent(newContent);
    localStorage.setItem(`chat_draft_${conversationId}`, newContent);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
    }, 0);
  };

  // Typing event emission with debouncing & mention trigger detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);
    if (sendError) setSendError(null);

    // Task 3.6: Persist draft
    if (val.trim()) {
      localStorage.setItem(`chat_draft_${conversationId}`, val);
    } else {
      localStorage.removeItem(`chat_draft_${conversationId}`);
    }

    // Mandatory Fix 3: Autocomplete triggers ONLY inside a space
    if (isGroup) {
      const cursor = e.target.selectionStart ?? val.length;
      const textBefore = val.slice(0, cursor);
      const lastAt = textBefore.lastIndexOf("@");

      if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBefore[lastAt - 1]))) {
        const query = textBefore.slice(lastAt + 1);
        if (!/\s/.test(query)) {
          setMentionStartIndex(lastAt);
          setMentionQuery(query);
          setSelectedMentionIndex(0);
        } else {
          setMentionQuery(null);
        }
      } else {
        setMentionQuery(null);
      }
    } else {
      // In 1:1 Direct Messages, typing @ is plain text and no popup appears
      setMentionQuery(null);
    }

    // Emit typing:start
    emit("typing:start", { conversationId });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      emit("typing:stop", { conversationId });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleSelectMention = (candidate: MentionCandidate) => {
    if (mentionStartIndex === -1) return;

    const cursor = inputRef.current?.selectionStart ?? content.length;
    const beforeAt = content.slice(0, mentionStartIndex);
    const afterCursor = content.slice(cursor);

    const replacement = candidate.isAll ? `@all ` : `@${candidate.fullName} `;
    const newContent = `${beforeAt}${replacement}${afterCursor}`;
    setContent(newContent);

    if (candidate.isAll) {
      setIsMentionAllSelected(true);
    } else {
      setSelectedMentionUserIds((prev) =>
        prev.includes(candidate.id) ? prev : [...prev, candidate.id],
      );
    }

    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = beforeAt.length + replacement.length;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate size (max 25MB per file per backend chatAttachmentUpload configuration)
    const MAX_SIZE = 25 * 1024 * 1024;
    for (const f of fileArray) {
      if (f.size > MAX_SIZE) {
        alert(`File "${f.name}" exceeds the 25MB maximum limit.`);
        return;
      }
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const formData = new FormData();
      fileArray.forEach((file) => {
        formData.append("files", file);
      });

      const res = await chatApi.uploadAttachments(formData, {
        signal: controller.signal,
        onProgress: (pct) => setUploadProgress(pct),
      });

      if (res.assets) {
        setAttachments((prev) => [...prev, ...res.assets]);
      }
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : "";
      if (errorName === "CanceledError" || errorName === "AbortError") {
        console.log("Upload cancelled by user");
      } else {
        console.error("Failed to upload chat attachments:", err);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      abortControllerRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      handleDroppedFiles: (files: File[]) => {
        if (files.length > 0) {
          void uploadFiles(files);
        }
      },
    }),
    [],
  );

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  // Task 4.1: Handle clipboard paste for images and files
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const filesToUpload: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) filesToUpload.push(file);
      }
    }

    if (filesToUpload.length > 0) {
      e.preventDefault();
      uploadFiles(filesToUpload);
    }
  };

  const handleRemoveAttachment = (assetId: string) => {
    setAttachments((prev) => prev.filter((a) => a.assetId !== assetId));
  };

  const handleDrivePickerSelect = (files: DriveFileItem[], mode: "attachment" | "link") => {
    if (mode === "link") {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const links = files
        .map((f) => `📎 [Drive File: ${f.name}](${origin}/drive?preview=${f.id})`)
        .join("\n");
      setContent((prev) => (prev ? `${prev}\n${links}` : links));
    } else {
      setSelectedDriveFiles((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newFiles = files.filter((f) => !existingIds.has(f.id));
        return [...prev, ...newFiles];
      });
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0 && selectedDriveFiles.length === 0) return;

    // Cancel typing timer and emit typing:stop
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    emit("typing:stop", { conversationId });

    const clientMessageId = crypto.randomUUID();
    const allAttachmentIds = [
      ...attachments.map((a) => a.assetId),
      ...selectedDriveFiles.map((df) => df.asset.id),
    ];

    // Share attached Drive files with all participants
    const participantEmails = participants
      .map((p) => p.user?.email)
      .filter((email): email is string => Boolean(email) && email !== currentUser?.email);

    if (selectedDriveFiles.length > 0 && participantEmails.length > 0) {
      for (const df of selectedDriveFiles) {
        try {
          await driveApi.batchShareRecipients(df.id, {
            recipientEmails: participantEmails,
            role: "VIEWER",
          });
        } catch (shareErr) {
          console.warn("Could not batch share drive file with chat participants:", shareErr);
        }
      }
    }

    const previousContent = content;
    const previousAttachments = attachments;
    const previousSelectedDriveFiles = selectedDriveFiles;
    const previousReplyingToMessage = replyingToMessage;
    const previousSelectedMentionUserIds = selectedMentionUserIds;
    const previousIsMentionAllSelected = isMentionAllSelected;

    sendMessage.mutate(
      {
        content: trimmed || (allAttachmentIds.length > 0 ? "Shared attachments" : ""),
        clientMessageId,
        parentMessageId: replyingToMessage?.id || null,
        attachmentIds: allAttachmentIds,
        ...(isGroup && {
          mentionedUserIds: selectedMentionUserIds,
          isMentionAll: isMentionAllSelected,
        }),
      },
      {
        onError: (err) => {
          // Task 2.2: Restore draft and input state on error to prevent lost messages
          setContent(previousContent);
          setAttachments(previousAttachments);
          setSelectedDriveFiles(previousSelectedDriveFiles);
          setReplyingToMessage(previousReplyingToMessage);
          setSelectedMentionUserIds(previousSelectedMentionUserIds);
          setIsMentionAllSelected(previousIsMentionAllSelected);
          if (previousContent.trim()) {
            localStorage.setItem(`chat_draft_${conversationId}`, previousContent);
          }
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ||
            "Failed to send message. Please try again.";
          setSendError(msg);
        },
      },
    );

    // Clear persisted draft on send
    localStorage.removeItem(`chat_draft_${conversationId}`);
    setContent("");
    setAttachments([]);
    setSelectedDriveFiles([]);
    setReplyingToMessage(null);
    setSelectedMentionUserIds([]);
    setIsMentionAllSelected(false);
    setMentionQuery(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Task 3.1: Formatting keyboard shortcuts (Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+K, Ctrl/Cmd+E)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        applyFormat("*", "*", "bold text");
        return;
      }
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        applyFormat("_", "_", "italic text");
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        applyFormat("`", "`", "code");
        return;
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        applyFormat("https://", "", "example.com");
        return;
      }
      if ((e.shiftKey && (e.key === "x" || e.key === "X")) || e.key === "~") {
        e.preventDefault();
        applyFormat("~", "~", "strikethrough");
        return;
      }
    }

    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectMention(mentionCandidates[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0 relative">
      {sendError && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-2 text-xs text-rose-700 dark:text-rose-300">
          <span>{sendError}</span>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />

      {/* Mention suggestions popup (Mandatory Fix 3: Spaces only) */}
      {isGroup && mentionQuery !== null && mentionCandidates.length > 0 && (
        <div className="mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 bg-[#f0f4f9] dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Space Members & Mentions
          </div>
          {mentionCandidates.map((cand, idx) => (
            <button
              key={cand.id}
              type="button"
              onClick={() => handleSelectMention(cand)}
              onMouseEnter={() => setSelectedMentionIndex(idx)}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors cursor-pointer text-xs",
                idx === selectedMentionIndex
                  ? "bg-[#d3e3fd]/60 text-[#001d35] dark:bg-[#004a77]/50 dark:text-[#c2e7ff]"
                  : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {cand.isAll ? (
                <div className="w-7 h-7 rounded-full bg-[#0b57d0] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  @
                </div>
              ) : cand.avatarUrl ? (
                <img
                  src={cand.avatarUrl}
                  alt={cand.fullName}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#c2e7ff] text-[#001d35] dark:bg-slate-700 dark:text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {cand.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-1.5">
                  <span>{cand.fullName}</span>
                  {cand.isAll && (
                    <span className="text-[10px] bg-[#0b57d0]/10 text-[#0b57d0] dark:bg-[#c2e7ff]/20 dark:text-[#c2e7ff] px-1.5 py-0.2 rounded-full font-bold">
                      All members
                    </span>
                  )}
                </div>
                {!cand.isAll && (
                  <div className="text-[11px] text-slate-400 truncate">
                    @{cand.username}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Replying banner */}
      {replyingToMessage && (
        <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-[#eaf1fb] dark:bg-[#004a77]/30 border border-[#c2e7ff] dark:border-[#004a77] flex items-center justify-between text-xs">
          <div className="truncate">
            <span className="font-bold text-[#001d35] dark:text-[#c2e7ff] mr-2">
              Replying to {replyingToMessage.sender?.fullName}:
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {replyingToMessage.content}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingToMessage(null)}
            className="text-slate-400 hover:text-slate-700 ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Progress Bar with Cancel */}
      {isUploading && (
        <div className="mb-2.5 px-3 py-2 bg-[#f0f4f9] dark:bg-slate-800 rounded-xl border border-[#c2e7ff] dark:border-slate-700 flex items-center gap-3 text-xs animate-in fade-in">
          <Loader2 size={15} className="animate-spin text-[#0b57d0] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Uploading attachments...
              </span>
              <span className="font-semibold text-[#0b57d0] dark:text-[#a8c7fa]">
                {uploadProgress !== null ? `${uploadProgress}%` : "Processing..."}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0b57d0] transition-all duration-150"
                style={{ width: `${uploadProgress ?? 15}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelUpload}
            className="px-2 py-0.5 rounded text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Attachments preview strip */}
      {(attachments.length > 0 || selectedDriveFiles.length > 0) && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.assetId}
              className="px-2.5 py-1 rounded-lg bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-xs"
            >
              {att.mimeType?.startsWith("image/") && att.secureUrl ? (
                <img
                  src={att.secureUrl}
                  alt={att.originalFilename}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <FileText size={14} className="text-[#0b57d0]" />
              )}
              <span className="truncate max-w-40 font-medium text-slate-800 dark:text-slate-200">
                {att.originalFilename}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.assetId)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {selectedDriveFiles.map((df) => (
            <div
              key={df.id}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs shadow-2xs"
            >
              <HardDrive size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span className="truncate max-w-40 font-medium text-emerald-900 dark:text-emerald-200">
                {df.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDriveFiles((prev) => prev.filter((f) => f.id !== df.id))}
                className="text-emerald-500 hover:text-rose-500 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task 3.1: Formatting Toolbar matching Orvexa Chat */}
      {showFormattingBar && (
        <div className="mb-2 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => applyFormat("*", "*", "bold text")}
            title="Bold (Ctrl+B)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat("_", "_", "italic text")}
            title="Italic (Ctrl+I)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat("~", "~", "strikethrough")}
            title="Strikethrough"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <Strikethrough size={15} />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={() => applyFormat("`", "`", "code")}
            title="Inline code (Ctrl+E)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <Code size={15} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat("```\n", "\n```", "code block")}
            title="Code block"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-xs font-mono font-bold transition-colors"
          >
            {"{ }"}
          </button>
          <button
            type="button"
            onClick={() => applyFormat("> ", "", "quote")}
            title="Quote"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <Quote size={15} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat("- ", "", "item")}
            title="Bulleted list"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat("https://", "", "example.com")}
            title="Link (Ctrl+K)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <LinkIcon size={15} />
          </button>
        </div>
      )}

      {/* Input container matching uploaded Orvexa Chat screenshot */}
      <div className="flex items-center gap-2">
        {/* "+" Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Add attachment"
          className="w-10 h-10 rounded-full bg-[#c2e7ff] hover:bg-[#b3dbf7] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin text-[#001d35] dark:text-[#c2e7ff]" />
          ) : (
            <Plus size={19} className="stroke-[2.5]" />
          )}
        </button>

        {/* Share from Drive Button */}
        <button
          type="button"
          onClick={() => setIsDrivePickerOpen(true)}
          title="Share from Drive"
          className="w-10 h-10 rounded-full bg-[#f0f4f9] hover:bg-[#e1e7ee] text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
        >
          <HardDrive size={18} className="text-[#1a73e8]" />
        </button>

        {/* Text Input Pill Container */}
        <div
          onPaste={handlePaste}
          className="flex-1 bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-full px-4 py-2 flex items-center gap-2 focus-within:border-[#0b57d0]/50 focus-within:ring-2 focus-within:ring-[#0b57d0]/20 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="button"
            title="Format options"
            onClick={() => setShowFormattingBar(!showFormattingBar)}
            className={cn(
              "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg cursor-pointer",
              showFormattingBar && "bg-slate-200 dark:bg-slate-700 text-[#0b57d0] dark:text-[#a8c7fa]",
            )}
          >
            <Type size={18} />
          </button>

          <button
            type="button"
            title="Insert emoji"
            onClick={() => setContent((prev) => prev + " 😊")}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
          >
            <Smile size={18} />
          </button>
        </div>

        {/* Send Button matching Orvexa Chat style */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && attachments.length === 0 && selectedDriveFiles.length === 0}
          title="Send message"
          className="w-10 h-10 rounded-full bg-[#c2e7ff] hover:bg-[#b3dbf7] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
        >
          <Send size={16} className="stroke-[2.2] translate-x-0.5" />
        </button>
      </div>

      {/* Drive File Picker Modal */}
      <DrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={handleDrivePickerSelect}
        allowMultiple={true}
        title="Share from Drive"
      />
    </div>
  );
});

MessageInput.displayName = "MessageInput";

export default MessageInput;
