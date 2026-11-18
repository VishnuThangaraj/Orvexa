import type { CalendarView } from "../types/calendar.types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const isSameDay = (d1: Date | string, d2: Date | string): boolean => {
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isToday = (d: Date | string): boolean => {
  return isSameDay(d, new Date());
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getViewRange = (
  date: Date,
  view: CalendarView,
): { start: Date; end: Date } => {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };

    case "4days": {
      const start = startOfDay(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 3);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "week":
      return { start: getStartOfWeek(date), end: getEndOfWeek(date) };

    case "month": {
      const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const start = getStartOfWeek(firstOfMonth);
      const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const end = getEndOfWeek(lastOfMonth);
      return { start, end };
    }

    case "year": {
      const start = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }

    case "schedule": {
      const start = startOfDay(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 30);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    default:
      return { start: getStartOfWeek(date), end: getEndOfWeek(date) };
  }
};

export const navigateDate = (
  date: Date,
  view: CalendarView,
  direction: -1 | 1,
): Date => {
  const newDate = new Date(date);
  switch (view) {
    case "day":
      newDate.setDate(newDate.getDate() + direction);
      break;
    case "4days":
      newDate.setDate(newDate.getDate() + direction * 4);
      break;
    case "week":
      newDate.setDate(newDate.getDate() + direction * 7);
      break;
    case "month":
      newDate.setMonth(newDate.getMonth() + direction);
      break;
    case "year":
      newDate.setFullYear(newDate.getFullYear() + direction);
      break;
    case "schedule":
      newDate.setDate(newDate.getDate() + direction * 7);
      break;
  }
  return newDate;
};

export const formatPeriodTitle = (date: Date, view: CalendarView): string => {
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  switch (view) {
    case "day":
      return `${date.getDate()} ${monthName} ${year}`;

    case "week": {
      const weekStart = getStartOfWeek(date);
      const weekEnd = getEndOfWeek(date);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
      }
      if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${SHORT_MONTH_NAMES[weekStart.getMonth()]} – ${SHORT_MONTH_NAMES[weekEnd.getMonth()]} ${weekStart.getFullYear()}`;
      }
      return `${SHORT_MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()} – ${SHORT_MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
    }

    case "month":
      return `${monthName} ${year}`;

    case "year":
      return `${year}`;

    case "4days":
      return `${monthName} ${year}`;

    case "schedule":
      return `${monthName} ${year}`;

    default:
      return `${monthName} ${year}`;
  }
};

export const getMiniMonthGrid = (
  year: number,
  month: number,
): Array<{
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}> => {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: Array<{
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    grid.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: isToday(date),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    grid.push({
      date,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: isToday(date),
    });
  }

  // Next month leading days (fill up to 35 or 42)
  const totalCells = grid.length > 35 ? 42 : 35;
  const remaining = totalCells - grid.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    grid.push({
      date,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: isToday(date),
    });
  }

  return grid;
};

export const formatTimeSlot = (hour: number): string => {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
};
