import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCalendarStore } from "../store/calendar.store";
import CalendarHeader from "../components/CalendarHeader";
import CalendarSidebar from "../components/CalendarSidebar";
import CalendarSideRail from "../components/CalendarSideRail";
import TasksSidePanel from "../components/TasksSidePanel";
import CreateEventModal from "../components/CreateEventModal";
import EventDetailsPopover from "../components/EventDetailsPopover";
import DayView from "../components/views/DayView";
import WeekView from "../components/views/WeekView";
import MonthView from "../components/views/MonthView";
import FourDaysView from "../components/views/FourDaysView";
import YearView from "../components/views/YearView";
import ScheduleView from "../components/views/ScheduleView";

export const Calendar: React.FC = () => {
  const {
    fetchCalendars,
    fetchSettings,
    fetchEvents,
    fetchTasks,
    view,
    setView,
    nextPeriod,
    prevPeriod,
    goToToday,
    openCreateModal,
    closeCreateModal,
    setSelectedEvent,
    activeTopTab,
    isLoading,
  } = useCalendarStore();

  const [searchParams, setSearchParams] = useSearchParams();

  // Handle URL query parameters for cross-module integration (e.g. Schedule from Orvexa Meet)
  useEffect(() => {
    const isCreate = searchParams.get("create") === "true";
    const meetCode = searchParams.get("code");
    const meetId = searchParams.get("meetId");
    const title = searchParams.get("title");

    if (isCreate) {
      openCreateModal({
        title: title || undefined,
        meetingId: meetId || undefined,
        location: meetCode ? `${window.location.origin}/meet/${meetCode}` : undefined,
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, openCreateModal, setSearchParams]);

  useEffect(() => {
    fetchCalendars();
    fetchSettings();
    fetchEvents();
    fetchTasks();
  }, [fetchCalendars, fetchSettings, fetchEvents, fetchTasks]);

  // Global Keyboard Shortcuts (D, W, M, Y, A, X, T, J/N, K/P, C, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in inputs or contenteditable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable)
      ) {
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedEvent(null);
        closeCreateModal();
        return;
      }

      const key = e.key.toUpperCase();
      switch (key) {
        case "D":
          e.preventDefault();
          setView("day");
          break;
        case "W":
          e.preventDefault();
          setView("week");
          break;
        case "M":
          e.preventDefault();
          setView("month");
          break;
        case "Y":
          e.preventDefault();
          setView("year");
          break;
        case "A":
          e.preventDefault();
          setView("schedule");
          break;
        case "X":
          e.preventDefault();
          setView("4days");
          break;
        case "T":
          e.preventDefault();
          goToToday();
          break;
        case "J":
        case "N":
          e.preventDefault();
          nextPeriod();
          break;
        case "K":
        case "P":
          e.preventDefault();
          prevPeriod();
          break;
        case "C":
          e.preventDefault();
          openCreateModal();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setView,
    nextPeriod,
    prevPeriod,
    goToToday,
    openCreateModal,
    closeCreateModal,
    setSelectedEvent,
  ]);

  const renderActiveView = () => {
    switch (view) {
      case "day":
        return <DayView />;
      case "week":
        return <WeekView />;
      case "month":
        return <MonthView />;
      case "4days":
        return <FourDaysView />;
      case "year":
        return <YearView />;
      case "schedule":
        return <ScheduleView />;
      default:
        return <WeekView />;
    }
  };

  return (
    <div
      role="application"
      aria-label="Orvexa Calendar Application"
      className="flex flex-col h-full w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden select-none"
    >
      {/* 1. Orvexa Calendar Top Bar Header */}
      <CalendarHeader />

      {/* 2. Main Body: Left Sidebar + Central Grid Viewport + Right Side Panel + Side Rail */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        {/* Left Sidebar (Mini calendar, Create, Checklists) */}
        <CalendarSidebar />

        {/* Center Grid Viewport */}
        <main
          className="flex-1 h-full overflow-hidden bg-white dark:bg-slate-900 flex flex-col relative"
          role="main"
        >
          {isLoading && (
            <div
              role="progressbar"
              aria-label="Loading calendar data"
              className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600 animate-pulse z-40"
            />
          )}

          {/* Active View Shell */}
          <div
            className="flex-1 w-full h-full overflow-hidden flex flex-col"
            id="calendar-view-container"
          >
            {activeTopTab === "tasks" ? (
              <div className="p-6 flex flex-col h-full overflow-y-auto">
                <h2 className="text-xl font-normal text-slate-800 dark:text-slate-100 mb-4">
                  My Tasks
                </h2>
                <p className="text-sm text-slate-500">
                  Tasks view active. Use the side panel or calendar top toggle to switch.
                </p>
              </div>
            ) : (
              renderActiveView()
            )}
          </div>
        </main>

        {/* Right Tasks/Keep Slide-over Panel */}
        <TasksSidePanel />

        {/* Far Right Orvexa Workspace Rail */}
        <CalendarSideRail />
      </div>

      {/* 3. Event Details Popover */}
      <EventDetailsPopover />

      {/* 4. Event Creation / Editing Modal */}
      <CreateEventModal />
    </div>
  );
};

export default Calendar;
