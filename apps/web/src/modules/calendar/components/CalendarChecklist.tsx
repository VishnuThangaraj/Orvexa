import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Check, X } from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";
import type { UserCalendar } from "../types/calendar.types";

const CALENDAR_COLORS = [
  "#039be5", // Blue
  "#7986cb", // Indigo
  "#33b679", // Green
  "#8e24aa", // Purple
  "#e67c73", // Red
  "#f6bf26", // Yellow
  "#f4511e", // Orange
  "#616161", // Gray
];

interface CalendarSectionProps {
  title: string;
  calendars: UserCalendar[];
  onToggle: (id: string) => void;
  onAddClick?: () => void;
  showAdd?: boolean;
}

const CalendarSection: React.FC<CalendarSectionProps> = ({
  title,
  calendars,
  onToggle,
  onAddClick,
  showAdd = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="py-2 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-3 py-1 group">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
        >
          <span>{title}</span>
          {isExpanded ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>

        {showAdd && onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            title={`Add ${title}`}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {calendars.map((cal) => (
            <button
              key={cal.id}
              type="button"
              onClick={() => onToggle(cal.id)}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left transition-colors"
            >
              {/* Custom Colored Checkbox */}
              <div
                className="w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: cal.isVisible ? cal.color : "transparent",
                  borderColor: cal.color,
                  borderWidth: "2px",
                }}
              >
                {cal.isVisible && <Check size={12} className="text-white stroke-[3]" />}
              </div>

              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {cal.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CalendarChecklist: React.FC = () => {
  const { calendars, toggleCalendarVisibility, createCalendar } = useCalendarStore();
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [newCalName, setNewCalName] = useState("");
  const [newCalColor, setNewCalColor] = useState(CALENDAR_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myCalendars = calendars.filter(
    (c) => c.systemType !== "HOLIDAYS",
  );
  const otherCalendars = calendars.filter(
    (c) => c.systemType === "HOLIDAYS",
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await createCalendar({
        name: newCalName.trim(),
        color: newCalColor,
      });
      setNewCalName("");
      setIsAddingCalendar(false);
    } catch (err) {
      console.error("Failed to create calendar:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <CalendarSection
        title="My calendars"
        calendars={myCalendars}
        onToggle={toggleCalendarVisibility}
        showAdd={true}
        onAddClick={() => setIsAddingCalendar((prev) => !prev)}
      />

      {/* Inline Create Calendar Form */}
      {isAddingCalendar && (
        <form
          onSubmit={handleCreate}
          className="mx-2 my-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              New Calendar
            </span>
            <button
              type="button"
              onClick={() => setIsAddingCalendar(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Calendar name"
            value={newCalName}
            onChange={(e) => setNewCalName(e.target.value)}
            autoFocus
            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {CALENDAR_COLORS.slice(0, 5).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCalColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                    newCalColor === color
                      ? "ring-2 ring-offset-1 ring-blue-500 scale-110"
                      : "hover:scale-105"
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newCalName.trim()}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-medium rounded-md shadow-2xs cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <CalendarSection
        title="Other calendars"
        calendars={otherCalendars}
        onToggle={toggleCalendarVisibility}
        showAdd={false}
      />
    </div>
  );
};

export default CalendarChecklist;
