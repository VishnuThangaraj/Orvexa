import React from "react";
import { Check } from "lucide-react";
import { useCalendarStore } from "../../store/calendar.store";
import { isToday } from "../../utils/date.utils";
import type { CalendarEvent, CalendarTask } from "../../types/calendar.types";

export const ScheduleView: React.FC = () => {
  const {
    events,
    tasks,
    calendars,
    setSelectedEvent,
    settings,
    toggleTaskCompleted,
    setActiveRightPanelTab,
  } = useCalendarStore();

  const isTasksCalendarVisible = calendars.some(
    (c) => c.systemType === "TASKS" && c.isVisible,
  );

  // Group events and tasks by date string (YYYY-MM-DD)
  const groupedItems: Record<
    string,
    { events: CalendarEvent[]; tasks: CalendarTask[] }
  > = {};

  for (const event of events) {
    const dateKey = new Date(event.startTime).toISOString().slice(0, 10);
    if (!groupedItems[dateKey]) groupedItems[dateKey] = { events: [], tasks: [] };
    groupedItems[dateKey].events.push(event);
  }

  if (isTasksCalendarVisible) {
    for (const task of tasks) {
      if (!task.dueDate) continue;
      if (task.isCompleted && !settings.showCompletedTasks) continue;
      const dateKey = new Date(task.dueDate).toISOString().slice(0, 10);
      if (!groupedItems[dateKey]) groupedItems[dateKey] = { events: [], tasks: [] };
      groupedItems[dateKey].tasks.push(task);
    }
  }

  const sortedDateKeys = Object.keys(groupedItems).sort();

  if (sortedDateKeys.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-white dark:bg-slate-900">
        <p className="text-base font-medium text-slate-600 dark:text-slate-300">
          No events or tasks scheduled
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Click "+ Create" or click on any time slot to schedule an event.
        </p>
      </div>
    );
  }

  return (
    <div
      role="feed"
      aria-label="Calendar schedule agenda"
      className="flex-1 w-full h-full overflow-y-auto p-4 md:p-8 select-none bg-white dark:bg-slate-900"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {sortedDateKeys.map((dateKey) => {
          const dateObj = new Date(dateKey);
          const isTodayDate = isToday(dateObj);
          const { events: dayEvents, tasks: dayTasks } = groupedItems[dateKey];

          const dateHeading = dateObj.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={dateKey}
              className="flex flex-col sm:flex-row sm:items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800"
            >
              {/* Date Header */}
              <div className="w-40 shrink-0 flex items-center gap-2 pt-1">
                {isTodayDate && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    isTodayDate
                      ? "font-bold text-blue-600 dark:text-blue-400"
                      : "font-semibold text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {dateHeading}
                </span>
              </div>

              {/* Items List (Events + Tasks) */}
              <div className="flex-1 space-y-2">
                {dayEvents.map((event) => {
                  const isHoliday =
                    event.eventType === "HOLIDAY" ||
                    event.calendar?.systemType === "HOLIDAYS";
                  const color = isHoliday
                    ? "#0b8043"
                    : event.color || "#039be5";

                  const timeLabel = event.isAllDay
                    ? "All day"
                    : `${new Date(event.startTime).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })} – ${new Date(event.endTime).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-start gap-3 cursor-pointer shadow-2xs group"
                    >
                      {/* Color indicator bar */}
                      <div
                        className="w-1.5 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {event.title}
                          </h4>
                          <span className="text-xs text-slate-400 shrink-0">
                            {timeLabel}
                          </span>
                        </div>

                        {event.location && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}

                {dayTasks.map((task) => (
                  <div
                    key={`task-${task.id}`}
                    onClick={() => setActiveRightPanelTab("tasks")}
                    className="w-full text-left p-3 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/70 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompleted(task.id, !task.isCompleted);
                        }}
                        className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      >
                        {task.isCompleted && (
                          <Check size={11} className="text-blue-600 stroke-[3]" />
                        )}
                      </button>
                      <span
                        className={`text-sm font-medium text-slate-800 dark:text-slate-100 truncate ${
                          task.isCompleted ? "line-through opacity-60" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium shrink-0">
                      Task
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;
