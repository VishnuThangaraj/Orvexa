import React, { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { useChatStore } from "../store/chat.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMessages, useSendMessage } from "../hooks/use-messages";
import RichTextRenderer from "./RichTextRenderer";
import type { ConversationParticipant } from "../types/chat.types";
import { cn } from "@/lib/utils";

interface ThreadReplyPanelProps {
  conversationId: string;
  isGroup: boolean;
  participants?: ConversationParticipant[];
}

export const ThreadReplyPanel: React.FC<ThreadReplyPanelProps> = ({
  conversationId,
  isGroup,
}) => {
  const { activeThreadRootMessage, setActiveThreadRootMessage } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);
  const { data: threadReplies = [] } = useMessages(
    conversationId,
    activeThreadRootMessage
      ? { parentMessageId: activeThreadRootMessage.id }
      : undefined,
  );
  const sendMessage = useSendMessage(conversationId);

  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threadDraftKey = activeThreadRootMessage
    ? `chat_draft_thread_${activeThreadRootMessage.id}`
    : "";

  // Restore draft
  useEffect(() => {
    if (!threadDraftKey) return;
    const saved = localStorage.getItem(threadDraftKey) || "";
    setContent(saved);
  }, [threadDraftKey]);

  // Auto-scroll to bottom of thread when replies arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadReplies.length]);

  if (!activeThreadRootMessage) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);
    if (val.trim()) {
      localStorage.setItem(threadDraftKey, val);
    } else {
      localStorage.removeItem(threadDraftKey);
    }
  };

  const handleSend = () => {
    if (!content.trim()) return;

    const clientMessageId = crypto.randomUUID();
    const prevContent = content;

    sendMessage.mutate(
      {
        content: content.trim(),
        parentMessageId: activeThreadRootMessage.id,
        clientMessageId,
      },
      {
        onError: () => {
          // Restore input and draft on failure
          setContent(prevContent);
          if (prevContent.trim()) {
            localStorage.setItem(threadDraftKey, prevContent);
          }
        },
        onSuccess: () => {
          setContent("");
          localStorage.removeItem(threadDraftKey);
        },
      },
    );

    // Optimistically clear composer
    setContent("");
    localStorage.removeItem(threadDraftKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="w-80 md:w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-xl z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Thread
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {threadReplies.length}{" "}
            {threadReplies.length === 1 ? "reply" : "replies"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveThreadRootMessage(null)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close thread"
        >
          <X size={18} />
        </button>
      </div>

      {/* Thread Content Viewport */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Root Message Card */}
        <div className="p-3.5 rounded-2xl bg-[#f0f4f9] dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {activeThreadRootMessage.sender?.fullName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeThreadRootMessage.sender?.fullName || "User"}
              </h4>
              <p className="text-[10px] text-slate-400">
                {formatTime(activeThreadRootMessage.createdAt)}
              </p>
            </div>
          </div>

          <RichTextRenderer
            content={activeThreadRootMessage.content}
            isGroup={isGroup}
          />
        </div>

        {/* Divider */}
        {threadReplies.length > 0 && (
          <div className="flex items-center gap-2 my-2 select-none">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider">
              Replies
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {/* Replies List */}
        {threadReplies.map((reply) => {
          const isSenderMe = String(reply.senderId) === String(currentUser?.id);

          return (
            <div
              key={reply.id}
              className={cn(
                "flex items-start gap-2.5",
                isSenderMe && "flex-row-reverse",
              )}
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 mt-0.5">
                {reply.sender?.fullName?.charAt(0) || "U"}
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl text-xs max-w-[80%]",
                  isSenderMe
                    ? "bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff]"
                    : "bg-[#f1f3f4] dark:bg-slate-800 text-slate-800 dark:text-slate-100",
                )}
              >
                {!isSenderMe && (
                  <p className="font-bold text-[11px] mb-1 text-slate-700 dark:text-slate-300">
                    {reply.sender?.fullName || "User"}
                  </p>
                )}
                <RichTextRenderer content={reply.content} isGroup={isGroup} />
                <p className="text-[9px] opacity-70 text-right mt-1">
                  {formatTime(reply.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Composer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 bg-[#f0f4f9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0b57d0]/20">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Reply in thread..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim()}
            className="w-7 h-7 rounded-full bg-[#0b57d0] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#0842a0] transition-colors cursor-pointer shrink-0"
            title="Send reply"
          >
            <Send size={13} className="translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadReplyPanel;
