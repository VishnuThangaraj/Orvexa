import React, { useState, useEffect, useRef } from "react";
import { X, Send, Lock } from "lucide-react";
import { useMeetStore } from "../../store/meet.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";

interface InCallChatPanelProps {
  meetingCode: string;
  isHost: boolean;
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

export const InCallChatPanel: React.FC<InCallChatPanelProps> = ({
  meetingCode,
  isHost,
  onSendMessage,
  onClose,
}) => {
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages = useMeetStore((state) => state.messages);
  const currentMeeting = useMeetStore((state) => state.currentMeeting);
  const fetchMessages = useMeetStore((state) => state.fetchMessages);
  const currentUser = useAuthStore((state) => state.user);

  const allowChat = currentMeeting?.allowChat ?? true;
  const canChat = allowChat || isHost;

  useEffect(() => {
    fetchMessages(meetingCode).catch(console.warn);
  }, [meetingCode, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !canChat) return;

    onSendMessage(content.trim());
    setContent("");
  };

  return (
    <aside className="w-80 sm:w-96 h-full bg-[#202124] border-l border-neutral-800 flex flex-col text-neutral-100 z-30 select-none">
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
        <h3 className="text-base font-medium">In-call messages</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          aria-label="Close chat panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Notice Banner */}
        <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-3 text-xs text-neutral-400 text-center leading-relaxed">
          Messages can only be seen by people in the call and are deleted when the call ends.
        </div>

        {/* Message list */}
        {messages.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-neutral-500">
            No messages yet
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser && String(currentUser.id) === String(msg.senderId);
            const timeStr = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-neutral-200">
                    {msg.senderName || "Participant"}
                    {isMe && " (You)"}
                  </span>
                  <span className="text-[10px] text-neutral-500">{timeStr}</span>
                </div>
                <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl px-3.5 py-2 text-xs text-neutral-100 break-words leading-relaxed inline-block max-w-full">
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-neutral-800 bg-[#202124] shrink-0">
        {canChat ? (
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Send a message to everyone"
              className="w-full bg-neutral-800/90 border border-neutral-700 rounded-full pl-4 pr-11 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!content.trim()}
              className="absolute right-1.5 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-transparent disabled:text-neutral-600 text-white flex items-center justify-center transition disabled:cursor-not-allowed shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-neutral-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Chat is turned off by the host</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default InCallChatPanel;
