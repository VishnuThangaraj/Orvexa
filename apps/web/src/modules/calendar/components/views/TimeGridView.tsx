import React, { useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { useCalendarStore } from "../../store/calendar.store";
import { formatTimeSlot, isToday, isSameDay } from "../../utils/date.utils";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import { computeDayEventPositions } from "../../utils/event-layout.utils";

interface TimeGridViewProps {
  days: Date[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TimeGridView: React.FC<TimeGridViewProps> = ({ days }) => {
  const {
    events,
    tasks,
    calendars,
    setSelectedEvent,
    openCreateModal,
    settings,
    toggleTaskCompleted,
    setActiveRightPanelTab,
  } = useCalendarStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to 8 AM by default (8 * 48px = 384px)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 384;
    }
  }, []);

  const isTasksCalendarVisible = calendars.some(
    (c) => c.systemType === "TASKS" && c.isVisible,
  );

  // Filter all-day events and tasks for the days in view
  const allDayItemsByDay = days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAllDayEvents = events.filter((e) => {
      if (!e.isAllDay) return false;
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      return start <= dayEnd && end >= dayStart;
    });

    const dayTasks = isTasksCalendarVisible
      ? tasks.filter((t) => {
          if (!t.dueDate) return false;
          if (t.isCompleted && !settings.showCompletedTasks) return false;
          return isSameDay(t.dueDate, day);
        })
      : [];

    return { events: dayAllDayEvents, tasks: dayTasks };
  });

  const hasAnyAllDay = allDayItemsByDay.some(
    (item) => item.events.length > 0 || item.tasks.length > 0,
  );

  const handleSlotClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(day);
    end.setHours(hour + 1, 0, 0, 0);

    openCreateModal({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isAllDay: false,
    });
  };

  return (
    <div
      role="grid"
      aria-label="Calendar time grid"
      className="flex flex-col h-full w-full overflow-hidden select-none bg-white dark:bg-slate-900"
    >
      {/* 1. Header Row (Day Names, Date Badges & All-Day Event Row) */}
      <div
        role="row"
        className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-20"
      >
        {/* Timezone label header */}
        <div className="w-16 sm:w-20 shrink-0 flex flex-col justify-end pb-2 px-2 border-r border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {settings.timezone === "Asia/Kolkata" ? "GMT+5:30" : "GMT"}
          </span>
        </div>

        {/* Day Header Columns */}
        <div className="flex-1 grid grid-flow-col auto-cols-fr divide-x divide-slate-200 dark:border-slate-800">
          {days.map((day) => {
            const isCurrentToday = isToday(day);
            const dayOfWeek = DAY_NAMES[day.getDay()];
            const dayNum = day.getDate();

            return (
              <div
                key={day.toISOString()}
                role="columnheader"
                aria-label={`${dayOfWeek} ${dayNum}`}
                className="flex flex-col items-center py-2 px-1"
              >
                <span
                  className={`text-[11px] font-medium tracking-wider uppercase mb-1 ${
                    isCurrentToday
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {dayOfWeek}
                </span>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[22px] font-normal leading-none transition-colors ${
                    isCurrentToday
                      ? "bg-blue-600 text-white font-medium shadow-2xs"
                      : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {dayNum}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. All-Day Events & Tasks Row */}
      {hasAnyAllDay && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10 max-h-28 overflow-y-auto">
          <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 dark:border-slate-800 py-1 px-2 flex items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              All day
            </span>
          </div>
          <div className="flex-1 grid grid-flow-col auto-cols-fr divide-x divide-slate-200 dark:divide-slate-800 p-1 gap-y-1">
            {days.map((day, dIdx) => {
              const { events: dayEvents, tasks: dayTasks } = allDayItemsByDay[dIdx];
              return (
                <div key={`allday-${day.toISOString()}`} className="space-y-1 px-1">
                  {dayEvents.map((event) => {
                    const bgColor = event.color || "#0b8043";
                    return (
                      <button
                        key={`event-${event.id}`}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        style={{ backgroundColor: bgColor }}
                        className="w-full text-left px-2 py-0.5 rounded text-xs font-medium text-white truncate shadow-2xs hover:brightness-95 cursor-pointer block"
                        title={event.title}
                      >
                        {event.title}
                      </button>
                    );
                  })}

                  {dayTasks.map((task) => (
                    <div
                      key={`task-${task.id}`}
                      onClick={() => setActiveRightPanelTab("tasks")}
                      className="w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-white truncate shadow-2xs hover:brightness-95 cursor-pointer bg-[#3f51b5]"
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
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Scrollable Hourly Time Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative flex"
      >
        {/* Time labels column */}
        <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 dark:border-slate-800 select-none py-0">
          {HOURS.map((hour) => (
            <div
              key={`hour-label-${hour}`}
              className="h-12 relative -top-2.5 text-right pr-2"
            >
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {hour === 0 ? "" : formatTimeSlot(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Day Grid Columns */}
        <div className="flex-1 grid grid-flow-col auto-cols-fr divide-x divide-slate-200 dark:divide-slate-800 relative">
          {days.map((day) => {
            const isCurrentToday = isToday(day);
            const positionedEvents = computeDayEventPositions(events, day);

            return (
              <div
                key={`grid-col-${day.toISOString()}`}
                className="relative h-[1152px]" // 24 * 48px
              >
                {/* 24 Hourly Slot click targets */}
                {HOURS.map((hour) => (
                  <div
                    key={`slot-${day.toISOString()}-${hour}`}
                    role="gridcell"
                    aria-label={`${formatTimeSlot(hour)} on ${day.toDateString()}`}
                    tabIndex={0}
                    onClick={() => handleSlotClick(day, hour)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSlotClick(day, hour);
                      }
                    }}
                    className="h-12 border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  />
                ))}

                {/* Real-Time Red Indicator Line if this column is today */}
                {isCurrentToday && <CurrentTimeIndicator showDot={true} />}

                {/* Timed Event Cards */}
                {positionedEvents.map(({ event, top, height, leftPct, widthPct }) => {
                  const bgColor = event.color || "#039be5";
                  const startStr = new Date(event.startTime).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }
                      }}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: bgColor,
                      }}
                      className="absolute rounded-lg p-1.5 text-white shadow-2xs hover:shadow-md hover:brightness-95 transition-all cursor-pointer z-10 overflow-hidden flex flex-col justify-start focus:ring-2 focus:ring-white"
                      title={`${event.title} (${startStr})`}
                    >
                      <p className="text-xs font-semibold leading-tight truncate">
                        {event.title}
                      </p>
                      <p className="text-[10px] font-medium opacity-90 truncate mt-0.5">
                        {startStr}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeGridView;
