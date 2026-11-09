import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, LogOut, User as UserIcon } from "lucide-react";
import { OrvexaLogo } from "@/common/components/OrvexaLogo";
import { useAuth, useLogout } from "@/modules/auth/hooks/use-auth.hooks";

export interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate("/authenticate", { replace: true });
      },
    });
  };

  const displayName = user?.fullName || user?.username || "Account";

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

      {/* Middle: Google Workspace style search bar */}
      <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search in workspace..."
            className="w-full bg-[#edf2fc] dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-11 pr-4 py-2 rounded-full text-sm outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#0b57d0]/30 focus:shadow-sm border border-transparent focus:border-[#0b57d0]/40 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right side: User profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="w-7 h-7 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">
            {displayName.charAt(0) || <UserIcon size={14} />}
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline max-w-35 truncate">
            {displayName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          title="Sign out"
          aria-label="Sign out"
          className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
