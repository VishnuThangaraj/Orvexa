import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  CalendarEvent,
  UserCalendar,
  CalendarTask,
  CalendarSetting,
  CreateEventInput,
  UpdateEventInput,
  CreateTaskInput,
  UpdateTaskInput,
  InvitationStatus,
} from "../types/calendar.types";

export const calendarApi = {
  // Events
  getEvents: async (params: {
    start: string;
    end: string;
    calendarIds?: string[];
    search?: string;
    includeDeclined?: boolean;
  }): Promise<CalendarEvent[]> => {
    const res = await api.get<ApiResponse<CalendarEvent[]>>("/calendar/events", {
      params: {
        ...params,
        calendarIds: params.calendarIds?.join(","),
      },
    });
    return res.data.data;
  },

  getEventById: async (id: string): Promise<CalendarEvent> => {
    const res = await api.get<ApiResponse<CalendarEvent>>(`/calendar/events/${id}`);
    return res.data.data;
  },

  createEvent: async (data: CreateEventInput): Promise<CalendarEvent> => {
    const res = await api.post<ApiResponse<CalendarEvent>>("/calendar/events", data);
    return res.data.data;
  },

  updateEvent: async (id: string, data: UpdateEventInput): Promise<CalendarEvent> => {
    const res = await api.patch<ApiResponse<CalendarEvent>>(`/calendar/events/${id}`, data);
    return res.data.data;
  },

  deleteEvent: async (
    id: string,
    params?: { recurrenceMode?: "SINGLE" | "FOLLOWING" | "ALL"; targetInstanceDate?: string },
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/calendar/events/${id}`,
      { params },
    );
    return res.data.data;
  },

  updateRsvp: async (
    id: string,
    responseStatus: InvitationStatus,
  ): Promise<{ eventId: string; userId: string; responseStatus: InvitationStatus }> => {
    const res = await api.patch<
      ApiResponse<{ eventId: string; userId: string; responseStatus: InvitationStatus }>
    >(`/calendar/events/${id}/rsvp`, { responseStatus });
    return res.data.data;
  },

  // Calendars
  getCalendars: async (): Promise<UserCalendar[]> => {
    const res = await api.get<ApiResponse<UserCalendar[]>>("/calendar/calendars");
    return res.data.data;
  },

  createCalendar: async (data: { name: string; color?: string }): Promise<UserCalendar> => {
    const res = await api.post<ApiResponse<UserCalendar>>("/calendar/calendars", data);
    return res.data.data;
  },

  updateCalendar: async (
    id: string,
    data: { name?: string; color?: string; isVisible?: boolean },
  ): Promise<UserCalendar> => {
    const res = await api.patch<ApiResponse<UserCalendar>>(`/calendar/calendars/${id}`, data);
    return res.data.data;
  },

  deleteCalendar: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete<ApiResponse<{ success: boolean }>>(
      `/calendar/calendars/${id}`,
    );
    return res.data.data;
  },

  // Tasks
  getTasks: async (params?: {
    start?: string;
    end?: string;
    includeCompleted?: boolean;
  }): Promise<CalendarTask[]> => {
    const res = await api.get<ApiResponse<CalendarTask[]>>("/calendar/tasks", {
      params,
    });
    return res.data.data;
  },

  createTask: async (data: CreateTaskInput): Promise<CalendarTask> => {
    const res = await api.post<ApiResponse<CalendarTask>>("/calendar/tasks", data);
    return res.data.data;
  },

  updateTask: async (id: string, data: UpdateTaskInput): Promise<CalendarTask> => {
    const res = await api.patch<ApiResponse<CalendarTask>>(`/calendar/tasks/${id}`, data);
    return res.data.data;
  },

  deleteTask: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete<ApiResponse<{ success: boolean }>>(
      `/calendar/tasks/${id}`,
    );
    return res.data.data;
  },

  // Settings
  getSettings: async (): Promise<CalendarSetting> => {
    const res = await api.get<ApiResponse<CalendarSetting>>("/calendar/settings");
    return res.data.data;
  },

  updateSettings: async (data: Partial<CalendarSetting>): Promise<CalendarSetting> => {
    const res = await api.patch<ApiResponse<CalendarSetting>>("/calendar/settings", data);
    return res.data.data;
  },
};

export default calendarApi;
