import { create } from "zustand";
import type {
  CalendarEvent,
  CalendarSetting,
  CalendarTask,
  CalendarView,
  CreateEventInput,
  CreateTaskInput,
  InvitationStatus,
  UpdateEventInput,
  UpdateTaskInput,
  UserCalendar,
} from "../types/calendar.types";
import calendarApi from "../api/calendar.api";
import {
  getViewRange,
  navigateDate,
} from "../utils/date.utils";

interface CalendarState {
  selectedDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  calendars: UserCalendar[];
  tasks: CalendarTask[];
  settings: CalendarSetting;
  selectedCalendarIds: string[];
  isSidebarOpen: boolean;
  isRightPanelOpen: boolean;
  activeRightPanelTab: "tasks" | "keep" | "contacts" | "maps" | null;
  activeTopTab: "calendar" | "tasks";
  searchQuery: string;
  isLoading: boolean;
  selectedEvent: CalendarEvent | null;
  isCreateModalOpen: boolean;
  createModalInitialData: Partial<CreateEventInput> | null;

  // Actions
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  goToToday: () => void;
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setRightPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setActiveRightPanelTab: (tab: "tasks" | "keep" | "contacts" | "maps" | null) => void;
  setActiveTopTab: (tab: "calendar" | "tasks") => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  openCreateModal: (initial?: Partial<CreateEventInput>) => void;
  closeCreateModal: () => void;

  // Data fetching
  fetchCalendars: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchTasks: () => Promise<void>;

  // Mutations
  createCalendar: (data: { name: string; color?: string }) => Promise<UserCalendar>;
  toggleCalendarVisibility: (calendarId: string) => Promise<void>;
  toggleSetting: (
    key: "showWeekends" | "showDeclinedEvents" | "showCompletedTasks",
  ) => Promise<void>;
  createEvent: (data: CreateEventInput) => Promise<CalendarEvent>;
  updateEvent: (id: string, data: UpdateEventInput) => Promise<CalendarEvent>;
  deleteEvent: (
    id: string,
    params?: { recurrenceMode?: "SINGLE" | "FOLLOWING" | "ALL"; targetInstanceDate?: string },
  ) => Promise<void>;
  rsvpEvent: (id: string, responseStatus: InvitationStatus) => Promise<void>;

  createTask: (data: CreateTaskInput) => Promise<CalendarTask>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<CalendarTask>;
  toggleTaskCompleted: (id: string, isCompleted: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Default to 18 November 2026 matching screenshots
  selectedDate: new Date("2026-11-18T10:00:00"),
  view: "week",
  events: [],
  calendars: [],
  tasks: [],
  settings: {
    defaultView: "week",
    showWeekends: true,
    showDeclinedEvents: true,
    showCompletedTasks: true,
    timezone: "Asia/Kolkata",
  },
  selectedCalendarIds: [],
  isSidebarOpen: true,
  isRightPanelOpen: false,
  activeRightPanelTab: "tasks",
  activeTopTab: "calendar",
  searchQuery: "",
  isLoading: false,
  selectedEvent: null,
  isCreateModalOpen: false,
  createModalInitialData: null,

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
    get().fetchEvents();
  },

  setView: (view: CalendarView) => {
    set({ view });
    get().fetchEvents();
    // Persist default view to backend
    calendarApi.updateSettings({ defaultView: view }).catch(() => {});
  },

  nextPeriod: () => {
    const { selectedDate, view } = get();
    const nextDate = navigateDate(selectedDate, view, 1);
    set({ selectedDate: nextDate });
    get().fetchEvents();
  },

  prevPeriod: () => {
    const { selectedDate, view } = get();
    const prevDate = navigateDate(selectedDate, view, -1);
    set({ selectedDate: prevDate });
    get().fetchEvents();
  },

  goToToday: () => {
    set({ selectedDate: new Date("2026-11-18T10:00:00") });
    get().fetchEvents();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().fetchEvents();
  },

  setSidebarOpen: (open) => {
    set((state) => ({
      isSidebarOpen: typeof open === "function" ? open(state.isSidebarOpen) : open,
    }));
  },

  setRightPanelOpen: (open) => {
    set((state) => ({
      isRightPanelOpen:
        typeof open === "function" ? open(state.isRightPanelOpen) : open,
    }));
  },

  setActiveRightPanelTab: (tab) => {
    set({
      activeRightPanelTab: tab,
      isRightPanelOpen: tab !== null,
    });
  },

  setActiveTopTab: (tab) => {
    set({ activeTopTab: tab });
  },

  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },

  openCreateModal: (initial) => {
    set({ isCreateModalOpen: true, createModalInitialData: initial || null });
  },

  closeCreateModal: () => {
    set({ isCreateModalOpen: false, createModalInitialData: null });
  },

  fetchCalendars: async () => {
    try {
      const calendars = await calendarApi.getCalendars();
      const visibleIds = calendars.filter((c) => c.isVisible).map((c) => c.id);
      set({ calendars, selectedCalendarIds: visibleIds });
      await get().fetchEvents();
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
    }
  },

  fetchSettings: async () => {
    try {
      const settings = await calendarApi.getSettings();
      set({
        settings,
        view: (settings.defaultView as CalendarView) || "week",
      });
    } catch (err) {
      console.error("Failed to fetch calendar settings:", err);
    }
  },

  fetchEvents: async () => {
    const { selectedDate, view, calendars, selectedCalendarIds, settings, searchQuery } = get();

    if (calendars.length > 0 && selectedCalendarIds.length === 0) {
      set({ events: [], isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      const { start, end } = getViewRange(selectedDate, view);
      const events = await calendarApi.getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
        calendarIds: selectedCalendarIds.length > 0 ? selectedCalendarIds : undefined,
        search: searchQuery || undefined,
        includeDeclined: settings.showDeclinedEvents,
      });

      set({ events, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch events:", err);
      set({ isLoading: false });
    }
  },

  fetchTasks: async () => {
    const { settings } = get();
    try {
      const tasks = await calendarApi.getTasks({
        includeCompleted: settings.showCompletedTasks,
      });
      set({ tasks });
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  },

  createCalendar: async (data: { name: string; color?: string }) => {
    const newCal = await calendarApi.createCalendar(data);
    await get().fetchCalendars();
    return newCal;
  },

  toggleCalendarVisibility: async (calendarId: string) => {
    const { calendars, selectedCalendarIds } = get();
    const cal = calendars.find((c) => c.id === calendarId);
    if (!cal) return;

    const nextVisible = !cal.isVisible;
    const nextCalendars = calendars.map((c) =>
      c.id === calendarId ? { ...c, isVisible: nextVisible } : c,
    );

    const nextSelected = nextVisible
      ? [...selectedCalendarIds, calendarId]
      : selectedCalendarIds.filter((id) => id !== calendarId);

    set({ calendars: nextCalendars, selectedCalendarIds: nextSelected });

    try {
      await calendarApi.updateCalendar(calendarId, { isVisible: nextVisible });
      get().fetchEvents();
    } catch (err) {
      console.error("Failed to toggle calendar visibility:", err);
    }
  },

  toggleSetting: async (key) => {
    const { settings } = get();
    const nextVal = !settings[key];
    const nextSettings = { ...settings, [key]: nextVal };

    set({ settings: nextSettings });

    try {
      await calendarApi.updateSettings({ [key]: nextVal });
      if (key === "showDeclinedEvents") {
        get().fetchEvents();
      }
      if (key === "showCompletedTasks") {
        get().fetchTasks();
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
    }
  },

  createEvent: async (data: CreateEventInput) => {
    const event = await calendarApi.createEvent(data);
    get().fetchEvents();
    return event;
  },

  updateEvent: async (id: string, data: UpdateEventInput) => {
    const event = await calendarApi.updateEvent(id, data);
    get().fetchEvents();
    return event;
  },

  deleteEvent: async (id, params) => {
    await calendarApi.deleteEvent(id, params);
    set({ selectedEvent: null });
    get().fetchEvents();
  },

  rsvpEvent: async (id, responseStatus) => {
    await calendarApi.updateRsvp(id, responseStatus);
    get().fetchEvents();
  },

  createTask: async (data) => {
    const task = await calendarApi.createTask(data);
    get().fetchTasks();
    return task;
  },

  updateTask: async (id, data) => {
    const task = await calendarApi.updateTask(id, data);
    get().fetchTasks();
    return task;
  },

  toggleTaskCompleted: async (id, isCompleted) => {
    await calendarApi.updateTask(id, { isCompleted });
    get().fetchTasks();
  },

  deleteTask: async (id) => {
    await calendarApi.deleteTask(id);
    get().fetchTasks();
  },
}));
