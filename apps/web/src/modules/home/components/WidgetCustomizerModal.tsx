import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Mail,
  MessageSquare,
  Calendar,
  Video,
  HardDrive,
  CheckSquare,
  Bell,
  SlidersHorizontal,
} from "lucide-react";
import type { UserDashboardPreferences } from "../types/home.types";
import { cn } from "@/lib/utils";

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserDashboardPreferences;
  onSave: (updates: Partial<UserDashboardPreferences>) => void;
  isSaving?: boolean;
}

const WIDGET_META: Record<
  string,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bg: string;
  }
> = {
  mail: {
    label: "Mail",
    description: "Unread count, recent inbox threads, quick compose",
    icon: Mail,
    color: "text-[#ea4335]",
    bg: "bg-[#fce8e6] dark:bg-red-950/50",
  },
  chat: {
    label: "Chat",
    description: "Direct messages, spaces, unread badges & presence",
    icon: MessageSquare,
    color: "text-[#0f9d58]",
    bg: "bg-[#e6f4ea] dark:bg-emerald-950/50",
  },
  calendar: {
    label: "Calendar",
    description: "Today's agenda, next up countdown & mini month",
    icon: Calendar,
    color: "text-[#1a73e8]",
    bg: "bg-[#e8f0fe] dark:bg-blue-950/50",
  },
  meet: {
    label: "Meet",
    description: "Join with code, new meeting & upcoming calls",
    icon: Video,
    color: "text-[#00897b]",
    bg: "bg-[#e0f2f1] dark:bg-teal-950/50",
  },
  drive: {
    label: "Drive",
    description: "Suggested files, storage meter & upload shortcuts",
    icon: HardDrive,
    color: "text-[#f9ab00]",
    bg: "bg-[#fef7e0] dark:bg-amber-950/50",
  },
  tasks: {
    label: "Tasks",
    description: "Pending tasks, due dates & quick capture",
    icon: CheckSquare,
    color: "text-[#1a73e8]",
    bg: "bg-[#e8f0fe] dark:bg-blue-950/50",
  },
  activity: {
    label: "Recent Activity",
    description: "Cross-module notification updates & collaboration stream",
    icon: Bell,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
  },
};

const DEFAULT_ORDER = [
  "calendar",
  "meet",
  "mail",
  "chat",
  "drive",
  "tasks",
  "activity",
];

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave,
  isSaving = false,
}) => {
  const [order, setOrder] = useState<string[]>(
    preferences.widgetOrder || DEFAULT_ORDER
  );
  const [hidden, setHidden] = useState<string[]>(
    preferences.hiddenWidgets || []
  );
  const [summaryStrip, setSummaryStrip] = useState<boolean>(
    preferences.summaryStrip ?? true
  );
  const [sizes, setSizes] = useState<Record<string, "full" | "half">>(
    (preferences.widgetSizes as Record<string, "full" | "half">) || {}
  );
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setOrder(preferences.widgetOrder || DEFAULT_ORDER);
      setHidden(preferences.hiddenWidgets || []);
      setSummaryStrip(preferences.summaryStrip ?? true);
      setSizes(
        (preferences.widgetSizes as Record<string, "full" | "half">) || {}
      );
    }
  }, [isOpen, preferences]);

  // Click outside and Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleHide = (id: string) => {
    setHidden((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    const newOrder = [...order];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setOrder(newOrder);
  };

  const handleReset = () => {
    setOrder(DEFAULT_ORDER);
    setHidden([]);
    setSummaryStrip(true);
    setSizes({});
  };

  const handleApply = () => {
    onSave({
      widgetOrder: order,
      hiddenWidgets: hidden,
      summaryStrip,
      widgetSizes: sizes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Customize Dashboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reorder cards or hide modules to fit your workflow
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Summary Strip Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Top Metrics Strip
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Show executive stat summary cards at the top of Home
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSummaryStrip(!summaryStrip)}
              className={cn(
                "w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0",
                summaryStrip
                  ? "bg-[#1a73e8] justify-end"
                  : "bg-slate-300 dark:bg-slate-700 justify-start"
              )}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Cards Order and Visibility */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 px-1">
              Active Cards & Layout Order
            </div>
            <div className="space-y-2">
              {order.map((widgetId, index) => {
                const meta = WIDGET_META[widgetId] || {
                  label: widgetId,
                  description: "",
                  icon: Check,
                  color: "text-slate-500",
                  bg: "bg-slate-100",
                };
                const Icon = meta.icon;
                const isHidden = hidden.includes(widgetId);

                return (
                  <div
                    key={widgetId}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all",
                      isHidden
                        ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 opacity-55"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          meta.bg
                        )}
                      >
                        <Icon size={18} className={meta.color} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                          {meta.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {/* Width Selector: 50% vs 100% */}
                      {!isHidden && (
                        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 mr-1">
                          <button
                            type="button"
                            onClick={() =>
                              setSizes((prev) => ({
                                ...prev,
                                [widgetId]: "half",
                              }))
                            }
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all cursor-pointer",
                              (sizes[widgetId] || "half") === "half"
                                ? "bg-white dark:bg-slate-700 text-[#1a73e8] dark:text-blue-400 shadow-2xs font-bold"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                            title="Set card to half width (50%)"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSizes((prev) => ({
                                ...prev,
                                [widgetId]: "full",
                              }))
                            }
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all cursor-pointer",
                              sizes[widgetId] === "full"
                                ? "bg-white dark:bg-slate-700 text-[#1a73e8] dark:text-blue-400 shadow-2xs font-bold"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                            title="Set card to full width (100%)"
                          >
                            100%
                          </button>
                        </div>
                      )}

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                        aria-label={`Move ${meta.label} up`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp size={15} />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={index === order.length - 1}
                        onClick={() => handleMove(index, "down")}
                        aria-label={`Move ${meta.label} down`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown size={15} />
                      </button>

                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={() => handleToggleHide(widgetId)}
                        aria-label={
                          isHidden
                            ? `Show ${meta.label}`
                            : `Hide ${meta.label}`
                        }
                        title={isHidden ? "Show widget" : "Hide widget"}
                        className={cn(
                          "p-1.5 rounded-lg cursor-pointer transition-colors ml-1",
                          isHidden
                            ? "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            : "text-[#1a73e8] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        )}
                      >
                        {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset to default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleApply}
              className="px-5 py-2 text-xs font-medium text-white bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 rounded-full shadow-xs cursor-pointer transition-colors"
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetCustomizerModal;
