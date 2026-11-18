import React from "react";
import { useCalendarStore } from "../../store/calendar.store";
import TimeGridView from "./TimeGridView";

export const DayView: React.FC = () => {
  const { selectedDate } = useCalendarStore();
  return <TimeGridView days={[selectedDate]} />;
};

export default DayView;
