import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Check,
  LogOut,
  Settings,
  X,
  Camera,
} from "lucide-react";
import { OrvexaLogo } from "@/common/components/OrvexaLogo";
import { UserAvatar } from "@/common/components/UserAvatar";
import { AppSwitcher } from "./AppSwitcher";
import { GlobalSearchModal } from "@/modules/home/components/GlobalSearchModal";
import { useAuth, useLogout } from "@/modules/auth/hooks/use-auth.hooks";
import { useSocketStore } from "@/modules/chat/store/socket.store";
import { useSocket } from "@/modules/chat/hooks/use-socket";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { myPresenceStatus, setMyPresenceStatus } = useSocketStore();
  const { emit } = useSocket();

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut for search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!isStatusDropdownOpen && !isAccountMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isStatusDropdownOpen &&
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
      if (
        isAccountMenuOpen &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStatusDropdownOpen, isAccountMenuOpen]);

  const handleSelectStatus = (status: "ACTIVE" | "AWAY" | "DND") => {
    setMyPresenceStatus(status);
    emit("presence:update", { status });
    setIsStatusDropdownOpen(false);
  };

  const firstName = user?.fullName?.split(" ")[0] || user?.username || "there";
  const workspaceEmail = user?.username ? `${user.username}@orvexa.com` : user?.email;

  return (
    <header
      className={`h-16 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 z-30 select-none ${className}`}
    >
      {/* Left side: Logo */}
      <div className="flex items-center gap-3">
        <Link to="/home" className="flex items-baseline gap-1.5 ml-1">
          <OrvexaLogo className="text-[22px] tracking-tight" />
          <span className="text-[20px] text-slate-800 dark:text-[#9aa0a6] tracking-tight leading-none font-medium">
            Workspace
          </span>
        </Link>
      </div>

      {/* Middle: Orvexa Workspace style search bar */}
      <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative w-full text-left cursor-text group"
        >
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 pointer-events-none transition-colors"
          />
          <div className="w-full bg-[#edf2fc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 pl-11 pr-14 py-2 rounded-full text-sm border border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-between">
            <span>Search in workspace...</span>
            <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white/70 dark:bg-slate-800/80 rounded-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right side: Presence status, Theme toggle, User profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Orvexa Workspace Presence Status Toggle */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            aria-label={`Status: ${myPresenceStatus.toLowerCase()}`}
            title={`Status: ${myPresenceStatus.toLowerCase()}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                myPresenceStatus === "ACTIVE" && "bg-[#137333]",
                myPresenceStatus === "AWAY" && "bg-[#ea8600]",
                myPresenceStatus === "DND" && "bg-[#d93025]",
              )}
            />
            <span className="hidden sm:inline">
              {myPresenceStatus === "ACTIVE"
                ? "Active"
                : myPresenceStatus === "AWAY"
                  ? "Away"
                  : "Do not disturb"}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Status
              </div>
              <button
                type="button"
                onClick={() => handleSelectStatus("ACTIVE")}
                className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#137333] shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Active
                  </span>
                </div>
                {myPresenceStatus === "ACTIVE" && (
                  <Check
                    size={14}
                    className="text-[#0b57d0] dark:text-[#a8c7fa]"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSelectStatus("AWAY")}
                className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea8600] shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Away
                  </span>
                </div>
                {myPresenceStatus === "AWAY" && (
                  <Check
                    size={14}
                    className="text-[#0b57d0] dark:text-[#a8c7fa]"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSelectStatus("DND")}
                className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d93025] shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Do not disturb
                  </span>
                </div>
                {myPresenceStatus === "DND" && (
                  <Check
                    size={14}
                    className="text-[#0b57d0] dark:text-[#a8c7fa]"
                  />
                )}
              </button>
            </div>
          )}
        </div>
        <AppSwitcher />
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            aria-label="Orvexa Account"
            title={user?.fullName || "Orvexa Account"}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
          >
            <UserAvatar
              src={user?.profileImage?.secureUrl}
              name={user?.fullName}
              username={user?.username}
              size="sm"
            />
            <span className="text-sm font-medium text-[#1f1f1f] dark:text-[#e3e3e3] hidden sm:inline max-w-32 truncate">
              {firstName}
            </span>
          </button>

          {isAccountMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#e9eef6] dark:bg-[#282a2c] border border-[#dadce0] dark:border-[#3c4043] rounded-[28px] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-xs font-medium text-[#444746] dark:text-[#c4c7c5] truncate max-w-56">
                  {workspaceEmail}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c7c5] cursor-pointer"
                  aria-label="Close account menu"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center bg-white dark:bg-[#1e1f20] rounded-3xl p-5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="relative group cursor-pointer mb-3"
                  title="Update profile picture"
                >
                  <UserAvatar
                    src={user?.profileImage?.secureUrl}
                    name={user?.fullName}
                    username={user?.username}
                    size="xl"
                    className="ring-2 ring-[#d3e3fd] dark:ring-[#004a77]"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-white dark:bg-[#282a2c] border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-center shadow-sm text-[#1f1f1f] dark:text-[#e3e3e3] group-hover:scale-105 transition-transform">
                    <Camera size={13} />
                  </span>
                </button>

                <div className="text-lg font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
                  Hi, {firstName}!
                </div>
                <div className="text-xs text-[#444746] dark:text-[#c4c7c5] mt-0.5 truncate max-w-full">
                  {user?.email}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="mt-4 px-5 py-2 rounded-full border border-[#747775] dark:border-[#8e918f] text-sm font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#0b57d0]/8 dark:hover:bg-[#a8c7fa]/10 transition-colors cursor-pointer"
                >
                  Manage your Orvexa Account
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    navigate("/profile?tab=preferences");
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white dark:bg-[#1e1f20] hover:bg-white/80 dark:hover:bg-[#333537] text-xs font-medium text-[#1f1f1f] dark:text-[#e3e3e3] transition-colors cursor-pointer"
                >
                  <Settings size={14} />
                  <span>Preferences</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    logoutMutation.mutate(undefined, {
                      onSettled: () => navigate("/authenticate", { replace: true }),
                    });
                  }}
                  disabled={logoutMutation.isPending}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white dark:bg-[#1e1f20] hover:bg-white/80 dark:hover:bg-[#333537] text-xs font-medium text-[#1f1f1f] dark:text-[#e3e3e3] transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
};

export default Navbar;
