import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Maximize2,
  Minimize2,
  ChevronsLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WidgetCardProps {
  id?: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  iconBg?: string;
  openTo?: string;
  openLabel?: string;
  badge?: number | string;
  badgeColor?: string;
  headerActions?: React.ReactNode;
  size?: "full" | "half" | "third" | "two-thirds" | string;
  onResize?: (newSize: "full" | "half") => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ size?: number; className?: string }>;
  emptyAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  title,
  icon: Icon,
  iconColor = "text-[#1a73e8] dark:text-blue-400",
  iconBg = "bg-blue-50 dark:bg-blue-950/40",
  openTo,
  openLabel,
  badge,
  badgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40",
  headerActions,
  size = "half",
  onResize,
  isLoading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = "No items yet",
  emptyMessage = "There is no recent activity to show right now.",
  emptyIcon: EmptyIcon,
  emptyAction,
  className = "",
  children,
}) => {
  const isFull = size === "full";

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/70 dark:border-slate-800/80 shadow-[0_1px_3px_0_rgba(60,64,67,0.08),0_4px_8px_3px_rgba(60,64,67,0.04)] hover:shadow-[0_2px_6px_0_rgba(60,64,67,0.12),0_8px_16px_4px_rgba(60,64,67,0.06)] transition-all duration-300 flex flex-col overflow-hidden w-full",
        className,
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105",
              iconBg,
            )}
          >
            <Icon size={19} className={iconColor} />
          </div>
          <h2 className="text-[15px] font-medium tracking-tight text-slate-800 dark:text-slate-100 truncate">
            {title}
          </h2>
          {badge !== undefined && badge !== 0 && (
            <span
              className={cn(
                "text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0",
                badgeColor,
              )}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerActions}

          {/* Interactive Widget Resize Control */}
          {onResize && (
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-full border border-slate-200/70 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => onResize(isFull ? "half" : "full")}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium rounded-full text-slate-600 hover:text-[#1a73e8] dark:text-slate-300 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                title={isFull ? "Shrink to half width (50%)" : "Expand to full width (100%)"}
              >
                {isFull ? (
                  <>
                    <Minimize2 size={11} />
                    <span>50%</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={11} />
                    <span>100%</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onResize(isFull ? "half" : "full")}
                className="sm:hidden p-1 rounded-full text-slate-500 hover:text-[#1a73e8] dark:text-slate-400 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                title={isFull ? "Shrink width" : "Expand width"}
              >
                {isFull ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          )}

          {openTo && (
            <Link
              to={openTo}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#1a73e8] dark:text-slate-400 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={openLabel || `Open ${title}`}
            >
              <span className="hidden sm:inline">{openLabel || "Open"}</span>
              <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between min-h-[220px]">
        {isLoading ? (
          <div className="space-y-3.5 animate-pulse py-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-2/3" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full mt-4" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <AlertCircle size={22} />
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Unable to load {title.toLowerCase()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs line-clamp-2">
              {error}
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Try again</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            {EmptyIcon && (
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <EmptyIcon size={22} />
              </div>
            )}
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {emptyTitle}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {emptyMessage}
            </div>
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Subtle Corner Resize Handle */}
      {onResize && (
        <div className="relative h-0">
          <button
            type="button"
            onClick={() => onResize(isFull ? "half" : "full")}
            className="absolute bottom-2 right-2 p-1 rounded-md text-slate-300 hover:text-[#1a73e8] dark:text-slate-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title={isFull ? "Click to set 50% width" : "Click to set 100% full width"}
          >
            <ChevronsLeftRight size={13} className="rotate-45" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WidgetCard;
