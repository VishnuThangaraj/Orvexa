export interface ParsedRRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  until?: Date;
  count?: number;
  byDay?: string[]; // e.g. ["MO", "WE", "FR"]
}

const DAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export const parseRRule = (ruleString: string): ParsedRRule | null => {
  if (!ruleString || typeof ruleString !== "string") return null;

  const parts = ruleString.replace(/^RRULE:/i, "").split(";");
  const params: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      params[key.toUpperCase().trim()] = value.trim();
    }
  }

  const freq = params.FREQ?.toUpperCase() as ParsedRRule["freq"];
  if (!freq || !["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) {
    return null;
  }

  const interval = params.INTERVAL ? Math.max(1, parseInt(params.INTERVAL, 10)) : 1;
  let until: Date | undefined;
  if (params.UNTIL) {
    // Format: YYYYMMDDTHHMMSSZ or YYYYMMDD
    const u = params.UNTIL;
    if (u.length === 8) {
      const year = parseInt(u.slice(0, 4), 10);
      const month = parseInt(u.slice(4, 6), 10) - 1;
      const day = parseInt(u.slice(6, 8), 10);
      until = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    } else {
      const year = parseInt(u.slice(0, 4), 10);
      const month = parseInt(u.slice(4, 6), 10) - 1;
      const day = parseInt(u.slice(6, 8), 10);
      const hour = parseInt(u.slice(9, 11), 10) || 0;
      const min = parseInt(u.slice(11, 13), 10) || 0;
      const sec = parseInt(u.slice(13, 15), 10) || 0;
      until = new Date(Date.UTC(year, month, day, hour, min, sec));
    }
  }

  const count = params.COUNT ? parseInt(params.COUNT, 10) : undefined;
  const byDay = params.BYDAY
    ? params.BYDAY.split(",").map((d) => d.toUpperCase().trim())
    : undefined;

  return {
    freq,
    interval,
    until,
    count,
    byDay,
  };
};

export interface MasterEventLike {
  id: string | bigint;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string | null;
  recurrenceExceptions?: string | null;
  [key: string]: any;
}

export const expandRecurringEvent = <T extends MasterEventLike>(
  event: T,
  rangeStart: Date,
  rangeEnd: Date,
): T[] => {
  if (!event.recurrenceRule) {
    return [event];
  }

  const rule = parseRRule(event.recurrenceRule);
  if (!rule) {
    return [event];
  }

  const durationMs = event.endTime.getTime() - event.startTime.getTime();
  const exceptionsSet = new Set<string>();

  if (event.recurrenceExceptions) {
    event.recurrenceExceptions.split(",").forEach((ex) => {
      const trimmed = ex.trim();
      if (trimmed) {
        // Store YYYY-MM-DD in UTC
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          exceptionsSet.add(d.toISOString().slice(0, 10));
        }
      }
    });
  }

  const instances: T[] = [];
  const eventStart = new Date(event.startTime);
  let cursor = new Date(eventStart);
  let occurrenceCount = 0;
  const MAX_OCCURRENCES = 500;

  // Fast-forward cursor when no COUNT constraint and cursor is far before rangeStart
  if (rule.count === undefined) {
    if (rule.freq === "YEARLY") {
      const yearsDiff = rangeStart.getUTCFullYear() - cursor.getUTCFullYear() - 1;
      if (yearsDiff > 0) {
        const intervalsToSkip = Math.floor(yearsDiff / rule.interval);
        if (intervalsToSkip > 0) {
          cursor.setUTCFullYear(cursor.getUTCFullYear() + intervalsToSkip * rule.interval);
        }
      }
    } else if (rule.freq === "DAILY") {
      const msDiff = rangeStart.getTime() - cursor.getTime() - 24 * 60 * 60 * 1000;
      if (msDiff > 0) {
        const intervalMs = rule.interval * 24 * 60 * 60 * 1000;
        const intervalsToSkip = Math.floor(msDiff / intervalMs);
        if (intervalsToSkip > 0) {
          cursor = new Date(cursor.getTime() + intervalsToSkip * intervalMs);
        }
      }
    } else if (rule.freq === "WEEKLY" && (!rule.byDay || rule.byDay.length === 0)) {
      const msDiff = rangeStart.getTime() - cursor.getTime() - 7 * 24 * 60 * 60 * 1000;
      if (msDiff > 0) {
        const intervalMs = rule.interval * 7 * 24 * 60 * 60 * 1000;
        const intervalsToSkip = Math.floor(msDiff / intervalMs);
        if (intervalsToSkip > 0) {
          cursor = new Date(cursor.getTime() + intervalsToSkip * intervalMs);
        }
      }
    } else if (rule.freq === "MONTHLY") {
      const currentTotalMonths = cursor.getUTCFullYear() * 12 + cursor.getUTCMonth();
      const rangeTotalMonths = rangeStart.getUTCFullYear() * 12 + rangeStart.getUTCMonth();
      const monthsDiff = rangeTotalMonths - currentTotalMonths - 1;
      if (monthsDiff > 0) {
        const intervalsToSkip = Math.floor(monthsDiff / rule.interval);
        if (intervalsToSkip > 0) {
          cursor.setUTCMonth(cursor.getUTCMonth() + intervalsToSkip * rule.interval);
        }
      }
    }
  }

  while (occurrenceCount < MAX_OCCURRENCES) {
    // Check UNTIL constraint
    if (rule.until && cursor > rule.until) {
      break;
    }

    // Check COUNT constraint
    if (rule.count !== undefined && occurrenceCount >= rule.count) {
      break;
    }

    const instanceEnd = new Date(cursor.getTime() + durationMs);
    const dateKey = cursor.toISOString().slice(0, 10);

    // If cursor has exceeded rangeEnd, stop early (for future-moving recurrence)
    if (cursor > rangeEnd) {
      break;
    }

    // If within requested window and not in exceptions list
    if (instanceEnd >= rangeStart && cursor <= rangeEnd) {
      if (!exceptionsSet.has(dateKey)) {
        instances.push({
          ...event,
          id: `${event.id}_${cursor.getTime()}`,
          masterEventId: String(event.id),
          isRecurringInstance: true,
          startTime: new Date(cursor),
          endTime: new Date(instanceEnd),
        });
      }
    }

    occurrenceCount++;

    // Advance cursor to next recurrence interval
    switch (rule.freq) {
      case "DAILY":
        cursor = new Date(cursor.getTime() + rule.interval * 24 * 60 * 60 * 1000);
        break;

      case "WEEKLY": {
        if (rule.byDay && rule.byDay.length > 0) {
          // If byDay is specified, advance day by day until matching target day
          let nextFound = false;
          let daysChecked = 0;
          let temp = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);

          while (daysChecked < 14) {
            const dayOfWeek = temp.getUTCDay();
            const targetDays = rule.byDay.map((d) => DAY_MAP[d]);
            if (targetDays.includes(dayOfWeek)) {
              cursor = temp;
              nextFound = true;
              break;
            }
            temp = new Date(temp.getTime() + 24 * 60 * 60 * 1000);
            daysChecked++;
          }
          if (!nextFound) {
            cursor = new Date(cursor.getTime() + rule.interval * 7 * 24 * 60 * 60 * 1000);
          }
        } else {
          cursor = new Date(cursor.getTime() + rule.interval * 7 * 24 * 60 * 60 * 1000);
        }
        break;
      }

      case "MONTHLY": {
        const nextMonth = cursor.getUTCMonth() + rule.interval;
        const newDate = new Date(cursor);
        newDate.setUTCMonth(nextMonth);
        cursor = newDate;
        break;
      }

      case "YEARLY": {
        const nextYear = cursor.getUTCFullYear() + rule.interval;
        const newDate = new Date(cursor);
        newDate.setUTCFullYear(nextYear);
        cursor = newDate;
        break;
      }
    }
  }

  return instances;
};
