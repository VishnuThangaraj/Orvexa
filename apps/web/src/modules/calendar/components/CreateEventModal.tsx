import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  MapPin,
  AlignLeft,
  Calendar as CalendarIcon,
  Bell,
  Repeat,
} from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";

const COLOR_PALETTE = [
  { name: "Peacock", value: "#039be5" },
  { name: "Basil", value: "#0b8043" },
  { name: "Lavender", value: "#7986cb" },
  { name: "Grape", value: "#8e24aa" },
  { name: "Flamingo", value: "#e67c73" },
  { name: "Tangerine", value: "#f4511e" },
  { name: "Banana", value: "#f6bf26" },
  { name: "Sage", value: "#33b679" },
  { name: "Blueberry", value: "#3f51b5" },
  { name: "Graphite", value: "#616161" },
];

export const CreateEventModal: React.FC = () => {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createModalInitialData,
    calendars,
    createEvent,
    selectedDate,
  } = useCalendarStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [color, setColor] = useState("#039be5");
  const [reminders, setReminders] = useState<number[]>([15]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal opens or initial data changes
  useEffect(() => {
    if (!isCreateModalOpen) return;

    if (createModalInitialData) {
      setTitle(createModalInitialData.title || "");
      setDescription(createModalInitialData.description || "");
      setLocation(createModalInitialData.location || "");
      setIsAllDay(Boolean(createModalInitialData.isAllDay));
      setRecurrenceRule(createModalInitialData.recurrenceRule || "");
      setColor(createModalInitialData.color || "#039be5");
      if (createModalInitialData.calendarId) {
        setSelectedCalendarId(createModalInitialData.calendarId);
      }

      if (createModalInitialData.startTime) {
        const s = new Date(createModalInitialData.startTime);
        setStartDate(s.toISOString().slice(0, 10));
        setStartTime(s.toTimeString().slice(0, 5));
      } else {
        const d = selectedDate || new Date();
        setStartDate(d.toISOString().slice(0, 10));
        setStartTime("09:00");
      }

      if (createModalInitialData.endTime) {
        const e = new Date(createModalInitialData.endTime);
        setEndDate(e.toISOString().slice(0, 10));
        setEndTime(e.toTimeString().slice(0, 5));
      } else {
        const d = selectedDate || new Date();
        setEndDate(d.toISOString().slice(0, 10));
        setEndTime("10:00");
      }
    } else {
      const d = selectedDate || new Date();
      const dateStr = d.toISOString().slice(0, 10);
      setTitle("");
      setDescription("");
      setLocation("");
      setIsAllDay(false);
      setStartDate(dateStr);
      setStartTime("09:00");
      setEndDate(dateStr);
      setEndTime("10:00");
      setRecurrenceRule("");
      setColor("#039be5");
      setReminders([15]);
    }

    if (calendars.length > 0 && !selectedCalendarId) {
      const primary = calendars.find((c) => c.isPrimary) || calendars[0];
      setSelectedCalendarId(primary.id);
    }
  }, [isCreateModalOpen, createModalInitialData, selectedDate, calendars, selectedCalendarId]);

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const startDateTime = isAllDay
        ? new Date(`${startDate}T00:00:00.000Z`)
        : new Date(`${startDate}T${startTime}:00`);

      const endDateTime = isAllDay
        ? new Date(`${endDate}T23:59:59.999Z`)
        : new Date(`${endDate}T${endTime}:00`);

      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isAllDay,
        calendarId: selectedCalendarId || undefined,
        color,
        recurrenceRule: recurrenceRule || null,
        reminders: reminders.map((m) => ({ minutesBefore: m })),
      });

      closeCreateModal();
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs select-none"
      onClick={closeCreateModal}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Create Event
          </span>
          <button
            type="button"
            onClick={closeCreateModal}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title Input */}
          <input
            type="text"
            placeholder="Add title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full text-2xl font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 focus:outline-none focus:border-blue-600 transition-colors"
          />

          {/* Date, Time & All Day */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Clock size={18} className="text-slate-400 shrink-0" />
              <div className="flex flex-wrap items-center gap-2 text-sm flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {!isAllDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                <span className="text-slate-400">–</span>

                {!isAllDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* All Day Checkbox */}
            <div className="pl-7">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>All day</span>
              </label>
            </div>
          </div>

          {/* Recurrence Selector */}
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Repeat size={18} className="text-slate-400 shrink-0" />
            <select
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Does not repeat</option>
              <option value="FREQ=DAILY;INTERVAL=1">Daily</option>
              <option value="FREQ=WEEKLY;INTERVAL=1">Weekly</option>
              <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">
                Every weekday (Monday to Friday)
              </option>
              <option value="FREQ=MONTHLY;INTERVAL=1">Monthly</option>
              <option value="FREQ=YEARLY;INTERVAL=1">Annually</option>
            </select>
          </div>

          {/* Location Input */}
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <MapPin size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description Textarea */}
          <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
            <AlignLeft size={18} className="text-slate-400 shrink-0 mt-2" />
            <textarea
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Target Calendar Selector */}
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <CalendarIcon size={18} className="text-slate-400 shrink-0" />
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {calendars
                .filter((c) => c.systemType !== "HOLIDAYS")
                .map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Color Picker Palette */}
          <div className="pl-7 space-y-1.5">
            <span className="text-xs font-medium text-slate-500">Event Color</span>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((pal) => (
                <button
                  key={pal.value}
                  type="button"
                  onClick={() => setColor(pal.value)}
                  style={{ backgroundColor: pal.value }}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    color === pal.value
                      ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                      : "hover:scale-105"
                  }`}
                  title={pal.name}
                />
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Bell size={18} className="text-slate-400 shrink-0" />
            <select
              value={reminders[0] || 15}
              onChange={(e) => setReminders([parseInt(e.target.value, 10)])}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/80">
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full cursor-pointer shadow-md transition-all"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
