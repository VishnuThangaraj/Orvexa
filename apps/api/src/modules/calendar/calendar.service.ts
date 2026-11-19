import AppError from "../../common/errors/AppError.js";
import { prisma } from "../../config/prisma.js";
import CalendarRepository from "./calendar.repository.js";
import { expandRecurringEvent } from "./recurrence.util.js";
import { ALL_PUBLIC_HOLIDAYS } from "./calendar.holidays.js";
import type {
  CreateEventDto,
  UpdateEventDto,
  FetchEventsQueryDto,
  CreateUserCalendarDto,
  UpdateUserCalendarDto,
  CreateTaskDto,
  UpdateTaskDto,
  FetchTasksQueryDto,
  UpdateCalendarSettingsDto,
  InvitationStatus,
} from "./calendar.types.js";

export class CalendarService {
  private calendarRepository: CalendarRepository;

  constructor() {
    this.calendarRepository = new CalendarRepository();
  }

  // Ensure default calendars and settings exist for the user
  async ensureUserCalendarProvisioned(userId: bigint) {
    const personalCount = await prisma.userCalendar.count({
      where: { userId },
    });

    if (personalCount === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      });

      const userName = user?.fullName || "My Calendar";

      await prisma.$transaction([
        prisma.userCalendar.create({
          data: {
            userId,
            name: userName,
            color: "#039be5",
            isVisible: true,
            isPrimary: true,
            isSystem: false,
            systemType: "PRIMARY",
          },
        }),
        prisma.userCalendar.create({
          data: {
            userId,
            name: "Birthdays",
            color: "#0b8043",
            isVisible: true,
            isPrimary: false,
            isSystem: true,
            systemType: "BIRTHDAYS",
          },
        }),
        prisma.userCalendar.create({
          data: {
            userId,
            name: "Tasks",
            color: "#3f51b5",
            isVisible: true,
            isPrimary: false,
            isSystem: true,
            systemType: "TASKS",
          },
        }),
      ]);
    }

    // Ensure the single global Public Holidays calendar exists
    let publicHolidaysCal = await prisma.userCalendar.findFirst({
      where: {
        isPublic: true,
        systemType: "HOLIDAYS",
      },
    });

    if (!publicHolidaysCal) {
      publicHolidaysCal = await prisma.userCalendar.create({
        data: {
          name: "Public Holidays",
          color: "#0b8043",
          isVisible: true,
          isPrimary: false,
          isSystem: true,
          isPublic: true,
          systemType: "HOLIDAYS",
        },
      });

      for (const h of ALL_PUBLIC_HOLIDAYS) {
        const startTime = new Date(`${h.date}T00:00:00.000Z`);
        const endTime = new Date(`${h.date}T23:59:59.999Z`);

        await prisma.calendarEvent.create({
          data: {
            title: h.title,
            description: h.description,
            calendarId: publicHolidaysCal.id,
            color: "#0b8043",
            startTime,
            endTime,
            isAllDay: true,
            timezone: "Asia/Kolkata",
            eventType: "HOLIDAY",
            visibility: "PUBLIC",
            recurrenceRule: h.recurrenceRule ?? null,
          },
        });
      }
    }

    const settings = await this.calendarRepository.getSettings(userId);
    if (!settings) {
      await this.calendarRepository.upsertSettings(userId, {
        defaultView: "week",
        showWeekends: true,
        showDeclinedEvents: true,
        showCompletedTasks: true,
        timezone: "Asia/Kolkata",
      });
    }
  }

  // Format event helper
  private formatEvent(event: any, currentUserId?: bigint) {
    const isOwner = currentUserId && event.createdBy ? event.createdBy === currentUserId : false;
    let myResponseStatus: InvitationStatus =
      isOwner || event.visibility === "PUBLIC" || event.eventType === "HOLIDAY"
        ? "ACCEPTED"
        : "PENDING";

    if (currentUserId && event.participants) {
      const p = event.participants.find(
        (part: any) => part.userId === currentUserId,
      );
      if (p) {
        myResponseStatus = p.responseStatus;
      }
    }

    return {
      id: String(event.id),
      title: event.title,
      description: event.description ?? null,
      createdBy: event.createdBy ? String(event.createdBy) : null,
      calendarId: event.calendarId ? String(event.calendarId) : null,
      color: event.color || event.calendar?.color || "#039be5",
      startTime:
        event.startTime instanceof Date
          ? event.startTime.toISOString()
          : String(event.startTime),
      endTime:
        event.endTime instanceof Date
          ? event.endTime.toISOString()
          : String(event.endTime),
      isAllDay: Boolean(event.isAllDay),
      timezone: event.timezone ?? null,
      location: event.location ?? null,
      eventType: event.eventType,
      visibility: event.visibility,
      recurrenceRule: event.recurrenceRule ?? null,
      meetingId: event.meetingId ? String(event.meetingId) : null,
      meeting: event.meeting
        ? {
            id: String(event.meeting.id),
            meetingCode: event.meeting.meetingCode,
            title: event.meeting.title,
            status: event.meeting.status,
          }
        : null,
      createdAt:
        event.createdAt instanceof Date
          ? event.createdAt.toISOString()
          : String(event.createdAt),
      updatedAt:
        event.updatedAt instanceof Date
          ? event.updatedAt.toISOString()
          : String(event.updatedAt),
      cancelledAt: event.cancelledAt
        ? event.cancelledAt instanceof Date
          ? event.cancelledAt.toISOString()
          : String(event.cancelledAt)
        : null,
      masterEventId: event.masterEventId ? String(event.masterEventId) : undefined,
      isRecurringInstance: Boolean(event.isRecurringInstance),
      calendar: event.calendar
        ? {
            id: String(event.calendar.id),
            name: event.calendar.name,
            color: event.calendar.color,
            isVisible: Boolean(event.calendar.isVisible),
            isPrimary: Boolean(event.calendar.isPrimary),
            isSystem: Boolean(event.calendar.isSystem),
            systemType: event.calendar.systemType ?? null,
          }
        : null,
      participants: (event.participants || []).map((p: any) => ({
        id: String(p.id),
        userId: String(p.userId),
        responseStatus: p.responseStatus,
        user: {
          id: String(p.user.id),
          fullName: p.user.fullName,
          username: p.user.username,
          email: p.user.email,
          profileImage: p.user.profileImage
            ? { secureUrl: p.user.profileImage.secureUrl }
            : null,
        },
      })),
      reminders: (event.reminders || []).map((r: any) => ({
        id: String(r.id),
        minutesBefore: r.minutesBefore,
        remindAt:
          r.remindAt instanceof Date
            ? r.remindAt.toISOString()
            : String(r.remindAt),
      })),
      myResponseStatus,
    };
  }

  // Format task helper
  private formatTask(task: any) {
    return {
      id: String(task.id),
      userId: String(task.userId),
      title: task.title,
      details: task.details ?? null,
      dueDate: task.dueDate
        ? task.dueDate instanceof Date
          ? task.dueDate.toISOString()
          : String(task.dueDate)
        : null,
      isCompleted: Boolean(task.isCompleted),
      completedAt: task.completedAt
        ? task.completedAt instanceof Date
          ? task.completedAt.toISOString()
          : String(task.completedAt)
        : null,
      createdAt:
        task.createdAt instanceof Date
          ? task.createdAt.toISOString()
          : String(task.createdAt),
      updatedAt:
        task.updatedAt instanceof Date
          ? task.updatedAt.toISOString()
          : String(task.updatedAt),
    };
  }

  // Format calendar helper
  private formatCalendar(cal: any) {
    return {
      id: String(cal.id),
      userId: cal.userId ? String(cal.userId) : null,
      name: cal.name,
      color: cal.color,
      isVisible: Boolean(cal.isVisible),
      isPrimary: Boolean(cal.isPrimary),
      isSystem: Boolean(cal.isSystem),
      isPublic: Boolean(cal.isPublic),
      systemType: cal.systemType ?? null,
      createdAt:
        cal.createdAt instanceof Date
          ? cal.createdAt.toISOString()
          : String(cal.createdAt),
      updatedAt:
        cal.updatedAt instanceof Date
          ? cal.updatedAt.toISOString()
          : String(cal.updatedAt),
    };
  }

  // Calendars
  async getUserCalendars(userId: bigint) {
    await this.ensureUserCalendarProvisioned(userId);
    const calendars = await this.calendarRepository.getUserCalendars(userId);
    const settings = await this.calendarRepository.getSettings(userId);
    let hiddenIds: string[] = [];
    if (settings?.hiddenCalendarIds) {
      try {
        hiddenIds = JSON.parse(settings.hiddenCalendarIds);
      } catch {
        hiddenIds = settings.hiddenCalendarIds.split(",").map((s) => s.trim());
      }
    }

    return calendars.map((c) => {
      const formatted = this.formatCalendar(c);
      if (c.isPublic) {
        formatted.isVisible = !hiddenIds.includes(String(c.id));
      }
      return formatted;
    });
  }

  async createCalendar(userId: bigint, dto: CreateUserCalendarDto) {
    const calendar = await this.calendarRepository.createUserCalendar(userId, dto);
    return this.formatCalendar(calendar);
  }

  async updateCalendar(
    userId: bigint,
    calendarId: bigint,
    dto: UpdateUserCalendarDto,
  ) {
    const calendar = await this.calendarRepository.findCalendarById(calendarId);
    if (!calendar) {
      throw new AppError("Calendar not found", 404);
    }

    // Public calendar: users can toggle visibility for themselves via hiddenCalendarIds
    if (calendar.isPublic) {
      if (dto.isVisible !== undefined) {
        const settings = await this.calendarRepository.getSettings(userId);
        let hidden: string[] = [];
        if (settings?.hiddenCalendarIds) {
          try {
            hidden = JSON.parse(settings.hiddenCalendarIds);
          } catch {
            hidden = settings.hiddenCalendarIds.split(",").map((s) => s.trim());
          }
        }
        const strId = String(calendarId);
        if (dto.isVisible === false && !hidden.includes(strId)) {
          hidden.push(strId);
        } else if (dto.isVisible === true) {
          hidden = hidden.filter((id) => id !== strId);
        }
        await this.calendarRepository.upsertSettings(userId, {
          hiddenCalendarIds: JSON.stringify(hidden),
        });
        const formatted = this.formatCalendar(calendar);
        formatted.isVisible = dto.isVisible;
        return formatted;
      }
      throw new AppError("Cannot modify public calendar properties", 403);
    }

    if (calendar.userId !== userId) {
      throw new AppError("Calendar not found", 404);
    }

    if ((calendar.isPrimary || calendar.isSystem) && dto.name && dto.name !== calendar.name) {
      throw new AppError("System and primary calendar names cannot be changed", 400);
    }

    const updated = await this.calendarRepository.updateUserCalendar(calendarId, dto);
    return this.formatCalendar(updated);
  }

  async deleteCalendar(userId: bigint, calendarId: bigint) {
    const calendar = await this.calendarRepository.findCalendarById(calendarId);
    if (!calendar || (calendar.userId !== userId && !calendar.isPublic)) {
      throw new AppError("Calendar not found", 404);
    }

    if (calendar.isPublic) {
      throw new AppError("Public calendars cannot be deleted", 403);
    }

    if (calendar.isPrimary) {
      throw new AppError("Primary calendar cannot be deleted", 400);
    }

    if (calendar.isSystem) {
      throw new AppError("System calendars cannot be deleted", 400);
    }

    await this.calendarRepository.deleteUserCalendar(calendarId);
    return { success: true };
  }

  // Events
  async getEvents(userId: bigint, query: FetchEventsQueryDto) {
    await this.ensureUserCalendarProvisioned(userId);

    const rangeStart = new Date(query.start);
    const rangeEnd = new Date(query.end);

    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
      throw new AppError("Invalid date range", 400);
    }

    const calendarIds = query.calendarIds?.map((id) => BigInt(id));

    // Fetch matching master and non-recurring events
    const rawEvents = await this.calendarRepository.getEventsForRange(
      userId,
      rangeStart,
      rangeEnd,
      calendarIds,
      query.search,
    );

    // Expand recurrence rules and flatten
    const instances: any[] = [];
    for (const event of rawEvents) {
      if (event.recurrenceRule) {
        const expanded = expandRecurringEvent(event, rangeStart, rangeEnd);
        instances.push(...expanded);
      } else {
        instances.push(event);
      }
    }

    // Format and filter by declined if requested
    const formatted = instances
      .map((ev) => this.formatEvent(ev, userId))
      .filter((ev) => {
        if (query.includeDeclined === false && ev.myResponseStatus === "DECLINED") {
          return false;
        }
        return true;
      });

    // Sort chronologically
    formatted.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return formatted;
  }

  async getEventById(userId: bigint, eventId: bigint) {
    const event = await this.calendarRepository.getEventById(eventId);
    if (!event || event.cancelledAt) {
      throw new AppError("Event not found", 404);
    }

    const isOwner = event.createdBy ? event.createdBy === userId : false;
    const isParticipant = event.participants?.some((p) => p.userId === userId);
    const isPublic = event.visibility === "PUBLIC" || Boolean(event.calendar?.isPublic);

    if (!isOwner && !isParticipant && !isPublic) {
      throw new AppError("Forbidden: You do not have access to this event", 403);
    }

    return this.formatEvent(event, userId);
  }

  async createEvent(userId: bigint, dto: CreateEventDto) {
    await this.ensureUserCalendarProvisioned(userId);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new AppError("Invalid start or end time", 400);
    }

    if (endTime < startTime) {
      throw new AppError("End time must be after start time", 400);
    }

    let calendarId: bigint | null = null;
    if (dto.calendarId) {
      calendarId = BigInt(dto.calendarId);
      const calendar = await this.calendarRepository.findCalendarById(calendarId);
      if (!calendar || calendar.userId !== userId) {
        throw new AppError("Specified calendar not found or not owned by you", 400);
      }
    } else {
      // Find primary calendar
      const userCalendars = await this.calendarRepository.getUserCalendars(userId);
      const primary = userCalendars.find((c) => c.isPrimary) || userCalendars[0];
      if (primary) {
        calendarId = primary.id;
      }
    }

    const guestUserIds = dto.guestUserIds
      ? dto.guestUserIds.map((id) => BigInt(id))
      : undefined;

    const meetingId =
      dto.meetingId !== undefined
        ? dto.meetingId
          ? BigInt(dto.meetingId)
          : null
        : undefined;

    const event = await this.calendarRepository.createEvent(userId, {
      title: dto.title,
      description: dto.description,
      startTime,
      endTime,
      isAllDay: dto.isAllDay,
      timezone: dto.timezone,
      location: dto.location,
      calendarId,
      color: dto.color,
      eventType: dto.eventType,
      visibility: dto.visibility,
      recurrenceRule: dto.recurrenceRule,
      meetingId: dto.meetingId ? BigInt(dto.meetingId) : undefined,
      guestUserIds,
      reminders: dto.reminders,
    });

    return this.formatEvent(event, userId);
  }

  async updateEvent(userId: bigint, eventId: bigint, dto: UpdateEventDto) {
    const existing = await this.calendarRepository.getEventById(eventId);
    if (!existing || existing.cancelledAt) {
      throw new AppError("Event not found", 404);
    }

    if (!existing.createdBy || existing.createdBy !== userId) {
      throw new AppError("Forbidden: Only the event creator can edit this event", 403);
    }

    if (existing.calendar?.isPublic || (existing.calendar?.isSystem && existing.calendar?.systemType === "HOLIDAYS")) {
      throw new AppError("System holiday events are read-only and cannot be modified", 403);
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : undefined;
    const endTime = dto.endTime ? new Date(dto.endTime) : undefined;

    if (startTime && endTime && endTime < startTime) {
      throw new AppError("End time must be after start time", 400);
    }

    let calendarId: bigint | undefined = undefined;
    if (dto.calendarId !== undefined) {
      if (dto.calendarId === null) {
        calendarId = undefined;
      } else {
        calendarId = BigInt(dto.calendarId);
        const calendar = await this.calendarRepository.findCalendarById(calendarId);
        if (!calendar || calendar.userId !== userId) {
          throw new AppError("Specified calendar not found or not owned by you", 400);
        }
      }
    }

    const guestUserIds = dto.guestUserIds
      ? dto.guestUserIds.map((id) => BigInt(id))
      : undefined;

    const meetingId =
      dto.meetingId !== undefined
        ? dto.meetingId
          ? BigInt(dto.meetingId)
          : null
        : undefined;

    // Handle recurrence editing modes
    if (existing.recurrenceRule && dto.recurrenceMode === "SINGLE" && dto.targetInstanceDate) {
      // 1. Add exception date to master event
      const targetDate = new Date(dto.targetInstanceDate);
      const dateKey = targetDate.toISOString().slice(0, 10);
      const existingExceptions = existing.recurrenceExceptions
        ? existing.recurrenceExceptions.split(",").map((s) => s.trim())
        : [];
      if (!existingExceptions.includes(dateKey)) {
        existingExceptions.push(dateKey);
      }

      await this.calendarRepository.updateEvent(
        eventId,
        { recurrenceExceptions: existingExceptions.join(",") },
        userId,
      );

      // 2. Create standalone single event instance with updated properties
      const singleEvent = await this.calendarRepository.createEvent(userId, {
        title: dto.title ?? existing.title,
        description: dto.description !== undefined ? dto.description : existing.description,
        startTime: startTime ?? targetDate,
        endTime: endTime ?? new Date(targetDate.getTime() + (existing.endTime.getTime() - existing.startTime.getTime())),
        isAllDay: dto.isAllDay !== undefined ? dto.isAllDay : existing.isAllDay,
        timezone: dto.timezone ?? existing.timezone,
        location: dto.location !== undefined ? dto.location : existing.location,
        calendarId: calendarId !== undefined ? calendarId : existing.calendarId,
        color: dto.color !== undefined ? dto.color : existing.color,
        eventType: dto.eventType ?? existing.eventType,
        visibility: dto.visibility ?? existing.visibility,
        recurrenceRule: null, // Standalone single event
        meetingId: meetingId !== undefined ? meetingId : existing.meetingId,
        guestUserIds: guestUserIds ?? existing.participants.map((p) => p.userId),
        reminders: dto.reminders,
      });

      return this.formatEvent(singleEvent, userId);
    }

    // Default mode: "ALL" updates the event definition directly
    const updated = await this.calendarRepository.updateEvent(
      eventId,
      {
        title: dto.title,
        description: dto.description,
        startTime,
        endTime,
        isAllDay: dto.isAllDay,
        timezone: dto.timezone,
        location: dto.location,
        calendarId,
        color: dto.color,
        eventType: dto.eventType,
        visibility: dto.visibility,
        recurrenceRule: dto.recurrenceRule,
        meetingId,
        guestUserIds,
        reminders: dto.reminders,
      },
      userId,
    );

    return this.formatEvent(updated, userId);
  }

  async deleteEvent(
    userId: bigint,
    eventId: bigint,
    recurrenceMode?: "SINGLE" | "FOLLOWING" | "ALL",
    targetInstanceDate?: string,
  ) {
    const existing = await this.calendarRepository.getEventById(eventId);
    if (!existing || existing.cancelledAt) {
      throw new AppError("Event not found", 404);
    }

    if (!existing.createdBy || existing.createdBy !== userId) {
      throw new AppError("Forbidden: Only the event creator can delete this event", 403);
    }

    if (existing.calendar?.isPublic || (existing.calendar?.isSystem && existing.calendar?.systemType === "HOLIDAYS")) {
      throw new AppError("System holiday events are read-only and cannot be deleted", 403);
    }

    if (existing.calendar?.isSystem && existing.calendar?.systemType === "HOLIDAYS") {
      throw new AppError("System holiday events are read-only and cannot be deleted", 403);
    }

    // If single occurrence delete on a recurring event
    if (existing.recurrenceRule && recurrenceMode === "SINGLE" && targetInstanceDate) {
      const targetDate = new Date(targetInstanceDate);
      const dateKey = targetDate.toISOString().slice(0, 10);
      const existingExceptions = existing.recurrenceExceptions
        ? existing.recurrenceExceptions.split(",").map((s) => s.trim())
        : [];
      if (!existingExceptions.includes(dateKey)) {
        existingExceptions.push(dateKey);
      }

      await this.calendarRepository.updateEvent(
        eventId,
        { recurrenceExceptions: existingExceptions.join(",") },
        userId,
      );

      return { success: true, message: "Recurrence occurrence removed" };
    }

    // Cancel entire event
    await this.calendarRepository.deleteEvent(eventId, true);
    return { success: true, message: "Event cancelled successfully" };
  }

  async updateRsvp(userId: bigint, eventId: bigint, status: InvitationStatus) {
    const existing = await this.calendarRepository.getEventById(eventId);
    if (!existing || existing.cancelledAt) {
      throw new AppError("Event not found", 404);
    }

    const participant = await this.calendarRepository.updateRsvp(eventId, userId, status);
    return {
      eventId: String(eventId),
      userId: String(userId),
      responseStatus: participant.responseStatus,
    };
  }

  // Tasks
  async getTasks(userId: bigint, query: FetchTasksQueryDto) {
    await this.ensureUserCalendarProvisioned(userId);

    const rangeStart = query.start ? new Date(query.start) : undefined;
    const rangeEnd = query.end ? new Date(query.end) : undefined;

    const tasks = await this.calendarRepository.getTasks(
      userId,
      rangeStart,
      rangeEnd,
      query.includeCompleted,
    );

    return tasks.map((t) => this.formatTask(t));
  }

  async createTask(userId: bigint, dto: CreateTaskDto) {
    await this.ensureUserCalendarProvisioned(userId);

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    const task = await this.calendarRepository.createTask(userId, {
      title: dto.title,
      details: dto.details,
      dueDate,
    });

    return this.formatTask(task);
  }

  async updateTask(userId: bigint, taskId: bigint, dto: UpdateTaskDto) {
    const task = await this.calendarRepository.getTaskById(taskId);
    if (!task || task.userId !== userId) {
      throw new AppError("Task not found", 404);
    }

    const dueDate = dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined;
    const updated = await this.calendarRepository.updateTask(taskId, {
      title: dto.title,
      details: dto.details,
      dueDate,
      isCompleted: dto.isCompleted,
    });

    return this.formatTask(updated);
  }

  async deleteTask(userId: bigint, taskId: bigint) {
    const task = await this.calendarRepository.getTaskById(taskId);
    if (!task || task.userId !== userId) {
      throw new AppError("Task not found", 404);
    }

    await this.calendarRepository.deleteTask(taskId);
    return { success: true };
  }

  // Settings
  async getSettings(userId: bigint) {
    await this.ensureUserCalendarProvisioned(userId);
    const settings = await this.calendarRepository.getSettings(userId);
    if (!settings) {
      return {
        defaultView: "week",
        showWeekends: true,
        showDeclinedEvents: true,
        showCompletedTasks: true,
        timezone: "Asia/Kolkata",
      };
    }

    return {
      id: String(settings.id),
      userId: String(settings.userId),
      defaultView: settings.defaultView,
      showWeekends: settings.showWeekends,
      showDeclinedEvents: settings.showDeclinedEvents,
      showCompletedTasks: settings.showCompletedTasks,
      timezone: settings.timezone,
      hiddenCalendarIds: settings.hiddenCalendarIds ?? null,
    };
  }

  async updateSettings(userId: bigint, dto: UpdateCalendarSettingsDto) {
    const updated = await this.calendarRepository.upsertSettings(userId, dto);
    return {
      id: String(updated.id),
      userId: String(updated.userId),
      defaultView: updated.defaultView,
      showWeekends: updated.showWeekends,
      showDeclinedEvents: updated.showDeclinedEvents,
      showCompletedTasks: updated.showCompletedTasks,
      timezone: updated.timezone,
      hiddenCalendarIds: updated.hiddenCalendarIds ?? null,
    };
  }
}

export default CalendarService;
