import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";
import { getMiniMonthGrid, isSameDay } from "../utils/date.utils";

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MiniCalendar: React.FC = () => {
  const { selectedDate, setSelectedDate } = useCalendarStore();

  // Mini calendar can navigate months independently
  const [currentYear, setCurrentYear] = useState<number>(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(selectedDate.getMonth());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const grid = getMiniMonthGrid(currentYear, currentMonth);

  return (
    <div className="w-full px-2 py-1 select-none">
      {/* Month & Year header with navigation arrows */}
      <div className="flex items-center justify-between py-1 px-1">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAYS_OF_WEEK.map((day, idx) => (
          <span
            key={`${day}-${idx}`}
            className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {grid.map((cell, idx) => {
          const isSelected = isSameDay(cell.date, selectedDate);
          const isTodayDate = cell.isToday;

          let cellClass = "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
          if (!cell.isCurrentMonth) {
            cellClass = "text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800";
          }

          return (
            <button
              key={`${cell.date.toISOString()}-${idx}`}
              type="button"
              onClick={() => setSelectedDate(cell.date)}
              className="w-full aspect-square flex items-center justify-center p-0.5 cursor-pointer focus:outline-none"
            >
              <div
                className={`w-7 h-7 flex items-center justify-center text-xs rounded-full transition-colors ${
                  isTodayDate
                    ? "bg-blue-600 text-white font-bold"
                    : isSelected
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold"
                    : cellClass
                }`}
              >
                {cell.dayNumber}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
