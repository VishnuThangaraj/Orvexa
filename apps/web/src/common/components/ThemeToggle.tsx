import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/common/theme";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
  className?: string;
  size?: number;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  size = 18,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={cn(
        "group p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0]/40 shrink-0",
        className,
      )}
    >
      {isDark ? (
        <Sun
          size={size}
          className="text-amber-400 transition-transform duration-300 group-hover:rotate-45"
        />
      ) : (
        <Moon
          size={size}
          className="text-slate-600 dark:text-slate-300 transition-transform duration-300 group-hover:-rotate-12"
        />
      )}
    </button>
  );
};

export default ThemeToggle;
