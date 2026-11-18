import React from "react";
import { useCalendarStore } from "../../store/calendar.store";
import { getStartOfWeek } from "../../utils/date.utils";
import TimeGridView from "./TimeGridView";

export const WeekView: React.FC = () => {
  const { selectedDate, settings } = useCalendarStore();

  const startOfWeek = getStartOfWeek(selectedDate);
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Filter weekends if showWeekends is false
  const visibleDays = settings.showWeekends
    ? allDays
    : allDays.filter((d) => d.getDay() !== 0 && d.getDay() !== 6);

  return <TimeGridView days={visibleDays} />;
};

export default WeekView;
