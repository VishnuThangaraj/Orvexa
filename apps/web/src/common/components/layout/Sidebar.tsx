import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Mail,
  MessageSquare,
  Video,
  Calendar,
  HardDrive,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  className?: string;
}

interface NavRailItem {
  id: string;
  label: string;
  to?: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
  }>;
  badge?: number | string;
}

const mainNavItems: NavRailItem[] = [
  { id: "home", label: "Home", to: "/home", icon: Home },
  { id: "mail", label: "Mail", to: "/mail", icon: Mail },
  { id: "drive", label: "Drive", icon: HardDrive },
  { id: "chat", label: "Chat", icon: MessageSquare, badge: 1 },
  { id: "meet", label: "Meet", icon: Video },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

const bottomNavItems: NavRailItem[] = [
  { id: "profile", label: "Profile", to: "/profile", icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  const currentTab =
    selectedTab ?? (location.pathname === "/home" ? "home" : "home");

  const handleItemClick = (item: NavRailItem) => {
    setSelectedTab(item.id);
    if (item.to) {
      navigate(item.to);
    }
  };

  const renderItem = (item: NavRailItem) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleItemClick(item)}
        title={item.label}
        className="group flex flex-col items-center justify-center w-full py-1 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0]/40 rounded-xl transition-all"
      >
        {/* Pill capsule with icon and optional badge */}
        <div
          className={cn(
            "w-14 h-8 rounded-full flex items-center justify-center relative transition-all duration-150",
            isActive
              ? "bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]"
              : "bg-transparent text-[#444746] dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800",
          )}
        >
          <Icon
            size={20}
            strokeWidth={isActive ? 2.3 : 1.9}
            className="shrink-0 transition-transform group-hover:scale-105"
          />

          {item.badge !== undefined && (
            <span className="absolute -top-1 -right-0.5 bg-[#ea4335] text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center leading-none shadow-xs pointer-events-none">
              {item.badge}
            </span>
          )}
        </div>

        {/* Label below capsule */}
        <span
          className={cn(
            "text-[11px] font-medium leading-tight mt-1 tracking-tight select-none",
            isActive
              ? "text-[#041e49] dark:text-[#c2e7ff] font-semibold"
              : "text-[#444746] dark:text-slate-400",
          )}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "h-full w-18 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none flex flex-col justify-between py-3 px-1",
        className,
      )}
    >
      {/* Top navigation rail items: Home, Mail, Chat, Meet, Calendar */}
      <nav className="flex flex-col items-center gap-3 w-full">
        {mainNavItems.map(renderItem)}
      </nav>

      {/* Bottom navigation rail items: Profile */}
      <div className="flex flex-col items-center gap-3 w-full mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {bottomNavItems.map(renderItem)}
      </div>
    </aside>
  );
};

export default Sidebar;
