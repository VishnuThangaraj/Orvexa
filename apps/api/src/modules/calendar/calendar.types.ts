import type {
  CalendarEventType,
  EventVisibility,
  InvitationStatus,
  CalendarAccessLevel,
} from "../../generated/prisma/enums.js";

export {
  CalendarEventType,
  EventVisibility,
  InvitationStatus,
  CalendarAccessLevel,
};

export interface CreateEventDto {
  title: string;
  description?: string | null;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay?: boolean;
  timezone?: string | null;
  location?: string | null;
  calendarId?: string | number | bigint | null;
  color?: string | null;
  eventType?: CalendarEventType;
  visibility?: EventVisibility;
  recurrenceRule?: string | null;
  meetingId?: string | number | bigint | null;
  guestUserIds?: Array<string | number | bigint>;
  reminders?: Array<{ minutesBefore: number }>;
}

export interface UpdateEventDto {
  title?: string;
  description?: string | null;
  startTime?: string | Date;
  endTime?: string | Date;
  isAllDay?: boolean;
  timezone?: string | null;
  location?: string | null;
  calendarId?: string | number | bigint | null;
  color?: string | null;
  eventType?: CalendarEventType;
  visibility?: EventVisibility;
  recurrenceRule?: string | null;
  meetingId?: string | number | bigint | null;
  guestUserIds?: Array<string | number | bigint>;
  reminders?: Array<{ minutesBefore: number }>;
  recurrenceMode?: "SINGLE" | "FOLLOWING" | "ALL";
  targetInstanceDate?: string | Date;
}

export interface FetchEventsQueryDto {
  start: string;
  end: string;
  calendarIds?: string[];
  search?: string;
  includeDeclined?: boolean;
}

export interface CreateUserCalendarDto {
  name: string;
  color?: string;
}

export interface UpdateUserCalendarDto {
  name?: string;
  color?: string;
  isVisible?: boolean;
}

export interface CreateTaskDto {
  title: string;
  details?: string | null;
  dueDate?: string | Date | null;
}

export interface UpdateTaskDto {
  title?: string;
  details?: string | null;
  dueDate?: string | Date | null;
  isCompleted?: boolean;
}

export interface FetchTasksQueryDto {
  start?: string;
  end?: string;
  includeCompleted?: boolean;
}

export interface UpdateCalendarSettingsDto {
  defaultView?: string;
  showWeekends?: boolean;
  showDeclinedEvents?: boolean;
  showCompletedTasks?: boolean;
  timezone?: string;
  hiddenCalendarIds?: string | null;
}

export interface UpdateRsvpDto {
  responseStatus: InvitationStatus;
}

export interface CalendarEventInstance {
  id: string;
  title: string;
  description?: string | null;
  createdBy?: string | null;
  calendarId?: string | null;
  color?: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  timezone?: string | null;
  location?: string | null;
  eventType: CalendarEventType;
  visibility: EventVisibility;
  recurrenceRule?: string | null;
  meetingId?: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  masterEventId?: string;
  isRecurringInstance?: boolean;
  calendar?: {
    id: string;
    userId?: string | null;
    name: string;
    color: string;
    isVisible: boolean;
    isPrimary: boolean;
    isSystem: boolean;
    isPublic?: boolean;
    systemType?: string | null;
  } | null;
  participants?: Array<{
    id: string;
    userId: string;
    responseStatus: InvitationStatus;
    user: {
      id: string;
      fullName: string;
      username: string;
      email: string;
      profileImage?: { secureUrl: string } | null;
    };
  }>;
  reminders?: Array<{
    id: string;
    minutesBefore: number;
    remindAt: string;
  }>;
  myResponseStatus?: InvitationStatus;
}
