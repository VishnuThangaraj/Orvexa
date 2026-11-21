import React, { useState } from "react";
import {
  X,
  Clock,
  MapPin,
  AlignLeft,
  Calendar as CalendarIcon,
  Bell,
  Repeat,
  Video,
  Copy,
  Check,
  Paperclip,
  HardDrive,
} from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";
import { meetApi } from "@/modules/meet/api/meet.api";
import { DrivePickerModal, type DriveFileItem } from "@/modules/drive";

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
  const isCreateModalOpen = useCalendarStore((state) => state.isCreateModalOpen);
  if (!isCreateModalOpen) return null;
  return <CreateEventModalContent />;
};

const CreateEventModalContent: React.FC = () => {
  const {
    closeCreateModal,
    createModalInitialData,
    calendars,
    createEvent,
    selectedDate,
  } = useCalendarStore();

  const initialD = selectedDate || new Date();
  const initialDateStr = initialD.toISOString().slice(0, 10);

  const [title, setTitle] = useState(createModalInitialData?.title || "");
  const [description, setDescription] = useState(
    createModalInitialData?.description || "",
  );
  const [location, setLocation] = useState(
    createModalInitialData?.location || "",
  );
  const [isAllDay, setIsAllDay] = useState(
    Boolean(createModalInitialData?.isAllDay),
  );
  const [startDate, setStartDate] = useState(() => {
    if (createModalInitialData?.startTime) {
      return new Date(createModalInitialData.startTime)
        .toISOString()
        .slice(0, 10);
    }
    return initialDateStr;
  });
  const [startTime, setStartTime] = useState(() => {
    if (createModalInitialData?.startTime) {
      return new Date(createModalInitialData.startTime)
        .toTimeString()
        .slice(0, 5);
    }
    return "09:00";
  });
  const [endDate, setEndDate] = useState(() => {
    if (createModalInitialData?.endTime) {
      return new Date(createModalInitialData.endTime)
        .toISOString()
        .slice(0, 10);
    }
    return initialDateStr;
  });
  const [endTime, setEndTime] = useState(() => {
    if (createModalInitialData?.endTime) {
      return new Date(createModalInitialData.endTime)
        .toTimeString()
        .slice(0, 5);
    }
    return "10:00";
  });
  const [recurrenceRule, setRecurrenceRule] = useState(
    createModalInitialData?.recurrenceRule || "",
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState(() => {
    if (createModalInitialData?.calendarId) {
      return createModalInitialData.calendarId;
    }
    const primary = calendars.find((c) => c.isPrimary) || calendars[0];
    return primary?.id || "";
  });
  const [color, setColor] = useState(
    createModalInitialData?.color || "#039be5",
  );
  const [reminders, setReminders] = useState<number[]>([15]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(
    createModalInitialData?.meetingId || null,
  );
  const [meetingCode, setMeetCode] = useState<string | null>(() => {
    const loc = createModalInitialData?.location || "";
    if (loc.includes("/meet/")) {
      return loc.split("/meet/")[1].split("?")[0].trim();
    }
    return null;
  });
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [meetCopied, setMeetCopied] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<DriveFileItem[]>([]);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  const handleDrivePickerSelect = (files: DriveFileItem[]) => {
    setSelectedDriveFiles((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const newFiles = files.filter((f) => !existingIds.has(f.id));
      return [...prev, ...newFiles];
    });
  };

  const handleRemoveDriveFile = (fileId: string) => {
    setSelectedDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleAddMeet = async () => {
    setIsCreatingMeet(true);
    try {
      const meeting = await meetApi.createMeeting({
        title: title.trim() || "Orvexa Meet Video Call",
        requireApproval: true,
      });
      setMeetingId(meeting.id);
      setMeetCode(meeting.meetingCode);
    } catch (err) {
      console.error("Failed to create Orvexa Meet call:", err);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const handleRemoveMeet = () => {
    setMeetingId(null);
    setMeetCode(null);
  };

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

      const finalLocation = meetingCode
        ? location.trim() || `${window.location.origin}/meet/${meetingCode}`
        : location.trim() || undefined;

      const attachmentsPayload = selectedDriveFiles.map((f) => ({
        fileId: f.id,
        assetId: f.asset.id,
        title: f.name,
        mimeType: f.asset.mimeType,
        sizeBytes: f.asset.bytes,
      }));

      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: finalLocation,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isAllDay,
        calendarId: selectedCalendarId || undefined,
        color,
        recurrenceRule: recurrenceRule || null,
        meetingId: meetingId || undefined,
        reminders: reminders.map((m) => ({ minutesBefore: m })),
        attachments: attachmentsPayload.length > 0 ? attachmentsPayload : undefined,
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

          {/* Orvexa Meet Video Conferencing */}
          {!meetingCode ? (
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Video size={18} className="text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={handleAddMeet}
                disabled={isCreatingMeet}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800 disabled:opacity-60"
              >
                <Video size={15} />
                <span>
                  {isCreatingMeet
                    ? "Adding Orvexa Meet..."
                    : "Add Orvexa Meet video conferencing"}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Video size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Video size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-blue-950 dark:text-blue-100 flex items-center gap-2">
                      <span>Join with Orvexa Meet</span>
                    </div>
                    <p className="text-[11px] font-mono text-blue-700 dark:text-blue-300 truncate">
                      {window.location.origin}/meet/{meetingCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/meet/${meetingCode}`,
                      );
                      setMeetCopied(true);
                      setTimeout(() => setMeetCopied(false), 2000);
                    }}
                    title="Copy meeting link"
                    className="p-1.5 rounded-full hover:bg-blue-200/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                  >
                    {meetCopied ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveMeet}
                    title="Remove Orvexa Meet"
                    className="p-1.5 rounded-full hover:bg-blue-200/60 dark:hover:bg-blue-900/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* Drive Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <Paperclip size={18} className="text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Attachments
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrivePickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                <HardDrive size={14} />
                <span>Add from Drive</span>
              </button>
            </div>

            {selectedDriveFiles.length > 0 && (
              <div className="pl-7 flex flex-wrap gap-2">
                {selectedDriveFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-[#f0f4f9] dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <HardDrive size={13} className="text-[#1a73e8] shrink-0" />
                    <span className="font-medium truncate max-w-44" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDriveFile(f.id)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer ml-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

      {/* Drive File Picker Modal */}
      <DrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={(files) => handleDrivePickerSelect(files)}
        allowMultiple={true}
        title="Attach from Drive"
      />
    </div>
  );
};

export default CreateEventModal;
