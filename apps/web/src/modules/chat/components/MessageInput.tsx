import React, { useState, useRef, useEffect } from "react";
import { Plus, Send, Smile, X, FileText, Loader2 } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useSendMessage } from "../hooks/use-messages";
import { useSocket } from "../hooks/use-socket";
import { chatApi } from "../api/chat.api";
import type { UploadedChatAsset } from "../types/chat.types";

interface MessageInputProps {
  conversationId: string;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  placeholder = "Type a message... (Type @ to mention)",
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<UploadedChatAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { replyingToMessage, setReplyingToMessage } = useChatStore();
  const sendMessage = useSendMessage(conversationId);
  const { emit } = useSocket();

  // Typing event emission with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await chatApi.uploadAttachments(formData);
      if (res.assets) {
        setAttachments((prev) => [...prev, ...res.assets]);
      }
    } catch (err: any) {
      console.error("Failed to upload chat attachments:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (assetId: string) => {
    setAttachments((prev) => prev.filter((a) => a.assetId !== assetId));
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    // Cancel typing timer and emit typing:stop
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    emit("typing:stop", { conversationId });

    sendMessage.mutate({
      content: trimmed || (attachments.length > 0 ? "Shared attachments" : ""),
      parentMessageId: replyingToMessage?.id || null,
      attachmentIds: attachments.map((a) => a.assetId),
    });

    setContent("");
    setAttachments([]);
    setReplyingToMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />

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

      {/* Attachments preview strip */}
      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.assetId}
              className="px-2.5 py-1 rounded-lg bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-xs"
            >
              <FileText size={14} className="text-[#0b57d0]" />
              <span className="truncate max-w-40 font-medium text-slate-800 dark:text-slate-200">
                {att.originalFilename}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.assetId)}
                className="text-slate-400 hover:text-rose-500"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container matching uploaded Google Chat screenshot */}
      <div className="flex items-center gap-3">
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

        {/* Text Input Pill Container */}
        <div className="flex-1 bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-full px-4 py-2 flex items-center gap-2 focus-within:border-[#0b57d0]/50 focus-within:ring-2 focus-within:ring-[#0b57d0]/20 transition-all">
          <input
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="button"
            title="Insert emoji"
            onClick={() => setContent((prev) => prev + " 😊")}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <Smile size={18} />
          </button>
        </div>

        {/* Send Button matching Google Chat style */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && attachments.length === 0}
          title="Send message"
          className="w-10 h-10 rounded-full bg-[#c2e7ff] hover:bg-[#b3dbf7] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
        >
          <Send size={16} className="stroke-[2.2] translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
