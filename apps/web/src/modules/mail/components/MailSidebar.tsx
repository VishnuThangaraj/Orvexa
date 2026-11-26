import React from "react";
import { MAIL_MENU, type MailMenuItem } from "../constants/mail.constants";
import { ComposePencilIcon } from "./MailIcons";
import { useMailCounts } from "../hooks/use-mail.counts";
import { cn } from "@/lib/utils";

export interface MailSidebarProps {
  className?: string;
  onCompose?: () => void;
  activeItem?: string;
  onSelectItem?: (id: string) => void;
}

export const MailSidebar: React.FC<MailSidebarProps> = ({
  className = "",
  onCompose,
  activeItem = "inbox",
  onSelectItem,
}) => {
  const activeId = activeItem;
  const { data: counts } = useMailCounts();

  const handleSelect = (item: MailMenuItem) => {
    onSelectItem?.(item.id);
  };

  const getItemBadge = (itemId: string): number | string | undefined => {
    if (!counts) return undefined;
    if (itemId === "inbox") {
      return counts.inboxUnread > 0 ? counts.inboxUnread : undefined;
    }
    if (itemId === "drafts") {
      return counts.drafts > 0 ? counts.drafts : undefined;
    }
    if (itemId === "trash") {
      return counts.trash > 0 ? counts.trash : undefined;
    }
    return undefined;
  };

  const isItemBadgeBold = (itemId: string): boolean => {
    return itemId === "inbox" || itemId === "drafts";
  };

  return (
    <aside
      className={cn(
        "flex flex-col w-60 xl:w-64 bg-[#f6f8fc] dark:bg-[#131314] h-full py-2.5 select-none shrink-0 overflow-y-auto transition-colors",
        className,
      )}
    >
      {/* Compose Button - Material 3 FAB */}
      <div className="px-3 mb-3.5">
        <button
          type="button"
          onClick={onCompose}
          className="inline-flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#c2e7ff] hover:bg-[#b5dffc] text-[#001d35] dark:bg-[#c2e7ff] dark:hover:bg-[#d3edff] dark:text-[#001d35] text-[14px] font-medium shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_4px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] active:scale-[0.99] transition-all cursor-pointer"
        >
          <ComposePencilIcon size={20} />
          <span>Compose</span>
        </button>
      </div>

      {/* Main Categories Navigation */}
      <nav className="flex flex-col gap-0.5 px-3">
        {MAIL_MENU.map((item) => {
          const isActive = activeId === item.id;
          const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
          const badge = getItemBadge(item.id) ?? item.badge;
          const badgeBold = isItemBadgeBold(item.id) || item.badgeBold;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className={cn(
                "group flex items-center h-9 px-3.5 rounded-full text-[13.5px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0]/40",
                isActive
                  ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-semibold"
                  : "text-[#1f1f1f] dark:text-[#e3e3e3] font-normal hover:bg-[#e1e5ea]/75 dark:hover:bg-[#282a2c]",
                badgeBold && !isActive && badge !== undefined
                  ? "font-semibold"
                  : "",
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "mr-3.5 shrink-0 transition-colors",
                  isActive
                    ? "text-[#001d35] dark:text-[#c2e7ff]"
                    : "text-[#444746] dark:text-[#c4c7c5] group-hover:text-[#1f1f1f] dark:group-hover:text-white",
                )}
                strokeWidth={isActive ? 2.25 : 1.85}
              />
              <span className="truncate">{item.name}</span>

              {badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto text-xs pl-2 tabular-nums select-none",
                    isActive
                      ? "font-semibold text-[#001d35] dark:text-[#c2e7ff]"
                      : badgeBold
                        ? "font-semibold text-[#1f1f1f] dark:text-[#e3e3e3]"
                        : "font-normal text-[#444746] dark:text-[#c4c7c5]",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default MailSidebar;
