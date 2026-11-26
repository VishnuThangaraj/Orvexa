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
        "flex items-center gap-2.5 mt-6 pb-4 select-none relative",
        className,
      )}
    >
      {/* Reply Pill Button */}
      <button
        type="button"
        onClick={onReply}
        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#747775]/45 dark:border-[#8e918f]/50 bg-transparent text-[13.5px] font-medium text-[#444746] dark:text-[#e3e3e3] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-all cursor-pointer active:scale-98"
      >
        <Reply className="size-4 text-[#444746] dark:text-[#c4c7c5]" />
        <span>Reply</span>
      </button>

      {/* Forward Pill Button */}
      <button
        type="button"
        onClick={onForward}
        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#747775]/45 dark:border-[#8e918f]/50 bg-transparent text-[13.5px] font-medium text-[#444746] dark:text-[#e3e3e3] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] transition-all cursor-pointer active:scale-98"
      >
        <Forward className="size-4 text-[#444746] dark:text-[#c4c7c5]" />
        <span>Forward</span>
      </button>

      {/* Emoji Reaction Pill Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          title="Add reaction"
          aria-label="Add reaction"
          className="size-9 rounded-full border border-[#747775]/45 dark:border-[#8e918f]/50 bg-transparent text-[#444746] dark:text-[#e3e3e3] hover:bg-[#f2f6fc] dark:hover:bg-[#282a2c] flex items-center justify-center transition-all cursor-pointer active:scale-98"
        >
          <Smile className="size-4.5 text-[#444746] dark:text-[#c4c7c5]" />
        </button>

        {showEmojiPicker && (
          <div className="absolute left-0 bottom-12 z-30 flex items-center gap-1.5 p-2 bg-white dark:bg-[#282a2c] border border-[#e1e3e1] dark:border-[#3c4043] rounded-full shadow-xl animate-in zoom-in-95 duration-150">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReactEmoji?.(emoji);
                  setShowEmojiPicker(false);
                }}
                className="p-1.5 hover:bg-[#f2f6fc] dark:hover:bg-[#333639] rounded-full text-base transition-transform hover:scale-130 cursor-pointer leading-none"
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
