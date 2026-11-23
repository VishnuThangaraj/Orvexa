import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Home,
  Mail,
  HardDrive,
  MessageSquare,
  Video,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppItem {
  id: string;
  name: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgLight: string;
  bgDark: string;
}

const APPS: AppItem[] = [
  {
    id: "home",
    name: "Home",
    to: "/home",
    icon: Home,
    color: "text-[#0b57d0] dark:text-[#a8c7fa]",
    bgLight: "bg-blue-50 hover:bg-blue-100",
    bgDark: "dark:bg-blue-950/40 dark:hover:bg-blue-900/60",
  },
  {
    id: "mail",
    name: "Mail",
    to: "/mail",
    icon: Mail,
    color: "text-[#ea4335] dark:text-[#f28b82]",
    bgLight: "bg-red-50 hover:bg-red-100",
    bgDark: "dark:bg-red-950/40 dark:hover:bg-red-900/60",
  },
  {
    id: "chat",
    name: "Chat",
    to: "/chat",
    icon: MessageSquare,
    color: "text-[#00ac47] dark:text-[#81c995]",
    bgLight: "bg-emerald-50 hover:bg-emerald-100",
    bgDark: "dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60",
  },
  {
    id: "meet",
    name: "Meet",
    to: "/meet",
    icon: Video,
    color: "text-[#00832d] dark:text-[#5bb974]",
    bgLight: "bg-green-50 hover:bg-green-100",
    bgDark: "dark:bg-green-950/40 dark:hover:bg-green-900/60",
  },
  {
    id: "calendar",
    name: "Calendar",
    to: "/calendar",
    icon: Calendar,
    color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    bgLight: "bg-sky-50 hover:bg-sky-100",
    bgDark: "dark:bg-sky-950/40 dark:hover:bg-sky-900/60",
  },
  {
    id: "drive",
    name: "Drive",
    to: "/drive",
    icon: HardDrive,
    color: "text-[#f29900] dark:text-[#fdd663]",
    bgLight: "bg-amber-50 hover:bg-amber-100",
    bgDark: "dark:bg-amber-950/40 dark:hover:bg-amber-900/60",
  },
];

export const AppSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectApp = (to: string) => {
    setIsOpen(false);
    navigate(to);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Orvexa apps"
        title="Orvexa apps"
        className={cn(
          "p-2 rounded-full transition-colors cursor-pointer",
          isOpen
            ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        )}
      >
        <LayoutGrid size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
            Workspace Apps
          </div>

          <div className="grid grid-cols-3 gap-2">
            {APPS.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => handleSelectApp(app.to)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105",
                      app.bgLight,
                      app.bgDark,
                    )}
                  >
                    <Icon size={24} className={app.color} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-2 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppSwitcher;
