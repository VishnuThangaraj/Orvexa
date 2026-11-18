import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";
import type { CalendarView } from "../types/calendar.types";

interface ViewOption {
  id: CalendarView;
  label: string;
  shortcut: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { id: "day", label: "Day", shortcut: "D" },
  { id: "week", label: "Week", shortcut: "W" },
  { id: "month", label: "Month", shortcut: "M" },
  { id: "year", label: "Year", shortcut: "Y" },
  { id: "schedule", label: "Schedule", shortcut: "A" },
  { id: "4days", label: "4 days", shortcut: "X" },
];

export const ViewSwitcherDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { view, setView, settings, toggleSetting } = useCalendarStore();

  const currentOption = VIEW_OPTIONS.find((opt) => opt.id === view) || VIEW_OPTIONS[1];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        <span>{currentOption.label}</span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 origin-top-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg ring-1 ring-black/5 py-1 z-50 text-sm">
          {/* View choices */}
          <div className="py-1">
            {VIEW_OPTIONS.map((opt) => {
              const isSelected = opt.id === view;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setView(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer ${
                    isSelected
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-xs text-slate-400 font-mono tracking-wider">
                    {opt.shortcut}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

          {/* Settings toggles */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => toggleSetting("showWeekends")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <div className="w-4 flex items-center justify-center">
                {settings.showWeekends && (
                  <Check size={16} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="text-sm">Show weekends</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSetting("showDeclinedEvents")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <div className="w-4 flex items-center justify-center">
                {settings.showDeclinedEvents && (
                  <Check size={16} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="text-sm">Show declined events</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSetting("showCompletedTasks")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <div className="w-4 flex items-center justify-center">
                {settings.showCompletedTasks && (
                  <Check size={16} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="text-sm">Show completed tasks</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSwitcherDropdown;
