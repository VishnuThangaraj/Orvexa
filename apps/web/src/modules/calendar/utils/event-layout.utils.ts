import type { CalendarEvent } from "../types/calendar.types";

export interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
}

const HOUR_HEIGHT = 48; // px per hour
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60; // 0.8 px/min

export const computeDayEventPositions = (
  events: CalendarEvent[],
  dayDate: Date,
): PositionedEvent[] => {
  // Filter timed (non-all-day) events on this date
  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(23, 59, 59, 999);

  const timedEvents = events.filter((e) => {
    if (e.isAllDay) return false;
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    return start < dayEnd && end > dayStart;
  });

  if (timedEvents.length === 0) return [];

  // Calculate start & end minutes from midnight for each event
  const items = timedEvents.map((event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    let startMinutes = 0;
    if (start > dayStart) {
      startMinutes = start.getHours() * 60 + start.getMinutes();
    }

    let endMinutes = 24 * 60;
    if (end < dayEnd) {
      endMinutes = end.getHours() * 60 + end.getMinutes();
    }

    // Minimum duration 25 minutes for readable chips
    const durationMinutes = Math.max(endMinutes - startMinutes, 25);

    return {
      event,
      startMinutes,
      endMinutes: startMinutes + durationMinutes,
      top: startMinutes * PIXELS_PER_MINUTE,
      height: Math.max(durationMinutes * PIXELS_PER_MINUTE, 20),
    };
  });

  // Sort by start time, then duration descending
  items.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes);
  });

  // Pack into columns for side-by-side rendering
  const clusters: Array<typeof items> = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0 || item.startMinutes < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results: PositionedEvent[] = [];

  for (const cluster of clusters) {
    const columns: Array<Array<(typeof items)[0]>> = [];

    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        if (item.startMinutes >= lastInCol.endMinutes) {
          columns[i].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([item]);
      }
    }

    const totalCols = columns.length;
    const colWidth = 100 / totalCols;

    for (let colIdx = 0; colIdx < totalCols; colIdx++) {
      for (const item of columns[colIdx]) {
        results.push({
          event: item.event,
          top: item.top,
          height: item.height,
          leftPct: colIdx * colWidth,
          widthPct: colWidth - 1, // Leave slight gap between side-by-side chips
        });
      }
    }
  }

  return results;
};
