import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Plus,
  Video,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { HomeCalendarData } from "../types/home.types";
import { getMiniMonthGrid } from "@/modules/calendar/utils/date.utils";
import { cn } from "@/lib/utils";

interface CalendarWidgetProps {
  data?: HomeCalendarData;
  isLoading?: boolean;
  error?: string | null;
  size?: "full" | "half" | string;
  onResize?: (size: "full" | "half") => void;
  onRetry?: () => void;
}

function formatEventTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function getCountdownText(startIso: string): string {
  try {
    const start = new Date(startIso).getTime();
    const now = Date.now();
    const diffMs = start - now;

    if (diffMs <= 0) return "In progress";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return diffMins <= 1 ? "Starts in 1 min" : `Starts in ${diffMins} mins`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? "In 1 hour" : `In ${diffHours} hours`;
    }

    return "Upcoming";
  } catch {
    return "Upcoming";
  }
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  data,
  isLoading = false,
  error = null,
  size = "half",
  onResize,
  onRetry,
}) => {
  const navigate = useNavigate();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());
  const [countdown, setCountdown] = useState<string>("");

  const todayEvents = data?.todayEvents || [];
  const nextUp = data?.nextUp;
  const eventDateSet = new Set(data?.monthEventDates || []);

  useEffect(() => {
    if (!nextUp) {
      setCountdown("");
      return;
    }

    setCountdown(getCountdownText(nextUp.startTime));
    const interval = setInterval(() => {
      setCountdown(getCountdownText(nextUp.startTime));
    }, 60000);

    return () => clearInterval(interval);
  }, [nextUp]);

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

  const monthGrid = getMiniMonthGrid(currentYear, currentMonth);

  const headerActions = (
    <button
      type="button"
      onClick={() => navigate("/calendar?create=true")}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
    >
      <Plus size={13} />
      <span>New Event</span>
    </button>
  );

  return (
    <WidgetCard
      title="Calendar"
      icon={CalendarIcon}
      iconColor="text-[#1a73e8]"
      iconBg="bg-blue-50 dark:bg-blue-950/40"
      badge={todayEvents.length > 0 ? `${todayEvents.length} today` : undefined}
      badgeColor="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40"
      openTo="/calendar"
      openLabel="Open Calendar"
      headerActions={headerActions}
      size={size}
      onResize={onResize}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      isEmpty={todayEvents.length === 0 && !nextUp}
      emptyTitle="Nothing scheduled for today"
      emptyMessage="Enjoy your free day, or schedule a new event or focus block."
      emptyIcon={Sparkles}
      emptyAction={
        <button
          type="button"
          onClick={() => navigate("/calendar?create=true")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] shadow-xs transition-all cursor-pointer"
        >
          <Plus size={13} />
          <span>Create an event</span>
        </button>
      }
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Next Up Highlight Card */}
        {nextUp && (
          <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/30 dark:from-blue-950/50 dark:via-indigo-950/30 dark:to-slate-900/60 rounded-[20px] border border-blue-200/70 dark:border-blue-900/50 shadow-2xs flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a73e8] text-white uppercase tracking-wider shrink-0 shadow-2xs">
                  Next Up
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {countdown}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-1.5">
                {nextUp.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1 shrink-0 font-medium">
                  <Clock size={12} className="text-slate-400" />
                  <span>
                    {formatEventTime(nextUp.startTime)} – {formatEventTime(nextUp.endTime)}
                  </span>
                </span>
                {nextUp.location && (
                  <span className="hidden sm:flex items-center gap-1 truncate max-w-40">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{nextUp.location}</span>
                  </span>
                )}
                {nextUp.attendeeCount > 1 && (
                  <span className="hidden sm:flex items-center gap-1 font-medium">
                    <Users size={12} className="text-slate-400 shrink-0" />
                    <span>{nextUp.attendeeCount} guests</span>
                  </span>
                )}
              </div>
            </div>

            {nextUp.meetUrl ? (
              <button
                type="button"
                onClick={() => navigate(nextUp.meetUrl!)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] transition-all shadow-xs hover:shadow-sm cursor-pointer shrink-0 active:scale-95"
              >
                <Video size={14} />
                <span>Join Meet</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/calendar?eventId=${nextUp.id}`)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 cursor-pointer shrink-0 transition-colors"
              >
                View
              </button>
            )}
          </div>
        )}

        {/* Content: Today's Agenda + Compact Mini Month */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-0">
          {/* Today's Agenda (3 cols) */}
          <div className="md:col-span-3 space-y-2 overflow-y-auto max-h-60 pr-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Today's Agenda</span>
              <span>{todayEvents.length} event{todayEvents.length === 1 ? "" : "s"}</span>
            </div>

            {todayEvents.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center italic bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No more events scheduled for today
              </div>
            ) : (
              todayEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/calendar?eventId=${evt.id}`)}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: evt.color || "#1a73e8" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors">
                        {evt.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {evt.isAllDay
                          ? "All day"
                          : `${formatEventTime(evt.startTime)} – ${formatEventTime(evt.endTime)}`}
                        {evt.location && ` • ${evt.location}`}
                      </div>
                    </div>
                  </div>

                  {evt.meetUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(evt.meetUrl!);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors shrink-0"
                    >
                      <Video size={11} />
                      <span>Join</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Mini Month Calendar (2 cols) */}
          <div className="md:col-span-2 p-3 bg-slate-50/70 dark:bg-slate-900/60 rounded-[22px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between select-none">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {new Date(currentYear, currentMonth).toLocaleDateString([], {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 text-center mb-1">
              {DAYS_OF_WEEK.map((day, i) => (
                <span
                  key={`dow-${i}`}
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {monthGrid.map((cell, idx) => {
                const y = cell.date.getFullYear();
                const m = String(cell.date.getMonth() + 1).padStart(2, "0");
                const d = String(cell.date.getDate()).padStart(2, "0");
                const dateKey = `${y}-${m}-${d}`;
                const hasEvents = eventDateSet.has(dateKey);

                return (
                  <button
                    key={`cell-${idx}`}
                    type="button"
                    onClick={() => navigate(`/calendar?date=${dateKey}`)}
                    className={cn(
                      "relative h-6 w-6 mx-auto rounded-full flex flex-col items-center justify-center text-[10px] transition-colors cursor-pointer",
                      cell.isCurrentMonth
                        ? "text-slate-700 dark:text-slate-300 font-medium"
                        : "text-slate-300 dark:text-slate-600",
                      cell.isToday &&
                        "bg-[#1a73e8] text-white font-bold shadow-2xs hover:bg-[#1557b0]",
                      !cell.isToday &&
                        cell.isCurrentMonth &&
                        "hover:bg-slate-200/60 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{cell.dayNumber}</span>
                    {hasEvents && !cell.isToday && (
                      <span className="w-1 h-1 rounded-full bg-[#1a73e8] dark:bg-blue-400 absolute bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Shortcut */}
            <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 text-[10px]">Tap date to view</span>
              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className="text-[#1a73e8] dark:text-[#8ab4f8] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Full view</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

export default CalendarWidget;
