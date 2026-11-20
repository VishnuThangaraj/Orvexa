export type CalendarView =
  | "day"
  | "week"
  | "month"
  | "year"
  | "schedule"
  | "4days";

export type EventVisibility = "DEFAULT" | "PUBLIC" | "PRIVATE" | "CONFIDENTIAL";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";

export type CalendarEventType =
  | "PERSONAL"
  | "WORK"
  | "MEETING"
  | "HOLIDAY"
  | "OUT_OF_OFFICE"
  | "REMINDER"
  | "TASK";

export interface CalendarParticipant {
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
}

export interface CalendarReminder {
  id: string;
  minutesBefore: number;
  remindAt: string;
}

export interface UserCalendar {
  id: string;
  userId?: string | null;
  name: string;
  color: string;
  isVisible: boolean;
  isPrimary: boolean;
  isSystem: boolean;
  isPublic?: boolean;
  systemType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
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
  meeting?: {
    id: string;
    meetingCode: string;
    title: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  masterEventId?: string;
  isRecurringInstance?: boolean;
  calendar?: {
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    isPrimary: boolean;
    isSystem: boolean;
    systemType?: string | null;
  } | null;
  participants?: CalendarParticipant[];
  reminders?: CalendarReminder[];
  myResponseStatus?: InvitationStatus;
}

export interface CalendarTask {
  id: string;
  userId: string;
  title: string;
  details?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSetting {
  id?: string;
  userId?: string;
  defaultView: CalendarView;
  showWeekends: boolean;
  showDeclinedEvents: boolean;
  showCompletedTasks: boolean;
  timezone: string;
}

export interface CreateEventInput {
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  timezone?: string | null;
  location?: string | null;
  calendarId?: string | null;
  color?: string | null;
  eventType?: CalendarEventType;
  visibility?: EventVisibility;
  recurrenceRule?: string | null;
  meetingId?: string | null;
  guestUserIds?: string[];
  reminders?: Array<{ minutesBefore: number }>;
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  timezone?: string | null;
  location?: string | null;
  calendarId?: string | null;
  color?: string | null;
  eventType?: CalendarEventType;
  visibility?: EventVisibility;
  recurrenceRule?: string | null;
  meetingId?: string | null;
  recurrenceMode?: "SINGLE" | "FOLLOWING" | "ALL";
  targetInstanceDate?: string;
  guestUserIds?: string[];
  reminders?: Array<{ minutesBefore: number }>;
}

export interface CreateTaskInput {
  title: string;
  details?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  details?: string | null;
  dueDate?: string | null;
  isCompleted?: boolean;
}
