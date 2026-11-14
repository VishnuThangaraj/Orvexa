const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

export const DateMonth = (timestamp: number | string | Date): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = months[date.getUTCMonth()];

  return `${day} ${month}`;
};
