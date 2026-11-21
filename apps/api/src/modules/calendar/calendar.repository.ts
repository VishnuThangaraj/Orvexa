import { prisma } from "../../config/prisma.js";
import type {
  CalendarEventType,
  EventVisibility,
  InvitationStatus,
  CalendarAttachmentDto,
} from "./calendar.types.js";

export interface CreateEventRepoData {
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  timezone?: string | null;
  location?: string | null;
  calendarId?: bigint | null;
  color?: string | null;
  eventType?: CalendarEventType;
  visibility?: EventVisibility;
  recurrenceRule?: string | null;
  meetingId?: bigint | null;
  guestUserIds?: bigint[];
  reminders?: Array<{ minutesBefore: number }>;
  attachments?: CalendarAttachmentDto[];
}

export interface UpdateEventRepoData {
  title?: string;
  description?: string | null;
  startTime?: Date;
  endTime?: Date;
  isAllDay?: boolean;
  timezone?: string | null;
  location?: string | null;
  calendarId?: bigint | null;
  color?: string | null;
  eventType?: CalendarEventType;
  visibility?: EventVisibility;
  recurrenceRule?: string | null;
  recurrenceExceptions?: string | null;
  meetingId?: bigint | null;
  guestUserIds?: bigint[];
  reminders?: Array<{ minutesBefore: number }>;
  attachments?: CalendarAttachmentDto[];
}

export class CalendarRepository {
  // Calendar management
  async getUserCalendars(userId: bigint) {
    return prisma.userCalendar.findMany({
      where: {
        OR: [{ userId }, { isPublic: true }],
      },
      orderBy: [{ isPrimary: "desc" }, { isSystem: "asc" }, { name: "asc" }],
    });
  }

  async findCalendarById(calendarId: bigint) {
    return prisma.userCalendar.findUnique({
      where: { id: calendarId },
    });
  }

  async createUserCalendar(userId: bigint, data: { name: string; color?: string }) {
    return prisma.userCalendar.create({
      data: {
        userId,
        name: data.name,
        color: data.color ?? "#039be5",
        isVisible: true,
        isPrimary: false,
        isSystem: false,
      },
    });
  }

  async updateUserCalendar(
    calendarId: bigint,
    data: { name?: string; color?: string; isVisible?: boolean },
  ) {
    return prisma.userCalendar.update({
      where: { id: calendarId },
      data,
    });
  }

  async deleteUserCalendar(calendarId: bigint) {
    return prisma.userCalendar.delete({
      where: { id: calendarId },
    });
  }

  // Event queries
  async getEventsForRange(
    userId: bigint,
    rangeStart: Date,
    rangeEnd: Date,
    calendarIds?: bigint[],
    search?: string,
  ) {
    const where: any = {
      cancelledAt: null,
      OR: [
        { createdBy: userId },
        { participants: { some: { userId } } },
        { calendar: { isPublic: true } },
      ],
    };

    if (calendarIds && calendarIds.length > 0) {
      where.calendarId = { in: calendarIds };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Include:
    // 1) Non-recurring events overlapping [rangeStart, rangeEnd]
    // 2) Recurring events that started on or before rangeEnd (recurrence engine will filter instances)
    const timeCondition = {
      OR: [
        {
          recurrenceRule: null,
          startTime: { lte: rangeEnd },
          endTime: { gte: rangeStart },
        },
        {
          recurrenceRule: { not: null },
          startTime: { lte: rangeEnd },
        },
      ],
    };

    if (where.AND) {
      where.AND.push(timeCondition);
    } else {
      where.AND = [timeCondition];
    }

    return prisma.calendarEvent.findMany({
      where,
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
            isVisible: true,
            isPrimary: true,
            isSystem: true,
            isPublic: true,
            systemType: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: {
                  select: { secureUrl: true },
                },
              },
            },
          },
        },
        reminders: {
          where: { userId },
          select: {
            id: true,
            minutesBefore: true,
            remindAt: true,
          },
        },
        meeting: {
          select: {
            id: true,
            meetingCode: true,
            title: true,
            status: true,
          },
        },
        attachments: {
          include: {
            driveFile: {
              include: {
                currentAsset: true,
                owner: true,
              },
            },
            asset: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async getEventById(eventId: bigint) {
    return prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
            isVisible: true,
            isPrimary: true,
            isSystem: true,
            isPublic: true,
            systemType: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: {
                  select: { secureUrl: true },
                },
              },
            },
          },
        },
        reminders: true,
        meeting: {
          select: {
            id: true,
            meetingCode: true,
            title: true,
            status: true,
          },
        },
        attachments: {
          include: {
            driveFile: {
              include: {
                currentAsset: true,
                owner: true,
              },
            },
            asset: true,
          },
        },
      },
    });
  }

  async createEvent(userId: bigint, data: CreateEventRepoData) {
    return prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: data.isAllDay ?? false,
        timezone: data.timezone ?? null,
        location: data.location ?? null,
        calendarId: data.calendarId ?? null,
        color: data.color ?? null,
        eventType: data.eventType ?? "PERSONAL",
        visibility: data.visibility ?? "PRIVATE",
        recurrenceRule: data.recurrenceRule ?? null,
        meetingId: data.meetingId ?? null,
        createdBy: userId,
        participants: {
          create: [
            // Creator is always marked as ACCEPTED participant
            {
              userId,
              responseStatus: "ACCEPTED",
            },
            ...(data.guestUserIds || [])
              .filter((id) => id !== userId)
              .map((guestId) => ({
                userId: guestId,
                responseStatus: "PENDING" as InvitationStatus,
              })),
          ],
        },
        reminders: data.reminders && data.reminders.length > 0
          ? {
              create: data.reminders.map((r) => ({
                userId,
                minutesBefore: r.minutesBefore,
                remindAt: new Date(data.startTime.getTime() - r.minutesBefore * 60 * 1000),
              })),
            }
          : undefined,
        attachments: data.attachments && data.attachments.length > 0
          ? {
              create: data.attachments.map((att) => ({
                driveFileId: att.fileId ? BigInt(att.fileId) : null,
                assetId: att.assetId ? BigInt(att.assetId) : null,
              })),
            }
          : undefined,
      },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
            isVisible: true,
            isPrimary: true,
            isSystem: true,
            isPublic: true,
            systemType: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImage: {
                  select: { secureUrl: true },
                },
              },
            },
          },
        },
        reminders: true,
        meeting: {
          select: {
            id: true,
            meetingCode: true,
            title: true,
            status: true,
          },
        },
        attachments: {
          include: {
            driveFile: {
              include: {
                currentAsset: true,
                owner: true,
              },
            },
            asset: true,
          },
        },
      },
    });
  }

  async updateEvent(eventId: bigint, data: UpdateEventRepoData, userId: bigint) {
    const updatePayload: any = {};

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.startTime !== undefined) updatePayload.startTime = data.startTime;
    if (data.endTime !== undefined) updatePayload.endTime = data.endTime;
    if (data.isAllDay !== undefined) updatePayload.isAllDay = data.isAllDay;
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.calendarId !== undefined) updatePayload.calendarId = data.calendarId;
    if (data.color !== undefined) updatePayload.color = data.color;
    if (data.eventType !== undefined) updatePayload.eventType = data.eventType;
    if (data.visibility !== undefined) updatePayload.visibility = data.visibility;
    if (data.recurrenceRule !== undefined) updatePayload.recurrenceRule = data.recurrenceRule;
    if (data.recurrenceExceptions !== undefined)
      updatePayload.recurrenceExceptions = data.recurrenceExceptions;
    if (data.meetingId !== undefined) updatePayload.meetingId = data.meetingId;

    // Execute in transaction if guests or reminders are being updated
    return prisma.$transaction(async (tx) => {
      if (data.guestUserIds !== undefined) {
        // Retain existing accepted status for creator
        await tx.calendarParticipant.deleteMany({
          where: {
            eventId,
            userId: { not: userId },
          },
        });

        const newGuests = data.guestUserIds.filter((id) => id !== userId);
        if (newGuests.length > 0) {
          await tx.calendarParticipant.createMany({
            data: newGuests.map((gId) => ({
              eventId,
              userId: gId,
              responseStatus: "PENDING" as InvitationStatus,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.reminders !== undefined) {
        await tx.calendarReminder.deleteMany({
          where: { eventId, userId },
        });

        if (data.reminders.length > 0) {
          const startTime = data.startTime ?? (await tx.calendarEvent.findUnique({ where: { id: eventId } }))?.startTime;
          if (startTime) {
            await tx.calendarReminder.createMany({
              data: data.reminders.map((r) => ({
                eventId,
                userId,
                minutesBefore: r.minutesBefore,
                remindAt: new Date(startTime.getTime() - r.minutesBefore * 60 * 1000),
              })),
            });
          }
        }
      }

      if (data.attachments !== undefined) {
        await tx.calendarEventAttachment.deleteMany({
          where: { eventId },
        });

        if (data.attachments.length > 0) {
          await tx.calendarEventAttachment.createMany({
            data: data.attachments.map((att) => ({
              eventId,
              driveFileId: att.fileId ? BigInt(att.fileId) : null,
              assetId: att.assetId ? BigInt(att.assetId) : null,
            })),
          });
        }
      }

      return tx.calendarEvent.update({
        where: { id: eventId },
        data: updatePayload,
        include: {
          calendar: {
            select: {
              id: true,
              name: true,
              color: true,
              isVisible: true,
              isPrimary: true,
              isSystem: true,
              isPublic: true,
              systemType: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                  email: true,
                  profileImage: {
                    select: { secureUrl: true },
                  },
                },
              },
            },
          },
          reminders: true,
          meeting: {
            select: {
              id: true,
              meetingCode: true,
              title: true,
              status: true,
            },
          },
          attachments: {
            include: {
              driveFile: {
                include: {
                  currentAsset: true,
                  owner: true,
                },
              },
              asset: true,
            },
          },
        },
      });
    });
  }

  async deleteEvent(eventId: bigint, soft = true) {
    if (soft) {
      return prisma.calendarEvent.update({
        where: { id: eventId },
        data: { cancelledAt: new Date() },
      });
    }
    return prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  }

  async updateRsvp(eventId: bigint, userId: bigint, status: InvitationStatus) {
    return prisma.calendarParticipant.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      create: {
        eventId,
        userId,
        responseStatus: status,
      },
      update: {
        responseStatus: status,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImage: {
              select: { secureUrl: true },
            },
          },
        },
      },
    });
  }

  // Task management
  async getTasks(
    userId: bigint,
    rangeStart?: Date,
    rangeEnd?: Date,
    includeCompleted = true,
  ) {
    const where: any = { userId };

    if (!includeCompleted) {
      where.isCompleted = false;
    }

    if (rangeStart && rangeEnd) {
      where.OR = [
        { dueDate: null },
        { dueDate: { gte: rangeStart, lte: rangeEnd } },
      ];
    }

    return prisma.calendarTask.findMany({
      where,
      orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
  }

  async getTaskById(taskId: bigint) {
    return prisma.calendarTask.findUnique({
      where: { id: taskId },
    });
  }

  async createTask(
    userId: bigint,
    data: { title: string; details?: string | null; dueDate?: Date | null },
  ) {
    return prisma.calendarTask.create({
      data: {
        userId,
        title: data.title,
        details: data.details ?? null,
        dueDate: data.dueDate ?? null,
      },
    });
  }

  async updateTask(
    taskId: bigint,
    data: {
      title?: string;
      details?: string | null;
      dueDate?: Date | null;
      isCompleted?: boolean;
    },
  ) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.details !== undefined) updateData.details = data.details;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted;
      updateData.completedAt = data.isCompleted ? new Date() : null;
    }

    return prisma.calendarTask.update({
      where: { id: taskId },
      data: updateData,
    });
  }

  async deleteTask(taskId: bigint) {
    return prisma.calendarTask.delete({
      where: { id: taskId },
    });
  }

  // Settings
  async getSettings(userId: bigint) {
    return prisma.calendarSetting.findUnique({
      where: { userId },
    });
  }

  async upsertSettings(
    userId: bigint,
    data: {
      defaultView?: string;
      showWeekends?: boolean;
      showDeclinedEvents?: boolean;
      showCompletedTasks?: boolean;
      timezone?: string;
      hiddenCalendarIds?: string | null;
    },
  ) {
    return prisma.calendarSetting.upsert({
      where: { userId },
      create: {
        userId,
        defaultView: data.defaultView ?? "week",
        showWeekends: data.showWeekends ?? true,
        showDeclinedEvents: data.showDeclinedEvents ?? true,
        showCompletedTasks: data.showCompletedTasks ?? true,
        timezone: data.timezone ?? "Asia/Kolkata",
        hiddenCalendarIds: data.hiddenCalendarIds ?? null,
      },
      update: data,
    });
  }
}

export default CalendarRepository;
