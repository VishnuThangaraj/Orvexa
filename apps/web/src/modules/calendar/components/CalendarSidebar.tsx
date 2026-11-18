import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  Users,
  CalendarCheck,
  CheckCircle2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";
import MiniCalendar from "./MiniCalendar";
import CalendarChecklist from "./CalendarChecklist";

export const CalendarSidebar: React.FC = () => {
  const { isSidebarOpen, openCreateModal, setActiveTopTab } = useCalendarStore();
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCreateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="w-64 shrink-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto select-none py-3 px-3 transition-all">
      <div className="space-y-4">
        {/* + Create Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsCreateDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg text-slate-700 dark:text-slate-100 font-medium text-sm transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <Plus size={20} className="text-blue-600 stroke-[2.5]" />
            </div>
            <span>Create</span>
            <ChevronDown size={14} className="text-slate-500 ml-1" />
          </button>

          {isCreateDropdownOpen && (
            <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsCreateDropdownOpen(false);
                  openCreateModal({ eventType: "PERSONAL" });
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <CalendarIcon size={18} className="text-blue-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Event
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCreateDropdownOpen(false);
                  setActiveTopTab("tasks");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <CheckCircle2 size={18} className="text-blue-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Task
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCreateDropdownOpen(false);
                  openCreateModal({ eventType: "MEETING" });
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
              >
                <CalendarCheck size={18} className="text-blue-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Appointment schedule
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Mini Month Calendar */}
        <MiniCalendar />

        {/* Search for People Input */}
        <div className="px-1">
          <div className="relative flex items-center">
            <Users
              size={16}
              className="absolute left-3 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
              placeholder="Search for people"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Booking Pages */}
        <div className="flex items-center justify-between px-2 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span>Booking pages</span>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            title="Create booking page"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Calendar Checklists (My calendars & Other calendars) */}
        <CalendarChecklist />
      </div>

      {/* Footer */}
      <div className="px-2 pt-4 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Terms</span>
        <span className="mx-1">–</span>
        <span>Privacy</span>
      </div>
    </aside>
  );
};

export default CalendarSidebar;
