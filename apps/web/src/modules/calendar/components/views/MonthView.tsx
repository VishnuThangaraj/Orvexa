import React, { useState } from "react";
import { Check } from "lucide-react";
import { useCalendarStore } from "../../store/calendar.store";
import { isToday, isSameDay } from "../../utils/date.utils";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const MonthView: React.FC = () => {
  const {
    selectedDate,
    events,
    tasks,
    calendars,
    setSelectedEvent,
    openCreateModal,
    settings,
    toggleTaskCompleted,
    setActiveRightPanelTab,
  } = useCalendarStore();

  const [overflowDate, setOverflowDate] = useState<Date | null>(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Compute full 35 or 42 grid dates
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const gridDates: Array<{
    date: Date;
    dayNum: number;
    isCurrentMonth: boolean;
    isFirstOfMonth: boolean;
  }> = [];

  // Previous month trailing
  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    gridDates.push({
      date,
      dayNum: day,
      isCurrentMonth: false,
      isFirstOfMonth: day === 1,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    gridDates.push({
      date,
      dayNum: d,
      isCurrentMonth: true,
      isFirstOfMonth: d === 1,
    });
  }

  // Next month leading (fill to 35 or 42)
  const totalCells = gridDates.length > 35 ? 42 : 35;
  const remaining = totalCells - gridDates.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    gridDates.push({
      date,
      dayNum: d,
      isCurrentMonth: false,
      isFirstOfMonth: d === 1,
    });
  }

  // Filter out weekends if showWeekends is false
  const visibleDates = settings.showWeekends
    ? gridDates
    : gridDates.filter((c) => c.date.getDay() !== 0 && c.date.getDay() !== 6);

  const visibleDayNames = settings.showWeekends
    ? DAY_NAMES
    : DAY_NAMES.filter((_, idx) => idx !== 0 && idx !== 6);

  const colCount = visibleDayNames.length;

  const handleDayClick = (date: Date) => {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(date);
    end.setHours(10, 0, 0, 0);

    openCreateModal({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isAllDay: true,
    });
  };

  const isTasksCalendarVisible = calendars.some(
    (c) => c.systemType === "TASKS" && c.isVisible,
  );

  return (
    <div
      role="grid"
      aria-label="Month calendar view"
      className="flex flex-col h-full w-full overflow-hidden select-none bg-white dark:bg-slate-900"
    >
      {/* Weekday Names Header */}
      <div
        role="row"
        className="grid border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:border-slate-800 shrink-0 text-center py-2"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {visibleDayNames.map((dayName) => (
          <span
            key={dayName}
            role="columnheader"
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase"
          >
            {dayName}
          </span>
        ))}
      </div>

      {/* Month Days Grid */}
      <div
        className="flex-1 grid divide-x divide-y divide-slate-200 dark:divide-slate-800 overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(110px, 1fr)",
        }}
      >
        {visibleDates.map(({ date, dayNum, isCurrentMonth, isFirstOfMonth }) => {
          const isTodayDate = isToday(date);

          // Get events matching this date
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          const dayEvents = events.filter((e) => {
            const start = new Date(e.startTime);
            const end = new Date(e.endTime);
            return start <= dayEnd && end >= dayStart;
          });

          // Get tasks due on this date (if Tasks calendar is visible)
          const dayTasks = isTasksCalendarVisible
            ? tasks.filter((t) => {
                if (!t.dueDate) return false;
                if (t.isCompleted && !settings.showCompletedTasks) return false;
                return isSameDay(t.dueDate, date);
              })
            : [];

          type CombinedItem =
            | { type: "event"; data: (typeof dayEvents)[0] }
            | { type: "task"; data: (typeof dayTasks)[0] };

          const allItems: CombinedItem[] = [
            ...dayEvents.map((e) => ({ type: "event" as const, data: e })),
            ...dayTasks.map((t) => ({ type: "task" as const, data: t })),
          ];

          const MAX_VISIBLE = 3;
          const visibleItems = allItems.slice(0, MAX_VISIBLE);
          const overflowCount = allItems.length - MAX_VISIBLE;

          const dateLabel = isFirstOfMonth
            ? `1 ${MONTH_SHORT_NAMES[date.getMonth()]}`
            : `${dayNum}`;

          return (
            <div
              key={date.toISOString()}
              role="gridcell"
              aria-label={date.toDateString()}
              tabIndex={0}
              onClick={() => handleDayClick(date)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleDayClick(date);
                }
              }}
              className={`p-1 flex flex-col justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors relative min-h-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                !isCurrentMonth ? "bg-slate-50/30 dark:bg-slate-900/40" : ""
              }`}
            >
              {/* Day Number Header */}
              <div className="flex justify-center items-center py-0.5">
                {isTodayDate ? (
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                    {dayNum}
                  </span>
                ) : (
                  <span
                    className={`text-xs font-normal ${
                      isFirstOfMonth ? "font-semibold" : ""
                    } ${
                      isCurrentMonth
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {dateLabel}
                  </span>
                )}
              </div>

              {/* Items List (Events + Tasks) */}
              <div className="flex-1 space-y-1 mt-1 overflow-hidden">
                {visibleItems.map((item) => {
                  if (item.type === "event") {
                    const event = item.data;
                    const isHoliday =
                      event.eventType === "HOLIDAY" ||
                      event.calendar?.systemType === "HOLIDAYS";
                    const bgColor = isHoliday
                      ? "#0b8043"
                      : event.color || "#039be5";

                    return (
                      <button
                        key={`event-${event.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        style={{ backgroundColor: bgColor }}
                        className="w-full text-left px-2 py-0.5 rounded text-xs font-medium text-white truncate shadow-2xs hover:brightness-95 cursor-pointer block"
                        title={event.title}
                      >
                        {event.title}
                      </button>
                    );
                  }

                  // Task Item
                  const task = item.data;
                  return (
                    <div
                      key={`task-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRightPanelTab("tasks");
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-white truncate shadow-2xs hover:brightness-95 cursor-pointer bg-[#3f51b5] dark:bg-[#3949ab]"
                      title={`Task: ${task.title}`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompleted(task.id, !task.isCompleted);
                        }}
                        className="w-3 h-3 rounded-full border border-white flex items-center justify-center shrink-0 hover:bg-white/20"
                      >
                        {task.isCompleted && (
                          <Check size={9} className="text-white stroke-[3]" />
                        )}
                      </button>
                      <span
                        className={`truncate ${
                          task.isCompleted ? "line-through opacity-75" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  );
                })}

                {/* +N More Link */}
                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowDate(date);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 px-1 py-0.5 cursor-pointer block"
                  >
                    +{overflowCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overflow Day Popover Modal */}
      {overflowDate && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
          onClick={() => setOverflowDate(null)}
        >
          <div
            className="w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {overflowDate.toDateString()}
              </h3>
              <button
                type="button"
                onClick={() => setOverflowDate(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {events
                .filter((e) => isSameDay(e.startTime, overflowDate))
                .map((event) => {
                  const bgColor = event.color || "#039be5";
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        setOverflowDate(null);
                        setSelectedEvent(event);
                      }}
                      style={{ backgroundColor: bgColor }}
                      className="w-full text-left px-2.5 py-1 rounded-md text-xs font-medium text-white truncate shadow-2xs hover:brightness-95 cursor-pointer block"
                    >
                      {event.title}
                    </button>
                  );
                })}

              {isTasksCalendarVisible &&
                tasks
                  .filter(
                    (t) =>
                      t.dueDate &&
                      isSameDay(t.dueDate, overflowDate) &&
                      (!t.isCompleted || settings.showCompletedTasks),
                  )
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setOverflowDate(null);
                        setActiveRightPanelTab("tasks");
                      }}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white truncate shadow-2xs hover:brightness-95 cursor-pointer bg-[#3f51b5]"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompleted(task.id, !task.isCompleted);
                        }}
                        className="w-3 h-3 rounded-full border border-white flex items-center justify-center shrink-0 hover:bg-white/20"
                      >
                        {task.isCompleted && (
                          <Check size={9} className="text-white stroke-[3]" />
                        )}
                      </button>
                      <span
                        className={`truncate ${
                          task.isCompleted ? "line-through opacity-75" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;
