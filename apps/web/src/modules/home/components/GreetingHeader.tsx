import React from "react";
import { SlidersHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/auth.store";

interface GreetingHeaderProps {
  onOpenCustomizer?: () => void;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  onOpenCustomizer,
}) => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const firstName = user?.fullName
    ? user.fullName.split(" ")[0]
    : user?.username || "there";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-800 dark:text-slate-100 tracking-[-0.02em]">
          <span>{getGreeting()}, </span>
          <span className="font-semibold text-[#1a73e8] dark:text-[#8ab4f8]">
            {firstName}
          </span>
        </h1>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs">
            <CalendarIcon size={13} className="text-[#1a73e8]" />
            <span>{formattedDate}</span>
          </span>
          <span>•</span>
          <span>Welcome to your Orvexa overview</span>
        </div>
      </div>

      {onOpenCustomizer && (
        <button
          type="button"
          onClick={onOpenCustomizer}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] hover:shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <SlidersHorizontal size={14} className="text-slate-500" />
          <span>Customize Home</span>
        </button>
      )}
    </div>
  );
};

export default GreetingHeader;
