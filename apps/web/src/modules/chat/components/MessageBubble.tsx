import React, { useState } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  Ban,
  MoreVertical,
  Reply,
  Pin,
  Copy,
  Trash2,
  FileText,
  Download,
  Link as LinkIcon,
  MessageSquare,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useChatStore } from "../store/chat.store";
import { driveApi } from "@/modules/drive";
import {
  useToggleReaction,
  useTogglePin,
  useDeleteMessage,
} from "../hooks/use-messages";
import RichTextRenderer from "./RichTextRenderer";
import { cn } from "@/lib/utils";
import type { ChatMessage, ConversationParticipant } from "../types/chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isGroup: boolean;
  participants?: ConversationParticipant[];
  isFirstInCluster?: boolean;
  showAvatar?: boolean;
  threadReplyCount?: number;
  onReplyInThread?: (message: ChatMessage) => void;
  isHighlighted?: boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isGroup,
  participants = [],
  isFirstInCluster = true,
  showAvatar = true,
  threadReplyCount = 0,
  onReplyInThread,
  isHighlighted = false,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const { setReplyingToMessage } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [savingAssetIds, setSavingAssetIds] = useState<Set<string>>(new Set());
  const [savedAssetIds, setSavedAssetIds] = useState<Set<string>>(new Set());

  const handleSaveToDrive = async (
    e: React.MouseEvent,
    assetId: string,
    filename: string,
  ) => {
    e.stopPropagation();
    if (savingAssetIds.has(assetId) || savedAssetIds.has(assetId)) return;
    setSavingAssetIds((prev) => new Set(prev).add(assetId));
    try {
      await driveApi.saveAssetToDrive({ assetId, filename });
      setSavedAssetIds((prev) => new Set(prev).add(assetId));
    } catch (err) {
      console.error("Failed to save chat asset to Drive", err);
    } finally {
      setSavingAssetIds((prev) => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
    }
  };

  const toggleReaction = useToggleReaction(message.conversationId);
  const togglePin = useTogglePin(message.conversationId);
  const deleteMessage = useDeleteMessage(message.conversationId);

  const isOutgoing = String(message.senderId) === String(currentUser?.id);
  const isDeleted = Boolean(message.deletedAt);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/chat?c=${message.conversationId}&m=${message.id}`;
    navigator.clipboard.writeText(url);
    setShowMenu(false);
  };

  const handleToggleReaction = (emoji: string) => {
    toggleReaction.mutate({ messageId: message.id, emoji });
    setShowEmojiPicker(false);
    setShowMenu(false);
  };

  // Group reactions by emoji with list of users who reacted (Task 3.3)
  const reactionsList = (message.reactions as any[]) || [];
  const reactionCounts: Record<
    string,
    { count: number; userReacted: boolean; userNames: string[] }
  > = {};

  reactionsList.forEach((r) => {
    if (!reactionCounts[r.emoji]) {
      reactionCounts[r.emoji] = { count: 0, userReacted: false, userNames: [] };
    }
    reactionCounts[r.emoji].count += 1;
    if (String(r.userId) === String(currentUser?.id)) {
      reactionCounts[r.emoji].userReacted = true;
    }
    const name =
      r.user?.fullName ||
      r.user?.username ||
      (String(r.userId) === String(currentUser?.id)
        ? "You"
        : `User ${r.userId}`);
    if (!reactionCounts[r.emoji].userNames.includes(name)) {
      reactionCounts[r.emoji].userNames.push(name);
    }
  });

  // Mandatory Fix 2: Calculate true per-recipient seen status from participants' read cursors
  const otherParticipants = (participants || []).filter(
    (p) => String(p.userId) !== String(currentUser?.id),
  );

  const seenParticipants = otherParticipants.filter((p) => {
    if (!p.lastReadMessageId) return false;
    try {
      return BigInt(p.lastReadMessageId) >= BigInt(message.id);
    } catch {
      return Number(p.lastReadMessageId) >= Number(message.id);
    }
  });

  const isSeenInDirect = !isGroup && seenParticipants.length > 0;
  const seenCountInGroup = isGroup ? seenParticipants.length : 0;

  // Mandatory Fix 3: Highlight message if space message mentions currentUser or @all
  const isMentioned = Boolean(
    isGroup &&
      !isOutgoing &&
      message.mentions?.some(
        (m) => m.isAll || String(m.userId) === String(currentUser?.id),
      ),
  );

  if (isDeleted) {
    return (
      <div
        className={cn(
          "flex items-end gap-2.5 my-2.5",
          isOutgoing ? "justify-end" : "justify-start",
        )}
      >
        {!isOutgoing && (
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs uppercase font-bold shrink-0">
            {message.sender?.fullName?.charAt(0) || "U"}
          </div>
        )}

        <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 select-none">
          <Ban size={15} className="text-slate-400" />
          <span className="text-xs text-slate-400 italic font-medium">
            This message was deleted
          </span>
          <span className="text-[10px] text-slate-400 ml-1">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        "group relative flex items-start gap-2.5 transition-all w-full",
        isFirstInCluster ? "mt-3 mb-1" : "my-0.5",
        isOutgoing ? "justify-end" : "justify-start",
      )}
      onMouseLeave={() => {
        setShowMenu(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Sender Avatar for incoming group messages with clustering */}
      {!isOutgoing && (
        showAvatar ? (
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs uppercase font-bold shrink-0 mt-0.5">
            {message.sender?.profileImage?.secureUrl ? (
              <img
                src={message.sender.profileImage.secureUrl}
                alt={message.sender.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              message.sender?.fullName?.charAt(0) || "U"
            )}
          </div>
        ) : (
          <div className="w-8 shrink-0" />
        )
      )}

      {/* Main Bubble Column */}
      <div className={cn("max-w-[85%] sm:max-w-xl flex flex-col", isOutgoing ? "items-end" : "items-start")}>
        {/* Sender Name in group chats only on first message of cluster */}
        {!isOutgoing && isGroup && isFirstInCluster && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 truncate">
            {message.sender?.fullName}
          </span>
        )}

        {/* Replying Banner */}
        {message.parentMessage && (
          <div
            className={cn(
              "px-3 py-1.5 mb-1 rounded-xl text-xs border-l-2 flex flex-col",
              isOutgoing
                ? "border-[#0b57d0] self-end bg-[#c2e7ff]/30 dark:bg-[#004a77]/30"
                : "border-slate-400 self-start bg-slate-100/70 dark:bg-slate-800/50",
            )}
          >
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px]">
              {message.parentMessage.sender?.fullName}
            </span>
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {message.parentMessage.content}
            </span>
          </div>
        )}

        {/* Message Bubble matching uploaded Orvexa Chat theme */}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm shadow-2xs relative transition-all",
            isOutgoing
              ? "bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] border border-transparent rounded-tr-xs"
              : isMentioned
              ? "bg-[#e8f0fe] dark:bg-[#002d4d] text-[#1f1f1f] dark:text-slate-100 border-l-4 border-[#1a73e8] rounded-tl-xs shadow-xs"
              : "bg-[#f1f3f4] dark:bg-slate-800 text-[#1f1f1f] dark:text-slate-100 border border-transparent rounded-tl-xs",
            isHighlighted &&
              "ring-2 ring-[#0b57d0] dark:ring-[#a8c7fa] ring-offset-2 dark:ring-offset-slate-900 duration-700 animate-pulse",
          )}
        >
          {/* Attachments rendering */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {message.attachments.map((att: any) => {
                const asset = att.asset;
                if (!asset) return null;
                const isImg =
                  asset.resourceType === "IMAGE" ||
                  asset.mimeType?.startsWith("image/");

                if (isImg && asset.secureUrl) {
                  return (
                    <div key={att.id} className="relative group/att rounded-xl overflow-hidden max-h-72">
                      <img
                        src={asset.secureUrl}
                        alt={asset.originalFilename}
                        className="w-full h-auto object-cover rounded-xl hover:opacity-95 cursor-pointer"
                        onClick={() => window.open(asset.secureUrl, "_blank")}
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/att:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs rounded-lg p-1">
                        <button
                          type="button"
                          onClick={(e) => handleSaveToDrive(e, asset.id, asset.originalFilename)}
                          title={savedAssetIds.has(asset.id) ? "Saved to Drive" : "Save to Drive"}
                          className="p-1 rounded text-white hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          {savingAssetIds.has(asset.id) ? (
                            <Loader2 size={14} className="animate-spin text-white" />
                          ) : savedAssetIds.has(asset.id) ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <FolderPlus size={14} />
                          )}
                        </button>
                        <a
                          href={asset.secureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-white hover:bg-white/20 transition-colors"
                          title="Download image"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  >
                    <FileText size={20} className="text-[#0b57d0] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                        {asset.originalFilename}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(Number(asset.bytes) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleSaveToDrive(e, asset.id, asset.originalFilename)}
                        title={savedAssetIds.has(asset.id) ? "Saved to Drive" : "Save to Drive"}
                        className="p-1 hover:text-[#0b57d0] text-slate-500 transition-colors cursor-pointer"
                      >
                        {savingAssetIds.has(asset.id) ? (
                          <Loader2 size={16} className="animate-spin text-[#0b57d0]" />
                        ) : savedAssetIds.has(asset.id) ? (
                          <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FolderPlus size={16} />
                        )}
                      </button>
                      {asset.secureUrl && (
                        <a
                          href={asset.secureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:text-[#0b57d0] text-slate-500 transition-colors"
                          title="Download file"
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rich Text / Markdown Content */}
          <RichTextRenderer
            content={message.content}
            isGroup={isGroup}
          />

          {/* Footer Metadata: Timestamp & Seen Status */}
          <div className="flex items-center justify-end gap-1.5 mt-1.5 select-none">
            {message.isEdited && (
              <span className="text-[10px] opacity-70 italic">edited</span>
            )}
            <span className={cn(
              "text-[11px]",
              isOutgoing ? "text-[#001d35]/70 dark:text-[#c2e7ff]/80" : "text-slate-400"
            )}>
              {formatTime(message.createdAt)}
            </span>

            {/* Mandatory Fix 2: Delivery & Seen indicators for outgoing messages */}
            {isOutgoing && (
              message.isOptimistic || message.status === "sending" ? (
                /* Optimistic in-flight message sending indicator */
                <span
                  className="flex items-center gap-0.5 text-slate-400 font-medium text-[11px] ml-1"
                  title="Sending..."
                >
                  <Clock size={12} className="stroke-[2] animate-pulse" />
                </span>
              ) : isGroup ? (
                /* Seen by group members indicator (Screenshot 3) */
                seenCountInGroup > 0 ? (
                  <div
                    className="flex items-center gap-1 ml-1"
                    title={`Seen by ${seenParticipants.map((p) => p.user?.fullName).join(", ")}`}
                  >
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {seenParticipants.slice(0, 3).map((p) =>
                        p.user?.profileImage?.secureUrl ? (
                          <img
                            key={p.id}
                            src={p.user.profileImage.secureUrl}
                            alt={p.user?.fullName}
                            className="w-3.5 h-3.5 rounded-full ring-1 ring-white dark:ring-slate-900 object-cover"
                          />
                        ) : (
                          <div
                            key={p.id}
                            className="w-3.5 h-3.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-1 ring-white dark:ring-slate-900 flex items-center justify-center text-[7px] font-bold uppercase"
                          >
                            {p.user?.fullName?.charAt(0) || "U"}
                          </div>
                        ),
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[#001d35]/80 dark:text-[#c2e7ff]/80">
                      {seenCountInGroup}
                    </span>
                  </div>
                ) : (
                  /* Single check: Delivered */
                  <span
                    className="flex items-center gap-0.5 text-slate-400 font-medium text-[11px] ml-1"
                    title="Delivered"
                  >
                    <Check size={13} className="stroke-[2]" />
                  </span>
                )
              ) : isSeenInDirect ? (
                /* Double check: Seen in 1:1 Direct Message */
                <span
                  className="flex items-center gap-0.5 text-[#137333] font-semibold text-[11px] ml-1"
                  title="Seen"
                >
                  <CheckCheck size={13} className="stroke-[2.5]" />
                  <span>Seen</span>
                </span>
              ) : (
                /* Single check: Delivered in 1:1 Direct Message */
                <span
                  className="flex items-center gap-0.5 text-slate-400 font-medium text-[11px] ml-1"
                  title="Delivered"
                >
                  <Check size={13} className="stroke-[2]" />
                  <span>Delivered</span>
                </span>
              )
            )}
          </div>
        </div>

        {/* Task 3.4: In-Line Thread Reply Indicator */}
        {threadReplyCount > 0 && (
          <button
            type="button"
            onClick={() => onReplyInThread?.(message)}
            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer select-none"
          >
            <MessageSquare size={13} className="shrink-0" />
            <span>
              {threadReplyCount} {threadReplyCount === 1 ? "reply" : "replies"}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              View thread →
            </span>
          </button>
        )}

        {/* Task 3.3: Reactions with Who Reacted on Hover */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionCounts).map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggleReaction(emoji)}
                title={`Reacted by: ${data.userNames.join(", ")}`}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all cursor-pointer",
                  data.userReacted
                    ? "bg-[#d3e3fd] border-[#c2e7ff] text-[#041e49] dark:bg-[#004a77] dark:border-[#005a8f] dark:text-[#c2e7ff]"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200",
                )}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Menu on Hover (Orvexa Chat style) */}
      <div
        className={cn(
          "absolute -top-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md px-1.5 py-0.5 gap-0.5 z-20",
          (showMenu || showEmojiPicker) && "opacity-100",
          isOutgoing ? "right-2" : isGroup ? "left-10" : "left-2",
        )}
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="React"
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer"
        >
          😊
        </button>
        <button
          type="button"
          onClick={() => {
            if (onReplyInThread) {
              onReplyInThread(message);
            } else {
              setReplyingToMessage(message);
            }
          }}
          title="Reply in thread"
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <Reply size={14} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            title="More"
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <MoreVertical size={14} />
          </button>

          {/* Context Popover */}
          {showMenu && (
            <div className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 z-30 space-y-0.5 text-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
              >
                <Copy size={13} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
              >
                <LinkIcon size={13} />
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  togglePin.mutate(message.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
              >
                <Pin size={13} />
                <span>Pin Message</span>
              </button>
              {isOutgoing && (
                <button
                  type="button"
                  onClick={() => {
                    deleteMessage.mutate(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Quick Emoji Picker */}
      {showEmojiPicker && (
        <div
          className={cn(
            "absolute bottom-full mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg px-2 py-1 flex items-center gap-1 z-30",
            isOutgoing ? "right-0" : "left-8",
          )}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleToggleReaction(emoji)}
              className="p-1 hover:scale-125 transition-transform text-base"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
