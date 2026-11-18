import React from "react";
import {
  Lightbulb,
  CheckCircle2,
  User,
  MapPin,
  Plus,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";

export const CalendarSideRail: React.FC = () => {
  const {
    isRightPanelOpen,
    setRightPanelOpen,
    activeRightPanelTab,
    setActiveRightPanelTab,
  } = useCalendarStore();

  const handleIconClick = (tab: "tasks" | "keep" | "contacts" | "maps") => {
    if (isRightPanelOpen && activeRightPanelTab === tab) {
      setRightPanelOpen(false);
      setActiveRightPanelTab(null);
    } else {
      setActiveRightPanelTab(tab);
      setRightPanelOpen(true);
    }
  };

  return (
    <aside className="w-14 shrink-0 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between py-3 select-none z-20">
      {/* Top Icons Rail */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Google Keep (Yellow Lightbulb) */}
        <button
          type="button"
          onClick={() => handleIconClick("keep")}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isRightPanelOpen && activeRightPanelTab === "keep"
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500"
          }`}
          title="Keep"
        >
          <Lightbulb size={20} className="fill-amber-400 stroke-amber-500" />
        </button>

        {/* Google Tasks (Blue Checkmark in circle) */}
        <button
          type="button"
          onClick={() => handleIconClick("tasks")}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isRightPanelOpen && activeRightPanelTab === "tasks"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600"
          }`}
          title="Tasks"
        >
          <CheckCircle2 size={20} className="stroke-[2.5]" />
        </button>

        {/* Google Contacts (Blue person icon) */}
        <button
          type="button"
          onClick={() => handleIconClick("contacts")}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isRightPanelOpen && activeRightPanelTab === "contacts"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500"
          }`}
          title="Contacts"
        >
          <User size={20} className="stroke-[2.2]" />
        </button>

        {/* Google Maps (Pin icon) */}
        <button
          type="button"
          onClick={() => handleIconClick("maps")}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isRightPanelOpen && activeRightPanelTab === "maps"
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600"
          }`}
          title="Maps"
        >
          <MapPin size={20} className="stroke-[2.2]" />
        </button>

        {/* Divider */}
        <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-1" />

        {/* Add-ons (+) */}
        <button
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title="Get add-ons"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Bottom Collapse/Expand Arrow */}
      <button
        type="button"
        onClick={() => setRightPanelOpen((prev) => !prev)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        title={isRightPanelOpen ? "Collapse side panel" : "Expand side panel"}
      >
        {isRightPanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
};

export default CalendarSideRail;
