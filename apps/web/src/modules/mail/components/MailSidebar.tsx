import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MAIL_MENU, type MailMenuItem } from "../contants/mail.constants";
import { ComposePencilIcon } from "./MailIcons";
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
  activeItem: controlledActive,
  onSelectItem,
}) => {
  const [internalActive, setInternalActive] = useState("inbox");
  const activeId = controlledActive ?? internalActive;

  const handleSelect = (item: MailMenuItem) => {
    setInternalActive(item.id);
    onSelectItem?.(item.id);
  };

  return (
    <aside
      className={cn(
        "flex flex-col w-64 bg-[#F8FAFD] dark:bg-slate-900 h-full py-4 select-none shrink-0 border-r border-slate-200/80 dark:border-slate-800/80",
        className,
      )}
    >
      {/* Compose Button - #C2E7FF Material 3 styling */}
      <div className="px-4 mb-4">
        <Button
          variant="c2e7ff"
          size="compose"
          onClick={onCompose}
          className="self-start shadow-xs hover:shadow-md cursor-pointer"
        >
          <ComposePencilIcon size={18} />
          <span>Compose</span>
        </Button>
      </div>

      {/* Navigation Menu List */}
      <nav className="flex flex-col gap-0.5 pr-3">
        {MAIL_MENU.map((item) => {
          const isActive = activeId === item.id;
          const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;

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
                item.badgeBold && !isActive
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

              {item.badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto text-xs pl-2 select-none",
                    item.badgeBold || isActive
                      ? "font-bold text-slate-900 dark:text-white"
                      : "font-normal text-slate-600 dark:text-slate-400",
                    isActive ? "text-[#001d35] dark:text-[#c2e7ff]" : "",
                  )}
                >
                  {item.badge}
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
