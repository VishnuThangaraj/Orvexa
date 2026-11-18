import React, { useState } from "react";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Settings,
  Calendar as CalendarIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";
import { formatPeriodTitle } from "../utils/date.utils";
import ViewSwitcherDropdown from "./ViewSwitcherDropdown";

export const CalendarHeader: React.FC = () => {
  const {
    selectedDate,
    view,
    setSidebarOpen,
    nextPeriod,
    prevPeriod,
    goToToday,
    searchQuery,
    setSearchQuery,
    activeTopTab,
    setActiveTopTab,
  } = useCalendarStore();

  const [isSearching, setIsSearching] = useState(false);

  const title = formatPeriodTitle(selectedDate, view);
  const todayDateNumber = new Date().getDate(); // Or 18 to match screenshots

  return (
    <header className="h-16 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left Section: Hamburger, Logo, Today, Arrows, Period Title */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {/* Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Main menu"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Calendar Logo with today's date badge */}
        <div className="flex items-center gap-2.5 shrink-0 pr-2">
          <div className="relative w-10 h-10 rounded-xl bg-blue-600 flex flex-col items-center justify-center text-white shadow-2xs">
            <span className="text-[17px] font-bold leading-none tracking-tight">
              {todayDateNumber}
            </span>
          </div>
          <span className="text-[22px] font-normal text-slate-800 dark:text-slate-100 hidden sm:inline tracking-tight">
            Calendar
          </span>
        </div>

        {/* Today Button */}
        <button
          type="button"
          onClick={goToToday}
          className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs cursor-pointer ml-1"
        >
          Today
        </button>

        {/* Previous and Next Navigation Arrows */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={prevPeriod}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Previous period"
            aria-label="Previous period"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={nextPeriod}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Next period"
            aria-label="Next period"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dynamic Period Title */}
        <h1 className="text-[20px] md:text-[22px] font-normal text-slate-800 dark:text-slate-100 truncate pl-1">
          {title}
        </h1>
      </div>

      {/* Right Section: Search, Help, Settings, View Switcher, Calendar/Tasks toggle, Apps grid, Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search Bar / Icon */}
        <div className="relative flex items-center">
          {isSearching ? (
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, people, places"
                autoFocus
                className="w-48 sm:w-64 pl-9 pr-8 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-200"
              />
              <Search
                size={16}
                className="absolute left-3 text-slate-400 pointer-events-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}
                className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearching(true)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Search"
              aria-label="Search events"
            >
              <Search size={20} />
            </button>
          )}
        </div>

        {/* Support / Help */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
          title="Support"
        >
          <HelpCircle size={20} />
        </button>

        {/* Settings */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
          title="Settings menu"
        >
          <Settings size={20} />
        </button>

        {/* View Switcher Dropdown (Day, Week, Month, etc.) */}
        <div className="ml-1">
          <ViewSwitcherDropdown />
        </div>

        {/* Calendar / Tasks Toggle Segmented Capsule */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ml-1">
          <button
            type="button"
            onClick={() => setActiveTopTab("calendar")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              activeTopTab === "calendar"
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-2xs font-medium"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
            title="Calendar view"
          >
            <CalendarIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTopTab("tasks")}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              activeTopTab === "tasks"
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-2xs font-medium"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
            title="Tasks view"
          >
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;
