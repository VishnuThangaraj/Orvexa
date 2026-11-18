import React from "react";
import { useCalendarStore } from "../../store/calendar.store";
import TimeGridView from "./TimeGridView";

export const FourDaysView: React.FC = () => {
  const { selectedDate } = useCalendarStore();

  const days = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return <TimeGridView days={days} />;
};

export default FourDaysView;
