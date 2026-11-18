export interface HolidayDefinition {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  recurrenceRule?: string | null;
}

// Fixed-date national and global holidays that repeat every year indefinitely
export const RECURRING_HOLIDAYS: HolidayDefinition[] = [
  {
    title: "New Year's Day",
    date: "1970-01-01",
    description: "Global Observance / Gazetted Holiday",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
  {
    title: "Republic Day",
    date: "1970-01-26",
    description: "National Holiday",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
  {
    title: "Dr. Ambedkar Jayanti",
    date: "1970-04-14",
    description: "Gazetted Holiday",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
  {
    title: "May Day / Labour Day",
    date: "1970-05-01",
    description: "Observance / Gazetted Holiday",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
  {
    title: "Independence Day",
    date: "1970-08-15",
    description: "National Holiday",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
  {
    title: "Mahatma Gandhi's Birthday",
    date: "1970-10-02",
    description: "National Holiday",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
  {
    title: "Christmas Day",
    date: "1970-12-25",
    description: "Gazetted Holiday",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
  {
    title: "New Year's Eve",
    date: "1970-12-31",
    description: "Global Observance",
    recurrenceRule: "RRULE:FREQ=YEARLY",
  },
];

// Variable-date Indian and religious holidays (lunar / solar / Islamic calendars)
export const VARIABLE_HOLIDAYS_2026: HolidayDefinition[] = [
  { title: "Maha Shivratri", date: "2026-02-15", description: "Gazetted Holiday" },
  { title: "Holi", date: "2026-03-04", description: "Gazetted Holiday" },
  { title: "Id-ul-Fitr", date: "2026-03-21", description: "Gazetted Holiday" },
  { title: "Good Friday", date: "2026-04-03", description: "Gazetted Holiday" },
  { title: "Mahavir Jayanti", date: "2026-04-14", description: "Gazetted Holiday" },
  { title: "Id-ul-Zuha (Bakrid)", date: "2026-05-28", description: "Gazetted Holiday" },
  { title: "Buddha Purnima", date: "2026-05-31", description: "Gazetted Holiday" },
  { title: "Muharram", date: "2026-06-26", description: "Gazetted Holiday" },
  { title: "Milad-un-Nabi", date: "2026-08-26", description: "Gazetted Holiday" },
  { title: "Janmashtami", date: "2026-09-04", description: "Gazetted Holiday" },
  { title: "Dussehra (Vijay Dashami)", date: "2026-10-20", description: "Gazetted Holiday" },
  { title: "Karaka Chaturthi", date: "2026-10-29", description: "Restricted Holiday" },
  { title: "Diwali/Deepavali", date: "2026-11-08", description: "Gazetted Holiday" },
  { title: "Naraka Chaturdasi", date: "2026-11-08", description: "Gazetted Holiday" },
  { title: "Govardhan Puja", date: "2026-11-09", description: "Restricted Holiday" },
  { title: "Bhai Duj", date: "2026-11-11", description: "Restricted Holiday" },
  { title: "Chhat Puja (Pratihar Sashthi)", date: "2026-11-15", description: "Restricted Holiday" },
  { title: "Guru Nanak Jayanti", date: "2026-11-24", description: "Gazetted Holiday" },
  { title: "Guru Tegh Bahadur's Martyrdom Day", date: "2026-11-24", description: "Restricted Holiday" },
];

export const VARIABLE_HOLIDAYS_2025: HolidayDefinition[] = [
  { title: "Maha Shivratri", date: "2025-02-26", description: "Gazetted Holiday" },
  { title: "Holi", date: "2025-03-14", description: "Gazetted Holiday" },
  { title: "Id-ul-Fitr", date: "2025-03-31", description: "Gazetted Holiday" },
  { title: "Good Friday", date: "2025-04-18", description: "Gazetted Holiday" },
  { title: "Mahavir Jayanti", date: "2025-04-10", description: "Gazetted Holiday" },
  { title: "Id-ul-Zuha (Bakrid)", date: "2025-06-07", description: "Gazetted Holiday" },
  { title: "Buddha Purnima", date: "2025-05-12", description: "Gazetted Holiday" },
  { title: "Muharram", date: "2025-07-06", description: "Gazetted Holiday" },
  { title: "Janmashtami", date: "2025-08-16", description: "Gazetted Holiday" },
  { title: "Milad-un-Nabi", date: "2025-09-05", description: "Gazetted Holiday" },
  { title: "Karaka Chaturthi", date: "2025-10-10", description: "Restricted Holiday" },
  { title: "Dussehra (Vijay Dashami)", date: "2025-10-02", description: "Gazetted Holiday" },
  { title: "Diwali/Deepavali", date: "2025-10-20", description: "Gazetted Holiday" },
  { title: "Naraka Chaturdasi", date: "2025-10-20", description: "Gazetted Holiday" },
  { title: "Govardhan Puja", date: "2025-10-22", description: "Restricted Holiday" },
  { title: "Bhai Duj", date: "2025-10-23", description: "Restricted Holiday" },
  { title: "Chhat Puja (Pratihar Sashthi)", date: "2025-10-28", description: "Restricted Holiday" },
  { title: "Guru Nanak Jayanti", date: "2025-11-05", description: "Gazetted Holiday" },
];

export const VARIABLE_HOLIDAYS_2027: HolidayDefinition[] = [
  { title: "Maha Shivratri", date: "2027-03-06", description: "Gazetted Holiday" },
  { title: "Holi", date: "2027-03-22", description: "Gazetted Holiday" },
  { title: "Id-ul-Fitr", date: "2027-03-10", description: "Gazetted Holiday" },
  { title: "Good Friday", date: "2027-03-26", description: "Gazetted Holiday" },
  { title: "Id-ul-Zuha (Bakrid)", date: "2027-05-17", description: "Gazetted Holiday" },
  { title: "Buddha Purnima", date: "2027-05-20", description: "Gazetted Holiday" },
  { title: "Muharram", date: "2027-06-16", description: "Gazetted Holiday" },
  { title: "Janmashtami", date: "2027-08-25", description: "Gazetted Holiday" },
  { title: "Milad-un-Nabi", date: "2027-08-15", description: "Gazetted Holiday" },
  { title: "Dussehra (Vijay Dashami)", date: "2027-10-09", description: "Gazetted Holiday" },
  { title: "Karaka Chaturthi", date: "2027-10-19", description: "Restricted Holiday" },
  { title: "Diwali/Deepavali", date: "2027-10-29", description: "Gazetted Holiday" },
  { title: "Govardhan Puja", date: "2027-10-30", description: "Restricted Holiday" },
  { title: "Bhai Duj", date: "2027-11-01", description: "Restricted Holiday" },
  { title: "Guru Nanak Jayanti", date: "2027-11-14", description: "Gazetted Holiday" },
];

export const ALL_PUBLIC_HOLIDAYS: HolidayDefinition[] = [
  ...RECURRING_HOLIDAYS,
  ...VARIABLE_HOLIDAYS_2025,
  ...VARIABLE_HOLIDAYS_2026,
  ...VARIABLE_HOLIDAYS_2027,
];

// Backwards-compatible export
export const INDIAN_HOLIDAYS_2026: HolidayDefinition[] = ALL_PUBLIC_HOLIDAYS;
