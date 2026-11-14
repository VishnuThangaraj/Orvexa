import React from "react";
import { MAIL_MENU, type MailMenuItem } from "../contants/mail.constants";
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
        "flex flex-col w-60 md:w-64 bg-[#f6f8fc] dark:bg-slate-950 h-full py-3 select-none shrink-0 overflow-y-auto",
        className,
      )}
    >
      {/* Compose Button - Material 3 Large Pill */}
      <div className="px-4 mb-4">
        <button
          type="button"
          onClick={onCompose}
          className="flex items-center gap-3.5 px-6 py-4 rounded-2xl bg-[#c2e7ff] hover:bg-[#b3dbf7] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <ComposePencilIcon size={20} />
          <span>Compose</span>
        </button>
      </div>

      {/* Main Categories Navigation */}
      <nav className="flex flex-col gap-0.5 pr-3">
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
                "group flex items-center h-8 pl-6 pr-4 rounded-r-full text-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0]/40",
                isActive
                  ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                  : "text-[#202124] dark:text-slate-300 font-normal hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                badgeBold && !isActive
                  ? "font-bold text-slate-900 dark:text-white"
                  : "",
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "mr-4 shrink-0 transition-colors",
                  isActive
                    ? "text-[#001d35] dark:text-[#c2e7ff]"
                    : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white",
                )}
                strokeWidth={isActive ? 2.4 : 1.9}
              />
              <span className="truncate">{item.name}</span>

              {badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto text-xs pl-2 select-none",
                    badgeBold || isActive
                      ? "font-bold text-slate-900 dark:text-white"
                      : "font-normal text-slate-600 dark:text-slate-400",
                    isActive ? "text-[#001d35] dark:text-[#c2e7ff]" : "",
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
