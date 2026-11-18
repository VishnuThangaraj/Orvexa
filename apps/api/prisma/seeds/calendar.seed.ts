import prisma from "../../src/infrastructure/database/prisma.js";
import { ALL_PUBLIC_HOLIDAYS } from "../../src/modules/calendar/calendar.holidays.js";

export const seedPublicHolidaysCalendar = async () => {
  // Clean up legacy per-user duplicate holiday calendars and events
  await prisma.userCalendar.deleteMany({
    where: { systemType: "HOLIDAYS", isPublic: false },
  });

  let publicCal = await prisma.userCalendar.findFirst({
    where: { isPublic: true, systemType: "HOLIDAYS" },
  });

  if (!publicCal) {
    publicCal = await prisma.userCalendar.create({
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
  }

  // Clear existing holiday events in the public calendar to ensure a fresh, consistent seed
  await prisma.calendarEvent.deleteMany({
    where: { calendarId: publicCal.id },
  });

  for (const h of ALL_PUBLIC_HOLIDAYS) {
    const startTime = new Date(`${h.date}T00:00:00.000Z`);
    const endTime = new Date(`${h.date}T23:59:59.999Z`);

    await prisma.calendarEvent.create({
      data: {
        title: h.title,
        description: h.description,
        calendarId: publicCal.id,
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

  return publicCal;
};

export const seedCalendarForUser = async (userId: bigint, userName?: string) => {
  // 1. Primary Calendar
  let primaryCal = await prisma.userCalendar.findFirst({
    where: { userId, isPrimary: true },
  });

  if (!primaryCal) {
    primaryCal = await prisma.userCalendar.create({
      data: {
        userId,
        name: userName || "Primary Calendar",
        color: "#039be5",
        isVisible: true,
        isPrimary: true,
        isSystem: false,
        systemType: "PRIMARY",
      },
    });
  }

  // 2. Birthdays Calendar
  let birthdaysCal = await prisma.userCalendar.findFirst({
    where: { userId, systemType: "BIRTHDAYS" },
  });

  if (!birthdaysCal) {
    birthdaysCal = await prisma.userCalendar.create({
      data: {
        userId,
        name: "Birthdays",
        color: "#0b8043",
        isVisible: true,
        isPrimary: false,
        isSystem: true,
        systemType: "BIRTHDAYS",
      },
    });
  }

  // 3. Tasks Calendar
  let tasksCal = await prisma.userCalendar.findFirst({
    where: { userId, systemType: "TASKS" },
  });

  if (!tasksCal) {
    tasksCal = await prisma.userCalendar.create({
      data: {
        userId,
        name: "Tasks",
        color: "#3f51b5",
        isVisible: true,
        isPrimary: false,
        isSystem: true,
        systemType: "TASKS",
      },
    });
  }

  // 4. Calendar Setting
  let setting = await prisma.calendarSetting.findUnique({
    where: { userId },
  });

  if (!setting) {
    setting = await prisma.calendarSetting.create({
      data: {
        userId,
        defaultView: "week",
        showWeekends: true,
        showDeclinedEvents: true,
        showCompletedTasks: true,
        timezone: "Asia/Kolkata",
      },
    });
  }

  return { primaryCal, birthdaysCal, tasksCal, setting };
};

export const seedAllCalendars = async () => {
  console.log("Seeding global Public Holidays calendar and recurring events...");
  await seedPublicHolidaysCalendar();

  const users = await prisma.user.findMany({
    select: { id: true, fullName: true },
  });

  console.log(`Seeding personal calendars for ${users.length} users...`);
  for (const user of users) {
    await seedCalendarForUser(user.id, user.fullName);
  }
  console.log("Calendar seeding completed successfully.");
};
