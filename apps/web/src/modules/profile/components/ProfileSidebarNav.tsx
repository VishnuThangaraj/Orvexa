import React from "react";
import {
  ArrowLeft,
  Home,
  IdCard,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/common/components/UserAvatar";
import type { User } from "@/modules/auth/types";
import { cn } from "@/lib/utils";
import type { ProfileTabId } from "../types/profile.types";

interface NavItem {
  id: ProfileTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    description: "Overview & quick search",
    icon: Home,
    iconColor: "text-[#0b57d0] dark:text-[#a8c7fa]",
  },
  {
    id: "personal-info",
    label: "Personal info",
    description: "Photo, name & contact",
    icon: IdCard,
    iconColor: "text-[#1a73e8] dark:text-[#8ab4f8]",
  },
  {
    id: "security",
    label: "Security & sign-in",
    description: "Password & devices",
    icon: ShieldCheck,
    iconColor: "text-[#137333] dark:text-[#81c995]",
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Theme, region & alerts",
    icon: SlidersHorizontal,
    iconColor: "text-[#8430ce] dark:text-[#d7aefb]",
  },
];

export interface ProfileSidebarNavProps {
  user: User;
  activeTab: ProfileTabId;
  onSelectTab: (tab: ProfileTabId) => void;
}

export const ProfileSidebarNav: React.FC<ProfileSidebarNavProps> = ({
  user,
  activeTab,
  onSelectTab,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile / Tablet horizontal pill tabs */}
      <nav
        aria-label="Account sections"
        className="flex lg:hidden items-center gap-2 overflow-x-auto no-scrollbar pb-2 w-full"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm whitespace-nowrap transition-all cursor-pointer shrink-0",
                isActive
                  ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium shadow-2xs"
                  : "bg-white dark:bg-[#1e1f20] text-[#444746] dark:text-[#c4c7c5] border border-[#e1e3e1] dark:border-[#333537] hover:bg-[#e1e3e1]/50 dark:hover:bg-[#282a2c]",
              )}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Google Account 2026 Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 sticky top-6 self-start">
        <div className="bg-white dark:bg-[#1e1f20] border border-[#e1e3e1] dark:border-[#333537] rounded-3xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none space-y-3">
          {/* Compact Account Identity Header */}
          <div className="flex items-center gap-3 px-2.5 pt-2 pb-3 border-b border-[#e1e3e1] dark:border-[#333537]">
            <UserAvatar
              src={user.profileImage?.secureUrl}
              name={user.fullName}
              username={user.username}
              size="md"
              className="ring-2 ring-[#d3e3fd] dark:ring-[#004a77]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
                {user.fullName}
              </div>
              <div className="text-xs text-[#444746] dark:text-[#c4c7c5] truncate">
                @{user.username}
              </div>
            </div>
          </div>

          {/* Pill Navigation Items */}
          <nav aria-label="Account navigation" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={cn(
                    "group flex items-center gap-3.5 w-full px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer text-left",
                    isActive
                      ? "bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff] font-medium"
                      : "text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2c]",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isActive
                        ? "bg-white/80 dark:bg-[#062e6f]/60 text-[#0b57d0] dark:text-[#c2e7ff]"
                        : "bg-[#f8fafd] dark:bg-[#131314] group-hover:bg-white dark:group-hover:bg-[#1e1f20]",
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        isActive
                          ? "text-[#0b57d0] dark:text-[#c2e7ff]"
                          : item.iconColor,
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-sm leading-tight truncate",
                        isActive
                          ? "text-[#041e49] dark:text-[#c2e7ff] font-semibold"
                          : "text-[#1f1f1f] dark:text-[#e3e3e3] font-medium",
                      )}
                    >
                      {item.label}
                    </div>
                    <div
                      className={cn(
                        "text-[11px] leading-tight mt-0.5 truncate",
                        isActive
                          ? "text-[#041e49]/75 dark:text-[#c2e7ff]/80"
                          : "text-[#444746] dark:text-[#c4c7c5]",
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Return to Workspace Footer */}
          <div className="pt-2 border-t border-[#e1e3e1] dark:border-[#333537]">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2c] transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Back to Workspace Home</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ProfileSidebarNav;
