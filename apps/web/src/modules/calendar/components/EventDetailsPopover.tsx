import React, { useState } from "react";
import {
  X,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  AlignLeft,
  Calendar as CalendarIcon,
  Users,
  Repeat,
  Video,
  Copy,
  Check,
} from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";
import type { InvitationStatus } from "../types/calendar.types";
import RecurringActionModal from "./RecurringActionModal";

export const EventDetailsPopover: React.FC = () => {
  const {
    selectedEvent,
    setSelectedEvent,
    openCreateModal,
    deleteEvent,
    rsvpEvent,
  } = useCalendarStore();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [meetCopied, setMeetCopied] = useState(false);

  if (!selectedEvent) return null;

  const meetCode =
    selectedEvent.meeting?.meetingCode ||
    (selectedEvent.location && selectedEvent.location.includes("/meet/")
      ? selectedEvent.location.split("/meet/")[1].split("?")[0].trim()
      : null);
  const meetUrl = meetCode
    ? `${window.location.origin}/meet/${meetCode}`
    : selectedEvent.location && selectedEvent.location.includes("/meet/")
    ? selectedEvent.location
    : null;

  const isHoliday =
    selectedEvent.eventType === "HOLIDAY" ||
    selectedEvent.calendar?.systemType === "HOLIDAYS";
  const eventColor = isHoliday
    ? "#0b8043"
    : selectedEvent.color || selectedEvent.calendar?.color || "#039be5";

  const startDate = new Date(selectedEvent.startTime);
  const endDate = new Date(selectedEvent.endTime);

  const dateStr = startDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = selectedEvent.isAllDay
    ? "All day"
    : `${startDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })} – ${endDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;

  const isRecurring = Boolean(
    selectedEvent.recurrenceRule || selectedEvent.isRecurringInstance,
  );

  const handleEditClick = () => {
    const eventToEdit = selectedEvent;
    setSelectedEvent(null);
    openCreateModal({
      title: eventToEdit.title,
      description: eventToEdit.description,
      startTime: eventToEdit.startTime,
      endTime: eventToEdit.endTime,
      isAllDay: eventToEdit.isAllDay,
      location: eventToEdit.location,
      color: eventToEdit.color,
      calendarId: eventToEdit.calendarId,
      eventType: eventToEdit.eventType,
      visibility: eventToEdit.visibility,
      recurrenceRule: eventToEdit.recurrenceRule,
      meetingId: eventToEdit.meetingId,
    });
  };

  const handleDeleteConfirm = async (mode: "SINGLE" | "ALL") => {
    setIsDeleteModalOpen(false);
    const idToDelete = selectedEvent.masterEventId || selectedEvent.id;
    await deleteEvent(idToDelete, {
      recurrenceMode: mode,
      targetInstanceDate: selectedEvent.startTime,
    });
  };

  const handleDeleteClick = async () => {
    if (isRecurring) {
      setIsDeleteModalOpen(true);
    } else {
      await deleteEvent(selectedEvent.id);
    }
  };

  const handleRsvp = async (status: InvitationStatus) => {
    await rsvpEvent(selectedEvent.masterEventId || selectedEvent.id, status);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center p-4 backdrop-blur-2xs select-none"
        onClick={() => setSelectedEvent(null)}
      >
        <div
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Action Icons */}
          <div className="flex items-center justify-end gap-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
            {!isHoliday && (
              <>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Edit event"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Event Content */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title with Colored Identifier */}
            <div className="flex items-start gap-3">
              <div
                className="w-4 h-4 rounded-md mt-1 shrink-0"
                style={{ backgroundColor: eventColor }}
              />
              <div>
                <h2 className="text-xl font-normal text-slate-800 dark:text-slate-100 leading-snug">
                  {selectedEvent.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Clock size={13} className="shrink-0" />
                  <span>
                    {dateStr} • {timeStr}
                  </span>
                </div>
                {isRecurring && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-1">
                    <Repeat size={12} />
                    <span>Repeats ({selectedEvent.recurrenceRule || "Series"})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Orvexa Meet Video Conference Card */}
            {meetUrl && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
                  >
                    <Video size={15} />
                    <span>Join with Orvexa Meet</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(meetUrl);
                      setMeetCopied(true);
                      setTimeout(() => setMeetCopied(false), 2000);
                    }}
                    className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                    title="Copy joining info"
                  >
                    {meetCopied ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <p className="text-[11px] font-mono text-blue-700 dark:text-blue-300 text-center truncate">
                  {meetUrl}
                </p>
              </div>
            )}

            {/* Location */}
            {selectedEvent.location && (
              <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <MapPin size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <span>{selectedEvent.location}</span>
              </div>
            )}

            {/* Description */}
            {selectedEvent.description && (
              <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <AlignLeft size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="whitespace-pre-line leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {/* Calendar */}
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <CalendarIcon size={18} className="text-slate-400 shrink-0" />
              <span>
                {selectedEvent.calendar?.name || "Calendar"}
              </span>
            </div>

            {/* Guests / Participants */}
            {selectedEvent.participants && selectedEvent.participants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Users size={14} />
                  <span>Guests ({selectedEvent.participants.length})</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {selectedEvent.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate">{p.user.fullName || p.user.email}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          p.responseStatus === "ACCEPTED"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                            : p.responseStatus === "DECLINED"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {p.responseStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RSVP Response Bar */}
          {!isHoliday && (
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Going?
              </span>
              <div className="flex items-center gap-1">
                {(["ACCEPTED", "DECLINED", "TENTATIVE"] as InvitationStatus[]).map(
                  (status) => {
                    const isCurrent = selectedEvent.myResponseStatus === status;
                    const label =
                      status === "ACCEPTED"
                        ? "Yes"
                        : status === "DECLINED"
                        ? "No"
                        : "Maybe";

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleRsvp(status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-2xs font-semibold"
                            : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recurring Event Delete Confirmation Modal */}
      <RecurringActionModal
        isOpen={isDeleteModalOpen}
        actionType="delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};

export default EventDetailsPopover;
