import React from "react";
import { useCalendarStore } from "../../store/calendar.store";
import { getMiniMonthGrid } from "../../utils/date.utils";

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

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export const YearView: React.FC = () => {
  const { selectedDate, setSelectedDate, setView } = useCalendarStore();
  const year = selectedDate.getFullYear();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setView("day");
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-8 select-none bg-white dark:bg-slate-900">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
        {MONTH_NAMES.map((monthName, monthIdx) => {
          const grid = getMiniMonthGrid(year, monthIdx);

          return (
            <div
              key={monthName}
              className="flex flex-col p-3 rounded-2xl hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              {/* Month Name */}
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 pl-1">
                {monthName}
              </h3>

              {/* Day Initials */}
              <div className="grid grid-cols-7 text-center mb-1">
                {DAYS_OF_WEEK.map((d, i) => (
                  <span
                    key={`${d}-${i}`}
                    className="text-[11px] font-medium text-slate-400 dark:text-slate-500 py-0.5"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {grid.map((cell, idx) => {
                  const isTodayDate = cell.isToday;

                  let cellColor = "text-slate-700 dark:text-slate-300";
                  if (!cell.isCurrentMonth) {
                    cellColor = "text-slate-300 dark:text-slate-600";
                  }

                  return (
                    <button
                      key={`${cell.date.toISOString()}-${idx}`}
                      type="button"
                      onClick={() => handleDateClick(cell.date)}
                      className="w-full aspect-square flex items-center justify-center p-0.5 cursor-pointer focus:outline-none group"
                    >
                      <div
                        className={`w-6 h-6 flex items-center justify-center text-xs rounded-full transition-all ${
                          isTodayDate
                            ? "bg-blue-600 text-white font-bold shadow-2xs"
                            : `${cellColor} group-hover:bg-slate-200 dark:group-hover:bg-slate-700`
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
        })}
      </div>
    </div>
  );
};

export default YearView;
