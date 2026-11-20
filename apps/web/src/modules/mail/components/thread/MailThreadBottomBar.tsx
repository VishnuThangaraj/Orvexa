import React, { useState } from "react";
import { Reply, Forward, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MailThreadBottomBarProps {
  className?: string;
  onReply?: () => void;
  onForward?: () => void;
  onReactEmoji?: (emoji: string) => void;
}

export const MailThreadBottomBar: React.FC<MailThreadBottomBarProps> = ({
  className,
  onReply,
  onForward,
  onReactEmoji,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const quickEmojis = ["👍", "❤️", "🎉", "👏", "😄", "🚀", "👀", "🔥"];

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 mt-5 pb-6 select-none relative",
        className,
      )}
    >
      {/* Reply Pill Button */}
      <button
        type="button"
        onClick={onReply}
        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
      >
        <Reply className="size-4 text-slate-600 dark:text-slate-400" />
        <span>Reply</span>
      </button>

      {/* Forward Pill Button */}
      <button
        type="button"
        onClick={onForward}
        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
      >
        <Forward className="size-4 text-slate-600 dark:text-slate-400" />
        <span>Forward</span>
      </button>

      {/* Emoji Reaction Pill Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          title="Add reaction"
          aria-label="Add reaction"
          className="size-9 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
        >
          <Smile className="size-4.5 text-slate-600 dark:text-slate-400" />
        </button>

        {showEmojiPicker && (
          <div className="absolute left-0 bottom-12 z-30 flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xl animate-in zoom-in-95 duration-150">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReactEmoji?.(emoji);
                  setShowEmojiPicker(false);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-base transition-transform hover:scale-130 cursor-pointer leading-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MailThreadBottomBar;
